import json
import ollama
import logging
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
# Loglarni tinchlantirish uchun
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

def load_data(filepath="file.json"):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

try:
    data = load_data()
    stages = data.get("onboarding_stages", [])
except Exception as e:
    print(f"File xatoligi: {e}")
    stages = []

# Global session, local serverda bitta user uchun xizmat qilishiga mo'ljallangan
session_state = {}

def reset_session():
    global session_state
    session_state = {
        'stage_idx': 0,
        'step_idx': 0,
        'field_idx': 0,
        'answers': {},
        'chat_history': [
            {'role': 'system', 'content': "Sen insonlarga onboarding (anketa/ma'lumot yig'ish) jarayonida yordam beruvchi xushmuomala, eng zamonaviy ochiqko'ngil botsan. Muloqotni insoniy, quruq emas va qiziqarli ko'rinishda olib borasan. Seni vazifang tizim tamonidan senga berilgan topshiriq va savollarni birin-ketin suhbatdoshdan chiroyli qilib majburlamay so'rab olish."}
        ]
    }

def get_current_field():
    idx_stage = session_state.get('stage_idx', 0)
    idx_step = session_state.get('step_idx', 0)
    idx_field = session_state.get('field_idx', 0)
    
    while idx_stage < len(stages):
        stage = stages[idx_stage]
        steps = stage.get("steps", [])
        while idx_step < len(steps):
            step = steps[idx_step]
            fields = step.get("fields", [])
            if idx_field < len(fields):
                session_state['stage_idx'] = idx_stage
                session_state['step_idx'] = idx_step
                session_state['field_idx'] = idx_field
                return fields[idx_field], stage
            idx_step += 1
            idx_field = 0
        idx_stage += 1
        idx_step = 0
        
    return None, None

