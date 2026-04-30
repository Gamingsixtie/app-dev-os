import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { DEFAULT_PRICES } from '@/data/default-prices';
import {
  detectDiscountPatterns,
  type DiscountPattern,
  type SchoolPriceInput,
  type PublicationPriceInput,
} from '@/engine/discount-patterns';

/**
 * Hook that fetches all school prices across the team, detects discount
 * patterns against publication prices, and returns the results.
 *
 * Uses React Query with 10-minute stale time to avoid excessive refetching.
 */
export function useDiscountPatterns() {
  const { data, isLoading } = useQuery({
    queryKey: ['discount-patterns'],
    queryFn: async (): Promise<DiscountPattern[]> => {
      // Fetch all school prices across the team (not just current school)
      const { data: rows, error } = await supabase
        .from('school_prices')
        .select('school_id, module_id, provider, amount, source');

      if (error) throw error;

      // Map DB rows to engine input format
      const schoolPrices: SchoolPriceInput[] = (rows ?? []).map((row) => ({
        schoolId: row.school_id as string,
        moduleId: row.module_id as string,
        provider: row.provider as string,
        amount: row.amount as number,
        source: row.source as string,
      }));

      // Map publication prices from static data
      const publicationPrices: PublicationPriceInput[] = DEFAULT_PRICES.map((p) => ({
        moduleId: p.moduleId,
        provider: p.provider,
        amountPerStudent: p.amountPerStudent,
      }));

      return detectDiscountPatterns(schoolPrices, publicationPrices);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const patterns = data ?? [];

  return {
    patterns,
    isLoading,
    hasPatterns: patterns.length > 0,
  };
}
