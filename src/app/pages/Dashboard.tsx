import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { generateCourseRecommendations } from '@/app/services/aiService';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import {
  Sparkles, Brain, Target, BookOpen, Code, Palette,
  Calculator, Globe, Lightbulb, Rocket, Star, LogOut,
  ChevronRight, Trophy, Zap, Clock, User, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

const ICON_MAP: Record<string, any> = {
  brain: Brain, code: Code, palette: Palette, calculator: Calculator,
  globe: Globe, book: BookOpen, lightbulb: Lightbulb, target: Target,
  rocket: Rocket, star: Star,
};

export function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.onboardingCompleted) {
      navigate('/onboarding');
      return;
    }
  }, [user, navigate]);

  const loadRecommendations = useCallback(async () => {
    if (!user?.aiProfile || !user?.onboardingData) return;
    setLoadingCourses(true);
    try {
      const recs = await generateCourseRecommendations(
        { ...user.aiProfile, iq_level: user.iqLevel },
        user.onboardingData
      );
      setCourses(recs);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      toast.error("Kurs tavsiyalarini yuklashda xatolik");
    } finally {
      setLoadingCourses(false);
    }
  }, [user]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  if (!user || !user.aiProfile) return null;

  const profile = user.aiProfile;
  const iqPercent = Math.round((user.iqScore / 47) * 100);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              BilimAi
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full">
              <User className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{user.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-purple-600 to-fuchsia-600 p-8 md:p-12 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-amber-300" />
              <span className="text-sm font-medium text-white/80">AI shaxsiy o'qituvchingiz tayyor</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Salom, {user.name}! 👋
            </h1>
            <p className="text-white/80 max-w-2xl text-base md:text-lg">
              {profile.full_summary}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* IQ Score */}
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-primary/5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">IQ Ball</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{user.iqScore}/47</p>
            <p className="text-xs text-muted-foreground mt-1">{user.iqLevel}</p>
            <Progress value={iqPercent} className="h-1.5 mt-2" />
          </div>

          {/* Mindset */}
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-primary/5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Mindset</span>
            </div>
            <p className="text-lg font-bold text-foreground">{profile.mindset_label}</p>
          </div>

          {/* Personality */}
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-primary/5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Brain className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Shaxsiyat</span>
            </div>
            <p className="text-lg font-bold text-foreground">{profile.personality_type}</p>
          </div>

          {/* AI Tone */}
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-primary/5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">AI uslubi</span>
            </div>
            <p className="text-lg font-bold text-foreground">{profile.ai_tone_setting}</p>
          </div>
        </div>

        {/* AI Insights */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-primary/5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-foreground">Kuchli tomonlaringiz</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(profile.strengths || []).map((s: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200">
                  ✨ {s}
                </span>
              ))}
            </div>
          </div>

          {/* Risk Factors */}
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-primary/5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-rose-500" />
              <h3 className="font-semibold text-foreground">E'tibor berish kerak</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(profile.risk_factors || []).map((r: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-rose-50 text-rose-700 text-sm font-medium rounded-full border border-rose-200">
                  ⚠️ {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Learning Profile */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-primary/5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">O'quv uslubingiz</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">{profile.learning_style_summary}</p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-primary/5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Haftalik reja tavsiyasi</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">{profile.weekly_plan}</p>
          </div>
        </div>

        {/* Course Recommendations */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                🎯 Sizga tavsiya etilgan kurslar
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Psixologik profilingiz va qiziqishlaringiz asosida AI tanladi
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadRecommendations}
              disabled={loadingCourses}
              className="border-primary/20 text-primary hover:bg-primary/5"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Yangilash
            </Button>
          </div>

          {loadingCourses ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white/60 rounded-2xl p-6 animate-pulse border border-primary/5">
                  <div className="w-12 h-12 bg-muted rounded-xl mb-4" />
                  <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full mb-1" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course, i) => {
                const Icon = ICON_MAP[course.icon] || BookOpen;
                return (
                  <div
                    key={i}
                    className="group bg-white/80 backdrop-blur rounded-2xl p-6 border border-primary/5 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${course.color || '#6C3CE1'}15` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: course.color || '#6C3CE1' }} />
                    </div>
                    <h3 className="font-semibold text-foreground text-lg mb-1 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {course.description}
                    </p>
                    
                    {/* Why recommended */}
                    <div className="p-3 bg-primary/5 rounded-xl mb-4">
                      <p className="text-xs text-primary leading-relaxed">
                        💡 {course.reason}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          course.difficulty === "Boshlang'ich" ? 'bg-green-100 text-green-700' :
                          course.difficulty === "O'rtacha" ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {course.difficulty}
                        </span>
                        <span className="text-xs text-muted-foreground">{course.duration}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Motivation */}
        <div className="bg-gradient-to-r from-accent/10 to-primary/5 rounded-2xl p-6 border border-accent/20">
          <div className="flex items-start gap-3">
            <Zap className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Motivatsiya profilingiz</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{profile.motivation_profile}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
