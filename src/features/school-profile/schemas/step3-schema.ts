import { z } from 'zod';

/**
 * Module selection schema.
 * 0 modules is allowed per CONTEXT.md.
 */
export const moduleSelectionSchema = z.object({
  selectedModules: z.array(z.string()),
});

export type ModuleSelectionData = z.infer<typeof moduleSelectionSchema>;
