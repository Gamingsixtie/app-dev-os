/**
 * Client-side document upload orchestration.
 * Uploads file to Supabase Storage, then calls the serverless function
 * for AI-powered price extraction.
 */

import { supabase } from '@/lib/supabase/client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ExtractedDocumentPrice {
  moduleId: string;
  provider: string;
  amount: number;
  source: string;
  priceType: 'publication' | 'agreed';
}

// ─── Accepted file extensions ───────────────────────────────────────────────

const ACCEPTED_EXTENSIONS = new Set([
  'pdf', 'xlsx', 'xls', 'docx', 'csv', 'txt',
]);

// ─── Auth helper (inline to avoid circular import) ──────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Niet ingelogd. Log opnieuw in om documenten te uploaden.');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

// ─── Main upload + extract function ─────────────────────────────────────────

/**
 * Uploads a document to Supabase Storage and calls the serverless
 * extract-document endpoint for AI price extraction.
 *
 * Flow: client upload -> Supabase Storage -> serverless downloads & parses -> Claude Haiku -> structured prices
 * This avoids Vercel's 4.5MB body size limit (per D-14, Research Pitfall 1).
 */
export async function uploadAndExtract(
  schoolId: string,
  teamId: string,
  file: File,
): Promise<ExtractedDocumentPrice[]> {
  // Validate file type
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ACCEPTED_EXTENSIONS.has(ext)) {
    throw new Error(
      'Niet-ondersteund bestandsformaat. Upload een PDF, Excel, Word of CSV bestand.',
    );
  }

  // Upload to Supabase Storage
  const path = `${teamId}/${schoolId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error('Upload mislukt. Controleer uw internetverbinding en probeer opnieuw.');
  }

  // Call serverless function for extraction
  const headers = await getAuthHeaders();
  const response = await fetch('/api/extract-document', {
    method: 'POST',
    headers,
    body: JSON.stringify({ storagePath: path, fileName: file.name }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Extractie mislukt');
  }

  return response.json();
}
