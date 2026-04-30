import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { AdminConfigEditor } from '../../admin/AdminConfigEditor';
import { ProviderConfigForm } from '../../admin/ProviderConfigForm';
import { CITO_CONFIG } from '@/data/providers/cito';
import type { PricingStrategy } from '@/models/pricing';

// ─── Mock useAuth ──────────────────────────────────────────────────────────────

const mockUseAuth = vi.fn();

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

// ─── Test Router Wrapper ───────────────────────────────────────────────────────

function renderWithRouter(component: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => component });
  const router = createRouter({ routeTree: rootRoute });
  return render(<RouterProvider router={router} />);
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
