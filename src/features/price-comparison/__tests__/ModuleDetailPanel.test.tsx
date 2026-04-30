import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModuleDetailPanel } from '../ModuleDetailPanel';
import type { ComparisonResult } from '../../../engine/price-comparison';
import type { PriceRecord } from '../../../models/pricing';

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

const mockSetDraftOverride = vi.fn();
const mockResetOverride = vi.fn();
const mockRecalculate = vi.fn();

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

let mockHasPendingChanges = false;

vi.mock('../store', () => ({
  usePriceComparisonStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      result: mockResult,
      draftOverrides: [],
      appliedOverrides: [],
      hasPendingChanges: mockHasPendingChanges,
      setDraftOverride: mockSetDraftOverride,
      resetOverride: mockResetOverride,
      recalculate: mockRecalculate,
      visibleProviders: ['cito', 'dia', 'jij'],
      setVisibleProviders: vi.fn(),
      toggleProvider: vi.fn(),
    }),
}));

describe('ModuleDetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPendingChanges = false;
  });

  it('shows pricing breakdown per provider', () => {
    render(<ModuleDetailPanel moduleId="rekenwiskunde" />);
    expect(screen.getByText('Prijsopbouw')).toBeInTheDocument();
  });

  it('shows "Niet beschikbaar" for providers without the module', () => {
    render(<ModuleDetailPanel moduleId="cognitieve-capaciteiten" />);
    const nietBeschikbaar = screen.getAllByText(/Niet beschikbaar/);
    expect(nietBeschikbaar.length).toBeGreaterThanOrEqual(2);
  });

  it('shows differentiators section with Cito before competitors', () => {
    render(<ModuleDetailPanel moduleId="rekenwiskunde" />);
    expect(screen.getByText('Onderscheidend vermogen')).toBeInTheDocument();

    // Provider labels appear as column headers in order: CITO, DIA, JIJ
    const allText = document.body.textContent ?? '';
    const citoIndex = allText.indexOf('CITO');
    const diaIndex = allText.indexOf('DIA');
    expect(citoIndex).toBeLessThan(diaIndex);
  });

  it('shows warning when competitor does not offer module and has no differentiators', () => {
    render(<ModuleDetailPanel moduleId="cognitieve-capaciteiten" />);
    // Providers without this module show "Niet aangeboden"
    expect(
      screen.getAllByText(/Niet aangeboden/).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('shows editable price inputs', () => {
    render(<ModuleDetailPanel moduleId="rekenwiskunde" />);
    expect(screen.getByText('Prijs aanpassen')).toBeInTheDocument();
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBe(3); // cito, dia, jij (only active providers)
  });

  it('typing new price calls setDraftOverride', () => {
    render(<ModuleDetailPanel moduleId="rekenwiskunde" />);
    const citoInput = screen.getByLabelText('Prijs per leerling Cito');
    fireEvent.change(citoInput, { target: { value: '5,50' } });
    expect(mockSetDraftOverride).toHaveBeenCalledWith({
      moduleId: 'rekenwiskunde',
      provider: 'cito',
      amount: 5.5,
    });
  });

  it('handles decimal comma in input (replace comma with period)', () => {
    render(<ModuleDetailPanel moduleId="rekenwiskunde" />);
    const citoInput = screen.getByLabelText('Prijs per leerling Cito');
    fireEvent.change(citoInput, { target: { value: '3,75' } });
    expect(mockSetDraftOverride).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 3.75 }),
    );
  });

  it('Herbereken button not visible when no pending changes', () => {
    mockHasPendingChanges = false;
    render(<ModuleDetailPanel moduleId="rekenwiskunde" />);
    expect(
      screen.queryByText('Herbereken vergelijking'),
    ).not.toBeInTheDocument();
  });

  it('Herbereken button visible when hasPendingChanges and calls recalculate', () => {
    mockHasPendingChanges = true;
    render(<ModuleDetailPanel moduleId="rekenwiskunde" />);
    const btn = screen.getByText('Herbereken vergelijking');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(mockRecalculate).toHaveBeenCalled();
  });
});
