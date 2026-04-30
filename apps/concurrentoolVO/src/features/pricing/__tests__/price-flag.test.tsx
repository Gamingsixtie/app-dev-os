import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

// Mock pricing-operations
vi.mock('@/db/pricing-operations', () => ({
  fetchPriceProposals: vi.fn(),
  createPriceProposal: vi.fn(),
  fetchOpenProposalCount: vi.fn(),
}));

import {
  fetchPriceProposals,
  createPriceProposal,
  fetchOpenProposalCount,
} from '@/db/pricing-operations';

const mockedFetchProposals = vi.mocked(fetchPriceProposals);
const mockedCreateProposal = vi.mocked(createPriceProposal);
const mockedFetchOpenCount = vi.mocked(fetchOpenProposalCount);

// Import hooks (will be created)
import {
  usePriceProposals,
  useCreateProposal,
  useOpenProposalCount,
} from '@/hooks/usePriceProposals';

// Import UI components (will be created)
import { PriceDiffDisplay } from '@/components/ui/PriceDiffDisplay';
import { ProposalBadge } from '@/components/ui/ProposalBadge';

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('usePriceProposals hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls fetchPriceProposals with correct filters', async () => {
    const mockData = [
      { id: '1', module_id: 'rekenen', provider: 'dia', status: 'open' },
    ];
    mockedFetchProposals.mockResolvedValue(mockData as never);

    const filters = { status: 'open', provider: 'dia' };
    const { result } = renderHook(() => usePriceProposals(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedFetchProposals).toHaveBeenCalledWith(filters);
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useOpenProposalCount hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('polls every 60 seconds (refetchInterval)', async () => {
    mockedFetchOpenCount.mockResolvedValue(3);

    const { result } = renderHook(() => useOpenProposalCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(3);
    expect(mockedFetchOpenCount).toHaveBeenCalled();
  });
});

describe('useCreateProposal hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invalidates price-proposals queries on success', async () => {
    const proposalResult = {
      id: '1',
      module_id: 'rekenen',
      provider: 'dia',
      status: 'open',
    };
    mockedCreateProposal.mockResolvedValue(proposalResult as never);
    mockedFetchProposals.mockResolvedValue([]);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    // Prime the cache
    const { result: listResult } = renderHook(
      () => usePriceProposals(),
      { wrapper },
    );
    await waitFor(() => expect(listResult.current.isSuccess).toBe(true));

    // Create a proposal
    const { result: createResult } = renderHook(
      () => useCreateProposal(),
      { wrapper },
    );

    await createResult.current.mutateAsync({
      module_id: 'rekenen',
      provider: 'dia',
      current_price: 5.80,
      proposed_price: 6.20,
      source: 'Offerte',
      explanation: 'Nieuwe prijs van DIA webshop',
    } as never);

    // Verify the mutation was called with the proposal data as first arg
    expect(mockedCreateProposal).toHaveBeenCalledWith(
      expect.objectContaining({
        module_id: 'rekenen',
        provider: 'dia',
        proposed_price: 6.20,
      }),
      expect.anything(), // React Query passes mutation context as second arg
    );
  });
});

describe('PriceDiffDisplay component', () => {
  it('shows correct percentage delta for price increase', () => {
    render(<PriceDiffDisplay oldPrice={5.80} newPrice={6.20} />);

    // Should show old price with line-through
    const oldPriceEl = screen.getByText(/5,80/);
    expect(oldPriceEl).toBeTruthy();

    // Should show new price
    const newPriceEl = screen.getByText(/6,20/);
    expect(newPriceEl).toBeTruthy();

    // Should show positive delta (price increase = red)
    expect(screen.getByText(/6,9%/)).toBeTruthy();
  });

  it('shows correct percentage delta for price decrease', () => {
    render(<PriceDiffDisplay oldPrice={10.00} newPrice={8.00} />);

    // Should show negative delta (price decrease = green)
    expect(screen.getByText(/20,0%/)).toBeTruthy();
  });
});

// --- PriceProposalModal tests ---

// Mock checkPriceDeviation
vi.mock('@/models/pricing', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/models/pricing')>();
  return {
    ...actual,
    checkPriceDeviation: vi.fn().mockReturnValue({
      hasDeviation: false,
      publicationPrice: 5.80,
      percentDiff: 0,
    }),
  };
});

import { checkPriceDeviation } from '@/models/pricing';
import { PriceProposalModal } from '@/features/review/PriceProposalModal';

const mockedCheckDeviation = vi.mocked(checkPriceDeviation);

describe('PriceProposalModal component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    moduleId: 'rekenen',
    provider: 'dia',
    currentPrice: 5.80,
    moduleName: 'Rekenen',
  };

  function renderModal(overrides = {}) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <PriceProposalModal {...defaultProps} {...overrides} />
      </QueryClientProvider>,
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockedCheckDeviation.mockReturnValue({
      hasDeviation: false,
      publicationPrice: 5.80,
      percentDiff: 0,
    });
  });

  it('renders with pre-filled current price as read-only', () => {
    renderModal();
    // Should show current price formatted
    expect(screen.getByText(/5,80/)).toBeTruthy();
    // Should show module name and provider
    expect(screen.getByText(/Rekenen/)).toBeTruthy();
    // Should show CTA text
    expect(screen.getByText('Voorstel indienen')).toBeTruthy();
  });

  it('renders form fields for source and explanation', () => {
    renderModal();
    // Should have source and explanation fields
    expect(screen.getByLabelText(/Bron/)).toBeTruthy();
    expect(screen.getByLabelText(/Toelichting/)).toBeTruthy();
  });

  it('does not render when isOpen is false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText('Voorstel indienen')).toBeNull();
  });
});

describe('ProposalBadge component', () => {
  it('renders correct label and color for "open" status', () => {
    const { container } = render(<ProposalBadge status="open" />);
    expect(screen.getByText('Open')).toBeTruthy();
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-status-manual-bg');
  });

  it('renders correct label and color for "approved" status', () => {
    const { container } = render(<ProposalBadge status="approved" />);
    expect(screen.getByText('Goedgekeurd')).toBeTruthy();
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-status-verified-bg');
  });

  it('renders correct label and color for "rejected" status', () => {
    const { container } = render(<ProposalBadge status="rejected" />);
    expect(screen.getByText('Afgewezen')).toBeTruthy();
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-status-stale-bg');
  });
});
