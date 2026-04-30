import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { SchoolplanAnalysisRow } from '@/db/types';
import type { OpportunityAnnotation } from '@/features/school-profile/schemas/schoolplan-analysis.schema';
import type { Json } from '@/lib/supabase/types';

// ─── Row mapper (snake_case DB -> camelCase where needed) ────────────────────

type AnalysisDbRow = Record<string, unknown>;

function mapAnalysisRow(row: AnalysisDbRow): SchoolplanAnalysisRow {
  return {
    id: row.id as string,
    school_id: row.school_id as string,
    file_name: row.file_name as string,
    file_path: row.file_path as string,
    page_count: row.page_count as number | null,
    uploaded_at: row.uploaded_at as string,
    summary: row.summary as string,
    themes: (row.themes ?? []) as string[],
    opportunities: (row.opportunities ?? []) as SchoolplanAnalysisRow['opportunities'],
    also_relevant: (row.also_relevant ?? []) as SchoolplanAnalysisRow['also_relevant'],
    opportunity_annotations: (row.opportunity_annotations ?? {}) as SchoolplanAnalysisRow['opportunity_annotations'],
    analysis_status: row.analysis_status as SchoolplanAnalysisRow['analysis_status'],
    error_message: row.error_message as string | null,
    created_by: row.created_by as string | null,
    updated_by: row.updated_by as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// ─── Query hook ──────────────────────────────────────────────────────────────

export function useSchoolplanAnalysis(schoolId: string) {
  return useQuery({
    queryKey: ['schoolplan-analysis', schoolId],
    queryFn: async (): Promise<SchoolplanAnalysisRow | null> => {
      const { data, error } = await supabase
        .from('schoolplan_analyses')
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapAnalysisRow(data) : null;
    },
    enabled: !!schoolId,
  });
}

// ─── Update annotation mutation ──────────────────────────────────────────────

interface UpdateAnnotationInput {
  opportunityIndex: number;
  annotation: OpportunityAnnotation;
}

export function useUpdateAnnotation(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ opportunityIndex, annotation }: UpdateAnnotationInput) => {
      // Read current annotations
      const { data: current, error: readError } = await supabase
        .from('schoolplan_analyses')
        .select('opportunity_annotations')
        .eq('school_id', schoolId)
        .single();
      if (readError) throw readError;

      // Merge the new annotation by index key
      const updated: Record<string, Json> = {
        ...((current?.opportunity_annotations as Record<string, Json>) || {}),
        [String(opportunityIndex)]: annotation as unknown as Json,
      };

      // Write back
      const { error: updateError } = await supabase
        .from('schoolplan_analyses')
        .update({ opportunity_annotations: updated as Json })
        .eq('school_id', schoolId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schoolplan-analysis', schoolId] });
    },
  });
}

// ─── Delete mutation (for replacing schoolplan per D-06) ─────────────────────

export function useDeleteSchoolplanAnalysis(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (filePath: string) => {
      // Delete file from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);
      if (storageError) throw storageError;

      // Delete the analysis row
      const { error: deleteError } = await supabase
        .from('schoolplan_analyses')
        .delete()
        .eq('school_id', schoolId);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schoolplan-analysis', schoolId] });
    },
  });
}
