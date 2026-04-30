import { z } from 'zod';

/**
 * Zod schema for the PriceEditModal form.
 * Supports both publication (bruto) and agreed (netto) price types
 * per D-09 and D-10.
 */
export const priceEntrySchema = z.object({
  moduleId: z.string().min(1, 'Module is verplicht'),
  provider: z.string().min(1, 'Aanbieder is verplicht'),
  amount: z
    .number({ error: 'Bedrag is verplicht' })
    .positive('Bedrag moet positief zijn'),
  priceType: z.enum(['publication', 'agreed']),
  discountPercentage: z.number().min(0).max(100).default(0),
  source: z.string().default(''),
  verifiedAt: z.string().nullable().default(null),
  note: z.string().default(''),
});

export type PriceEntryFormInput = z.input<typeof priceEntrySchema>;
