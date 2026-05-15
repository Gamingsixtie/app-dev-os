/**
 * Zod schemas for AI Excel-import (Phase 26-04).
 *
 * Single source of truth: reuses the canonical pricing-config schemas from
 * `src/features/admin/schemas/pricing-config.schema.ts`. We re-export them under
 * "import" aliases so callers can express intent (this is the shape the AI must
 * produce for a given provider).
 *
 * Used by:
 * - api/ai-price-import.ts (server) — optional validation hook (server only
 *   validates the request envelope; per-shape validation runs on the client).
 * - src/features/pricing/import/ai-price-import-client.ts (client) — validates
 *   the AI response BEFORE showing the diff.
 *
 * Decision D-08 / D-11 (CONTEXT.md): single-provider per upload; AI prompt is
 * scoped to one provider; the matching schema is selected via PROVIDER_IMPORT_SCHEMAS.
 */

import type { z } from 'zod';
import {
  flatConfigSchema,
  tieredLicenseConfigSchema,
  packageBundleConfigSchema,
  platformModuleConfigSchema,
} from '@/features/admin/schemas/pricing-config.schema';

// Re-export named schemas under "import" aliases so callers know the intent.
export const CitoImportSchema = platformModuleConfigSchema;
export const DiaImportSchema = packageBundleConfigSchema;
export const JijImportSchema = tieredLicenseConfigSchema;
export const SaqiImportSchema = flatConfigSchema;

export type ProviderImportKey = 'cito' | 'dia' | 'jij' | 'saqi';

export const PROVIDER_IMPORT_SCHEMAS = {
  cito: CitoImportSchema,
  dia: DiaImportSchema,
  jij: JijImportSchema,
  saqi: SaqiImportSchema,
} as const satisfies Record<ProviderImportKey, z.ZodSchema>;

export interface ProviderImportResult {
  /** Shape conforms to PROVIDER_IMPORT_SCHEMAS[provider]._output. */
  proposed: unknown;
  /** Optional NL-language note from the AI on ambiguities. */
  notes?: string;
}
