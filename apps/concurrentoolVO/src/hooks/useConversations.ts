import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { addConversation, updateConversation, deleteConversation, mapConversationRow } from '@/db/operations';
import type { Conversation } from '@/db/types';
import type { z } from 'zod';
import type { conversationSchema } from '@/features/school-profile/schemas/conversation.schema';

type ConversationFormInput = z.input<typeof conversationSchema>;

export function useConversations(schoolId: string) {
  return useQuery({
    queryKey: ['conversations', schoolId],
    queryFn: async (): Promise<Conversation[]> => {
      const { data, error } = await supabase.from('conversations')
        .select('*')
        .eq('school_id', schoolId)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapConversationRow);
    },
    enabled: !!schoolId,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, data }: { schoolId: string; data: ConversationFormInput }) =>
      addConversation(schoolId, data),
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['conversations', schoolId] });
      // Also invalidate contacts because lastContactDate may have changed
      qc.invalidateQueries({ queryKey: ['contacts', schoolId] });
    },
  });
}

export function useUpdateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, conversationId, data }: { schoolId: string; conversationId: string; data: Partial<Conversation> }) =>
      updateConversation(schoolId, conversationId, data),
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['conversations', schoolId] });
    },
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, conversationId }: { schoolId: string; conversationId: string }) =>
      deleteConversation(schoolId, conversationId),
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['conversations', schoolId] });
    },
  });
}
