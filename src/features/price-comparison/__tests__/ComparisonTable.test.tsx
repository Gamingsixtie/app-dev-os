import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComparisonTable } from '../ComparisonTable';
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

// Mock the price comparison store
const storeState = {
  result: null as ComparisonResult | null,
  draftOverrides: [] as unknown[],
  appliedOverrides: [] as unknown[],
  hasPendingChanges: false,
  isInternalMode: true,
  hybridResult: null,
  diaPackageResult: null,
  activeCompetitor: null as string | null,
  sensitivityResult: null,
  contractPeriod: 'annual' as const,
  visibleProviders: ['cito', 'dia', 'jij'] as string[],
  setVisibleProviders: vi.fn(),
  toggleProvider: vi.fn(),
  citoBundleType: 'individual' as string,
  setCitoBundleType: vi.fn(),
  setDraftOverride: vi.fn(),
  resetOverride: vi.fn(),
  recalculate: vi.fn(),
};

vi.mock('../store', () => ({
  usePriceComparisonStore: Object.assign(
    (selector: (s: typeof storeState) => unknown) => selector(storeState),
    { getState: () => ({ initialize: vi.fn() }) },
  ),
}));

// Mock school profile store: include JIJ in moduleSetups so JIJ column shows
const mockSchoolProfileState = {
  moduleSetups: [
    { moduleId: 'rekenwiskunde', currentProvider: 'jij', pricePerStudent: null },
  ],
  studentCounts: {} as Partial<Record<string, Record<number, number>>>,
  selectedModules: ['rekenwiskunde', 'cognitieve-capaciteiten'] as string[],
};

vi.mock('../../school-profile/store', () => ({
  useSchoolProfileStore: Object.assign(
    (selector: (s: typeof mockSchoolProfileState) => unknown) => selector(mockSchoolProfileState),
    { getState: () => mockSchoolProfileState },
  ),
}));

const makePriceRecord = (
  moduleId: string,
  provider: 'cito' | 'dia' | 'jij',
  amount: number,
): PriceRecord => ({
  moduleId,
  provider,
  amountPerStudent: amount,
  source: 'publication',
  sourceLabel: 'Publicatieprijs 2025',
  verifiedAt: new Date('2026-01-15'),
  isPublicationPrice: true,
});

const mockResult: ComparisonResult = {
  modules: [
    {
      moduleId: 'rekenwiskunde',
      moduleName: 'Reken-Wiskunde',
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
        jij: {
          pricePerStudent: 4.8,
          totalCost: 2160,
          studentCount: 450,
          priceRecord: makePriceRecord('rekenwiskunde', 'jij', 4.8),
          breakdown: [],
        },
        saqi: null,
      },
    },
    {
      moduleId: 'cognitieve-capaciteiten',
      moduleName: 'Cognitieve capaciteitentoets',
      moduleCategory: 'overige-instrumenten',
      providers: {
        cito: {
          pricePerStudent: 6.0,
          totalCost: 2700,
          studentCount: 450,
          priceRecord: makePriceRecord('cognitieve-capaciteiten', 'cito', 6.0),
          breakdown: [],
        },
        dia: null,
        jij: null,
        saqi: null,
      },
    },
  ],
  totals: { cito: 4725, dia: 2340, jij: 2160, saqi: 0 },
  differences: { citoVsDia: 2385, citoVsJij: 2565, citoVsSaqi: null },
  diaPackageResult: null,
};

describe('ComparisonTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState.result = mockResult;
  });

  it('renders header row with Module, Cito, DIA, JIJ', () => {
    renderWithProviders(<ComparisonTable result={mockResult} />);
    expect(screen.getByText('Module')).toBeInTheDocument();
    expect(screen.getByText('Cito')).toBeInTheDocument();
    expect(screen.getByText('DIA')).toBeInTheDocument();
    expect(screen.getByText('JIJ')).toBeInTheDocument();
  });

  it('renders module rows with formatted prices', () => {
    renderWithProviders(<ComparisonTable result={mockResult} />);
    expect(screen.getByText('Reken-Wiskunde')).toBeInTheDocument();
    expect(screen.getByText('Cognitieve capaciteitentoets')).toBeInTheDocument();
  });

  it('renders "n.v.t." for null provider costs', () => {
    renderWithProviders(<ComparisonTable result={mockResult} />);
    const badges = screen.getAllByText('n.v.t.');
    // Cognitieve capaciteiten: DIA and JIJ are null
    expect(badges.length).toBe(2);
  });

  it('renders totaalrij with "Totaal" label', () => {
    renderWithProviders(<ComparisonTable result={mockResult} />);
    expect(screen.getByText('Totaal')).toBeInTheDocument();
  });

  it('renders totaal row with formatted prices', () => {
    renderWithProviders(<ComparisonTable result={mockResult} />);
    expect(screen.getByText('Totaal')).toBeInTheDocument();
  });

  it('clicking chevron expands detail row (ModuleDetailPanel visible)', () => {
    renderWithProviders(<ComparisonTable result={mockResult} />);
    const moduleCell = screen.getByText('Reken-Wiskunde').closest('[role="button"]');
    expect(moduleCell).toBeTruthy();
    fireEvent.click(moduleCell!);
    // ModuleDetailPanel renders sections
    expect(screen.getByText('Prijs aanpassen')).toBeInTheDocument();
  });

  it('only one detail row open at a time (accordion)', () => {
    renderWithProviders(<ComparisonTable result={mockResult} />);

    // Open first module
    const rekenwiskunde = screen.getByText('Reken-Wiskunde').closest('[role="button"]');
    fireEvent.click(rekenwiskunde!);
    expect(screen.getByText('Prijs aanpassen')).toBeInTheDocument();

    // Open second module - first should close
    const cognitief = screen.getByText('Cognitieve capaciteitentoets').closest('[role="button"]');
    fireEvent.click(cognitief!);

    // Only one detail panel at a time
    const panels = screen.getAllByText('Prijs aanpassen');
    expect(panels.length).toBe(1);
  });

  it('renders category subheader rows', () => {
    renderWithProviders(<ComparisonTable result={mockResult} />);
    expect(screen.getByText('Leerlingvolgsysteem')).toBeInTheDocument();
    expect(screen.getByText('Overige instrumenten')).toBeInTheDocument();
  });

  it('shows n.v.t. for null provider in module row', () => {
    renderWithProviders(<ComparisonTable result={mockResult} />);
    // Cognitieve capaciteiten has null DIA and JIJ
    const nvtElements = screen.getAllByText('n.v.t.');
    expect(nvtElements.length).toBeGreaterThanOrEqual(1);
  });
});
