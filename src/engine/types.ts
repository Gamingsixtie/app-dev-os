import type { PriceRecord } from '../models/pricing';
import type { Assumption } from '../models/assumptions';
import type { SchoolLevel, Scenario } from '../models/school';
import type { ComparisonResult } from './price-comparison';

export interface SchoolProfile {
  levels: SchoolLevel[];
  studentCounts: Record<string, Record<number, number>>;
  selectedModules: string[];
  scenario: Scenario | null;
}

export interface CalculationInput {
  schoolProfile: SchoolProfile;
  selectedModules: string[];
  prices: PriceRecord[];
  assumptions: Assumption[];
}

/** Phase 2 calculation result - price comparison across providers */
export type CalculationResult = ComparisonResult;
