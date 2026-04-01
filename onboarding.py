import json
import ollama

def load_data(filepath="file.json"):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def evaluate_answer(question, options, user_answer, field_type="text"):
    # Bu alohida chaqiruv bo'lib, foydalanuvchining javobi to'g'ri/yaroqliligini tekshiradi
    eval_prompt = f"Savol: '{question}'\nFoydalanuvchining xom javobi: '{user_answer}'\n\n"
    
    if field_type == "date":
        eval_prompt += "- DIQQAT! Turi SANA (date) bolgani uchun albatta yil (sana) ham korsatilishi shart! Agar foydalanuvchi faqat kun va oyni yozgan bo'lsa (masalan: '5 avgust'), buni albatta INVALID deb bahola!\n\n"
        
    if options:
        if isinstance(options[0], dict):
             opt_keys = [str(o.get("id") or o.get("text")) for o in options]
             eval_prompt += f"Mumkin bo'lgan variantlar: {', '.join(opt_keys)}.\n"
        else:
             eval_prompt += f"Mumkin bo'lgan variantlar: {', '.join(map(str, options))}.\n"
             
    eval_prompt += """
Vazifang:
1) Agar foydalanuvchi savolga yetarlicha mos javob bergan bo'lsa, "VALID: <qisqa qilib aniq javobni yozing>" deb qaytar. (Agar variantlar bo'lsa, faqatgina eng mosiga tegishli matn/id ni qaytar).
2) Agar foydalanuvchi "bilmayman", "istamayman", "kerak emas", "puling bormi" kabi rad etuvchi yoki savolga mutlaqo aloqasiz xatosiz narsalarni yozgan bo'lsa, "INVALID" deb qaytargin.
Faqat shu ikki xil formatdan birida javob ber, hech qanday qo'shimcha izoh yozma!
"""
    try:
        response = ollama.chat(
            model='gemini-3-flash-preview:latest', 
            messages=[{'role': 'user', 'content': eval_prompt}]
        )
        return response['message']['content'].strip()
    except Exception as e:
        return f"VALID: {user_answer}" # Xatolik bo'lsa qabul qilib ketaveramiz

def ask_question_via_ollama(field, previous_answers, chat_history):
    question = field.get("question")
    required = field.get("required", False)
    field_type = field.get("type", "text")
    
    # Handle district dependency logic
    options = field.get("options", [])
    if field.get("depends_on") == "region":
        region_ans = previous_answers.get("region")
        if region_ans:
            for key in field.get("options_by_region", {}).keys():
                if region_ans.lower() in key.lower() or key.lower() in region_ans.lower():
                    options = field["options_by_region"][key]
                    break

    # Contextga yangi savol topshirig'ini qo'shamiz
    prompt = f"Suhbatdoshdan quyidagi narsani so'rashing kerak: '{question}'."
    if options:
        if isinstance(options[0], dict):
             opt_texts = [o.get("text") or "Rasm/Variant: " + str(o.get('id')) for o in options]
             prompt += f" Javob berishini osonlashtirish uchun ushbu variantlarni aytib o't: {', '.join(opt_texts)}."
        else:
             prompt += f" Javob berishini osonlashtirish uchun ushbu variantlarni aytib o't: {', '.join(options)}."
             
    chat_history.append({'role': 'user', 'content': f"[TIZIM TOPSHIRIG'I: {prompt} Hech qanday qo'shimcha izohsiz to'g'ridan to'g'ri o'z rolingda qisqacha savolni ber]"})
    
    while True:
        try:
            # Bot savol shakllantiradi
            response = ollama.chat(
                model='gemini-3-flash-preview:latest', 
                messages=chat_history
            )
            bot_msg = response['message']['content'].strip()
        except Exception as e:
            bot_msg = f"[Xato: Ollama ulanmadi] {question} (Variantlar: {options})"
            
        print(f"\n🤖 Bot: {bot_msg}")
        chat_history.append({'role': 'assistant', 'content': bot_msg})
        
        # User input
        user_answer = input("👤 Siz: ")
        chat_history.append({'role': 'user', 'content': user_answer})
        
        # Albatta olinishi kerak bo'lsa Validation qilamiz
        if required:
            eval_res = evaluate_answer(question, options, user_answer, field_type)
            if eval_res.startswith("VALID:"):
                formal_ans = eval_res.replace("VALID:", "").strip()
                # To'g'ri deb qabul qilganimizni Tizim tariqasida yozib qoyamiz, kelgusi chat ucun
                chat_history.append({'role': 'user', 'content': "[TIZIM TOPSHIRIG'I: Foydalanuvchi ma'lumotni berdi, ajoyib qabul qildi, o'zingizcha qo'shimcha izohlamang. Rahmat deb ketsangiz bo'ladi yoki indamay oxirgi xabaringda saqlab qol]"})
                return formal_ans
            else:
                # Agar javob INVALID bo'lsa, qistaymiz
                chat_history.append({'role': 'user', 'content': "[TIZIM TOPSHIRIG'I: Foydalanuvchi bu savolga aniq javob bermadi yoki rad etdi (bilmayman, istamayman dedi). Bu ma'lumot bizga juda zarur. Xushmuomalalik bilan, lekin qat'iy qilib buning muhimligini tushuntirgin va xuddi shu savolni yana boshqacha, yumshoqroq qilib so'ra.]"})
                continue
        else:
            # Agar majburiy bo'lmasa, eval qilib qabul qilaveramiz
            eval_res = evaluate_answer(question, options, user_answer, field_type)
            if eval_res.startswith("VALID:"):
                formal_ans = eval_res.replace("VALID:", "").strip()
            else:
                formal_ans = user_answer.strip()
            return formal_ans

def main():
    try:
        data = load_data()
    except Exception as e:
        print(f"Xatolik: 'file.json' fayli o'qilmadi. Detail: {e}")
        return

    answers = {}
    chat_history = [
        {'role': 'system', 'content': "Sen insonlarga onboarding (anketa/ma'lumot yig'ish) jarayonida yordam beruvchi xushmuomala, ochiqko'ngil botsan. Muloqotni insoniy, quruq emas va qiziqarli ko'rinishda olib borasan. Seni vazifang tizim tamonidan senga berilgan topshiriq va savollarni birin-ketin suhbatdoshdan chiroyli qilib majburlamay so'rab olish."}
    ]
    
    print("Assalomu alaykum! Onboarding jarayoniga xush kelibsiz. Biz sizga bir nechta savollar beramiz.")
    
    for stage in data.get("onboarding_stages", []):
        print(f"\n{'='*40}")
        print(f"  BOSQICH: {stage.get('title', '')}")
        print(f"  {stage.get('description', '')}")
        print(f"{'='*40}")
        
        for step in stage.get("steps", []):
            for field in step.get("fields", []):
                formal_ans = ask_question_via_ollama(field, answers, chat_history)
                answers[field["field"]] = formal_ans

    print("\n" + "*"*40)
    print("ONBOARDING YAKUNLANDI! SIZNING JAVOBLARINGIZ:")
    print(json.dumps(answers, indent=2, ensure_ascii=False))
    print("*"*40)

if __name__ == "__main__":
    main()
