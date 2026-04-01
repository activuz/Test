import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { useBooks } from '@/app/contexts/BooksContext';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { ArrowLeft, Plus, Edit, Trash2, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

export function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { books, loading, deleteBook } = useBooks();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!user.isAdmin) {
      toast.error('Admin huquqlari yo\'q');
      navigate('/books');
      return;
    }
  }, [user, navigate]);

  const handleDeleteClick = (bookId: string) => {
    setBookToDelete(bookId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return;

    setDeleting(true);

    try {
      await deleteBook(bookToDelete);
      toast.success('Kitob o\'chirildi');
    } catch (error) {
      console.error('Delete book error:', error);
      toast.error('O\'chirishda xato');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setBookToDelete(null);
    }
  };

  if (!user || !user.isAdmin) return null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/50 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/books')} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-purple-600" />
              <h1 className="text-2xl font-bold">Admin Panel</h1>
            </div>
          </div>
          <Button onClick={() => navigate('/admin/books/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Yangi Kitob
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Kitoblarni Boshqarish</h2>
          <p className="text-gray-600">
            Kitoblarni qo'shish, tahrirlash va o'chirish
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
          </div>
        ) : books.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Hozircha kitoblar yo'q</h3>
              <p className="text-gray-600 mb-4">
                Birinchi kitobni qo'shish uchun "Yangi Kitob" tugmasini bosing
              </p>
              <Button onClick={() => navigate('/admin/books/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Yangi Kitob Qo'shish
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <Card key={book.id}>
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
                    onClick={() => navigate(`/admin/books/${book.id}/edit`)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Tahrirlash
                  </Button>
                  <Button
                    onClick={() => handleDeleteClick(book.id)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    O'chirish
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kitobni o'chirishni tasdiqlaysizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu amalni ortga qaytarib bo'lmaydi. Kitob va uning barcha ma'lumotlari butunlay o'chiriladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}