import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentCountsSchema, type StudentCountsData } from '../schemas/step2-schema.ts';
import {
  SCHOOL_LEVEL_LABELS,
  YEARS_PER_LEVEL,
  type SchoolLevel,
  type CurrentToolUsage,
} from '../../../models/school.ts';
import { SCHOOL_SIZE_PRESETS } from '../../../data/school-profiles.ts';
import { useSchoolProfileStore } from '../store.ts';
import StepContainer from '../../../components/wizard/StepContainer.tsx';
import CurrentToolPerLevel from './CurrentToolPerLevel.tsx';
import { forwardRef, useImperativeHandle, useState } from 'react';
import type { WizardStepRef } from './WizardStep1.tsx';

const WizardStep2 = forwardRef<WizardStepRef>(function WizardStep2(_props, ref) {
  const {
    levels,
    studentCounts,
    setStudentCounts,
    applyPreset,
    currentToolUsage,
    setCurrentToolUsage,
    setCurrentToolUsageMap,
  } = useSchoolProfileStore();
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const buildDefaultValues = (): StudentCountsData => {
    const counts: Record<string, Record<string, number>> = {};
    for (const level of levels) {
      counts[level] = {};
      for (const year of YEARS_PER_LEVEL[level]) {
        counts[level][String(year)] = studentCounts[level]?.[year] ?? 0;
      }
    }
    // Phase 27 R5 — seed currentToolUsage van store (empty {} default uit schema)
    return { studentCounts: counts, currentToolUsage: { ...currentToolUsage } };
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentCountsData>({
    resolver: zodResolver(studentCountsSchema),
    defaultValues: buildDefaultValues(),
  });

  // Phase 27 R5 — watch the per-niveau map so radio-state stays in sync with
  // the form when ouder-component re-renders (store + form dual-source).
  const watchedCurrentToolUsage = watch('currentToolUsage') ?? {};

  const handleCurrentToolUsageChange = (
    level: SchoolLevel,
    val: CurrentToolUsage,
  ) => {
    setValue(`currentToolUsage.${level}`, val, { shouldValidate: false });
    setCurrentToolUsage(level, val);
  };

  const handlePresetClick = (presetId: 'klein' | 'midden' | 'groot') => {
    applyPreset(presetId);
    setActivePreset(presetId);

    // Only fill form values for levels the user selected in step 1.
    // The preset may contain other levels — skip those.
    const preset = SCHOOL_SIZE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    for (const level of levels) {
      const yearCounts = preset.studentCounts[level];
      if (yearCounts) {
        for (const [year, count] of Object.entries(yearCounts)) {
          setValue(`studentCounts.${level}.${year}`, count, { shouldValidate: true });
        }
      }
    }
  };

  useImperativeHandle(ref, () => ({
    submit: () =>
      new Promise<boolean>((resolve) => {
        handleSubmit(
          (data) => {
            // Convert string keys back to number keys for store
            const converted: Partial<Record<SchoolLevel, Record<number, number>>> = {};
            for (const [level, years] of Object.entries(data.studentCounts)) {
              converted[level as SchoolLevel] = {};
              for (const [year, count] of Object.entries(years)) {
                converted[level as SchoolLevel]![Number(year)] = count;
              }
            }
            setStudentCounts(converted);
            // Phase 27 R5 — mirror form's final currentToolUsage to store on
            // submit (defense-in-depth; per-radio onChange already writes-through).
            if (data.currentToolUsage) {
              setCurrentToolUsageMap(data.currentToolUsage);
            }
            resolve(true);
          },
          () => {
            resolve(false);
          },
        )();
      }),
  }));

  // Find max columns needed
  const allYears = levels.map((level) => YEARS_PER_LEVEL[level]);
  const maxYears = Math.max(...allYears.map((y) => y.length), 0);

  return (
    <StepContainer title="Hoeveel leerlingen per leerjaar?">
      {/* Preset buttons */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="text-[14px] font-semibold text-neutral-700">Vul standaard in:</span>
        {SCHOOL_SIZE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handlePresetClick(preset.id)}
            className={`
              text-[14px] font-semibold rounded-md px-3 h-10 min-h-[44px]
              border transition-colors
              ${activePreset === preset.id
                ? 'bg-cito-accent text-white border-cito-accent'
                : 'bg-transparent text-cito-accent border-cito-accent hover:bg-[#fff7ed]'
              }
            `}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Matrix grid */}
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="min-w-[120px] text-left text-[14px] font-semibold text-neutral-700 pb-2" />
              {Array.from({ length: maxYears }, (_, i) => (
                <th
                  key={i}
                  className="text-center text-[14px] font-semibold text-neutral-700 pb-2 px-1"
                >
                  Leerjaar {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {levels.map((level) => (
              <tr key={level}>
                <td className="min-w-[120px] text-left text-[14px] font-semibold text-neutral-700 py-1 pr-3">
                  {SCHOOL_LEVEL_LABELS[level]}
                </td>
                {YEARS_PER_LEVEL[level].map((year) => (
                  <td key={year} className="px-1 py-1">
                    <input
                      type="number"
                      min="0"
                      {...register(`studentCounts.${level}.${String(year)}`, {
                        valueAsNumber: true,
                      })}
                      className={`
                        w-16 h-10 text-center bg-white rounded-md
                        border
                        focus:border-cito-primary focus:border-2 focus:outline-none
                        ${errors.studentCounts?.[level]?.[String(year)]
                          ? 'border-red-600'
                          : 'border-neutral-200'
                        }
                      `}
                    />
                  </td>
                ))}
                {/* Empty cells for levels with fewer years */}
                {Array.from({ length: maxYears - YEARS_PER_LEVEL[level].length }, (_, i) => (
                  <td key={`empty-${i}`} className="px-1 py-1" />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {errors.studentCounts && typeof errors.studentCounts.message === 'string' && (
        <p className="mt-3 text-[14px] text-red-600" role="alert">
          {errors.studentCounts.message}
        </p>
      )}

      {/* Phase 27 R5 — per-niveau huidig-gebruik (Cito / DIA / JIJ! / Mix / Geen).
          Optioneel: blokkeert Next-knop niet (currentToolUsage default {}). */}
      {levels.length > 0 && (
        <CurrentToolPerLevel
          levels={levels}
          value={watchedCurrentToolUsage}
          onChange={handleCurrentToolUsageChange}
        />
      )}
    </StepContainer>
  );
});

export default WizardStep2;
