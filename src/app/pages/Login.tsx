import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleLogin } from '@react-oauth/google';

export function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success("Xush kelibsiz!");
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || "Kirish xatosi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">HamrohAI</CardTitle>
          <CardDescription>Hisobingizga kiring</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  try {
                    await loginWithGoogle(credentialResponse.credential);
                    navigate('/onboarding');
                  } catch (e: any) {
                    toast.error(e.message || "Google bilan ulanishda xatolik");
                  }
                }
              }}
              onError={() => {
                toast.error("Google avtorizatsiyasi bekor qilindi");
              }}
            />
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">yoki</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
                className="bg-gray-50 text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
                className="bg-gray-50 text-gray-900"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kirish
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <div className="text-sm text-center text-gray-600">
            Hisobingiz yo'qmi?{' '}
            <Link to="/signup" className="text-purple-600 hover:underline">
              Ro'yxatdan o'ting
            </Link>
          </div>
          <div className="text-sm text-center">
            <Link to="/" className="text-gray-600 hover:underline">
              ← Bosh sahifaga qaytish
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
