import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePricingDataStore } from '@/stores/pricing-data-store';
import { DEFAULT_PRICES } from '@/data/default-prices';

vi.mock('@/db/pricing-operations', () => ({
  fetchPublicationPrices: vi.fn(),
  fetchPricingConfigs: vi.fn(),
}));

import { fetchPublicationPrices, fetchPricingConfigs } from '@/db/pricing-operations';
const mockFetchPrices = vi.mocked(fetchPublicationPrices);
const mockFetchConfigs = vi.mocked(fetchPricingConfigs);

describe('offline fallback behavior for pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state with static defaults
    usePricingDataStore.setState({
      publicationPrices: [...DEFAULT_PRICES],
      pricingConfigs: [],
      lastSyncedAt: null,
      isLoading: false,
      isOffline: false,
    });
  });

  it('returns cached pricing data when offline', async () => {
    // Pre-populate store with some cached data
    const cachedPrices = [...DEFAULT_PRICES];
    usePricingDataStore.setState({ publicationPrices: cachedPrices });

    // Simulate Supabase being unreachable
    mockFetchPrices.mockRejectedValueOnce(new Error('Network error'));
    mockFetchConfigs.mockRejectedValueOnce(new Error('Network error'));

    await usePricingDataStore.getState().loadFromSupabase();

    const state = usePricingDataStore.getState();
    // Data should be preserved (not cleared)
    expect(state.publicationPrices.length).toBeGreaterThan(0);
    expect(state.publicationPrices.length).toBe(cachedPrices.length);
    expect(state.isOffline).toBe(true);
  });

  it('falls back to TS DEFAULT_PRICES when no cache available', () => {
    // On fresh store init, publicationPrices should match DEFAULT_PRICES
    const state = usePricingDataStore.getState();
    expect(state.publicationPrices.length).toBe(DEFAULT_PRICES.length);
    // Verify shape matches — each record has moduleId and provider
    state.publicationPrices.forEach((price) => {
      expect(price).toHaveProperty('moduleId');
      expect(price).toHaveProperty('provider');
      expect(price).toHaveProperty('amountPerStudent');
    });
  });

  it('sets isOffline flag when Supabase fetch fails', async () => {
    mockFetchPrices.mockRejectedValueOnce(new Error('Connection refused'));
    mockFetchConfigs.mockRejectedValueOnce(new Error('Connection refused'));

    // Starts as online
    expect(usePricingDataStore.getState().isOffline).toBe(false);

    await usePricingDataStore.getState().loadFromSupabase();

    expect(usePricingDataStore.getState().isOffline).toBe(true);
  });

  it('clears isOffline flag on successful fetch', async () => {
    // Start in offline state
    usePricingDataStore.setState({ isOffline: true });

    mockFetchPrices.mockResolvedValueOnce([
      {
        id: 'test-1',
        team_id: 't1',
        module_id: 'rekenwiskunde',
        provider: 'cito',
        amount_per_student: 5.5,
        source: 'seed',
        source_label: 'Publicatieprijs 2025-2026',
        verified_at: new Date().toISOString(),
        is_active: true,
        note: null,
        created_by: null,
        updated_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    mockFetchConfigs.mockResolvedValueOnce([]);

    await usePricingDataStore.getState().loadFromSupabase();

    expect(usePricingDataStore.getState().isOffline).toBe(false);
  });

  it('updates lastSyncedAt on successful fetch', async () => {
    expect(usePricingDataStore.getState().lastSyncedAt).toBeNull();

    mockFetchPrices.mockResolvedValueOnce([
      {
        id: 'test-2',
        team_id: 't1',
        module_id: 'rekenwiskunde',
        provider: 'cito',
        amount_per_student: 5.5,
        source: 'seed',
        source_label: 'Publicatieprijs 2025-2026',
        verified_at: new Date().toISOString(),
        is_active: true,
        note: null,
        created_by: null,
        updated_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    mockFetchConfigs.mockResolvedValueOnce([]);

    await usePricingDataStore.getState().loadFromSupabase();

    const lastSynced = usePricingDataStore.getState().lastSyncedAt;
    expect(lastSynced).not.toBeNull();
    // Should be a valid ISO string
    expect(new Date(lastSynced!).toISOString()).toBe(lastSynced);
  });
});
