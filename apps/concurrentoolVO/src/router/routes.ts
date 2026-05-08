import {
  createRootRoute,
  createRoute,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router';
import { checkSchoolExists } from './guards';
import RootLayout from '@/components/routing/RootLayout';
import SchoolLayout from '@/components/routing/SchoolLayout';

// Root layout (with UserMenu header and migration gate)
export const rootRoute = createRootRoute({
  component: RootLayout,
});

// Login route — outside ProtectedRoute
export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: lazyRouteComponent(() => import('@/features/auth/LoginPage'), 'LoginPage'),
});

// Auth callback — Supabase magic-link landing, outside ProtectedRoute so the
// PKCE ?code= handshake completes before any redirect can strip the query.
export const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: lazyRouteComponent(() => import('@/features/auth/AuthCallback'), 'AuthCallback'),
});

// Index route — smart redirect to overview
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: async () => {
    throw redirect({ to: '/scholen' });
  },
});

// School overview
export const scholenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scholen',
  component: lazyRouteComponent(() => import('@/features/school-overview/SchoolOverviewPage')),
});

// School layout (parent for all school-specific routes)
export const schoolRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scholen/$slug',
  beforeLoad: async ({ params }) => {
    const school = await checkSchoolExists(params.slug);
    if (!school) {
      throw redirect({
        to: '/scholen',
        search: { error: 'not-found' },
      });
    }
    return { school };
  },
  component: SchoolLayout,
});

// Dashboard (index route for school profile)
export const schoolDashboardRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/',
  component: lazyRouteComponent(() => import('@/features/school-profile/tabs/DashboardTab')),
});

// Wizard step
export const wizardStepRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/wizard/$step',
  component: lazyRouteComponent(() => import('@/components/routing/WizardPage')),
});

// Price comparison (also accessible as tab via ComparisonTab)
export const vergelijkingRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/vergelijking',
  component: lazyRouteComponent(() => import('@/features/school-profile/tabs/ComparisonTab')),
});

// Current vs proposed
export const huidigVsCitoRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/huidig-vs-cito',
  component: lazyRouteComponent(
    () => import('@/features/price-comparison/CurrentVsProposedPage'),
    'CurrentVsProposedPage',
  ),
});

// Migration
export const migratieRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/migratie',
  component: lazyRouteComponent(
    () => import('@/features/price-comparison/MigrationPage'),
    'MigrationPage',
  ),
});

// Products tab
export const schoolProductsRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/producten',
  component: lazyRouteComponent(() => import('@/features/school-profile/tabs/ProductsTab')),
});

// Contacts tab
export const schoolContactsRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/contacten',
  component: lazyRouteComponent(() => import('@/features/school-profile/tabs/ContactsTab')),
});

// Conversations tab
export const schoolConversationsRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/gesprekken',
  component: lazyRouteComponent(() => import('@/features/school-profile/tabs/ConversationsTab')),
});

// Schoolplan tab
export const schoolplanRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/schoolplan',
  component: lazyRouteComponent(() => import('@/features/school-profile/tabs/SchoolplanTab')),
});

// Export tab — heavy: pulls in @react-pdf/renderer (lazy already inside PdfDownloadButton)
export const exportRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/export',
  component: lazyRouteComponent(() => import('@/features/export/ExportTab')),
});

// Review queue (manager-only)
export const reviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/review',
  component: lazyRouteComponent(() => import('@/features/review/ReviewQueuePage')),
});

// Admin config editor (manager-only)
export const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: lazyRouteComponent(
    () => import('@/features/admin/AdminConfigEditor'),
    'AdminConfigEditor',
  ),
});

// Centralised route paths — import these instead of hardcoding strings
export const SCHOOL_TAB_ROUTES = {
  overzicht: '/scholen/$slug',
  vergelijking: '/scholen/$slug/vergelijking',
  'huidig-vs-cito': '/scholen/$slug/huidig-vs-cito',
  migratie: '/scholen/$slug/migratie',
  producten: '/scholen/$slug/producten',
  contacten: '/scholen/$slug/contacten',
  gesprekken: '/scholen/$slug/gesprekken',
  schoolplan: '/scholen/$slug/schoolplan',
  export: '/scholen/$slug/export',
} as const;

export const ROUTE_PATHS = {
  review: '/review',
} as const;

export const routeTree = rootRoute.addChildren([
  loginRoute,
  authCallbackRoute,
  indexRoute,
  scholenRoute,
  reviewRoute,
  adminRoute,
  schoolRoute.addChildren([
    schoolDashboardRoute,
    wizardStepRoute,
    vergelijkingRoute,
    huidigVsCitoRoute,
    migratieRoute,
    schoolProductsRoute,
    schoolContactsRoute,
    schoolConversationsRoute,
    schoolplanRoute,
    exportRoute,
  ]),
]);
