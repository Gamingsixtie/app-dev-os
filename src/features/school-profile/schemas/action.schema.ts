import { z } from 'zod';

export const actionSchema = z.object({
  title: z.string().min(1, 'Titel is verplicht'),
  status: z.enum(['todo', 'in-progress', 'done']).default('todo'),
  conversationId: z.string().nullable().default(null),
  type: z.string().nullable().default(null),
  dueDate: z.string().nullable().default(null),
});

export type ActionFormData = z.infer<typeof actionSchema>;
