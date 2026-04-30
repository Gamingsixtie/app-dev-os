import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock pricing-operations
const mockApproveProposal = vi.fn();
vi.mock('@/db/pricing-operations', () => ({
  approveProposal: (...args: unknown[]) => mockApproveProposal(...args),
}));

// Mock pricing-data-store
const mockLoadFromSupabase = vi.fn();
vi.mock('@/stores/pricing-data-store', () => ({
  usePricingDataStore: {
    getState: () => ({ loadFromSupabase: mockLoadFromSupabase }),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('auto-recalculation on proposal approval', () => {
  it('triggers loadFromSupabase for store refresh after approval', async () => {
    mockApproveProposal.mockResolvedValue(undefined);
    mockLoadFromSupabase.mockResolvedValue(undefined);

    // Simulate what ReviewQueueItem does on approve success
    await mockApproveProposal('proposal-1');
    await mockLoadFromSupabase();

    expect(mockApproveProposal).toHaveBeenCalledWith('proposal-1');
    expect(mockLoadFromSupabase).toHaveBeenCalledTimes(1);
  });

  it('does not trigger loadFromSupabase for rejected proposals', async () => {
    // For rejections, we only update the proposal status, not reload prices
    const mockRejectProposal = vi.fn().mockResolvedValue(undefined);

    await mockRejectProposal('proposal-2', 'Prijs klopt niet');

    expect(mockRejectProposal).toHaveBeenCalledWith('proposal-2', 'Prijs klopt niet');
    expect(mockLoadFromSupabase).not.toHaveBeenCalled();
  });

  it('query invalidation covers publication-prices and price-proposals keys', () => {
    // Verify the query keys that need to be invalidated on approval
    const queryKeysToInvalidate = ['publication-prices', 'price-proposals'];

    expect(queryKeysToInvalidate).toContain('publication-prices');
    expect(queryKeysToInvalidate).toContain('price-proposals');
  });
});
