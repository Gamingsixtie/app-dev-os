import {
  createRootRoute,
  createRoute,
  redirect,
} from '@tanstack/react-router';
import { checkSchoolExists } from './guards';
import RootLayout from '@/components/routing/RootLayout';
import SchoolLayout from '@/components/routing/SchoolLayout';
import WizardPage from '@/components/routing/WizardPage';
import { CurrentVsProposedPage } from '@/features/price-comparison/CurrentVsProposedPage';
import { MigrationPage } from '@/features/price-comparison/MigrationPage';
import SchoolOverviewPage from '@/features/school-overview/SchoolOverviewPage';
import DashboardTab from '@/features/school-profile/tabs/DashboardTab';
import ComparisonTab from '@/features/school-profile/tabs/ComparisonTab';
import ProductsTab from '@/features/school-profile/tabs/ProductsTab';
import ContactsTab from '@/features/school-profile/tabs/ContactsTab';
import ConversationsTab from '@/features/school-profile/tabs/ConversationsTab';
import SchoolplanTab from '@/features/school-profile/tabs/SchoolplanTab';
import ExportTab from '@/features/export/ExportTab';
import { LoginPage } from '@/features/auth/LoginPage';
import ReviewQueuePage from '@/features/review/ReviewQueuePage';
import { AdminConfigEditor } from '@/features/admin/AdminConfigEditor';

// Root layout (with UserMenu header and migration gate)
export const rootRoute = createRootRoute({
  component: RootLayout,
});

// Login route — outside ProtectedRoute
export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
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
  component: SchoolOverviewPage,
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
  component: DashboardTab,
});

// Wizard step
export const wizardStepRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/wizard/$step',
  component: WizardPage,
});

// Price comparison (also accessible as tab via ComparisonTab)
export const vergelijkingRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/vergelijking',
  component: ComparisonTab,
});

// Current vs proposed
export const huidigVsCitoRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/huidig-vs-cito',
  component: CurrentVsProposedPage,
});

// Migration
export const migratieRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/migratie',
  component: MigrationPage,
});

// Products tab
export const schoolProductsRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/producten',
  component: ProductsTab,
});

// Contacts tab
export const schoolContactsRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/contacten',
  component: ContactsTab,
});

// Conversations tab
export const schoolConversationsRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/gesprekken',
  component: ConversationsTab,
});

// Schoolplan tab
export const schoolplanRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/schoolplan',
  component: SchoolplanTab,
});

// Export tab
export const exportRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/export',
  component: ExportTab,
});

// Review queue (manager-only)
export const reviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/review',
  component: ReviewQueuePage,
});

// Admin config editor (manager-only)
export const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminConfigEditor,
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
