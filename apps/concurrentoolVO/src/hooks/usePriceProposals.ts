import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPriceProposals,
  createPriceProposal,
  fetchOpenProposalCount,
} from '@/db/pricing-operations';

/**
 * Hook to fetch price proposals with optional filters.
 * Follows the same React Query pattern as useSchoolPrices.
 */
export function usePriceProposals(filters?: { status?: string; provider?: string; moduleId?: string }) {
  return useQuery({
    queryKey: ['price-proposals', filters],
    queryFn: () => fetchPriceProposals(filters),
  });
}

/**
 * Hook to get the count of open proposals for badge display (D-09).
 * Polls every 60 seconds to keep badge up-to-date.
 */
export function useOpenProposalCount() {
  return useQuery({
    queryKey: ['price-proposals', 'open-count'],
    queryFn: fetchOpenProposalCount,
    refetchInterval: 60_000, // Poll every minute for badge updates
  });
}

/**
 * Mutation hook to create a new price proposal.
 * Invalidates all price-proposals queries on success so lists and counts update.
 */
export function useCreateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPriceProposal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price-proposals'] });
    },
  });
}
