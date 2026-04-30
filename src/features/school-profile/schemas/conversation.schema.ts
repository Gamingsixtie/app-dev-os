import { z } from 'zod';

export const conversationSchema = z.object({
  date: z.string().min(1, 'Datum is verplicht'),
  contactId: z.string().min(1, 'Contactpersoon is verplicht'),
  content: z.string().min(1, 'Inhoud is verplicht'),
  tags: z.array(z.string()).default([]),
});

export type ConversationFormData = z.infer<typeof conversationSchema>;
