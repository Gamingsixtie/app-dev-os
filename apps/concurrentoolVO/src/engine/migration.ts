import type { CitoMigrationPriceRecord } from '../data/cito-migration-prices';
import type { TimeSavingResult, TimeSavingTask } from '../models/time-savings';
import { TIME_SAVING_TASKS } from '../models/time-savings';
import { MODULE_CATALOG } from '../models/modules';
import { getTotalStudents } from './price-comparison';

export interface MigrationModuleResult {
  moduleId: string;
  moduleName: string;
  oldPricePerStudent: number;
  newPricePerStudent: number;
  oldTotalCost: number;
  newTotalCost: number;
  /** oldTotalCost - newTotalCost. Positive = new platform is cheaper. */
  annualDifference: number;
}

/**
 * Backward-compat re-export shim (Phase 27 Wave 0).
 *
 * `TimeSavingResult` was relocated to `@/models/time-savings`. This
 * re-export keeps the old import path working for callers that import
 * `TimeSavingResult` from `@/engine/migration`. Plan 27-10 removes the
 * shim and forces callers to use `@/models/time-savings` directly.
 */
export type { TimeSavingResult } from '../models/time-savings';

export interface MultiYearProjectionEntry {
  year: 1 | 3;
  cumulativeSavings: number;
}

export interface MigrationResult {
  modules: MigrationModuleResult[];
  totalOldCost: number;
  totalNewCost: number;
  /** totalOldCost - totalNewCost. Positive = new platform is cheaper. */
  financialDifference: number;
  timeSavings: TimeSavingResult[];
  totalTimeSavingsHours: number;
  totalTimeSavingsValue: number;
  /** financialDifference + totalTimeSavingsValue */
  totalAnnualValue: number;
  multiYearProjection: MultiYearProjectionEntry[];
  switchingCosts: number;
  breakEvenMonth: number | null;
}

/**
 * Compute the break-even month: how many months until switching costs are recovered.
 * Returns 0 if no switching costs, null if value never breaks even.
 */
function computeBreakEvenMonth(totalAnnualValue: number, switchingCosts: number): number | null {
  if (switchingCosts <= 0) return 0;
  if (totalAnnualValue <= 0) return null;
  return Math.ceil((switchingCosts / totalAnnualValue) * 12);
}

/**
 * Pure function: calculate the business case for migrating from old to new Cito platform.
 * Does not modify any external state.
 *
 * @param selectedModules   Module IDs selected by the user
 * @param studentCounts     Student counts per level/year
 * @param migrationPrices   Old vs new Cito prices per module
 * @param timeSavingOverrides  taskId → hours/year override (consultant-entered). null = task skipped/unknown.
 * @param hourlyRate        Value per hour saved (null = unknown)
 * @param switchingCosts    One-time switching costs (default: 0)
 */
export function calculateMigration(
  selectedModules: string[],
  studentCounts: Partial<Record<string, Record<number, number>>>,
  migrationPrices: CitoMigrationPriceRecord[],
  timeSavingOverrides: Record<string, number | null>,
  hourlyRate: number | null,
  switchingCosts: number = 0,
  customTasks: TimeSavingTask[] = [],
  hiddenTaskIds: string[] = [],
): MigrationResult {
  const totalStudents = getTotalStudents(studentCounts);

  const modules: MigrationModuleResult[] = selectedModules
    .map((moduleId) => {
      const priceRecord = migrationPrices.find((p) => p.moduleId === moduleId);
      if (!priceRecord) return null;

      const moduleDef = MODULE_CATALOG.find((m) => m.id === moduleId);
      const moduleName = moduleDef?.name ?? moduleId;

      const oldTotalCost = priceRecord.oldPricePerStudent * totalStudents;
      const newTotalCost = priceRecord.newPricePerStudent * totalStudents;

      return {
        moduleId,
        moduleName,
        oldPricePerStudent: priceRecord.oldPricePerStudent,
        newPricePerStudent: priceRecord.newPricePerStudent,
        oldTotalCost,
        newTotalCost,
        annualDifference: oldTotalCost - newTotalCost,
      };
    })
    .filter((m): m is MigrationModuleResult => m !== null);

  const totalOldCost = modules.reduce((sum, m) => sum + m.oldTotalCost, 0);
  const totalNewCost = modules.reduce((sum, m) => sum + m.newTotalCost, 0);
  const financialDifference = totalOldCost - totalNewCost;

  const effectiveRate = hourlyRate ?? 0;

  const hiddenSet = new Set(hiddenTaskIds);
  const allTasks = [...TIME_SAVING_TASKS, ...customTasks].filter((t) => !hiddenSet.has(t.id));

  const timeSavings: TimeSavingResult[] = allTasks.map((task) => {
    // If the task has an explicit override, use it (including null = skipped).
    // If no override exists for this task, use the default hours.
    const hasOverride = task.id in timeSavingOverrides;
    const hoursPerYear = hasOverride ? timeSavingOverrides[task.id] : task.defaultHoursPerYear;
    return {
      taskId: task.id,
      taskLabel: task.label,
      oldMethodLabel: task.oldMethodLabel,
      newMethodLabel: task.newMethodLabel,
      hoursPerYear,
      valuePerYear: (hoursPerYear ?? 0) * effectiveRate,
    };
  });

  const totalTimeSavingsHours = timeSavings.reduce((sum, t) => sum + (t.hoursPerYear ?? 0), 0);
  const totalTimeSavingsValue = timeSavings.reduce((sum, t) => sum + t.valuePerYear, 0);
  const totalAnnualValue = financialDifference + totalTimeSavingsValue;

  const multiYearProjection: MultiYearProjectionEntry[] = [
    { year: 1, cumulativeSavings: totalAnnualValue },
    { year: 3, cumulativeSavings: totalAnnualValue * 3 },
  ];

  return {
    modules,
    totalOldCost,
    totalNewCost,
    financialDifference,
    timeSavings,
    totalTimeSavingsHours,
    totalTimeSavingsValue,
    totalAnnualValue,
    multiYearProjection,
    switchingCosts,
    breakEvenMonth: computeBreakEvenMonth(totalAnnualValue, switchingCosts),
  };
}
