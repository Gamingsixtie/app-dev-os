import type { Assumption } from '../models/assumptions';

export const DEFAULT_ASSUMPTIONS: Assumption[] = [
  {
    id: 'uurtarief',
    label: 'Uurtarief',
    description: 'Gemiddeld uurtarief docent (o.b.v. CAO VO)',
    defaultValue: 50,
    currentValue: 50,
    unit: 'euro/uur',
    category: 'financieel',
  },
];
