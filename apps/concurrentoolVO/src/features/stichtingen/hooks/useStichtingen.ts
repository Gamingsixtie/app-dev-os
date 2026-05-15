/**
 * React Query hooks for the Stichting list-view (Phase 27 Plan 02 R1).
 *
 * Phase 27 Plan 07 (R11) added:
 *  - `useUnlinkedSchools()` — query for schools without a `stichtingId`,
 *    feeds the smart-suggestion + handmatig sections of `BulkLinkSchoolsDialog`.
 *  - `useBulkLinkSchools()` — mutation that links N schools to a Stichting
 *    in a single Supabase call and invalidates the relevant caches.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  bulkLinkSchools,
  createStichting,
  deleteStichting,
  getAllSchools,
  listStichtingen,
  type StichtingCreateInput,
} from '@/db/operations';

/** Query key shared with `useStichting(id)` — `['stichtingen']` is the list cache. */
export const STICHTINGEN_QUERY_KEY = ['stichtingen'] as const;

/** Query key for ongekoppelde scholen (stichtingId == null). */
export const UNLINKED_SCHOOLS_QUERY_KEY = ['unlinked-schools'] as const;

export function useStichtingen() {
  return useQuery({
    queryKey: STICHTINGEN_QUERY_KEY,
    queryFn: () =>
      Promise.race([
        listStichtingen(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout: server reageert niet')), 15000),
        ),
      ]),
    retry: 2,
  });
}

export function useCreateStichting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StichtingCreateInput) => createStichting(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STICHTINGEN_QUERY_KEY });
    },
  });
}

export function useDeleteStichting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStichting(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STICHTINGEN_QUERY_KEY });
    },
  });
}

/**
 * Fetch all schools that are NOT yet linked to any Stichting (Phase 27 Plan 07
 * R11). Reuses `getAllSchools` and filters client-side — the table is RLS-scoped
 * to the team so the working set stays bounded.
 */
export function useUnlinkedSchools() {
  return useQuery({
    queryKey: UNLINKED_SCHOOLS_QUERY_KEY,
    queryFn: async () => {
      const schools = await getAllSchools();
      return schools.filter((s) => !s.stichtingId);
    },
    retry: 2,
  });
}

/**
 * Bulk-link N schools to a Stichting in one transaction. Invalidates the
 * stichting-schools list, the unlinked-schools list, and the schools list.
 */
export function useBulkLinkSchools() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stichtingId, schoolIds }: { stichtingId: string; schoolIds: string[] }) =>
      bulkLinkSchools(stichtingId, schoolIds),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['stichting-schools', vars.stichtingId] });
      qc.invalidateQueries({ queryKey: UNLINKED_SCHOOLS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['schools'] });
    },
  });
}
