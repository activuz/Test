import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { useBooks } from '@/app/contexts/BooksContext';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Wand2, BookOpen, Sparkles, LogOut, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function BooksList() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { books, loading } = useBooks();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Tizimdan chiqdingiz');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/50 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wand2 className="h-8 w-8 text-purple-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              MagiBook
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Salom, {user.name}!
            </span>
            {user.isAdmin && (
              <Button onClick={() => navigate('/admin')} variant="outline" size="sm">
                <Shield className="mr-2 h-4 w-4" />
                Admin Panel
              </Button>
            )}
            <Button onClick={handleLogout} variant="ghost" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Chiqish
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Kitoblar Kutubxonasi</h2>
          <p className="text-gray-600">
            O'qish yoki interaktiv sayohatni boshlash uchun kitobni tanlang
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
          </div>
        ) : books.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Hozircha kitoblar yo'q</h3>
              <p className="text-gray-600">
                Admin foydalanuvchilar yangi kitoblar qo'shishi mumkin
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <Card key={book.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{book.title}</CardTitle>
                  <CardDescription>
                    {book.chapters.length} ta bo'lim
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Qo'shilgan: {new Date(book.createdAt).toLocaleDateString('uz-UZ')}
                  </p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/book/${book.id}/read`)}
                    variant="outline"
                    className="flex-1"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    O'qish
                  </Button>
                  <Button
                    onClick={() => navigate(`/book/${book.id}/adventure`)}
                    className="flex-1"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Sayohat
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}