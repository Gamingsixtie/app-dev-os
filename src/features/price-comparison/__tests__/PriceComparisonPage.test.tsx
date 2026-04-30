import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PriceComparisonPage } from '../PriceComparisonPage';
import type { ComparisonResult } from '../../../engine/price-comparison';
import type { PriceRecord } from '../../../models/pricing';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

// ─── Mock stores ─────────────────────────────────────────────────────────────

const makePriceRecord = (
  moduleId: string,
  provider: 'cito' | 'dia' | 'jij',
  amount: number,
): PriceRecord => ({
  moduleId,
  provider,
  amountPerStudent: amount,
  source: 'publication',
  sourceLabel: 'Test',
  verifiedAt: new Date('2026-01-15'),
  isPublicationPrice: true,
});

const mockResult: ComparisonResult = {
  modules: [
    {
      moduleId: 'rekenwiskunde',
      moduleName: 'Rekenwiskunde',
      moduleCategory: 'leerlingvolgsysteem',
      providers: {
        cito: {
          pricePerStudent: 4.5,
          totalCost: 2025,
          studentCount: 450,
          priceRecord: makePriceRecord('rekenwiskunde', 'cito', 4.5),
          breakdown: [],
        },
        dia: {
          pricePerStudent: 5.2,
          totalCost: 2340,
          studentCount: 450,
          priceRecord: makePriceRecord('rekenwiskunde', 'dia', 5.2),
          breakdown: [],
        },
        jij: null,
        saqi: null,
      },
    },
  ],
  totals: { cito: 2025, dia: 2340, jij: 0, saqi: 0 },
  differences: { citoVsDia: 315, citoVsJij: null, citoVsSaqi: null },
};

const priceStoreState = {
  result: mockResult,
  initialize: vi.fn(),
  citoBundleType: 'individual' as const,
  contractPeriod: 'annual' as const,
  visibleProviders: ['cito', 'dia'] as string[],
  toggleProvider: vi.fn(),
};

vi.mock('../store', () => ({
  usePriceComparisonStore: Object.assign(
    (selector: (s: typeof priceStoreState) => unknown) => selector(priceStoreState),
    { getState: () => ({ initialize: vi.fn() }) },
  ),
}));

const schoolStoreState = {
  selectedModules: ['rekenwiskunde'],
  studentCounts: { havo: { 3: 150, 4: 150, 5: 150 } },
  activeSchoolId: 'test-school-1',
};

vi.mock('../../school-profile/store', () => ({
  useSchoolProfileStore: Object.assign(
    (selector: (s: typeof schoolStoreState) => unknown) => selector(schoolStoreState),
    { getState: () => schoolStoreState },
  ),
}));

// ─── Mock child components as stubs ──────────────────────────────────────────

vi.mock('../ai-advies/AiAdviesSection', () => ({
  AiAdviesSection: () => <div data-testid="ai-advies">AI Advies</div>,
}));

vi.mock('../ComparisonTable', () => ({
  ComparisonTable: () => <div data-testid="comparison-table">Table</div>,
}));

vi.mock('../ComparisonChart', () => ({
  ComparisonChart: () => <div data-testid="comparison-chart">Chart</div>,
}));

vi.mock('../MeerwaardePanel', () => ({
  MeerwaardePanel: () => <div data-testid="meerwaarde-panel">Meerwaarde</div>,
}));

vi.mock('../CitoBundleSelector', () => ({
  CitoBundleSelector: () => <div data-testid="cito-bundle">CitoBundle</div>,
}));

vi.mock('../DiaBundleSelector', () => ({
  DiaBundleSelector: () => <div data-testid="dia-bundle">DiaBundle</div>,
}));

vi.mock('../PeriodToggle', () => ({
  PeriodToggle: () => <div data-testid="period-toggle">PeriodToggle</div>,
}));

vi.mock('../../../components/ui/DisclaimerFooter', () => ({
  DisclaimerFooter: () => <div data-testid="disclaimer-footer">Disclaimer</div>,
}));

vi.mock('../components/ProviderToolbar', () => ({
  ProviderToolbar: () => <div data-testid="provider-toolbar">Toolbar</div>,
}));

