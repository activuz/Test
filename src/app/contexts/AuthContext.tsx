import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '@/app/services/apiService';

export interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
  onboardingCompleted?: boolean;
  onboardingProgress?: string;
  chatHistory?: any[];
  provider?: 'email' | 'google';
  onboardingData?: Record<string, any>;
  iqScore?: number;
  psychologicalProfile?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{requiresOtp: boolean, email: string}>;
  verifyOtpAndLogin: (email: string, code: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
        const savedToken = localStorage.getItem('hamrohai_token');
        if (savedToken) {
           try {
             // Let it populate automatically from headers
             const data = await apiService.getMe();
             setAccessToken(savedToken);
             setUser({
                id: `user_${data.email}`,
                email: data.email,
                onboardingCompleted: data.onboardingCompleted,
                onboardingProgress: data.onboardingProgress,
                chatHistory: data.chatHistory,
                onboardingData: data.onboardingData,
                iqScore: data.iqScore,
                psychologicalProfile: data.psychologicalProfile ? JSON.stringify(data.psychologicalProfile) : undefined,
                provider: data.provider || 'email',
             });
           } catch (e) {
             console.log("Token invalid or expired", e);
             localStorage.removeItem('hamrohai_token');
           }
        }
        setLoading(false);
    };
    fetchMe();
  }, []);

  const signup = async (email: string, password: string) => {
    // Endi bu login qilmaydi, aksincha OTP kod soralganini qaytaradi
    const response = await apiService.register(email, password);
    return response;
  };

  const verifyOtpAndLogin = async (email: string, code: string) => {
    const data = await apiService.verifyOtp(email, code);
    const userData: User = {
      id: `user_${Date.now()}`,
      email: data.email,
      onboardingCompleted: false,
      provider: 'email',
    };

    setAccessToken(data.accessToken);
    setUser(userData);
    localStorage.setItem('hamrohai_token', data.accessToken);
  };

  const login = async (email: string, password: string) => {
    const data = await apiService.login(email, password);
    const userData: User = {
      id: `user_${Date.now()}`,
      email: data.email,
      onboardingCompleted: data.onboardingCompleted,
      onboardingProgress: data.onboardingProgress,
      chatHistory: data.chatHistory,
      onboardingData: data.onboardingData,
      iqScore: data.iqScore,
      psychologicalProfile: data.psychologicalProfile ? JSON.stringify(data.psychologicalProfile) : undefined,
      provider: 'email',
    };

    setAccessToken(data.accessToken);
    setUser(userData);
    localStorage.setItem('hamrohai_token', data.accessToken);
  };

  const loginWithGoogle = async (credential: string) => {
    const data = await apiService.googleLogin(credential);
    const userData: User = {
      id: `user_${Date.now()}`,
      email: data.email,
      onboardingCompleted: data.onboardingCompleted,
      onboardingProgress: data.onboardingProgress,
      chatHistory: data.chatHistory,
      onboardingData: data.onboardingData,
      iqScore: data.iqScore,
      psychologicalProfile: data.psychologicalProfile ? JSON.stringify(data.psychologicalProfile) : undefined,
      provider: 'google',
    };

    setAccessToken(data.accessToken);
    setUser(userData);
    localStorage.setItem('hamrohai_token', data.accessToken);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    // Use functional update to avoid state race conditions
    setUser(prev => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });

    try {
       await apiService.updateUser(updates);
    } catch (e) {
       console.error("Failed to sync auth context with backend", e);
    }
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('hamrohai_token');
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, signup, verifyOtpAndLogin, loginWithGoogle, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
