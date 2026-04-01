import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export async function generateAIProfile(
  answers: Record<string, any>,
  iqResult: { score: number; level: string; breakdown: Record<string, number> }
): Promise<any> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Sen ta'lim psixologi va AI o'qituvchisan. Quyidagi foydalanuvchi ma'lumotlarini tahlil qilib, uning shaxsiy ta'lim profilini yaratgin.

FOYDALANUVCHI MA'LUMOTLARI:
${JSON.stringify(answers, null, 2)}

IQ TEST NATIJALARI:
- Umumiy ball: ${iqResult.score}/47
- Daraja: ${iqResult.level}
- Toifalar: ${JSON.stringify(iqResult.breakdown)}

Quyidagi JSON formatda javob ber (FAQAT JSON, boshqa hech narsa yozma):
{
  "personality_type": "Big Five asosida shaxsiyat turi (masalan: Ochiq va vijdonli)",
  "mindset_label": "Fixed yoki Growth Mindset",
  "motivation_profile": "Asosiy motivatsiya turi va tavsifi (2-3 jumla)",
  "learning_style_summary": "O'quv uslubi tavsifi (2-3 jumla)",
  "ai_tone_setting": "AI muloqot uslubi: qattiq/do'stona/neytral/hazilkash",
  "risk_factors": ["Risk omil 1", "Risk omil 2"],
  "strengths": ["Kuchli tomon 1", "Kuchli tomon 2", "Kuchli tomon 3"],
  "recommended_subjects": ["Fan 1", "Fan 2", "Fan 3", "Fan 4", "Fan 5"],
  "weekly_plan": "Haftalik o'quv rejasi taklifi (3-4 jumla)",
  "full_summary": "Foydalanuvchining to'liq psixologik profili va ta'lim tavsiyalari (5-7 jumla)"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('AI javobidan JSON ajratib olishda xatolik');
  } catch (error) {
    console.error('AI Profile generation error:', error);
    // Return fallback profile
    return {
      personality_type: "Tahlil qilinmoqda...",
      mindset_label: answers.mindset_type?.includes("o'rgansa bo'ladi") ? "Growth Mindset" : "Fixed Mindset",
      motivation_profile: "Foydalanuvchi o'z-o'zini rivojlantirishga intiladi.",
      learning_style_summary: answers.learning_style || "Aralash uslub",
      ai_tone_setting: answers.preferred_ai_tone || "Do'stona",
      risk_factors: [answers.main_obstacle || "Aniqlanmadi"],
      strengths: ["Bilimga intilish", "Onboarding jarayonini yakunladi"],
      recommended_subjects: answers.interests ? 
        (Array.isArray(answers.interests) ? answers.interests.slice(0, 5) : [answers.interests]) : 
        ["Umumiy bilim"],
      weekly_plan: `Kuniga ${answers.daily_study_time || '1 soat'} o'qish tavsiya etiladi.`,
      full_summary: "Profil AI tomonidan tahlil qilinmoqda. Iltimos, keyinroq qayta urinib ko'ring."
    };
  }
}

export async function generateCourseRecommendations(
  profile: any,
  answers: Record<string, any>
): Promise<any[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Sen AI ta'lim maslahatchisan. Foydalanuvchining quyidagi profili asosida 6 ta kurs tavsiya qil.

FOYDALANUVCHI PROFILI:
- Shaxsiyat: ${profile.personality_type}
- Mindset: ${profile.mindset_label}
- O'quv uslubi: ${profile.learning_style_summary}
- Qiziqishlar: ${JSON.stringify(answers.interests || [])}
- Rivojlantirish istagidagi ko'nikmalar: ${JSON.stringify(answers.skills_to_develop || [])}
- Orzu karerasi: ${answers.dream_career || 'Belgilanmagan'}
- Ta'lim darajasi: ${answers.education_level || 'Belgilanmagan'}
- Kunlik vaqt: ${answers.daily_study_time || '1 soat'}
- IQ darajasi: ${profile.iq_level || "O'rtacha"}
- Kuchli tomonlar: ${JSON.stringify(profile.strengths || [])}
- Zaif sohalar: ${answers.weakest_area || 'Belgilanmagan'}

Quyidagi JSON formatda 6 ta kurs tavsiya et (FAQAT JSON array, boshqa hech narsa yozma):
[
  {
    "title": "Kurs nomi",
    "subject": "Fan nomi",
    "description": "Kurs haqida qisqa tavsif (2 jumla)",
    "reason": "Nima uchun aynan bu kurs tavsiya etildi (1-2 jumla, profilga bog'lab)",
    "difficulty": "Boshlang'ich|O'rtacha|Yuqori",
    "duration": "Taxminiy davomiyligi",
    "icon": "brain|code|palette|calculator|globe|book|lightbulb|target|rocket|star",
    "color": "#hex rang kodi"
  }
]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('AI javobidan kurslar ro\'yxatini ajratishda xatolik');
  } catch (error) {
    console.error('Course recommendations error:', error);
    // Fallback recommendations based on interests
    const interests = answers.interests || ['Umumiy bilim'];
    const interestList = Array.isArray(interests) ? interests : [interests];
    
    return interestList.slice(0, 6).map((interest: string, i: number) => ({
      title: `${interest} asoslari`,
      subject: interest,
      description: `${interest} bo'yicha boshlang'ich darajadagi kurs. Amaliy misollar bilan.`,
      reason: `Sizning qiziqishlaringiz asosida tanlandi.`,
      difficulty: "Boshlang'ich",
      duration: "4 hafta",
      icon: ['brain', 'code', 'palette', 'calculator', 'globe', 'book'][i % 6],
      color: ['#6C3CE1', '#00D4AA', '#FF6B6B', '#4ECDC4', '#FFE66D', '#45B7D1'][i % 6],
    }));
  }
}
