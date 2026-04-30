import { z } from 'zod';
import { SCHOOL_LEVELS } from '../../../models/school';

export const schoolTypeSchema = z.object({
  schoolName: z.string()
    .min(2, 'Voer een schoolnaam in van minimaal 2 tekens')
    .max(100, 'Schoolnaam mag maximaal 100 tekens bevatten'),
  levels: z.array(z.enum(SCHOOL_LEVELS))
    .min(1, 'Selecteer minimaal een niveau om door te gaan'),
});

export type SchoolTypeData = z.infer<typeof schoolTypeSchema>;
