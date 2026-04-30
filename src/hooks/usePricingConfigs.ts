/**
 * React Query hook for fetching pricing configs from Supabase.
 * Wraps fetchPricingConfigs with caching and stale-time management.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchPricingConfigs } from '@/db/pricing-operations';

export function usePricingConfigs() {
  return useQuery({
    queryKey: ['pricing-configs'],
    queryFn: fetchPricingConfigs,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
