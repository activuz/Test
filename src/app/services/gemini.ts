import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export interface ChatMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

const SYSTEM_INSTRUCTION = `Sen HamrohAI platformasida foydalanuvchilarga onboarding (ma'lumot yig'ish) jarayonida yordam beruvchi xushmuomala, ochiqko'ngil AI yordamchisan. Sening ismning HamrohAI. Muloqotni insoniy, quruq emas va qiziqarli ko'rinishda olib borasan. O'zbek tilida gaplashasan. Qisqa va aniq javoblar berasan - ortiqcha izoh yozma.`;

export async function generateBotMessage(
  chatHistory: ChatMessage[],
  instruction: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const chat = model.startChat({ history: chatHistory });

  const prompt = `[TIZIM TOPSHIRIG'I: ${instruction} Hech qanday qo'shimcha izohsiz to'g'ridan to'g'ri o'z rolingda qisqacha savolni ber]`;

  const result = await chat.sendMessage(prompt);
  return result.response.text().trim();
}

export async function validateAnswer(
  question: string,
  userAnswer: string,
  options: string[] | null,
  fieldType: string
): Promise<{ valid: boolean; normalized: string }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  let prompt = `Savol: "${question}"\nFoydalanuvchining javobi: "${userAnswer}"\n\n`;

  if (fieldType === 'date') {
    prompt += `DIQQAT! Turi SANA (date) bo'lgani uchun albatta yil ham ko'rsatilishi shart! Agar faqat kun va oy yozilgan bo'lsa, INVALID deb bahola!\n\n`;
  }

  if (options && options.length > 0) {
    prompt += `Mumkin bo'lgan variantlar: ${options.join(', ')}.\n`;
  }

  prompt += `Vazifang:
1) Agar foydalanuvchi savolga yetarlicha mos javob bergan bo'lsa, "VALID: <qisqa aniq javob>" deb qaytar.
2) Agar foydalanuvchi rad etsa yoki aloqasiz javob berse, "INVALID" deb qaytar.
Faqat shu ikki formatda javob ber!`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  if (text.startsWith('VALID:')) {
    return { valid: true, normalized: text.replace('VALID:', '').trim() };
  }
  return { valid: false, normalized: '' };
}

export async function generateAIProfile(answers: Record<string, string>): Promise<{
  personality_type: string;
  mindset_label: string;
  learning_style_summary: string;
  motivation_profile: string;
  recommended_content_format: string;
  ai_tone_setting: string;
  iq_level: string;
  strengths: string[];
  risk_factors: string[];
  weekly_study_plan_suggestion: string;
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const answersText = Object.entries(answers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  const prompt = `Quyidagi foydalanuvchi ma'lumotlari asosida psixologik profil yarating. JSON formatida qaytaring:

Foydalanuvchi ma'lumotlari:
${answersText}

Quyidagi JSON strukturasida qaytaring (hech qanday markdown yoki qo'shimcha matn bo'lmashi kerak):
{
  "personality_type": "...",
  "mindset_label": "...",
  "learning_style_summary": "...",
  "motivation_profile": "...",
  "recommended_content_format": "...",
  "ai_tone_setting": "...",
  "iq_level": "...",
  "strengths": ["...", "...", "..."],
  "risk_factors": ["...", "..."],
  "weekly_study_plan_suggestion": "..."
}`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();

  // Remove markdown code blocks if present
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(text);
  } catch {
    return {
      personality_type: 'Analitik o\'quvchi',
      mindset_label: 'O\'sish mentaliteti',
      learning_style_summary: 'Vizual va amaliy o\'rganish',
      motivation_profile: 'Maqsadga yo\'naltirilgan',
      recommended_content_format: 'Video darslar va amaliy mashqlar',
      ai_tone_setting: 'Qo\'llab-quvvatlovchi va rag\'batlantiruvchi',
      iq_level: 'O\'rtadan yuqori',
      strengths: ['Izchillik', 'Qiziquvchanlik', 'Moslashuvchanlik'],
      risk_factors: ['Ortiqcha tahlil qilish', 'Vaqt boshqaruvi'],
      weekly_study_plan_suggestion: 'Kuniga 1-2 soat, hafta 5 kun',
    };
  }
}

export async function generateCourseRecommendations(
  profile: Record<string, any>,
  answers: Record<string, string>
): Promise<Array<{
  title: string;
  description: string;
  category: string;
  difficulty: string;
  why_recommended: string;
  estimated_time: string;
  url?: string;
}>> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const profileText = Object.entries(profile)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n');

  const interests = answers.interests || '';
  const goal = answers.main_goal || '';
  const career = answers.dream_career || '';
  const skills = answers.skills_to_develop || '';

  const prompt = `Foydalanuvchi psixologik profili:
${profileText}

Qiziqishlari: ${interests}
Asosiy maqsadi: ${goal}
Orzuiy kasbi: ${career}
Rivojlantirmoqchi bo'lgan ko'nikmalar: ${skills}

Ushbu foydalanuvchi uchun 6 ta eng mos kurs/dars tavsiya qiling. JSON massiv formatida qaytaring:
[
  {
    "title": "Kurs nomi",
    "description": "Qisqa tavsif (1-2 jumlada)",
    "category": "Matematika/Dasturlash/Fan/Til/Biznes/San'at/...",
    "difficulty": "Boshlang'ich/O'rta/Yuqori",
    "why_recommended": "Nima uchun tavsiya etilmoqda (1 jumla)",
    "estimated_time": "Taxminiy vaqt"
  }
]

Faqat JSON massiv qaytaring, markdown yoki qo'shimcha matn yo'q!`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(text);
  } catch {
    return [
      {
        title: 'Matematika asoslari',
        description: 'Algebra, geometriya va statistika asoslarini o\'rganing',
        category: 'Matematika',
        difficulty: 'Boshlang\'ich',
        why_recommended: 'Har qanday sohada kerakli asosiy ko\'nikma',
        estimated_time: '4 hafta',
      },
      {
        title: 'Python dasturlash',
        description: 'Python tilida dasturlash asoslarini o\'rganing',
        category: 'Dasturlash',
        difficulty: 'Boshlang\'ich',
        why_recommended: 'Kelajak kasbi uchun zarur texnik ko\'nikma',
        estimated_time: '6 hafta',
      },
    ];
  }
}
