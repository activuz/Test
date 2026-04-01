import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { BookOpen, Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-purple-600">404</h1>
          <div className="flex justify-center mt-4">
            <BookOpen className="h-16 w-16 text-gray-400" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-4">Sahifa topilmadi</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Kechirasiz, siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/')}>
            <Home className="mr-2 h-4 w-4" />
            Bosh Sahifa
          </Button>
          <Button onClick={() => navigate('/books')} variant="outline">
            <BookOpen className="mr-2 h-4 w-4" />
            Kitoblar
          </Button>
        </div>
      </div>
    </div>
  );
}
