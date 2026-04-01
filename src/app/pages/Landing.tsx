import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import { BookOpen, Sparkles, Wand2 } from 'lucide-react';

export function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Wand2 className="h-8 w-8 text-purple-600" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            MagiBook
          </h1>
        </div>
        <div className="flex gap-4">
          {user ? (
            <>
              <Button onClick={() => navigate('/books')} variant="outline">
                Kitoblar
              </Button>
              {user.isAdmin && (
                <Button onClick={() => navigate('/admin')} variant="outline">
                  Admin Panel
                </Button>
              )}
            </>
          ) : (
            <>
              <Button onClick={() => navigate('/login')} variant="outline">
                Kirish
              </Button>
              <Button onClick={() => navigate('/signup')}>
                Ro'yxatdan o'tish
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-6">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span className="text-purple-700 font-medium">AI-powered Interaktiv Kitoblar</span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Kitoblarni{' '}
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              O'qish Emas,
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Yashash Vaqti!
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            MagiBook bilan kitob o'qish oddiy matndan ko'proq narsaga aylanadi. 
            AI yordamida siz hikoyaning bir qismi bo'lasiz va o'z tanlovlaringiz orqali hikoyani davom ettirasiz!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {user ? (
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => navigate('/books')}
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Kitoblarni Ko'rish
              </Button>
            ) : (
              <>
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6"
                  onClick={() => navigate('/signup')}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Bepul Boshlash
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-6"
                  onClick={() => navigate('/login')}
                >
                  Hisobga Kirish
                </Button>
              </>
            )}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 bg-white/50 backdrop-blur rounded-2xl border border-purple-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Oddiy O'qish</h3>
              <p className="text-gray-600">
                Kitoblarni klassik usulda o'qing va zavqlaning
              </p>
            </div>

            <div className="p-6 bg-white/50 backdrop-blur rounded-2xl border border-pink-100">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Wand2 className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Interaktiv Sayohat</h3>
              <p className="text-gray-600">
                AI bilan hikoya ichida rol o'ynang va qaror qabul qiling
              </p>
            </div>

            <div className="p-6 bg-white/50 backdrop-blur rounded-2xl border border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">AI Hamroh</h3>
              <p className="text-gray-600">
                Har bir tanlovingizga mos hikoyani davom ettiradi
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-gray-500">
        <p>© 2025 MagiBook. Barcha huquqlar himoyalangan.</p>
      </footer>
    </div>
  );
}
