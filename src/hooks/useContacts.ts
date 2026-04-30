import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { addContact, updateContact, deleteContact, setEngagementStatus, mapContactRow } from '@/db/operations';
import type { Contact } from '@/db/types';
import type { EngagementStatus } from '@/models/school';
import type { z } from 'zod';
import type { contactSchema } from '@/features/school-profile/schemas/contact.schema';

type ContactFormInput = z.input<typeof contactSchema>;

export function useContacts(schoolId: string) {
  return useQuery({
    queryKey: ['contacts', schoolId],
    queryFn: async (): Promise<Contact[]> => {
      const { data, error } = await supabase.from('contacts')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at');
      if (error) throw error;
      return (data ?? []).map(mapContactRow);
    },
    enabled: !!schoolId,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, data }: { schoolId: string; data: ContactFormInput }) =>
      addContact(schoolId, data),
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['contacts', schoolId] });
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, contactId, data }: { schoolId: string; contactId: string; data: Partial<Contact> }) =>
      updateContact(schoolId, contactId, data),
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['contacts', schoolId] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, contactId }: { schoolId: string; contactId: string }) =>
      deleteContact(schoolId, contactId),
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['contacts', schoolId] });
    },
  });
}

export function useSetEngagementStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      schoolId,
      contactId,
      status,
      options,
    }: {
      schoolId: string;
      contactId: string;
      status: EngagementStatus;
      options?: { waitingForContactId?: string | null; dropOffReason?: string };
    }) => setEngagementStatus(schoolId, contactId, status, options),
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['contacts', schoolId] });
      qc.invalidateQueries({ queryKey: ['schools'] });
    },
  });
}
