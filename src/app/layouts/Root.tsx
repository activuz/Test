import { Outlet } from 'react-router';
import { AuthProvider } from '@/app/contexts/AuthContext';
import { Toaster } from 'sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '123-placeholder.apps.googleusercontent.com';

export function Root() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
          <Outlet />
        </div>
        <Toaster position="top-center" />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}