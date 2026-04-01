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

export function Signup() {
  const navigate = useNavigate();
  const { signup, verifyOtpAndLogin, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Parollar mos kelmadi');
      return;
    }

    setLoading(true);
    try {
      if (!isOtpStep) {
         // Ro'yxatdan o'tish OTP qadamini chaqiradi
         const result = await signup(formData.email, formData.password);
         if (result?.requiresOtp) {
            toast.success("Emailingizga tasdiq kodi yuborildi!");
            setIsOtpStep(true);
         } else {
            navigate('/onboarding');
         }
      } else {
         // OTP ni tasdiqlash
         await verifyOtpAndLogin(formData.email, otpCode);
         toast.success("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
         navigate('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">HamrohAI'ga Qo'shiling</CardTitle>
          <CardDescription>Aqlli o'quv sayohatingizni boshlang</CardDescription>
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">yoki</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {!isOtpStep ? (
              <>
                <div className="space-y-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email manzili"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="h-12 rounded-xl bg-gray-50 text-gray-900"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Parol"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="h-12 rounded-xl bg-gray-50 text-gray-900"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Parolni tasdiqlang"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="h-12 rounded-xl bg-gray-50 text-gray-900"
                    required
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-center text-purple-600 mb-2">
                  6-xonali Tasdiqlash kodi
                </p>
                <Input
                  id="otpCode"
                  type="text"
                  placeholder="Kod (Masalan: 123456)"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="h-12 rounded-xl text-center text-lg tracking-widest bg-gray-50 text-gray-900 placeholder:text-gray-400"
                  maxLength={6}
                  required
                />
              </div>
            )}
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ro'yxatdan o'tish
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <div className="text-sm text-center text-gray-600">
            Hisobingiz bormi?{' '}
            <Link to="/login" className="text-purple-600 hover:underline">
              Kirish
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
