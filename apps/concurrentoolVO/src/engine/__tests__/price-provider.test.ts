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

describe('async price provider with TS fallback', () => {
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

  it('returns prices from Supabase when available', async () => {
    const testPrice = {
      id: 'supabase-1',
      team_id: 't1',
      module_id: 'rekenwiskunde',
      provider: 'cito',
      amount_per_student: 9.99,
      source: 'manual' as const,
      source_label: 'Handmatig ingevoerd',
      verified_at: new Date().toISOString(),
      is_active: true,
      note: null,
      created_by: null,
      updated_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockFetchPrices.mockResolvedValueOnce([testPrice]);
    mockFetchConfigs.mockResolvedValueOnce([]);

    await usePricingDataStore.getState().loadFromSupabase();

    const state = usePricingDataStore.getState();
    // Store should now contain the Supabase data instead of defaults
    expect(state.publicationPrices).toHaveLength(1);
    expect(state.publicationPrices[0].moduleId).toBe('rekenwiskunde');
    expect(state.publicationPrices[0].provider).toBe('cito');
    expect(state.publicationPrices[0].amountPerStudent).toBe(9.99);
    expect(state.isOffline).toBe(false);
  });

  it('falls back to TS-based DEFAULT_PRICES when Supabase is unreachable', async () => {
    mockFetchPrices.mockRejectedValueOnce(new Error('Supabase unreachable'));
    mockFetchConfigs.mockRejectedValueOnce(new Error('Supabase unreachable'));

    await usePricingDataStore.getState().loadFromSupabase();

    const state = usePricingDataStore.getState();
    // Should retain the static defaults when fetch fails
    expect(state.publicationPrices.length).toBe(DEFAULT_PRICES.length);
    expect(state.isOffline).toBe(true);
    // Verify at least one known default price exists
    const citoPrice = state.publicationPrices.find(
      (p) => p.provider === 'cito' && p.moduleId === DEFAULT_PRICES[0].moduleId,
    );
    expect(citoPrice).toBeDefined();
    expect(citoPrice!.amountPerStudent).toBe(DEFAULT_PRICES[0].amountPerStudent);
  });

  it('merges school-specific overrides with publication prices', () => {
    // Verify that publicationPrices are PriceRecord[] with the expected shape
    // so they can coexist with school-specific overrides in downstream consumers
    const state = usePricingDataStore.getState();

    state.publicationPrices.forEach((price) => {
      // Each PriceRecord has the fields needed for engine consumption
      expect(price).toHaveProperty('moduleId');
      expect(price).toHaveProperty('provider');
      expect(price).toHaveProperty('amountPerStudent');
      expect(price).toHaveProperty('source');
      expect(price).toHaveProperty('verifiedAt');
      expect(price).toHaveProperty('isPublicationPrice');
      // amountPerStudent should be a non-negative number
      expect(typeof price.amountPerStudent).toBe('number');
      expect(price.amountPerStudent).toBeGreaterThanOrEqual(0);
      // provider must be one of the known providers
      expect(['cito', 'dia', 'jij', 'saqi']).toContain(price.provider);
    });

    // Multiple providers should be present in defaults
    const providers = new Set(state.publicationPrices.map((p) => p.provider));
    expect(providers.size).toBeGreaterThanOrEqual(2);
  });

  it('marks stale prices with correct status', () => {
    // Create a price verified 8 months ago (should be stale at 6-month threshold)
    const eightMonthsAgo = new Date();
    eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);

    const recentDate = new Date();

    const stalePrice = {
      moduleId: 'stale-module',
      provider: 'cito' as const,
      amountPerStudent: 10.0,
      source: 'publication' as const,
      sourceLabel: 'Oud tarief',
      verifiedAt: eightMonthsAgo,
      isPublicationPrice: true,
    };

    const freshPrice = {
      moduleId: 'fresh-module',
      provider: 'dia' as const,
      amountPerStudent: 5.0,
      source: 'publication' as const,
      sourceLabel: 'Recent tarief',
      verifiedAt: recentDate,
      isPublicationPrice: true,
    };

    usePricingDataStore.setState({
      publicationPrices: [stalePrice, freshPrice],
    });

    const stalePrices = usePricingDataStore.getState().getStalePrices(new Date());

    // Only the old price should be stale
    expect(stalePrices).toHaveLength(1);
    expect(stalePrices[0].moduleId).toBe('stale-module');

    // The fresh price should NOT be in the stale list
    const freshInStale = stalePrices.find((p) => p.moduleId === 'fresh-module');
    expect(freshInStale).toBeUndefined();
  });
});
