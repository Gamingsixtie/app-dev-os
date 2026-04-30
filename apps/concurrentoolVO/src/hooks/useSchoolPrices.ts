import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { SchoolPriceEntry } from '@/db/types';

// ─── Row mapper (snake_case DB -> camelCase app) ─────────────────────────────

type SchoolPriceRow = Record<string, unknown>;

function mapPriceRow(row: SchoolPriceRow): SchoolPriceEntry {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    moduleId: row.module_id as string,
    provider: row.provider as string,
    amount: row.amount as number,
    priceType: row.price_type as 'publication' | 'agreed',
    discountPercentage: row.discount_percentage as number,
    source: row.source as string,
    verifiedAt: row.verified_at as string | null,
    note: row.note as string,
    isActive: row.is_active as boolean,
    activationReason: row.activation_reason as string | null,
    activatedAt: row.activated_at as string | null,
    createdBy: row.created_by as string | null,
    updatedBy: row.updated_by as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Query hook ──────────────────────────────────────────────────────────────

export function useSchoolPrices(schoolId: string) {
  return useQuery({
    queryKey: ['school-prices', schoolId],
    queryFn: async (): Promise<SchoolPriceEntry[]> => {
      const { data, error } = await supabase
        .from('school_prices')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapPriceRow);
    },
    enabled: !!schoolId,
  });
}

// ─── Create mutation ─────────────────────────────────────────────────────────

interface CreatePriceInput {
  schoolId: string;
  data: {
    moduleId: string;
    provider: string;
    amount: number;
    priceType: 'publication' | 'agreed';
    discountPercentage?: number;
    source?: string;
    verifiedAt?: string | null;
    note?: string;
    isActive?: boolean;
  };
}

export function useCreateSchoolPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ schoolId, data }: CreatePriceInput) => {
      const { error } = await supabase.from('school_prices').insert({
        school_id: schoolId,
        module_id: data.moduleId,
        provider: data.provider,
        amount: data.amount,
        price_type: data.priceType,
        discount_percentage: data.discountPercentage ?? 0,
        source: data.source ?? '',
        verified_at: data.verifiedAt ?? null,
        note: data.note ?? '',
        is_active: data.isActive ?? false,
      });
      if (error) throw error;
    },
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['school-prices', schoolId] });
    },
  });
}

// ─── Update mutation ─────────────────────────────────────────────────────────

interface UpdatePriceInput {
  schoolId: string;
  priceId: string;
  data: Partial<{
    moduleId: string;
    provider: string;
    amount: number;
    priceType: 'publication' | 'agreed';
    discountPercentage: number;
    source: string;
    verifiedAt: string | null;
    note: string;
  }>;
}

export function useUpdateSchoolPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ priceId, data }: UpdatePriceInput) => {
      const updateData: Record<string, unknown> = {};
      if (data.moduleId !== undefined) updateData.module_id = data.moduleId;
      if (data.provider !== undefined) updateData.provider = data.provider;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.priceType !== undefined) updateData.price_type = data.priceType;
      if (data.discountPercentage !== undefined) updateData.discount_percentage = data.discountPercentage;
      if (data.source !== undefined) updateData.source = data.source;
      if (data.verifiedAt !== undefined) updateData.verified_at = data.verifiedAt;
      if (data.note !== undefined) updateData.note = data.note;

      const { error } = await supabase
        .from('school_prices')
        .update(updateData)
        .eq('id', priceId);
      if (error) throw error;
    },
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['school-prices', schoolId] });
    },
  });
}

// ─── Delete mutation ─────────────────────────────────────────────────────────

export function useDeleteSchoolPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ priceId }: { schoolId: string; priceId: string }) => {
      const { error } = await supabase
        .from('school_prices')
        .delete()
        .eq('id', priceId);
      if (error) throw error;
    },
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['school-prices', schoolId] });
    },
  });
}

// ─── Activate mutation (mutual exclusion) ────────────────────────────────────

interface ActivatePriceInput {
  schoolId: string;
  priceId: string;
  moduleId: string;
  provider: string;
  reason: string;
}

/**
 * Activates a single price entry and deactivates all others for the same
 * school + module + provider combination. Per D-08 (radiobutton activation
 * with reason) and D-09 (SchoolPriceEntry model).
 */
export function useActivateSchoolPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ schoolId, priceId, moduleId, provider, reason }: ActivatePriceInput) => {
      // Step 1: Deactivate all prices with same school + module + provider
      const { error: deactivateError } = await supabase
        .from('school_prices')
        .update({ is_active: false })
        .eq('school_id', schoolId)
        .eq('module_id', moduleId)
        .eq('provider', provider);
      if (deactivateError) throw deactivateError;

      // Step 2: Activate the target price
      const { error: activateError } = await supabase
        .from('school_prices')
        .update({
          is_active: true,
          activation_reason: reason,
          activated_at: new Date().toISOString(),
        })
        .eq('id', priceId);
      if (activateError) throw activateError;
    },
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['school-prices', schoolId] });
    },
  });
}
