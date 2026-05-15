/**
 * Zod schema for the Stichting create/edit form (Phase 27 Plan 02 R1).
 *
 * Used with react-hook-form's `zodResolver`. Dutch error messages per
 * app-rule (all UI text in Dutch, all code in English).
 */
import { z } from 'zod';

export const stichtingFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Naam moet minimaal 2 tekens bevatten')
    .max(100, 'Naam mag maximaal 100 tekens bevatten')
    .trim(),
  region: z
    .string()
    .max(100, 'Regio mag maximaal 100 tekens bevatten')
    .default('')
    .optional(),
});

export type StichtingFormInput = z.input<typeof stichtingFormSchema>;
export type StichtingFormValues = z.output<typeof stichtingFormSchema>;
