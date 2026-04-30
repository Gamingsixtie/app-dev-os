/**
 * Extended intake extraction schema (V2).
 * Adds contact persons, action items, and pipeline signals
 * to the base extraction schema for richer AI-powered intake.
 *
 * Hardened against all known Claude output quirks:
 * - null for any field (arrays, strings, numbers, enums)
 * - string numbers ("450" → 450)
 * - empty strings ("" → undefined for optional fields)
 * - missing fields (defaults applied)
 */

import { z } from 'zod';

// ---- Shared constants ----

export const MODULE_IDS = [
  'rekenwiskunde',
  'nederlands',
  'engels',
  'taalverzorging',
  'sociaal-emotioneel',
  'cognitieve-capaciteiten',
  'leer-werkhouding',
  'frans',
  'duits',
  'spaans',
] as const;

export const SCHOOL_LEVELS = ['vmbo-b', 'vmbo-k', 'vmbo-gt', 'havo', 'vwo'] as const;

export const PROVIDERS = ['cito-oud', 'cito-nieuw', 'dia', 'jij', 'overig', 'geen'] as const;

// ---- Helpers: accept AI quirks and normalize ----

// null | string | number → number (null → 0, "450" → 450)
const coerceNumber = z.preprocess(
  (v) => (v === null ? 0 : typeof v === 'string' ? Number(v) : v),
  z.number(),
);

// null | string | number → number | null ("450" → 450, null stays null)
const coerceNumberNullable = z.preprocess(
  (v) => (typeof v === 'string' ? Number(v) : v),
  z.number().nullable(),
);

// null | "" | undefined | string → string | undefined (strips null and empty strings)
const optStr = z.preprocess(
  (v) => {
    if (v === null || v === undefined) return undefined;
    if (typeof v === 'string' && v.trim() === '') return undefined;
    return v;
  },
  z.string().optional(),
);

// null | undefined | enum → enum | undefined (strips null)
function optEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess((v) => v === null ? undefined : v, z.enum(values).optional());
}

// null | undefined | array → array (null → [])
function safeArray<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((v) => v ?? [], z.array(schema));
}

// ---- V2 Schema ----

export const IntakeExtractionSchemaV2 = z.object({
  // --- V1 fields ---
  levels: safeArray(z.enum(SCHOOL_LEVELS)),
  studentCountsPerLevel: z.preprocess(
    (v) => v ?? null,
    z.record(z.string(), coerceNumber).nullable(),
  ),
  // Per-year counts: { "havo": { "1": 150, "2": 140 } } — preferred over per-level totals
  studentCountsPerYear: z.preprocess(
    (v) => v ?? null,
    z.record(z.string(), z.record(z.string(), coerceNumber)).nullable(),
  ).optional(),
  selectedModules: safeArray(z.enum(MODULE_IDS)),
  moduleSetups: safeArray(z.object({
    moduleId: z.enum(MODULE_IDS),
    currentProvider: z.enum(PROVIDERS),
    pricePerStudent: coerceNumberNullable,
    customProviderName: optStr,
  })),
  unsureAbout: safeArray(z.string()),

  // --- V2 additions ---
  contactPersonen: safeArray(z.object({
    naam: z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string()),
    rol: optStr,
    dmuPositie: optEnum(['coordinator', 'mt', 'finance', 'it', 'onbekend'] as const),
    email: optStr,
    telefoon: optStr,
  })).default([]),

  actiePunten: safeArray(z.object({
    wat: z.preprocess((v) => (v === null || v === undefined ? '' : v), z.string()),
    wanneer: optStr,
    verantwoordelijke: optStr,
  })).default([]),

  pipelineSignaal: optEnum([
    'interesse',
    'twijfel',
    'afwijzing',
    'concurrent-switch',
    'verlenging',
    'neutraal',
  ] as const),
});

export type IntakeExtractionV2 = z.infer<typeof IntakeExtractionSchemaV2>;
