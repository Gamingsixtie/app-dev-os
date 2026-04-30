import { useEffect } from 'react';
import { Outlet, useParams, useNavigate, useRouterState } from '@tanstack/react-router';
import { useSchool } from '@/hooks/useSchools';
import { useAuth } from '@/features/auth/AuthProvider';
import { ReadOnlyBanner } from '@/components/ui/ReadOnlyBanner';
import { useSchoolProfileStore } from '@/features/school-profile/store';
import { usePriceComparisonStore } from '@/features/price-comparison/store';
import ProfileHeader from '@/features/school-profile/components/ProfileHeader';
import TabNavigation from '@/features/school-profile/components/TabNavigation';

export default function SchoolLayout() {
  const { slug } = useParams({ from: '/scholen/$slug' });
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { userProfile } = useAuth();

  // Detect if we're on a wizard path — hide tabs on wizard
  const isWizardPath = currentPath.includes('/wizard/');

  const { data: school, isLoading } = useSchool(slug);

  // Determine ownership and role-based visibility
  const isOwner = !!(school?.ownerId && userProfile?.id && school.ownerId === userProfile.id);
  const showReadOnlyBanner = !isOwner && userProfile?.role && userProfile.role !== 'accountmanager';

  // Redirect if school not found (after loading)
  useEffect(() => {
    if (!isLoading && school === null) {
      navigate({ to: '/scholen', search: { error: 'not-found' } });
    }
  }, [school, isLoading, navigate]);

  // Hydrate stores when school data changes
  useEffect(() => {
    if (school) {
      useSchoolProfileStore.getState().hydrate(school);
      usePriceComparisonStore.getState().hydrate(school);
    }
  }, [school?.id, school?.updatedAt]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cito-bg flex items-center justify-center">
        <div className="animate-pulse text-neutral-400">Laden...</div>
      </div>
    );
  }

  if (!school) return null;

  return (
    <div className="min-h-screen bg-cito-bg">
      {!isWizardPath && <ProfileHeader />}
      {!isWizardPath && showReadOnlyBanner && (
        <div className="px-8 max-sm:px-4">
          <ReadOnlyBanner role={userProfile!.role as 'manager' | 'viewer'} />
        </div>
      )}
      {!isWizardPath && <TabNavigation />}
      <Outlet />
    </div>
  );
}
