import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { useBooks, type Book } from '@/app/contexts/BooksContext';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function BookReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getBook } = useBooks();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (id) {
      const foundBook = getBook(id);
      if (foundBook) {
        setBook(foundBook);
      } else {
        toast.error('Kitob topilmadi');
        navigate('/books');
      }
    }
    setLoading(false);
  }, [id, user, getBook, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!book) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/50 backdrop-blur border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button onClick={() => navigate('/books')} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold flex-1 line-clamp-1">{book.title}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Tabs defaultValue="full" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="full">To'liq Matn</TabsTrigger>
            <TabsTrigger value="chapters">Bo'limlar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="full">
            <Card>
              <CardContent className="p-8">
                <div className="prose prose-lg max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {book.fullText}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="chapters">
            <div className="space-y-6">
              {book.chapters?.map((chapter, index) => (
                <Card key={index}>
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-4 text-purple-700">
                      {index + 1}. {chapter.title}
                    </h3>
                    <div className="prose prose-lg max-w-none">
                      <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {chapter.content}
                      </p>
                    </div>
                    {chapter.roles && chapter.roles.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-semibold text-sm text-gray-500 mb-3">
                          Interaktiv Rollar:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {chapter.roles.map((role, roleIndex) => (
                            <span
                              key={roleIndex}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}