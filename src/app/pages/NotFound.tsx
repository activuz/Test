import { Link } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Sparkles } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      <div className="text-center space-y-6 p-8">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-6xl font-extrabold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            404
          </h1>
          <p className="text-xl text-muted-foreground mt-2">Sahifa topilmadi</p>
        </div>
        <Link to="/">
          <Button className="bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl shadow-lg shadow-primary/20">
            Bosh sahifaga qaytish
          </Button>
        </Link>
      </div>
    </div>
  );
}
