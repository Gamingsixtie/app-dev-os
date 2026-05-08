import { useState, useEffect } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { useAuth } from '@/features/auth/AuthProvider';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { UserMenu } from '@/features/auth/UserMenu';
import { CloudMigrationWizard } from '@/features/migration/CloudMigrationWizard';
import { hasLocalData, isMigrationComplete } from '@/db/migrations';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import ReviewBadgeCounter from '@/components/ui/ReviewBadgeCounter';
import { useOfflineQueue } from '@/lib/offline-queue';
import { usePricingDataStore } from '@/stores/pricing-data-store';

// Skip auth in development when VITE_SKIP_AUTH is set
const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true';

/**
 * Root layout providing:
 * - Auth guard on all routes except /login (skippable via VITE_SKIP_AUTH)
 * - UserMenu in the header
 * - Cloud migration wizard on first login with local data
 */
export default function RootLayout() {
  const { user, userProfile, loading } = useAuth();
  const routerState = useRouterState();
  const isLoginPage = routerState.location.pathname === '/login';
  const isAuthCallback = routerState.location.pathname === '/auth/callback';

  // When SKIP_AUTH is on we never gate on migration, so seed the initial state
  // accordingly and short-circuit the effect below — avoids a synchronous
  // setState inside useEffect (set-state-in-effect anti-pattern).
  const [needsMigration, setNeedsMigration] = useState<boolean | null>(
    SKIP_AUTH ? false : null,
  );

  // Reset needsMigration to null while auth is still loading or the user is
  // logged out, by comparing against the previous render. Doing this in render
  // (not in an effect) avoids triggering a cascading render via setState in
  // useEffect.
  const authPending = !SKIP_AUTH && (!user || loading);
  const [prevAuthPending, setPrevAuthPending] = useState(authPending);
  if (prevAuthPending !== authPending) {
    setPrevAuthPending(authPending);
    if (authPending) setNeedsMigration(null);
  }

  // Sync offline mutation queue when coming back online
  useEffect(() => {
    const handleOnline = async () => {
      const { mutations, syncAll } = useOfflineQueue.getState();
      if (mutations.length > 0) {
        const result = await syncAll();
        if (result.conflicts > 0) {
          console.warn(`${result.conflicts} wijziging(en) hadden een conflict (server-versie behouden)`);
        }
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Check for local data migration after auth completes
  useEffect(() => {
    if (SKIP_AUTH) {
      // Initial state already seeded to false; no work to do.
      return;
    }
    if (!user || loading) {
      // Reset to null is handled in the render-phase block above.
      return;
    }

    (async () => {
      if (!isMigrationComplete() && (await hasLocalData())) {
        setNeedsMigration(true);
      } else {
        setNeedsMigration(false);
      }
    })();
  }, [user, loading]);

  // Load pricing data from Supabase after auth confirms (per D-03, Gap 1 fix)
  useEffect(() => {
    if (SKIP_AUTH) {
      // In dev mode, load immediately (no auth gate)
      usePricingDataStore.getState().loadFromSupabase();
      return;
    }
    if (!user || loading) return;
    // User is authenticated — load pricing data from Supabase
    usePricingDataStore.getState().loadFromSupabase();
  }, [user, loading]);

  // Login page and auth callback are not protected — the callback needs to
  // run Supabase's PKCE exchange before any auth-guard can redirect away.
  if (isLoginPage || isAuthCallback) {
    return <Outlet />;
  }

  // Skip auth guard in dev mode
  if (SKIP_AUTH) {
    return (
      <>
        <OfflineBanner />
        <header className="bg-white border-b border-neutral-200 px-8 max-sm:px-4 h-12 flex items-center justify-between">
          <span className="text-sm font-medium text-cito-primary">Cito Rekentool</span>
          <span className="text-xs text-orange-500 font-medium">DEV MODE — auth uitgeschakeld</span>
        </header>
        <Outlet />
      </>
    );
  }

  // All other routes require auth
  return (
    <ProtectedRoute>
      <OfflineBanner />
      {/* Header with UserMenu */}
      <header className="bg-white border-b border-neutral-200 px-8 max-sm:px-4 h-12 flex items-center justify-between">
        <span className="text-sm font-medium text-cito-primary">Cito Rekentool</span>
        <div className="flex items-center gap-4">
          {/* Review link - manager only */}
          {(userProfile?.role === 'manager' || userProfile?.role === 'accountmanager') && (
            <a
              href="/review"
              className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-cito-primary transition-colors"
            >
              Review
              <ReviewBadgeCounter />
            </a>
          )}
          <UserMenu />
        </div>
      </header>

      {/* Migration wizard gate */}
      {needsMigration === true ? (
        <CloudMigrationWizard onComplete={() => setNeedsMigration(false)} />
      ) : (
        <Outlet />
      )}
    </ProtectedRoute>
  );
}
