import { z } from 'zod';
import {
  CUSTOMER_TYPES,
  SCHOOL_TYPES,
  GROWTH_TRAJECTORIES,
} from '@/models/school';

/**
 * Phase 27 Plan 03 (R3 + R4) — shared sales-context Zod schema.
 *
 * Captures the three Step 1 fields beyond schoolName + levels:
 *   - customerType (R3): Cito-klant onderscheid — drives Plan 10 (R10)
 *     Upsell-scenario visibility in Stap 5.
 *   - schoolType + customSchoolType (R4): schoolsoort-variant; free-text
 *     label only when schoolType === 'overig'.
 *   - growthTrajectory (R4): groei/krimp/stabiel/loting — sales-context
 *     for stichting-rapportages.
 *
 * Merged into step1-schema via .merge(schoolMetaSchema). The refine() on
 * schoolType=overig keeps customSchoolType conditionally required without
 * making the field globally mandatory.
 */

export const customerTypeSchema = z.enum(CUSTOMER_TYPES);
export const schoolTypeEnum = z.enum(SCHOOL_TYPES);
export const growthTrajectorySchema = z.enum(GROWTH_TRAJECTORIES);

/**
 * Plain object schema (exported separately) so callers can `.extend()` it onto
 * existing object schemas (e.g. step1-schema). Applying `.refine()` here would
 * turn the schema into a `ZodEffects` instance, which is not extendable. The
 * conditional-required check on customSchoolType is applied at the step level.
 */
export const schoolMetaShape = {
  customerType: customerTypeSchema,
  schoolType: schoolTypeEnum,
  // Max 50 chars per T-27-03-01 mitigation (PDF render injection bound)
  customSchoolType: z.string().max(50, 'Maximaal 50 tekens').optional(),
  growthTrajectory: growthTrajectorySchema,
};

export const schoolMetaSchema = z
  .object(schoolMetaShape)
  .refine(
    (d) => d.schoolType !== 'overig' || (!!d.customSchoolType && d.customSchoolType.length > 0),
    { message: 'Vul de naam van het schooltype in', path: ['customSchoolType'] },
  );

export type SchoolMetaData = z.infer<typeof schoolMetaSchema>;
