import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { apiService } from '@/app/services/apiService';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Brain, Star, BookOpen, Loader2, Award, Zap, TrendingUp, LogOut, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';

export function Dashboard() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !user.onboardingCompleted) {
       navigate('/onboarding');
    }
  }, [user, navigate]);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      
      // Agar allaqachon generatsiya qilingan profil bo'lsa
      if (user.psychologicalProfile) {
         try {
           setProfile(JSON.parse(user.psychologicalProfile));
         } catch (e) {
           console.error("Parse error", e);
         }
         return;
      }
      
      // Aks holda uni generatsiya qilamiz
      if (user.onboardingData) {
         setLoading(true);
         try {
           const newProfile = await apiService.generatePsychologicalProfile(
             user.email,
             user.onboardingData,
             user.iqScore ?? 0
           );
           
           setProfile(newProfile);
           updateUser({ psychologicalProfile: JSON.stringify(newProfile) });
         } catch (e) {
             console.error("Dashboard error", e);
         }
         setLoading(false);
      }
    }
    
    loadProfile();
  }, [user, updateUser]);

  const handleLogout = () => {
     logout();
     navigate('/');
  };

  const getIqLevel = (score: number) => {
    if (score < 15) return "Boshlang'ich daraja";
    if (score < 28) return "O'rtacha daraja";
    if (score < 38) return "Yuqori qobiliyat";
    return "Mantiqiy daho!";
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFD] p-6 text-center">
         <div className="w-20 h-20 mb-6 rounded-2xl bg-purple-100 flex items-center justify-center animate-pulse">
            <Brain className="h-10 w-10 text-purple-600 animate-bounce" />
         </div>
         <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI profilingizni tahlil qilmoqda...
         </h2>
         <p className="mt-4 text-gray-500 max-w-md">
           Onboarding va IQ test natijalaringizni asos qilib, faqat sizga mos eng mukammal fanlarni topyapmiz.
         </p>
         <div className="mt-8 flex gap-2 justify-center">
           {[...Array(3)].map((_, i) => (
             <div key={i} className="w-3 h-3 rounded-full bg-purple-400 animate-ping" style={{ animationDelay: `\${i * 150}ms` }} />
           ))}
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 font-sans pb-16">
      {/* Navbar */}
      <header className="px-8 py-5 flex justify-between items-center bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-purple-600" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            HamrohAi
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div 
            className="hidden md:block text-right cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/profile')}
          >
             <div className="text-sm font-semibold">{user?.email}</div>
             <div className="text-xs text-gray-500 capitalize">{user?.provider} User</div>
          </div>
          <Button variant="outline" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Welcome Section */}
        <div className="flex items-center gap-4 mb-8">
           <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-200">
             <Star className="h-8 w-8 text-white fill-white" />
           </div>
           <div>
             <h2 className="text-3xl font-bold text-gray-800">Assalomu alaykum!</h2>
             <p className="text-gray-600 text-lg mt-1">Sizning AI-generated shaxsiy ta'lim profilingiz tayyor.</p>
           </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Insights */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="p-6 rounded-3xl shadow-md border-purple-50 hover:shadow-xl transition-all h-full bg-white relative overflow-hidden">
               <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-50 rounded-full blur-3xl opacity-50" />
               <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-pink-50 rounded-full blur-3xl opacity-50" />
               
               <h3 className="font-semibold text-lg flex items-center gap-2 mb-6">
                 <Zap className="h-5 w-5 text-yellow-500" /> Profil Xulosasi
               </h3>
               
               <p className="text-gray-700 leading-relaxed z-10 relative">
                 {profile.summary}
               </p>

               <div className="mt-8">
                 <h4 className="font-semibold text-sm text-gray-500 mb-4 uppercase tracking-wider">
                   Sizning kuchli tomonlaringiz:
                 </h4>
                 <div className="flex flex-wrap gap-2 relative z-10">
                    {profile.strengths?.map((s: string, idx: number) => (
                       <span key={idx} className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-lg text-sm font-medium border border-purple-200">
                         {s}
                       </span>
                    ))}
                 </div>
               </div>
            </Card>

            <Card className="p-6 rounded-3xl shadow-md border-blue-50 bg-gradient-to-br from-blue-50 to-indigo-50 border relative overflow-hidden">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-semibold text-lg text-blue-900 flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" /> Mantiq Testi Natijasi
                 </h3>
                 <span className="text-2xl font-bold text-blue-700">{user?.iqScore || 0}</span>
               </div>
               
               <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden mb-3">
                  <div 
                    className="bg-blue-600 h-full rounded-full" 
                    style={{ width: `\${Math.min(((user?.iqScore || 0) / 47) * 100, 100)}%` }} 
                  />
               </div>
               <p className="text-blue-800 font-medium">
                 Holat: {getIqLevel(user?.iqScore || 0)}
               </p>
            </Card>

            {/* IQ Test CTA if not taken */}
            {(!user?.iqScore || user.iqScore === 0) && (
              <Card className="p-6 rounded-3xl shadow-lg border-2 border-dashed border-purple-200 bg-purple-50/50 flex flex-col items-center text-center group hover:border-purple-400 transition-all cursor-pointer" onClick={() => navigate('/iq-test')}>
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">IQ Testni Topshiring!</h3>
                <p className="text-purple-700/70 text-sm mb-6">
                  Profilingizni mukammal darajaga yetkazish va o'zingizga mos aniqroq yo'nalishlarni olish uchun mantiqiy darajangizni aniqlang.
                </p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-6 font-bold shadow-md shadow-purple-200">
                  Testni boshlash
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Card>
            )}
          </div>

          {/* Right Column - Recommendations */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-2xl text-gray-800 mb-6 flex items-center gap-3">
               <TrendingUp className="h-6 w-6 text-purple-600" />
               AI Tavsiya etadigan yo'nalishlar
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
               {profile.recommendedSubjects?.map((sub: any, idx: number) => (
                  <Card key={idx} className="p-6 rounded-[2rem] shadow-sm hover:shadow-lg transition-all border border-gray-100 group cursor-pointer bg-white">
                     <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <BookOpen className="h-6 w-6 text-purple-600" />
                     </div>
                     <h4 className="text-xl font-bold text-gray-900 mb-2">{sub.name}</h4>
                     <p className="text-gray-500 text-sm leading-relaxed mb-6">
                       {sub.reason}
                     </p>
                     
                     <Button className="w-full rounded-xl bg-gray-50 text-purple-700 hover:bg-purple-600 hover:text-white transition-colors" variant="ghost">
                        Darsni ko'rish
                     </Button>
                  </Card>
               ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
