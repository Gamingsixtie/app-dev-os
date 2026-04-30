/**
 * React Query hook for fetching publication prices from Supabase.
 * Wraps fetchPublicationPrices with caching and stale-time management.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchPublicationPrices } from '@/db/pricing-operations';

export function usePublicationPrices() {
  return useQuery({
    queryKey: ['publication-prices'],
    queryFn: fetchPublicationPrices,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
