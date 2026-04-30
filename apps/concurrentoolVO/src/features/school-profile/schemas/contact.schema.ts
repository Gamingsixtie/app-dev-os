import { z } from 'zod';
import { DMU_POSITIONS, PREFERRED_CHANNELS, AUTHORITY_LEVELS } from '@/models/school';

export const contactSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  dmuPosition: z.enum(DMU_POSITIONS, { error: 'DMU-positie is verplicht' }),
  jobTitle: z.string().default(''),
  email: z.string().email('Ongeldig e-mailadres').or(z.literal('')).default(''),
  phone: z.string().default(''),
  preferredChannel: z.enum(PREFERRED_CHANNELS).default('email'),
  authority: z.enum(AUTHORITY_LEVELS).default('adviserend'),
  notes: z.string().default(''),
  isPrimary: z.boolean().default(false),
});

export type ContactFormData = z.infer<typeof contactSchema>;
