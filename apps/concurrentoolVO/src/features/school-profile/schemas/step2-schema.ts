import { z } from 'zod';
import { SCHOOL_LEVELS, CURRENT_TOOL_USAGE_VALUES } from '@/models/school';

/**
 * Validates student counts as Record<SchoolLevel, Record<number, number>>
 * where all values are >= 0.
 *
 * Phase 27 Plan 05 (R5) — extended with `currentToolUsage`: optioneel per
 * niveau (Cito / DIA / JIJ! / Mix / Geen). `.default({})` zodat de Next-knop
 * niet blokkeert wanneer de gebruiker niets invult (acceptance criterion).
 */
export const studentCountsSchema = z.object({
  studentCounts: z.record(
    z.string(),
    z.record(
      z.string(),
      z.number().min(0, 'Vul voor elk leerjaar een geldig leerlingaantal in (0 of hoger)'),
    ),
  ),
  currentToolUsage: z
    .partialRecord(
      z.enum(SCHOOL_LEVELS),
      z.enum(CURRENT_TOOL_USAGE_VALUES),
    )
    .default({}),
});

/**
 * Use z.input so optional `.default({})` fields aren't required on form
 * defaultValues (matches Phase 8 pattern for Zod v4 input vs output types).
 */
export type StudentCountsData = z.input<typeof studentCountsSchema>;
