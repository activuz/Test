import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { useBooks } from '@/app/contexts/BooksContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Chapter {
  title: string;
  content: string;
  roles: string[];
}

export function AdminBookForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getBook, createBook, updateBook } = useBooks();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    fullText: '',
    chapters: [{ title: '', content: '', roles: [''] }] as Chapter[]
  });

  const isEdit = !!id;

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

    if (isEdit && id) {
      const book = getBook(id);
      if (book) {
        setFormData({
          title: book.title,
          fullText: book.fullText,
          chapters: book.chapters.map((ch: Chapter) => ({
            ...ch,
            roles: ch.roles && ch.roles.length > 0 ? ch.roles : ['']
          }))
        });
      } else {
        toast.error('Kitob topilmadi');
        navigate('/admin');
      }
    }
  }, [user, id, isEdit, navigate, getBook]);

  const addChapter = () => {
    setFormData({
      ...formData,
      chapters: [...formData.chapters, { title: '', content: '', roles: [''] }]
    });
  };

  const removeChapter = (index: number) => {
    const newChapters = formData.chapters.filter((_, i) => i !== index);
    setFormData({ ...formData, chapters: newChapters });
  };

  const updateChapter = (index: number, field: keyof Chapter, value: any) => {
    const newChapters = [...formData.chapters];
    newChapters[index] = { ...newChapters[index], [field]: value };
    setFormData({ ...formData, chapters: newChapters });
  };

  const addRole = (chapterIndex: number) => {
    const newChapters = [...formData.chapters];
    newChapters[chapterIndex].roles.push('');
    setFormData({ ...formData, chapters: newChapters });
  };

  const removeRole = (chapterIndex: number, roleIndex: number) => {
    const newChapters = [...formData.chapters];
    newChapters[chapterIndex].roles = newChapters[chapterIndex].roles.filter((_, i) => i !== roleIndex);
    setFormData({ ...formData, chapters: newChapters });
  };

  const updateRole = (chapterIndex: number, roleIndex: number, value: string) => {
    const newChapters = [...formData.chapters];
    newChapters[chapterIndex].roles[roleIndex] = value;
    setFormData({ ...formData, chapters: newChapters });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Kitob nomini kiriting');
      return;
    }

    if (!formData.fullText.trim()) {
      toast.error('To\'liq matnni kiriting');
      return;
    }

    if (formData.chapters.length === 0) {
      toast.error('Kamida bitta bo\'lim qo\'shing');
      return;
    }

    for (let i = 0; i < formData.chapters.length; i++) {
      if (!formData.chapters[i].title.trim()) {
        toast.error(`${i + 1}-bo\'lim nomini kiriting`);
        return;
      }
      if (!formData.chapters[i].content.trim()) {
        toast.error(`${i + 1}-bo\'lim matnini kiriting`);
        return;
      }
    }

    // Clean up roles (remove empty ones)
    const cleanedChapters = formData.chapters.map(ch => ({
      ...ch,
      roles: ch.roles.filter(r => r.trim() !== '')
    }));

    setLoading(true);

    try {
      if (isEdit && id) {
        await updateBook(id, {
          title: formData.title,
          fullText: formData.fullText,
          chapters: cleanedChapters
        });
        toast.success('Kitob yangilandi');
      } else {
        await createBook({
          title: formData.title,
          fullText: formData.fullText,
          chapters: cleanedChapters,
          createdBy: user.id
        });
        toast.success('Kitob qo\'shildi');
      }
      navigate('/admin');
    } catch (error) {
      console.error('Save book error:', error);
      toast.error('Xato yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.isAdmin) return null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/50 backdrop-blur border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button onClick={() => navigate('/admin')} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">
            {isEdit ? 'Kitobni Tahrirlash' : 'Yangi Kitob Qo\'shish'}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Asosiy Ma'lumotlar</CardTitle>
              <CardDescription>
                Kitobning umumiy ma'lumotlarini kiriting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Kitob Nomi *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Masalan: Sehrli Dunyo"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullText">To'liq Matn *</Label>
                <Textarea
                  id="fullText"
                  value={formData.fullText}
                  onChange={(e) => setFormData({ ...formData, fullText: e.target.value })}
                  placeholder="Kitobning to'liq matnini kiriting..."
                  rows={10}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Chapters */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Bo'limlar</h3>
                <p className="text-sm text-gray-600">
                  Har bir bo'lim uchun matn va rollarni kiriting
                </p>
              </div>
              <Button type="button" onClick={addChapter} variant="outline" disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Bo'lim Qo'shish
              </Button>
            </div>

            {formData.chapters.map((chapter, chapterIndex) => (
              <Card key={chapterIndex}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">Bo'lim {chapterIndex + 1}</CardTitle>
                    {formData.chapters.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeChapter(chapterIndex)}
                        variant="ghost"
                        size="sm"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bo'lim Nomi *</Label>
                    <Input
                      value={chapter.title}
                      onChange={(e) => updateChapter(chapterIndex, 'title', e.target.value)}
                      placeholder="Bo'lim nomini kiriting"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bo'lim Matni *</Label>
                    <Textarea
                      value={chapter.content}
                      onChange={(e) => updateChapter(chapterIndex, 'content', e.target.value)}
                      placeholder="Bo'lim matnini kiriting..."
                      rows={6}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Interaktiv Rollar</Label>
                      <Button
                        type="button"
                        onClick={() => addRole(chapterIndex)}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Rol Qo'shish
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {chapter.roles.map((role, roleIndex) => (
                        <div key={roleIndex} className="flex gap-2">
                          <Input
                            value={role}
                            onChange={(e) => updateRole(chapterIndex, roleIndex, e.target.value)}
                            placeholder="Rol nomi (masalan: Botir qahramon)"
                            disabled={loading}
                          />
                          <Button
                            type="button"
                            onClick={() => removeRole(chapterIndex, roleIndex)}
                            variant="ghost"
                            size="icon"
                            disabled={loading || chapter.roles.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin')}
              disabled={loading}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Yangilash' : 'Qo\'shish'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}