import { z } from 'zod';

/**
 * Validates student counts as Record<SchoolLevel, Record<number, number>>
 * where all values are >= 0.
 */
export const studentCountsSchema = z.object({
  studentCounts: z.record(
    z.string(),
    z.record(
      z.string(),
      z.number().min(0, 'Vul voor elk leerjaar een geldig leerlingaantal in (0 of hoger)'),
    ),
  ),
});

export type StudentCountsData = z.infer<typeof studentCountsSchema>;
