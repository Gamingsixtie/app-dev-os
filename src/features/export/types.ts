import type { ComparisonResult } from '@/engine/price-comparison';
import type { MigrationResult } from '@/engine/migration';
import type { DmuAssumption } from '@/data/dmu-assumptions';
import type { CitoProductAdvantage } from '@/data/cito-product-info';
import type { DmuTag } from './utils/dmu-tag-filter';

export type ReportType = 'prijsvergelijking' | 'waarderapport' | 'gecombineerd';

export type DmuTarget = 'coordinator' | 'mt' | 'finance' | 'generiek';

export interface ExportConfig {
  reportType: ReportType;
  dmuTarget: DmuTarget;
  assumptionOverrides?: Record<string, string>;
}

export interface ReportData {
  schoolName: string;
  date: string;
  selectedModules: string[];
  totalStudents: number;
  comparison: ComparisonResult | null;
  migration: MigrationResult | null;
  priceDifference: number | null;
  dmuAssumptions?: DmuAssumption[];
  productAdvantages?: CitoProductAdvantage[];
  schoolplanOpportunities?: Array<{
    theme: string;
    citoProduct: string;
    explanation: string;
    status: 'open' | 'besproken' | 'niet-relevant';
    tags?: DmuTag[];
  }>;
}
