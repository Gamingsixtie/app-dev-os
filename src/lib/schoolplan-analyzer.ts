/**
 * Client-side schoolplan upload and analysis orchestration.
 * Uploads file to Supabase Storage, creates initial DB row,
 * then streams SSE from the serverless analysis function.
 */

import { supabase } from '@/lib/supabase/client';
import type { Json } from '@/lib/supabase/types';

// ─── Accepted file extensions (per D-16: PDF, Word, TXT only) ────────────────

const ACCEPTED_EXTENSIONS = new Set(['pdf', 'docx', 'txt']);

// ─── Auth helper (inline to avoid circular import with ai-intake.ts) ─────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Niet ingelogd. Log opnieuw in om een schoolplan te uploaden.');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

// ─── SSE event types ─────────────────────────────────────────────────────────

interface SSEStepEvent {
  type: 'step';
  step: number;
  label: string;
}

interface SSEResultEvent {
  type: 'result';
  summary: string;
  themes: string[];
  opportunities: Json[];
  alsoRelevant: Json[];
  pageCount: number | null;
}

interface SSEErrorEvent {
  type: 'error';
  message: string;
}

type SSEEvent = SSEStepEvent | SSEResultEvent | SSEErrorEvent;

// ─── Main upload + analyze function ──────────────────────────────────────────

/**
 * Uploads a schoolplan document and triggers AI analysis via SSE streaming.
 *
 * Flow:
 * 1. Validate file type (PDF, DOCX, TXT only)
 * 2. Upload to Supabase Storage
 * 3. Create/upsert initial DB row (pending status)
 * 4. Stream analysis from serverless function via SSE
 * 5. Update DB row with results on completion
 */
export async function uploadAndAnalyzeSchoolplan(
  schoolId: string,
  teamId: string,
  file: File,
  onProgress: (step: number, label: string) => void,
): Promise<void> {
  // 1. Validate file type
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ACCEPTED_EXTENSIONS.has(ext)) {
    throw new Error(
      'Niet-ondersteund bestandsformaat. Upload een PDF, Word (.docx) of tekst (.txt) bestand.',
    );
  }

  // 2. Upload to Supabase Storage
  const storagePath = `${teamId}/schoolplans/${schoolId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Supabase Storage upload error:', uploadError);
    throw new Error(`Upload mislukt: ${uploadError.message}`);
  }

  // 3. Create initial DB row via upsert (per D-06: one schoolplan per school)
  const { error: upsertError } = await supabase
    .from('schoolplan_analyses')
    .upsert(
      {
        school_id: schoolId,
        file_name: file.name,
        file_path: storagePath,
        page_count: null,
        analysis_status: 'pending',
        summary: '',
        themes: [],
        opportunities: [],
        also_relevant: [],
        opportunity_annotations: {},
        error_message: null,
      },
      { onConflict: 'school_id' },
    );

  if (upsertError) {
    console.error('Supabase DB upsert error:', upsertError);
    throw new Error(`Opslaan mislukt: ${upsertError.message}`);
  }

  // 4. Call serverless function for AI analysis via SSE
  onProgress(1, 'Document wordt samengevat...');

  const headers = await getAuthHeaders();
  const response = await fetch('/api/analyze-schoolplan', {
    method: 'POST',
    headers,
    body: JSON.stringify({ storagePath, fileName: file.name, schoolId }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    // Update status to failed
    await supabase
      .from('schoolplan_analyses')
      .update({
        analysis_status: 'failed',
        error_message: `Server fout: ${response.status} — ${errorBody}`,
      })
      .eq('school_id', schoolId);
    throw new Error(`Analyse mislukt: ${errorBody || `HTTP ${response.status}`}`);
  }

  // 5. Parse SSE stream
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Streaming niet beschikbaar.');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;

        try {
          const event: SSEEvent = JSON.parse(jsonStr);

          if (event.type === 'step') {
            onProgress(event.step, event.label);
          } else if (event.type === 'result') {
            // Update DB row with analysis results
            await supabase
              .from('schoolplan_analyses')
              .update({
                summary: event.summary,
                themes: event.themes,
                opportunities: event.opportunities,
                also_relevant: event.alsoRelevant,
                page_count: event.pageCount,
                analysis_status: 'complete',
                error_message: null,
              })
              .eq('school_id', schoolId);
          } else if (event.type === 'error') {
            await supabase
              .from('schoolplan_analyses')
              .update({
                analysis_status: 'failed',
                error_message: event.message,
              })
              .eq('school_id', schoolId);
            throw new Error(event.message);
          }
        } catch (parseError) {
          // Skip malformed SSE events
          if (parseError instanceof Error && parseError.message !== jsonStr) {
            throw parseError;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