// Mock engine functions
vi.mock('../../../engine/price-comparison', () => ({
  PROVIDER_LABELS: { cito: 'Cito', dia: 'DIA', jij: 'JIJ!', saqi: 'SAQI' },
  getTotalStudents: () => 450,
}));

vi.mock('../../../data/providers/cito', () => ({
  getCitoBundle: () => ({
    pricePerStudent: 4.5,
    contractPrices: { annual: 4.5, 'three-year': 4.0, 'three-year-duo': 3.8 },
  }),
  CITO_CONFIG: {
    name: 'Cito',
    pricingStrategy: { type: 'per-student', basePrice: 4.5 },
    modules: [],
    defaultPrices: [],
  },
}));

vi.mock('../../../data/providers/dia', () => ({
  DIA_CONFIG: {
    name: 'DIA',
    pricingStrategy: { type: 'per-student', basePrice: 5.2 },
    modules: [],
    defaultPrices: [],
  },
}));

vi.mock('../../../data/providers/jij', () => ({
  JIJ_CONFIG: {
    name: 'JIJ!',
    pricingStrategy: { type: 'per-student', basePrice: 4.8 },
    modules: [],
    defaultPrices: [],
  },
}));

vi.mock('../../../lib/format', () => ({
  formatCurrency: (v: number) => `EUR ${v.toFixed(2)}`,
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PriceComparisonPage', () => {
  it('renders sections in D-05 order', () => {
    const { container } = renderWithProviders(<PriceComparisonPage />);
    const sections = container.querySelectorAll('section');

    // Expected order: ai-advies, bundel/periode, totalen, toolbar+chart, detail+table, meerwaarde, disclaimer
    expect(sections.length).toBeGreaterThanOrEqual(7);

    // Verify key content in correct section order
    expect(within(sections[0]).getByTestId('ai-advies')).toBeInTheDocument();
    expect(within(sections[1]).getByText('Prijsvergelijking')).toBeInTheDocument();
    expect(within(sections[2]).getByText('Samenvatting vergelijking')).toBeInTheDocument();
    expect(within(sections[3]).getByTestId('provider-toolbar')).toBeInTheDocument();
    expect(within(sections[4]).getByTestId('comparison-table')).toBeInTheDocument();
    expect(within(sections[5]).getByText('Meerwaarde en tijdwinst')).toBeInTheDocument();
    expect(within(sections[6]).getByTestId('disclaimer-footer')).toBeInTheDocument();
  });

  it('applies alternating color bands (D-15)', () => {
    const { container } = renderWithProviders(<PriceComparisonPage />);
    const sections = container.querySelectorAll('section');

    // Expected: neutral-50, white, neutral-50, white, white, neutral-50
    expect(sections[0].className).toContain('bg-neutral-50');
    expect(sections[1].className).toContain('bg-white');
    expect(sections[2].className).toContain('bg-neutral-50');
  });

  it('meerwaarde section is collapsed by default (D-11)', () => {
    renderWithProviders(<PriceComparisonPage />);
    const meerwSummary = screen.getByText('Meerwaarde en tijdwinst');
    const details = meerwSummary.closest('details');
    expect(details).toBeTruthy();
    expect(details!.hasAttribute('open')).toBe(false);
  });

  it('does not show differentiators in ComparisonSummary (D-06)', () => {
    renderWithProviders(<PriceComparisonPage />);
    expect(screen.queryByText(/Unieke Cito voordelen/)).not.toBeInTheDocument();
    expect(screen.queryByText(/citoAdvantages/)).not.toBeInTheDocument();
  });

  it('has D-14 tooltip attributes on bundel and periode controls', () => {
    const { container } = renderWithProviders(<PriceComparisonPage />);
    const tooltipElements = container.querySelectorAll('[title]');
    const titles = Array.from(tooltipElements).map((el) => el.getAttribute('title'));
    expect(titles.some((t) => t?.includes('bundel'))).toBe(true);
    expect(titles.some((t) => t?.includes('contractperiode'))).toBe(true);
  });

  it('has chevron animation class on details elements', () => {
    const { container } = renderWithProviders(<PriceComparisonPage />);
    const chevrons = container.querySelectorAll('.group-open\\:rotate-180');
    expect(chevrons.length).toBeGreaterThanOrEqual(1);
  });
});
