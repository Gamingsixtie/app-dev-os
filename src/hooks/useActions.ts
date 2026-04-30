import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { addAction, updateAction, deleteAction, mapActionRow } from '@/db/operations';
import type { ActionItem } from '@/db/types';
import type { z } from 'zod';
import type { actionSchema } from '@/features/school-profile/schemas/action.schema';

type ActionFormInput = z.input<typeof actionSchema>;

export function useActions(schoolId: string) {
  return useQuery({
    queryKey: ['actions', schoolId],
    queryFn: async (): Promise<ActionItem[]> => {
      const { data, error } = await supabase.from('actions')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapActionRow);
    },
    enabled: !!schoolId,
  });
}

export function useCreateAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, data }: { schoolId: string; data: ActionFormInput }) =>
      addAction(schoolId, data),
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['actions', schoolId] });
    },
  });
}

export function useUpdateAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, actionId, data }: { schoolId: string; actionId: string; data: Partial<ActionItem> }) =>
      updateAction(schoolId, actionId, data),
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['actions', schoolId] });
    },
  });
}

export function useDeleteAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, actionId }: { schoolId: string; actionId: string }) =>
      deleteAction(schoolId, actionId),
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['actions', schoolId] });
    },
  });
}
