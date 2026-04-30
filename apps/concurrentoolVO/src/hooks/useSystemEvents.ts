import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { addSystemEvent, mapSystemEventRow } from '@/db/operations';
import type { SystemEvent } from '@/db/types';

export function useSystemEvents(schoolId: string) {
  return useQuery({
    queryKey: ['system-events', schoolId],
    queryFn: async (): Promise<SystemEvent[]> => {
      const { data, error } = await supabase.from('system_events')
        .select('*')
        .eq('school_id', schoolId)
        .order('timestamp', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapSystemEventRow);
    },
    enabled: !!schoolId,
  });
}

export function useAddSystemEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      schoolId,
      event,
    }: {
      schoolId: string;
      event: Omit<SystemEvent, 'id' | 'timestamp' | 'schoolId'>;
    }) => addSystemEvent(schoolId, event),
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['system-events', schoolId] });
    },
  });
}
