import { z } from 'zod';
import { SCHOOL_LEVELS } from '../../../models/school';
import { schoolMetaShape } from './school-meta.schema';

/**
 * Phase 27 Plan 03 (R3 + R4) — WizardStep1 form schema.
 *
 * Composes the original schoolName + levels with the shared sales-context
 * shape (`schoolMetaShape`) and re-applies the conditional refine that
 * makes `customSchoolType` required only when `schoolType === 'overig'`.
 */
export const schoolTypeSchema = z
  .object({
    schoolName: z
      .string()
      .min(2, 'Voer een schoolnaam in van minimaal 2 tekens')
      .max(100, 'Schoolnaam mag maximaal 100 tekens bevatten'),
    levels: z
      .array(z.enum(SCHOOL_LEVELS))
      .min(1, 'Selecteer minimaal een niveau om door te gaan'),
    ...schoolMetaShape,
  })
  .refine(
    (d) => d.schoolType !== 'overig' || (!!d.customSchoolType && d.customSchoolType.length > 0),
    { message: 'Vul de naam van het schooltype in', path: ['customSchoolType'] },
  );

export type SchoolTypeData = z.infer<typeof schoolTypeSchema>;
