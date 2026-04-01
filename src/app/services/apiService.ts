// src/app/services/apiService.ts
const BASE_URL = 'http://localhost:8000/api';

const getHeaders = () => {
  const token = localStorage.getItem('hamrohai_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const apiService = {
  async register(email: string, password: string) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Xatolik");
    return data;
  },

  async verifyOtp(email: string, code: string) {
    const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Xatolik");
    return data;
  },

  async login(email: string, password: string) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Xatolik");
    return data;
  },

  async googleLogin(credential: string) {
    const res = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Xatolik");
    return data;
  },

  async getMe() {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Sahifa yangilandi, hisob topilmadi");
    return await res.json();
  },

  async updateUser(updates: any) {
    const res = await fetch(`${BASE_URL}/user/update`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error("Update failed");
    return await res.json();
  },

  async askQuestionBot(question: string, options: any[], chatHistory: any[]) {
    const res = await fetch(`${BASE_URL}/chat/ask`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ question, options, chatHistory })
    });
    const data = await res.json();
    return data.response;
  },

  async evaluateAnswer(question: string, options: any[], userAnswer: string, fieldType: string) {
    const res = await fetch(`${BASE_URL}/chat/evaluate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ question, options, userAnswer, fieldType })
    });
    const data = await res.json();
    return data.response;
  },

  async generatePsychologicalProfile(email: string, onboardingData: any, iqScore: number) {
    const res = await fetch(`${BASE_URL}/profile/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, onboardingData, iqScore })
    });
    const data = await res.json();
    return data.profile;
  },

  async extractFields(userAnswer: string, availableFields: any[]) {
    const res = await fetch(`${BASE_URL}/chat/extract`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userAnswer, availableFields })
    });
    const data = await res.json();
    return data;
  }
};
