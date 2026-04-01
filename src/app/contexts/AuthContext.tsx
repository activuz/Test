import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  personality_type: string;
  mindset_label: string;
  motivation_profile: string;
  learning_style_summary: string;
  ai_tone_setting: string;
  risk_factors: string[];
  strengths: string[];
  recommended_subjects: string[];
  weekly_plan: string;
  full_summary: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  onboardingCompleted: boolean;
  onboardingData: Record<string, any>;
  iqScore: number;
  iqLevel: string;
  iqBreakdown: Record<string, number>;
  aiProfile: UserProfile | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('bilim_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const persistUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('bilim_user', JSON.stringify(userData));
    // Also update in users list
    const usersData = localStorage.getItem('bilim_users');
    const users = usersData ? JSON.parse(usersData) : [];
    const idx = users.findIndex((u: any) => u.id === userData.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...userData };
    }
    localStorage.setItem('bilim_users', JSON.stringify(users));
  };

  const signup = async (email: string, password: string, name: string) => {
    const usersData = localStorage.getItem('bilim_users');
    const users = usersData ? JSON.parse(usersData) : [];

    if (users.find((u: any) => u.email === email)) {
      throw new Error("Bu email allaqachon ro'yxatdan o'tgan");
    }

    const newUser: User & { password: string } = {
      id: `user_${Date.now()}`,
      email,
      name,
      password,
      onboardingCompleted: false,
      onboardingData: {},
      iqScore: 0,
      iqLevel: '',
      iqBreakdown: {},
      aiProfile: null,
    };

    users.push(newUser);
    localStorage.setItem('bilim_users', JSON.stringify(users));

    const { password: _, ...userData } = newUser;
    persistUser(userData);
  };

  const login = async (email: string, password: string) => {
    const usersData = localStorage.getItem('bilim_users');
    const users = usersData ? JSON.parse(usersData) : [];

    const found = users.find((u: any) => u.email === email && u.password === password);
    if (!found) {
      throw new Error("Email yoki parol noto'g'ri");
    }

    const { password: _, ...userData } = found;
    persistUser(userData);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bilim_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    persistUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
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