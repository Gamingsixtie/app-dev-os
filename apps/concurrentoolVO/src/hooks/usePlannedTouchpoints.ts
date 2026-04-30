import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import {
  addPlannedTouchpoint,
  updatePlannedTouchpoint,
  deletePlannedTouchpoint,
  mapPlannedTouchpointRow,
} from '@/db/operations';
import type { PlannedTouchpoint } from '@/db/types';

export function usePlannedTouchpoints(schoolId: string) {
  return useQuery({
    queryKey: ['planned_touchpoints', schoolId],
    queryFn: async (): Promise<PlannedTouchpoint[]> => {
      const { data, error } = await supabase.from('planned_touchpoints')
        .select('*')
        .eq('school_id', schoolId)
        .order('school_year_start', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapPlannedTouchpointRow);
    },
    enabled: !!schoolId,
  });
}

export function useCreatePlannedTouchpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, data }: {
      schoolId: string;
      data: { contactId: string; schoolYearStart: number; monthIndex: number; note?: string };
    }) => addPlannedTouchpoint(schoolId, data),
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['planned_touchpoints', schoolId] });
    },
  });
}

export function useUpdatePlannedTouchpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, touchpointId, data }: {
      schoolId: string;
      touchpointId: string;
      data: Partial<Pick<PlannedTouchpoint, 'note' | 'status' | 'monthIndex'>>;
    }) => updatePlannedTouchpoint(schoolId, touchpointId, data),
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['planned_touchpoints', schoolId] });
    },
  });
}

export function useDeletePlannedTouchpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, touchpointId }: { schoolId: string; touchpointId: string }) =>
      deletePlannedTouchpoint(schoolId, touchpointId),
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['planned_touchpoints', schoolId] });
    },
  });
}
