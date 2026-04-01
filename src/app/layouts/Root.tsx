import { Outlet } from 'react-router';
import { AuthProvider } from '@/app/contexts/AuthContext';
import { OnboardingProvider } from '@/app/contexts/OnboardingContext';

export function Root() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <Outlet />
      </OnboardingProvider>
    </AuthProvider>
  );
}