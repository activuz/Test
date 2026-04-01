import React, { createContext, useContext, useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  bookId: string;
  chapterIndex: number;
  userId: string;
  messages: Message[];
  systemPrompt: string;
  createdAt: string;
}

interface ChatContextType {
  currentSession: ChatSession | null;
  loading: boolean;
  startChat: (bookId: string, chapterIndex: number, bookTitle: string, chapterContent: string, roles: string[]) => Promise<string>;
  sendMessage: (message: string) => Promise<string>;
  getSessionHistory: (sessionId: string) => ChatSession | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);

  const getGeminiClient = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY topilmadi. Iltimos, Gemini API kalitini environment variable\'ga qo\'shing.');
    }
    return new GoogleGenerativeAI(apiKey);
  };

  const startChat = async (
    bookId: string, 
    chapterIndex: number, 
    bookTitle: string, 
    chapterContent: string, 
    roles: string[]
  ): Promise<string> => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const systemPrompt = `
Sen "${bookTitle}" kitobining ${chapterIndex + 1}-bo'limida hikoyachi va o'yinchi rolida ishtirok etassan.

KITOB KONTEKSTI:
${chapterContent}

MAVJUD ROLLAR:
${roles?.map((role: string, i: number) => `${i + 1}. ${role}`).join('\n') || 'Rollar belgilanmagan'}

QOIDALAR:
1. Foydalanuvchi birinchi navbatda qaysi rolni tanlaishini so'ra
2. Foydalanuvchi rol tanlagandan so'ng, uning rolida hikoyani boshlang
3. Har bir javobingizda vaziyatni tavsifla va foydalanuvchidan qaror qabul qilishni so'ra
4. Foydalanuvchi o'rniga hech qachon qaror qabul qilma - faqat natijalarni tavsifla
5. Hikoyani kitobning ushbu bo'limi doirasida davom ettir
6. Javoblaringni qiziqarli va jonli qil
7. O'zbek tilida javob ber

MUHIM: Sen foydalanuvchi o'rniga harakatlar qilmaysan, faqat vaziyatni tasvirlab berasan va tanlov variantlarini taklif qilasan.
      `.trim();

      const sessionId = `chat_${Date.now()}`;
      
      const session: ChatSession = {
        id: sessionId,
        bookId,
        chapterIndex,
        userId: user.id,
        messages: [],
        systemPrompt,
        createdAt: new Date().toISOString()
      };

      // Generate welcome message
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(
        systemPrompt + "\n\nFoydalanuvchiga xush kelibsiz va qaysi rolni tanlashini so'rang."
      );
      const welcomeMessage = result.response.text();

      // Add welcome message
      session.messages.push({
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date().toISOString()
      });

      // Save session
      const sessions = JSON.parse(localStorage.getItem('chat_sessions') || '[]');
      sessions.push(session);
      localStorage.setItem('chat_sessions', JSON.stringify(sessions));

      setCurrentSession(session);
      return welcomeMessage;
    } catch (error: any) {
      console.error('Start chat error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: string): Promise<string> => {
    if (!currentSession) {
      throw new Error('Chat sessiyasi topilmadi');
    }

    setLoading(true);
    try {
      // Add user message
      const userMessage: Message = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };

      currentSession.messages.push(userMessage);

      // Build conversation history
      const conversationHistory = currentSession.systemPrompt + "\n\n" +
        currentSession.messages.map((msg: Message) => 
          `${msg.role === 'user' ? 'Foydalanuvchi' : 'AI'}: ${msg.content}`
        ).join('\n\n');

      // Get AI response
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(
        conversationHistory + "\n\nFoydalanuvchining oxirgi xabariga javob ber:"
      );
      const aiResponse = result.response.text();

      // Add AI message
      const aiMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };

      currentSession.messages.push(aiMessage);

      // Update session in localStorage
      const sessions = JSON.parse(localStorage.getItem('chat_sessions') || '[]');
      const updatedSessions = sessions.map((s: ChatSession) => 
        s.id === currentSession.id ? currentSession : s
      );
      localStorage.setItem('chat_sessions', JSON.stringify(updatedSessions));

      setCurrentSession({ ...currentSession });
      return aiResponse;
    } catch (error: any) {
      console.error('Send message error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getSessionHistory = (sessionId: string): ChatSession | null => {
    const sessions = JSON.parse(localStorage.getItem('chat_sessions') || '[]');
    return sessions.find((s: ChatSession) => s.id === sessionId) || null;
  };

  return (
    <ChatContext.Provider value={{ 
      currentSession, 
      loading, 
      startChat, 
      sendMessage, 
      getSessionHistory 
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}