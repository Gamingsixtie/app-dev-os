/**
 * Client-side helper for AI price normalization.
 *
 * Calls the /api/normalize-price serverless function to normalize
 * free-form price text into structured module-ID + provider + amount.
 *
 * Used by PriceProposalModal (D-12) and future ops-competitor-intel skill (D-16).
 */

import { supabase } from '@/lib/supabase/client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface NormalizedPrice {
  moduleId: string;
  provider: string;
  amountPerStudent: number;
  confidence: 'high' | 'medium' | 'low';
  warning?: string;
}

export interface NormalizedPriceResult {
  prices: NormalizedPrice[];
  unmatched: string[];
}

// ─── Auth helper (inline to avoid circular import) ──────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Niet ingelogd. Log opnieuw in.');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

// ─── Main function ──────────────────────────────────────────────────────────

/**
 * Normalize free-form price text to structured pricing data.
 *
 * @param text Free-form text containing pricing information
 * @returns Structured result with matched prices and unmatched segments
 * @throws Error when API call fails or user is not authenticated
 */
export async function normalizePrice(text: string): Promise<NormalizedPriceResult> {
  const headers = await getAuthHeaders();

  const response = await fetch('/api/normalize-price', {
    method: 'POST',
    headers,
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error('Normalisatie mislukt');
  }

  return response.json();
}
