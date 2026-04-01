import { Link } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Sparkles, Brain, Target, BookOpen, ChevronRight, Zap, Shield, Users } from 'lucide-react';

const STEPS = [
  {
    icon: Users,
    title: "Ro'yxatdan o'ting",
    description: "Bir necha soniyada hisobingizni yarating",
    color: "#6C3CE1",
  },
  {
    icon: Brain,
    title: "O'zingiz haqingizda aytib bering",
    description: "Psixologik profil va qiziqishlaringizni aniqlang",
    color: "#00D4AA",
  },
  {
    icon: Target,
    title: "IQ testini yeching",
    description: "Aqliy qobiliyatingizni tekshiring",
    color: "#FF6B6B",
  },
  {
    icon: Sparkles,
    title: "AI tavsiyalarni oling",
    description: "Shaxsiy ta'lim rejangiz tayyor!",
    color: "#FFB800",
  },
];

const FEATURES = [
  {
    icon: Brain,
    title: "Psixologik tahlil",
    description: "Big Five personality, mindset va motivatsiya tahlili",
  },
  {
    icon: Zap,
    title: "AI bilan ishlash",
    description: "Gemini AI sizning profilingizga mos kurslarni taklif qiladi",
  },
  {
    icon: Shield,
    title: "Shaxsiy yondashuv",
    description: "Sizning o'quv uslubingizga moslashtirilgan ta'lim rejasi",
  },
  {
    icon: BookOpen,
    title: "Keng kurs bazasi",
    description: "Matematika, dasturlash, fizika va boshqa fanlar",
  },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 overflow-hidden">
      {/* Decorative blobs */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      <div className="fixed top-1/2 left-1/2 w-[600px] h-[600px] bg-fuchsia-200/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      {/* Nav */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            BilimAi
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-primary">
              Kirish
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
              Boshlash
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-full text-sm font-medium text-primary mb-8">
          <Zap className="w-4 h-4" />
          Sun'iy intellekt yordamida individual ta'lim
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
          <span className="bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent">
            AI sizning shaxsiy
          </span>
          <br />
          <span className="bg-gradient-to-r from-primary via-purple-600 to-accent bg-clip-text text-transparent">
            o'qituvchingiz
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Psixologik profil, IQ test va sun'iy intellekt tahlili asosida
          sizga eng mos ta'lim rejasini yaratamiz
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup">
            <Button size="lg" className="h-14 px-8 text-base bg-gradient-to-r from-primary to-purple-600 text-white shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 rounded-xl transition-all duration-300 hover:-translate-y-0.5">
              <Sparkles className="w-5 h-5 mr-2" />
              Bepul boshlash
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="h-14 px-8 text-base border-primary/20 text-primary hover:bg-primary/5 rounded-xl">
              Hisobimga kirish
            </Button>
          </Link>
        </div>

        {/* Quick stats */}
        <div className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span>AI tahlil</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>Shaxsiy reja</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>IQ test</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Qanday ishlaydi?
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
          4 oddiy qadam — va sizning shaxsiy ta'lim rejangiz tayyor
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <div key={i} className="relative group">
              <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-primary/5 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${step.color}15` }}
                  >
                    <step.icon className="w-6 h-6" style={{ color: step.color }} />
                  </div>
                  <span className="text-3xl font-bold text-muted/40">{i + 1}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 text-primary/20">
                  <ChevronRight className="w-6 h-6" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-primary/5">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Nima uchun <span className="text-primary">BilimAi</span>?
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {FEATURES.map((feat, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-primary/3 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground">{feat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="bg-gradient-to-r from-primary via-purple-600 to-fuchsia-600 rounded-3xl p-8 md:p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Kelajagingizni bugun boshlang
          </h2>
          <p className="text-white/80 max-w-md mx-auto mb-8">
            AI sizning eng yaxshi o'qituvchingizga aylansin. Ro'yxatdan o'ting va shaxsiy ta'lim rejangizni oling.
          </p>
          <Link to="/signup">
            <Button size="lg" className="h-14 px-8 text-base bg-white text-primary hover:bg-white/90 rounded-xl shadow-xl">
              <Sparkles className="w-5 h-5 mr-2" />
              Hozir boshlash
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-8 text-center text-sm text-muted-foreground border-t border-primary/5">
        <p>© 2026 BilimAi. Sun'iy intellekt yordamida ta'lim.</p>
      </footer>
    </div>
  );
}
