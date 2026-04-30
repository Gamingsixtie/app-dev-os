/**
 * Central Zustand store for all pricing data.
 *
 * Data flow: Supabase -> store -> engine (via getState())
 * Offline fallback: Supabase -> localStorage cache -> static TS imports
 *
 * Per D-03: Store provides configs to engine via getState() pattern.
 * Per D-04: Three-layer fallback: live DB -> cached -> static TS.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PROVIDER_CONFIGS as STATIC_CONFIGS } from '@/data/providers/index';
import type { ProviderConfig } from '@/data/providers/index';
import { DEFAULT_PRICES as STATIC_PRICES } from '@/data/default-prices';
import { fetchPublicationPrices, fetchPricingConfigs } from '@/db/pricing-operations';
import type { PriceRecord } from '@/models/pricing';
import { getPriceStatus } from '@/models/pricing';
import type { PublicationPrice, PricingConfig } from '@/db/pricing-types';

interface PricingDataState {
  providerConfigs: Record<string, ProviderConfig>;
  publicationPrices: PriceRecord[];
  pricingConfigs: PricingConfig[];
  lastSyncedAt: string | null;
  isLoading: boolean;
  isOffline: boolean;
  loadFromSupabase: () => Promise<void>;
  getStalePrices: (now?: Date) => PriceRecord[];
}

/**
 * Transform PublicationPrice (DB row) to PriceRecord (app model).
 */
function toAppPriceRecord(row: PublicationPrice): PriceRecord {
  return {
    moduleId: row.module_id,
    provider: row.provider as PriceRecord['provider'],
    amountPerStudent: row.amount_per_student,
    source: row.source === 'seed' ? 'publication' : (row.source as PriceRecord['source']),
    sourceLabel: row.source_label,
    verifiedAt: new Date(row.verified_at),
    isPublicationPrice: row.source === 'seed' || row.source === 'proposal',
    note: row.note ?? undefined,
  };
}

export const usePricingDataStore = create<PricingDataState>()(
  persist(
    (set, get) => ({
      providerConfigs: { ...STATIC_CONFIGS },
      publicationPrices: [...STATIC_PRICES],
      pricingConfigs: [],
      lastSyncedAt: null,
      isLoading: false,
      isOffline: false,

      loadFromSupabase: async () => {
        set({ isLoading: true });
        try {
          const [dbPrices, dbConfigs] = await Promise.all([
            fetchPublicationPrices(),
            fetchPricingConfigs(),
          ]);

          // Transform DB prices to app PriceRecords
          const publicationPrices = dbPrices.map(toAppPriceRecord);

          // Store raw configs for downstream use
          const pricingConfigs = dbConfigs;

          // TODO: In future, transform PricingConfig[] to ProviderConfig records
          // For now, keep static configs as base and overlay DB data
          const providerConfigs = { ...STATIC_CONFIGS };

          set({
            publicationPrices,
            pricingConfigs,
            providerConfigs,
            lastSyncedAt: new Date().toISOString(),
            isOffline: false,
            isLoading: false,
          });
        } catch {
          // Keep existing cached data, mark offline
          set({
            isOffline: true,
            isLoading: false,
          });
        }
      },

      getStalePrices: (now?: Date) => {
        const currentDate = now ?? new Date();
        return get().publicationPrices.filter(
          (p) => getPriceStatus(p, currentDate) === 'stale',
        );
      },
    }),
    {
      name: 'pricing-data-cache',
      partialize: (state) => ({
        providerConfigs: state.providerConfigs,
        publicationPrices: state.publicationPrices,
        pricingConfigs: state.pricingConfigs,
        lastSyncedAt: state.lastSyncedAt,
      }),
    },
  ),
);
