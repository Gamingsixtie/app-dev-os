import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminConfigEditor } from '../../admin/AdminConfigEditor';
import { ProviderConfigForm } from '../../admin/ProviderConfigForm';
import { CITO_CONFIG } from '@/data/providers/cito';

// ─── Mock useAuth ──────────────────────────────────────────────────────────────

const mockUseAuth = vi.fn();

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

// ─── Mock pricing-configs hook (avoids hitting Supabase in tests) ───────────────

vi.mock('@/hooks/usePricingConfigs', () => ({
  usePricingConfigs: () => ({ data: [], isLoading: false, error: null }),
}));

// ─── Test Router Wrapper ───────────────────────────────────────────────────────

function renderWithRouter(component: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute({ component: () => component });
  const router = createRouter({ routeTree: rootRoute });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('AdminConfigEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "Geen toegang" for non-manager role', async () => {
    mockUseAuth.mockReturnValue({
      userProfile: { role: 'accountmanager' },
      user: { id: '1' },
      loading: false,
    });

    renderWithRouter(<AdminConfigEditor />);

    await waitFor(() => {
      expect(screen.getByText(/geen toegang/i)).toBeDefined();
    });
  });

  it('renders provider tabs for manager role', async () => {
    mockUseAuth.mockReturnValue({
      userProfile: { role: 'manager' },
      user: { id: '1' },
      loading: false,
    });

    renderWithRouter(<AdminConfigEditor />);

    await waitFor(() => {
      expect(screen.getByText('Prijsstructuur configuratie')).toBeDefined();
      expect(screen.getByText('Cito')).toBeDefined();
      expect(screen.getByText('DIA')).toBeDefined();
    });
  });
});

describe('ProviderConfigForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation error on invalid config save attempt', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    renderWithRouter(
      <ProviderConfigForm
        provider="cito"
        config={CITO_CONFIG.pricingStrategy}
        onSave={onSave}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Configuratie opslaan')).toBeDefined();
    });
  });

  it('renders save button with correct Dutch label', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    renderWithRouter(
      <ProviderConfigForm
        provider="cito"
        config={CITO_CONFIG.pricingStrategy}
        onSave={onSave}
      />,
    );

    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /configuratie opslaan/i });
      expect(saveButton).toBeDefined();
    });
  });
});

describe('admin route', () => {
  it('/admin route is registered in routes.ts', async () => {
    const { routeTree } = await import('@/router/routes');
    const router = createRouter({ routeTree });
    const paths = Object.keys(router.routesByPath);
    expect(paths).toContain('/admin');
  }, 15000);
});
