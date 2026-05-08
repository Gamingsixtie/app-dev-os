import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from './AuthProvider';

/**
 * Landing page for Supabase magic-link redirects.
 * Supabase exchanges the PKCE ?code= for a session via detectSessionInUrl;
 * this component waits for the session to settle and then routes onward.
 * Lives outside ProtectedRoute so the auth handshake is never short-circuited.
 */
export function AuthCallback() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) {
      void navigate({ to: '/scholen', replace: true });
    } else {
      void navigate({ to: '/login', replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cito-bg">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-cito-primary border-t-transparent" />
        <p className="text-base text-neutral-700">Bezig met inloggen…</p>
      </div>
    </div>
  );
}
