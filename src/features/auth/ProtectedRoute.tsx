import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { AuthLoadingScreen } from './AuthLoadingScreen';

/**
 * Route guard that redirects unauthenticated users to /login.
 * Shows AuthLoadingScreen while the session is being checked.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !user && !redirecting) {
      setRedirecting(true);
      window.location.href = '/login';
    }
  }, [user, loading, redirecting]);

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    // Show loading while redirect to /login is in progress
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}
