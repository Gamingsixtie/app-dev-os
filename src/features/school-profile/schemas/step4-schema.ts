import { z } from 'zod';

const currentProviderEnum = z.enum(['cito-oud', 'cito-nieuw', 'dia', 'jij', 'saqi', 'overig', 'geen']);

export const moduleCurrentSetupSchema = z.object({
  moduleSetups: z.array(
    z.object({
      moduleId: z.string(),
      currentProvider: currentProviderEnum,
      pricePerStudent: z.number().min(0).nullable(),
      customProviderName: z.string().optional(),
    }).refine(
      (data) => data.currentProvider !== 'overig' || (data.customProviderName && data.customProviderName.trim().length > 0),
      { message: 'Vul de naam van de aanbieder in', path: ['customProviderName'] },
    ),
  ),
});

export type ModuleCurrentSetupData = z.infer<typeof moduleCurrentSetupSchema>;
