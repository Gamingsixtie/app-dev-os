import { z } from 'zod';

export const scenarioSchema = z.object({
  scenario: z.enum(['A', 'B', 'C'], {
    message: 'Selecteer een scenario om door te gaan',
  }),
});

export type ScenarioData = z.infer<typeof scenarioSchema>;
