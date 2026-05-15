/**
 * Phase 26-05 — integration test for PrijzenPage.
 *
 * Strategy: heavy use of vi.mock() to isolate PrijzenPage from auth, router and
 * query infrastructure. The test verifies the *composition* (manager-gate +
 * heading + 3 tabs + export/import buttons), not the internal logic of children
 * — those have their own tests (PrijzenTabs.test.tsx, etc.).
 *
 * Mocks the heavy tab-content components (CitoBasisvaardigheidenTab, etc.) so we
 * don't drag in Supabase, @react-pdf/renderer or docx during composition checks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// --- Mocks (must be declared before importing PrijzenPage) ---------------------

// VITE_SKIP_AUTH defaults to undefined in test runs but if a local .env.local
// sets it to "true" the manager-gate would be bypassed at module-load time.
// vi.stubEnv normally runs after module hoisting; wrap in vi.hoisted to push it
// before the PrijzenPage import below evaluates `import.meta.env.VITE_SKIP_AUTH`.
vi.hoisted(() => {
  // Vitest exposes import.meta.env on the test-runner side as a mutable object.
  // Setting via process.env covers Vite's dev-server env injection too.
  if (typeof process !== 'undefined' && process.env) {
    process.env.VITE_SKIP_AUTH = 'false';
  }
});
vi.stubEnv('VITE_SKIP_AUTH', 'false');

const mockUseAuth = vi.fn();
vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockSetTab = vi.fn();
const mockSetSub = vi.fn();
const mockSearchState: {
  tab: 'basis' | 'concurrentie';
  sub: 'dia' | 'jij' | 'sociaal-emotioneel' | 'executieve' | 'overig';
} = { tab: 'basis', sub: 'dia' };
vi.mock('@/features/pricing/hooks/usePrijzenSearch', () => ({
  usePrijzenSearch: () => ({
    tab: mockSearchState.tab,
    sub: mockSearchState.sub,
    setTab: mockSetTab,
    setSub: mockSetSub,
  }),
}));

vi.mock('@/hooks/usePricingConfigs', () => ({
  usePricingConfigs: () => ({
    data: [
      {
        id: 'fake-cito-id',
        provider: 'cito',
        is_active: true,
        version: 1,
        team_id: 't',
        config_data: {},
        updated_at: '',
        updated_by: 'u',
      },
    ],
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

// Stub heavy children with their visible Dutch labels so the composition checks
// can still assert on text without pulling in Supabase, @react-pdf or docx.
vi.mock('@/features/pricing/components/PrijzenTabs', () => ({
  PrijzenTabs: () => (
    <nav data-testid="prijzen-tabs">
      <button type="button">Cito Basisvaardigheden</button>
      <button type="button">Concurrentie</button>
    </nav>
  ),
}));

vi.mock('@/features/pricing/components/CitoBasisvaardigheidenTab', () => ({
  CitoBasisvaardigheidenTab: () => <div data-testid="basis-tab" />,
}));

vi.mock('@/features/pricing/components/ConcurrentieSubTabs', () => ({
  ConcurrentieSubTabs: () => <nav data-testid="concurrentie-subtabs" />,
}));

vi.mock('@/features/pricing/components/ConcurrentieCategoryView', () => ({
  ConcurrentieCategoryView: ({ category }: { category: string }) => (
    <div data-testid="concurrentie-category-view" data-category={category} />
  ),
}));

vi.mock('@/features/admin/ProviderConfigForm', () => ({
  ProviderConfigForm: () => <div data-testid="provider-config-form" />,
}));

vi.mock('@/features/pricing/components/PriceListExportButton', () => ({
  PriceListExportButton: () => <button type="button">Exporteer prijslijst ▾</button>,
}));

vi.mock('@/features/pricing/components/PriceImportFlow', () => ({
  PriceImportFlow: ({ open }: { open: boolean }) =>
    open ? <div data-testid="import-flow-open" /> : null,
}));

// Import AFTER mocks so the mocked modules are picked up.
import { PrijzenPage } from '../PrijzenPage';

function renderPage() {
  return render(<PrijzenPage />);
}

describe('PrijzenPage integration', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockSetTab.mockReset();
    mockSetSub.mockReset();
    mockSearchState.tab = 'basis';
    mockSearchState.sub = 'dia';
  });

  it('toont "Geen toegang" voor accountmanager (non-manager)', () => {
    mockUseAuth.mockReturnValue({ userProfile: { role: 'accountmanager' } });
    renderPage();
    expect(screen.getByText('Geen toegang')).toBeInTheDocument();
    // The full page composition should NOT be rendered for non-managers.
    expect(screen.queryByText('Cito Prijzen + Concurrentie')).not.toBeInTheDocument();
  });

  it('rendert heading, 2 hoofdtabs en export + import knoppen voor manager', () => {
    mockUseAuth.mockReturnValue({ userProfile: { role: 'manager' } });
    renderPage();
    expect(screen.getByText('Cito Prijzen + Concurrentie')).toBeInTheDocument();
    expect(screen.getByText('Cito Basisvaardigheden')).toBeInTheDocument();
    expect(screen.getByText('Concurrentie')).toBeInTheDocument();
    // Old separate "Cito Modules" hoofdtab is now folded into Basisvaardigheden sub-categories.
    expect(screen.queryByText('Cito Modules')).not.toBeInTheDocument();
    expect(screen.getByText(/Exporteer prijslijst/)).toBeInTheDocument();
    expect(screen.getByText('Importeer prijzen uit Excel')).toBeInTheDocument();
  });

  it('toont Cito Basisvaardigheden content wanneer tab="basis" (geen sub-tabs)', () => {
    mockUseAuth.mockReturnValue({ userProfile: { role: 'manager' } });
    mockSearchState.tab = 'basis';
    renderPage();
    expect(screen.getByTestId('basis-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('concurrentie-subtabs')).not.toBeInTheDocument();
    expect(screen.queryByTestId('concurrentie-category-view')).not.toBeInTheDocument();
  });

  it('toont ProviderConfigForm wanneer Concurrentie sub="jij" (provider-mode)', () => {
    mockUseAuth.mockReturnValue({ userProfile: { role: 'manager' } });
    mockSearchState.tab = 'concurrentie';
    mockSearchState.sub = 'jij';
    renderPage();
    expect(screen.getByTestId('concurrentie-subtabs')).toBeInTheDocument();
    expect(screen.getByTestId('provider-config-form')).toBeInTheDocument();
    expect(screen.queryByTestId('basis-tab')).not.toBeInTheDocument();
    expect(screen.queryByTestId('concurrentie-category-view')).not.toBeInTheDocument();
  });

  it('toont ConcurrentieCategoryView wanneer Concurrentie sub="sociaal-emotioneel" (categorie-mode)', () => {
    mockUseAuth.mockReturnValue({ userProfile: { role: 'manager' } });
    mockSearchState.tab = 'concurrentie';
    mockSearchState.sub = 'sociaal-emotioneel';
    renderPage();
    expect(screen.getByTestId('concurrentie-subtabs')).toBeInTheDocument();
    const view = screen.getByTestId('concurrentie-category-view');
    expect(view).toBeInTheDocument();
    expect(view.getAttribute('data-category')).toBe('sociaal-emotioneel');
    expect(screen.queryByTestId('provider-config-form')).not.toBeInTheDocument();
  });

  it('opent de import-flow wanneer op "Importeer prijzen uit Excel" wordt geklikt', () => {
    mockUseAuth.mockReturnValue({ userProfile: { role: 'manager' } });
    renderPage();
    // Modal closed by default
    expect(screen.queryByTestId('import-flow-open')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Importeer prijzen uit Excel'));
    expect(screen.getByTestId('import-flow-open')).toBeInTheDocument();
  });
});
