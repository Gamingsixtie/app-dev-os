import { useMemo } from 'react';
import { useSchoolProfileStore } from '../school-profile/store';
import { usePriceComparisonStore } from './store';
import { calculateMigration } from '@/engine/migration';
import { CITO_MIGRATION_PRICES } from '@/data/cito-migration-prices';
import { TimeSavingsSection } from '../school-profile/components/TimeSavingsSection';
import { updateSchoolData } from '@/db/operations';

// ─── Tijdwinst sectie (interactief) ─────────────────────────────────────────

function ComparisonTimeSavings() {
  const activeSchoolId = useSchoolProfileStore((s) => s.activeSchoolId);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);
  const migrationHourlyRate = usePriceComparisonStore(
    (s) => s.migrationHourlyRate,
  );
  const migrationTimeSavingOverrides = usePriceComparisonStore(
    (s) => s.migrationTimeSavingOverrides,
  );
  const customTimeSavingTasks = usePriceComparisonStore(
    (s) => s.customTimeSavingTasks,
  );
  const hiddenTimeSavingTaskIds = usePriceComparisonStore(
    (s) => s.hiddenTimeSavingTaskIds,
  );
  const setMigrationHourlyRate = usePriceComparisonStore(
    (s) => s.setMigrationHourlyRate,
  );
  const setMigrationTimeSavingOverride = usePriceComparisonStore(
    (s) => s.setMigrationTimeSavingOverride,
  );
  const addCustomTimeSavingTask = usePriceComparisonStore(
    (s) => s.addCustomTimeSavingTask,
  );
  const removeCustomTimeSavingTask = usePriceComparisonStore(
    (s) => s.removeCustomTimeSavingTask,
  );
  const updateCustomTimeSavingTask = usePriceComparisonStore(
    (s) => s.updateCustomTimeSavingTask,
  );
  const toggleHiddenTimeSavingTask = usePriceComparisonStore(
    (s) => s.toggleHiddenTimeSavingTask,
  );

  const migrationResult = useMemo(
    () =>
      calculateMigration(
        selectedModules,
        studentCounts,
        CITO_MIGRATION_PRICES,
        migrationTimeSavingOverrides,
        migrationHourlyRate,
        0,
        customTimeSavingTasks,
        hiddenTimeSavingTaskIds,
      ),
    [selectedModules, studentCounts, migrationTimeSavingOverrides, migrationHourlyRate, customTimeSavingTasks, hiddenTimeSavingTaskIds],
  );

  const handleHourlyRateChange = (rate: number | null) => {
    setMigrationHourlyRate(rate);
    if (activeSchoolId) {
      updateSchoolData(activeSchoolId, { migrationHourlyRate: rate ?? 0 });
    }
  };

  const handleHoursChange = (taskId: string, hours: number | null) => {
    setMigrationTimeSavingOverride(taskId, hours);
    if (activeSchoolId) {
      const updated = { ...migrationTimeSavingOverrides, [taskId]: hours };
      updateSchoolData(activeSchoolId, { migrationTimeSavingOverrides: updated });
    }
  };

  return (
    <TimeSavingsSection
      timeSavings={migrationResult.timeSavings}
      totalHours={migrationResult.totalTimeSavingsHours}
      totalValue={migrationResult.totalTimeSavingsValue}
      hourlyRate={migrationHourlyRate}
      hiddenTaskIds={hiddenTimeSavingTaskIds}
      customTasks={customTimeSavingTasks}
      onHoursChange={handleHoursChange}
      onHourlyRateChange={handleHourlyRateChange}
      onAddCustomTask={addCustomTimeSavingTask}
      onRemoveCustomTask={removeCustomTimeSavingTask}
      onUpdateCustomTask={updateCustomTimeSavingTask}
      onToggleHidden={toggleHiddenTimeSavingTask}
    />
  );
}

// ─── Main panel ─────────────────────────────────────────────────────────────

export function MeerwaardePanel() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-shrink-0 w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-600"
            aria-hidden="true"
          >
            <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-emerald-800">
            Meerwaarde — meer dan alleen prijs
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Kwalitatieve voordelen en tijdwinst
          </p>
        </div>
      </div>

      {/* Invulbare tijdwinst */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">
          Tijdwinst Cito-platform
        </h3>
        <p className="text-xs text-neutral-500 mb-3">
          Vul samen met de klant de geschatte tijdwinst per taak in. Optioneel:
          voeg een uurtarief toe om de besparing in euro's te zien.
        </p>
        <ComparisonTimeSavings />
      </div>
    </div>
  );
}
