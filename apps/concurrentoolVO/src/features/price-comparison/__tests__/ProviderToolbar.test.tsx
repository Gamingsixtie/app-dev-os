import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProviderToolbar } from '../components/ProviderToolbar';

// Mock store
const toggleProviderSpy = vi.fn();
const storeState = {
  visibleProviders: ['cito', 'dia'] as string[],
  toggleProvider: toggleProviderSpy,
};

vi.mock('../store', () => ({
  usePriceComparisonStore: (selector: (s: typeof storeState) => unknown) =>
    selector(storeState),
}));

// Mock MODULE_CATALOG with minimal data
vi.mock('@/models/modules', () => ({
  MODULE_CATALOG: [
    { id: 'mod-a', name: 'Module A', availableFrom: ['cito', 'dia'] },
    { id: 'mod-b', name: 'Module B', availableFrom: ['cito', 'jij'] },
    { id: 'mod-c', name: 'Module C', availableFrom: ['cito'] },
  ],
}));

// Mock provider configs for PricingInfoPopover
vi.mock('@/data/providers', () => ({
  PROVIDER_CONFIGS: {
    cito: { pricingStrategy: { type: 'platform+module' } },
    dia: { pricingStrategy: { type: 'package-bundle' } },
    jij: { pricingStrategy: { type: 'tiered-license' } },
    saqi: { pricingStrategy: { type: 'flat' } },
  },
}));

vi.mock('@/engine/price-comparison', () => ({
  PROVIDER_LABELS: { cito: 'Cito', dia: 'DIA', jij: 'JIJ!', saqi: 'SAQI' },
}));

beforeEach(() => {
  toggleProviderSpy.mockClear();
});

describe('ProviderToolbar', () => {
  it('renders "Vergelijk:" label', () => {
    render(<ProviderToolbar />);
    expect(screen.getByText('Vergelijk:')).toBeInTheDocument();
  });

  it('renders checkboxes for all 4 providers', () => {
    render(<ProviderToolbar />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4);
  });

  it('checks cito and dia checkboxes matching visibleProviders', () => {
    render(<ProviderToolbar />);
    const checkboxes = screen.getAllByRole('checkbox');
    // Order: cito, dia, jij, saqi
    expect(checkboxes[0]).toBeChecked(); // cito
    expect(checkboxes[1]).toBeChecked(); // dia
    expect(checkboxes[2]).not.toBeChecked(); // jij
    expect(checkboxes[3]).not.toBeChecked(); // saqi
  });

  it('disables cito checkbox (always visible)', () => {
    render(<ProviderToolbar />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeDisabled();
  });

  it('renders info popover buttons with aria-labels', () => {
    render(<ProviderToolbar />);
    expect(screen.getByLabelText('Prijsmodel Cito')).toBeInTheDocument();
    expect(screen.getByLabelText('Prijsmodel DIA')).toBeInTheDocument();
    expect(screen.getByLabelText('Prijsmodel JIJ!')).toBeInTheDocument();
    expect(screen.getByLabelText('Prijsmodel SAQI')).toBeInTheDocument();
  });

  it('renders provider color dots', () => {
    const { container } = render(<ProviderToolbar />);
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots).toHaveLength(4);
  });

  it('opens popover on info button click showing pricing description', () => {
    render(<ProviderToolbar />);
    const diaButton = screen.getByLabelText('Prijsmodel DIA');
    fireEvent.click(diaButton);
    // DIA uses package-bundle strategy
    expect(screen.getByText(/Pakketprijzen per leerling/)).toBeInTheDocument();
  });

  it('renders module counts per provider', () => {
    render(<ProviderToolbar />);
    // cito: 3 modules, dia: 1, jij: 1, saqi: 0
    expect(screen.getByText('(3)')).toBeInTheDocument();
  });
});
