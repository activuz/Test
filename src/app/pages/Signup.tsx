import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Parollar mos emas');
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }

    setLoading(true);
    try {
      await signup(formData.email, formData.password, formData.name);
      toast.success("Ro'yxatdan o'tdingiz!");
      navigate('/onboarding');
    } catch (error: any) {
      toast.error(error.message || "Ro'yxatdan o'tish xatosi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <Card className="w-full max-w-md relative z-10 bg-white/80 backdrop-blur-xl border-primary/5 shadow-xl shadow-primary/5 rounded-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">BilimAi'ga Qo'shiling</CardTitle>
          <CardDescription>
            AI yordamida shaxsiy ta'lim rejangizni yarating
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ismingiz</Label>
              <Input
                id="name" type="text" placeholder="Ismingiz"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required disabled={loading}
                className="h-12 rounded-xl bg-white/80 border-primary/10 focus:border-primary/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email" type="email" placeholder="email@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required disabled={loading}
                className="h-12 rounded-xl bg-white/80 border-primary/10 focus:border-primary/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <Input
                id="password" type="password" placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required disabled={loading}
                className="h-12 rounded-xl bg-white/80 border-primary/10 focus:border-primary/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Parolni tasdiqlang</Label>
              <Input
                id="confirmPassword" type="password" placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                required disabled={loading}
                className="h-12 rounded-xl bg-white/80 border-primary/10 focus:border-primary/40"
              />
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-semibold shadow-lg shadow-primary/20" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ro'yxatdan o'tish
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-0">
          <div className="text-sm text-center text-muted-foreground">
            Hisobingiz bormi?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Kirish
            </Link>
          </div>
          <div className="text-sm text-center">
            <Link to="/" className="text-muted-foreground hover:text-primary hover:underline">
              ← Bosh sahifaga
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}