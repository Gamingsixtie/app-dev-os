import type { SchoolLevel, Scenario } from '../../models/school';

export interface SchoolProfile {
  levels: SchoolLevel[];
  studentCounts: Record<SchoolLevel, Record<number, number>>;
  selectedModules: string[];
  scenario: Scenario | null;
}
