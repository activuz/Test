import { Outlet } from 'react-router';
import { AuthProvider } from '@/app/contexts/AuthContext';
import { BooksProvider } from '@/app/contexts/BooksContext';
import { ChatProvider } from '@/app/contexts/ChatContext';

export function Root() {
  return (
    <AuthProvider>
      <BooksProvider>
        <ChatProvider>
          <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
            <Outlet />
          </div>
        </ChatProvider>
      </BooksProvider>
    </AuthProvider>
  );
}