def evaluate_answer(question, options, user_answer, field_type="text"):
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
1) Agar foydalanuvchi savolga yetarlicha mos javob bergan bo'lsa, "VALID: <qisqa qilib aniq javobni yozing>" deb qaytar. 
2) Agar foydalanuvchi "bilmayman", "istamayman", "kerak emas" kabi rad etuvchi yoki savolga mutlaqo aloqasiz xatosiz narsalarni yozgan bo'lsa, "INVALID" deb qaytargin.
Faqat shu ikki xil formatdan birida javob ber, hech qanday qo'shimcha izoh yozma!
"""
    try:
        response = ollama.chat(
            model='gemini-3-flash-preview:latest', 
            messages=[{'role': 'user', 'content': eval_prompt}]
        )
        return response['message']['content'].strip()
    except Exception as e:
        return f"VALID: {user_answer}" 

def call_ollama():
    try:
        response = ollama.chat(
            model='gemini-3-flash-preview:latest', 
            messages=session_state['chat_history']
        )
        return response['message']['content'].strip()
    except Exception as e:
        return f"[Xato: Ollama API javob bermadi: {e}]"

def get_options_for_field(field):
    options = field.get("options", [])
    if field.get("depends_on") == "region":
        region_ans = session_state['answers'].get("region")
        if region_ans:
            for key in field.get("options_by_region", {}).keys():
                if region_ans.lower() in key.lower() or key.lower() in region_ans.lower():
                    options = field["options_by_region"][key]
                    break
    return options

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/init', methods=['POST'])
def init_chat():
    reset_session()
    field, stage = get_current_field()
    if not field:
        return jsonify({"bot_message": "Ma'lumotlar ro'yxati bo'sh.", "status": "completed"})
    
    options = get_options_for_field(field)
    question = field.get("question")
    prompt = f"Suhbatdoshdan quyidagi narsani so'rashing kerak: '{question}'."
    if options:
        if isinstance(options[0], dict):
             opt_texts = [o.get("text") or "Rasm/Variant: " + str(o.get('id')) for o in options]
             prompt += f" Javob berishini osonlashtirish uchun ushbu variantlarni aytib o't: {', '.join(opt_texts)}."
        else:
             prompt += f" Javob berishini osonlashtirish uchun ushbu variantlarni aytib o't: {', '.join(options)}."
             
    session_state['chat_history'].append({'role': 'user', 'content': f"[TIZIM TOPSHIRIG'I: {prompt} Hech qanday qo'shimcha izohsiz to'g'ridan to'g'ri o'z rolingda qisqacha savolni ber]"})
    
    bot_msg = call_ollama()
    session_state['chat_history'].append({'role': 'assistant', 'content': bot_msg})
    
    return jsonify({"bot_message": bot_msg, "status": "ongoing", "stage_title": stage.get('title', '')})

@app.route('/api/message', methods=['POST'])
def handle_message():
    user_msg = request.json.get('message', '')
    if not user_msg:
         return jsonify({"error": "Empty message"}), 400
         
    session_state['chat_history'].append({'role': 'user', 'content': user_msg})
    
    field, stage = get_current_field()
    if not field:
        return jsonify({"bot_message": "Suhbatingiz uchun rahmat! Barcha ma'lumotlar saqlandi.", "status": "completed", "answers": session_state['answers']})
        
    options = get_options_for_field(field)
    question = field.get("question")
    required = field.get("required", False)
    field_type = field.get("type", "text")
    
    eval_res = evaluate_answer(question, options, user_msg, field_type)
    
    if required and not eval_res.startswith("VALID:"):
        # qistaymiz
        session_state['chat_history'].append({'role': 'user', 'content': "[TIZIM TOPSHIRIG'I: Foydalanuvchi bu savolga aniq javob bermadi (yoki yilsiz qoldirdi) yoki rad etdi (bilmayman, istamayman). Bu ma'lumot bizga juda zarur. Xushmuomalalik bilan, lekin aniq tushuntirgin va xuddi shu savolni yana yumshoqroq qilib so'ra.]"})
        bot_msg = call_ollama()
        session_state['chat_history'].append({'role': 'assistant', 'content': bot_msg})
        return jsonify({"bot_message": bot_msg, "status": "ongoing", "stage_title": stage.get('title', '')})
        
    # Valid
    if eval_res.startswith("VALID:"):
        formal_ans = eval_res.replace("VALID:", "").strip()
    else:
        formal_ans = user_msg.strip()
        
    session_state['answers'][field["field"]] = formal_ans
    
    # move to next
    session_state['chat_history'].append({'role': 'user', 'content': "[TIZIM TOPSHIRIG'I: Foydalanuvchi ma'lumotni berdi, qabul qilindi. Rahmat deb ismsiz shunchaki keyingi savolga o'tishga urg'u bergin.]"})
    session_state['field_idx'] += 1
    
    next_field, next_stage = get_current_field()
    
    if not next_field:
        # Yakunlandi
        bot_msg = "Ajoyib! Barcha bosqichlardan muvaffaqiyatli o'tdingiz. Ma'lumotlaringiz qabul qilindi. Katta tashakkur!"
        return jsonify({"bot_message": bot_msg, "status": "completed", "answers": session_state['answers']})
        
    # Ask next field
    n_options = get_options_for_field(next_field)
    n_question = next_field.get("question")
    prompt = f"Yangi savol. Suhbatdoshdan quyidagi narsani so'rashing kerak: '{n_question}'."
    if n_options:
        if isinstance(n_options[0], dict):
             opt_texts = [o.get("text") or "Rasm/Variant: " + str(o.get('id')) for o in n_options]
             prompt += f" Javob berishini osonlashtirish uchun ushbu variantlarni aytib o't: {', '.join(opt_texts)}."
        else:
             prompt += f" Javob berishini osonlashtirish uchun ushbu variantlarni aytib o't: {', '.join(n_options)}."
             
    session_state['chat_history'].append({'role': 'user', 'content': f"[TIZIM TOPSHIRIG'I: {prompt} Hech qanday keraksiz izohsiz to'g'ridan to'g'ri o'z rolingda qisqacha ushbu yangi savolni ber]"})
    
    bot_msg = call_ollama()
    session_state['chat_history'].append({'role': 'assistant', 'content': bot_msg})
    
    return jsonify({"bot_message": bot_msg, "status": "ongoing", "stage_title": next_stage.get('title', '')})

if __name__ == '__main__':
    print("Web Onboarding server is started! http://127.0.0.1:5000 ga kiring.")
    app.run(debug=True, port=5000, use_reloader=False)
