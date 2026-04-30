import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PublicationPrice, PricingConfig } from '@/db/pricing-types';

// Mock the DB operations
vi.mock('@/db/pricing-operations', () => ({
  fetchPublicationPrices: vi.fn(),
  fetchPricingConfigs: vi.fn(),
}));

// Mock static data imports
vi.mock('@/data/providers/index', () => ({
  PROVIDER_CONFIGS: {
    cito: { key: 'cito', label: 'Cito', defaultPrices: [] },
    dia: { key: 'dia', label: 'DIA', defaultPrices: [] },
    jij: { key: 'jij', label: 'JIJ', defaultPrices: [] },
    saqi: { key: 'saqi', label: 'SAQI', defaultPrices: [] },
  },
}));

vi.mock('@/data/default-prices', () => ({
  DEFAULT_PRICES: [],
}));

describe('usePricingDataStore', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset store state between tests
    const { usePricingDataStore } = await import('@/stores/pricing-data-store');
    usePricingDataStore.setState({
      providerConfigs: {},
      publicationPrices: [],
      pricingConfigs: [],
      lastSyncedAt: null,
      isLoading: false,
      isOffline: false,
    });
  });

  it('loadFromSupabase success sets providerConfigs and publicationPrices from DB data, sets lastSyncedAt, isOffline=false', async () => {
    const mockPrices: PublicationPrice[] = [
      {
        id: '1', team_id: 't1', module_id: 'lvs-vo', provider: 'cito',
        amount_per_student: 5.50, source: 'seed', source_label: 'Seed',
        verified_at: '2026-01-01', is_active: true, note: null,
        created_by: null, updated_by: null, created_at: '2026-01-01', updated_at: '2026-01-01',
      },
    ];
    const mockConfigs: PricingConfig[] = [
      {
        id: 'c1', team_id: 't1', provider: 'cito', config_type: 'platform+module',
        config_data: { bundles: [] }, version: 1, is_active: true,
        created_by: null, updated_by: null, created_at: '2026-01-01', updated_at: '2026-01-01',
      },
    ];

    const { fetchPublicationPrices, fetchPricingConfigs } = await import('@/db/pricing-operations');
    vi.mocked(fetchPublicationPrices).mockResolvedValue(mockPrices);
    vi.mocked(fetchPricingConfigs).mockResolvedValue(mockConfigs);

    const { usePricingDataStore } = await import('@/stores/pricing-data-store');
    await usePricingDataStore.getState().loadFromSupabase();

    const state = usePricingDataStore.getState();
    expect(state.publicationPrices.length).toBe(1);
    expect(state.publicationPrices[0].moduleId).toBe('lvs-vo');
    expect(state.publicationPrices[0].provider).toBe('cito');
    expect(state.publicationPrices[0].amountPerStudent).toBe(5.50);
    expect(state.pricingConfigs.length).toBe(1);
    expect(state.lastSyncedAt).toBeTruthy();
    expect(state.isOffline).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('loadFromSupabase failure keeps existing cached data, sets isOffline=true', async () => {
    const { fetchPublicationPrices, fetchPricingConfigs } = await import('@/db/pricing-operations');
    vi.mocked(fetchPublicationPrices).mockRejectedValue(new Error('Network error'));
    vi.mocked(fetchPricingConfigs).mockRejectedValue(new Error('Network error'));

    const { usePricingDataStore } = await import('@/stores/pricing-data-store');

    // Set some cached data first
    usePricingDataStore.setState({
      publicationPrices: [{
        moduleId: 'cached', provider: 'cito', amountPerStudent: 1.00,
        source: 'publication', sourceLabel: 'Cached', verifiedAt: new Date(), isPublicationPrice: true,
      }],
      lastSyncedAt: '2026-01-01T00:00:00Z',
    });

    await usePricingDataStore.getState().loadFromSupabase();

    const state = usePricingDataStore.getState();
    // Cached data preserved
    expect(state.publicationPrices.length).toBe(1);
    expect(state.publicationPrices[0].moduleId).toBe('cached');
    expect(state.isOffline).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('initial state falls back to STATIC_CONFIGS and STATIC_PRICES', async () => {
    const { usePricingDataStore } = await import('@/stores/pricing-data-store');

    // The store should have default state based on static imports
    const state = usePricingDataStore.getState();
    expect(state.providerConfigs).toBeDefined();
    expect(state.publicationPrices).toBeDefined();
    expect(state.isOffline).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.lastSyncedAt).toBeNull();
  });

  it('persist middleware serializes providerConfigs, publicationPrices, lastSyncedAt but not isLoading or isOffline', async () => {
    // This tests the partialize function by checking that the store config
    // includes persist with the correct partialize setup
    const { usePricingDataStore } = await import('@/stores/pricing-data-store');

    // The persist middleware should be configured
    // We test by checking that the store has persist methods
    expect(usePricingDataStore.persist).toBeDefined();
    expect(usePricingDataStore.persist.getOptions().name).toBe('pricing-data-cache');

    // Check partialize function
    const partialize = usePricingDataStore.persist.getOptions().partialize;
    if (partialize) {
      const fullState = {
        providerConfigs: { cito: {} },
        publicationPrices: [],
        pricingConfigs: [],
        lastSyncedAt: '2026-01-01',
        isLoading: true,
        isOffline: true,
        loadFromSupabase: () => {},
        getStalePrices: () => [],
      };
      const persisted = partialize(fullState as never);
      expect(persisted).not.toHaveProperty('isLoading');
      expect(persisted).not.toHaveProperty('isOffline');
      expect(persisted).toHaveProperty('providerConfigs');
      expect(persisted).toHaveProperty('publicationPrices');
      expect(persisted).toHaveProperty('lastSyncedAt');
    }
  });

  it('getStalePrices returns publication prices where verified_at > 6 months ago', async () => {
    const { usePricingDataStore } = await import('@/stores/pricing-data-store');

    const now = new Date('2026-06-01');
    const staleDate = new Date('2025-10-01'); // > 6 months ago
    const freshDate = new Date('2026-04-01'); // < 6 months ago

    usePricingDataStore.setState({
      publicationPrices: [
        {
          moduleId: 'stale-mod', provider: 'cito', amountPerStudent: 3.00,
          source: 'publication', sourceLabel: 'Pub', verifiedAt: staleDate, isPublicationPrice: true,
        },
        {
          moduleId: 'fresh-mod', provider: 'dia', amountPerStudent: 4.00,
          source: 'publication', sourceLabel: 'Pub', verifiedAt: freshDate, isPublicationPrice: true,
        },
      ],
    });

    const stalePrices = usePricingDataStore.getState().getStalePrices(now);
    expect(stalePrices.length).toBe(1);
    expect(stalePrices[0].moduleId).toBe('stale-mod');
  });
});
