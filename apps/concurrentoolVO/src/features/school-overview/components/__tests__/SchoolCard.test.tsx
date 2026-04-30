import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import {
  createMemoryHistory,
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SchoolCard from '../../SchoolCard';
import type { SchoolRecord } from '@/db/types';

// Mock useAuth to avoid Supabase dependency
vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: null,
    userProfile: { id: 'test-user', name: 'Test', role: 'accountmanager', region: '', teamId: '' },
    session: null,
    loading: false,
    signIn: vi.fn(),
    signInWithMagicLink: vi.fn(),
    signOut: vi.fn(),
  }),
}));

const baseSchool: SchoolRecord = {
  id: 'test-id',
  slug: 'test-school',
  name: 'Montessori College',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
  isComplete: true,
  completedSteps: [0, 1, 2, 3, 4],
  levels: ['havo', 'vwo'],
  studentCounts: { havo: { 1: 100, 2: 100 }, vwo: { 1: 80, 2: 80 } },
  selectedModules: ['rekenwiskunde', 'nederlands'],
  moduleSetups: [
    { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: 3.36 },
    { moduleId: 'nederlands', currentProvider: 'geen', pricePerStudent: null },
  ],
  scenario: 'A',
  appliedOverrides: [],
  migrationHourlyRate: 50,
  migrationTimeSavingOverrides: {},
  switchingCosts: 0,
  contacts: [{ id: 'c1', name: 'Jan', dmuPosition: 'gebruiker', isPrimary: true, jobTitle: '', email: '', phone: '', createdAt: '2026-01-01' }],
  conversations: [],
  actions: [],
  systemEvents: [],
  pipelineStatus: 'prospect',
  region: '',
  tags: [],
  viewPreference: 'compact',
};

function renderSchoolCard(
  school: SchoolRecord,
  mode: 'compact' | 'extended',
) {
  const onDelete = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  // Capture in closure for the component
  const CardWrapper = () => (
    <>
      <SchoolCard school={school} onDelete={onDelete} mode={mode} />
      <Outlet />
    </>
  );

  const rootRoute = createRootRoute({ component: CardWrapper });
  const schoolRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/scholen/$slug',
    component: () => null,
  });
  const wizardRoute = createRoute({
    getParentRoute: () => schoolRoute,
    path: '/wizard/$step',
    component: () => null,
  });
  const routeTree = rootRoute.addChildren([schoolRoute.addChildren([wizardRoute])]);
  const memoryHistory = createMemoryHistory({ initialEntries: ['/'] });
  const router = createRouter({ routeTree, history: memoryHistory });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { onDelete };
}

describe('SchoolCard', () => {
  it('renders school name', async () => {
    renderSchoolCard(baseSchool, 'compact');
    await waitFor(() => {
      expect(screen.getByText('Montessori College')).toBeInTheDocument();
    });
  });

  it('renders pipeline status badge', async () => {
    renderSchoolCard(baseSchool, 'compact');
    await waitFor(() => {
      expect(screen.getByText(/Prospect/i)).toBeInTheDocument();
    });
  });

  it('renders delete button with correct aria-label', async () => {
    renderSchoolCard(baseSchool, 'compact');
    await waitFor(() => {
      expect(screen.getByLabelText('Montessori College verwijderen')).toBeInTheDocument();
    });
  });

  it('delete button calls onDelete callback', async () => {
    const user = userEvent.setup();
    const { onDelete } = renderSchoolCard(baseSchool, 'compact');

    const deleteButton = await screen.findByLabelText('Montessori College verwijderen');
    await user.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith(baseSchool);
  });

  it('incomplete school shows "Niet voltooid" indicator', async () => {
    const incompleteSchool: SchoolRecord = {
      ...baseSchool,
      isComplete: false,
      completedSteps: [],
    };
    renderSchoolCard(incompleteSchool, 'compact');
    await waitFor(() => {
      expect(screen.getByText('Niet voltooid')).toBeInTheDocument();
    });
  });

  it('extended mode shows level labels and module summary', async () => {
    renderSchoolCard(baseSchool, 'extended');
    await waitFor(() => {
      expect(screen.getByText(/HAVO/)).toBeInTheDocument();
    });
    expect(screen.getByText('2 modules, 1 bij DIA')).toBeInTheDocument();
  });
});
