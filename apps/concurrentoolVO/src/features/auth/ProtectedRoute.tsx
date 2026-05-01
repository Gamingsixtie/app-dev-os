import { useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { AuthLoadingScreen } from './AuthLoadingScreen';

/**
 * Route guard that redirects unauthenticated users to /login.
 * Shows AuthLoadingScreen while the session is being checked.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  // Use a ref instead of state to debounce the redirect: the redirect itself
  // is a side effect (window.location.href), so we don't need to re-render
  // the component when the guard fires. This avoids the set-state-in-effect
  // anti-pattern flagged by react-hooks/set-state-in-effect.
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (!loading && !user && !redirectingRef.current) {
      redirectingRef.current = true;
      window.location.href = '/login';
    }
  }, [user, loading]);

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    // Show loading while redirect to /login is in progress
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}
