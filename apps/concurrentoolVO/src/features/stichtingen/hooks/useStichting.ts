/**
 * React Query hooks for a single Stichting detail view (Phase 27 Plan 02 R1).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStichting,
  updateStichting,
  listSchoolsForStichting,
  linkSchoolToStichting,
  unlinkSchoolFromStichting,
  type StichtingUpdateInput,
} from '@/db/operations';
import { STICHTINGEN_QUERY_KEY } from './useStichtingen';

export function useStichting(id: string | undefined) {
  return useQuery({
    queryKey: ['stichting', id],
    queryFn: () => {
      if (!id) throw new Error('Stichting ID ontbreekt');
      return getStichting(id);
    },
    enabled: !!id,
  });
}

export function useUpdateStichting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: StichtingUpdateInput }) =>
      updateStichting(id, patch),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: STICHTINGEN_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['stichting', vars.id] });
    },
  });
}

export function useSchoolsForStichting(stichtingId: string | undefined) {
  return useQuery({
    queryKey: ['stichting-schools', stichtingId],
    queryFn: () => {
      if (!stichtingId) return [];
      return listSchoolsForStichting(stichtingId);
    },
    enabled: !!stichtingId,
  });
}

export function useLinkSchoolToStichting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, stichtingId }: { schoolId: string; stichtingId: string }) =>
      linkSchoolToStichting(schoolId, stichtingId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['stichting-schools', vars.stichtingId] });
      qc.invalidateQueries({ queryKey: ['schools'] });
    },
  });
}

export function useUnlinkSchoolFromStichting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId }: { schoolId: string; stichtingId: string }) =>
      unlinkSchoolFromStichting(schoolId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['stichting-schools', vars.stichtingId] });
      qc.invalidateQueries({ queryKey: ['schools'] });
    },
  });
}
