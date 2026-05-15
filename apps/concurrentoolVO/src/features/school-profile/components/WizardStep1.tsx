import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { schoolTypeSchema, type SchoolTypeData } from '../schemas/step1-schema';
import { SCHOOL_LEVELS, SCHOOL_LEVEL_LABELS } from '../../../models/school';
import { useSchoolProfileStore } from '../store';
import { updateSchoolData } from '@/db/operations';
import { uniqueSlug } from '@/lib/slugify';
import StepContainer from '../../../components/wizard/StepContainer';
import { useImperativeHandle, forwardRef } from 'react';
import CustomerTypeRadio from './CustomerTypeRadio';
import SchoolTypeFields from './SchoolTypeFields';
import GrowthTrajectoryRadio from './GrowthTrajectoryRadio';

export interface WizardStepRef {
  submit: () => Promise<boolean>;
}

const WizardStep1 = forwardRef<WizardStepRef>(function WizardStep1(_props, ref) {
  const {
    levels,
    schoolName,
    activeSchoolId,
    customerType,
    schoolType,
    customSchoolType,
    growthTrajectory,
    setLevels,
    setSchoolName,
    setCustomerType,
    setSchoolType,
    setCustomSchoolType,
    setGrowthTrajectory,
  } = useSchoolProfileStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SchoolTypeData>({
    resolver: zodResolver(schoolTypeSchema),
    defaultValues: {
      schoolName: schoolName,
      levels: levels,
      customerType: customerType ?? undefined,
      schoolType: schoolType ?? undefined,
      customSchoolType: customSchoolType ?? '',
      growthTrajectory: growthTrajectory ?? undefined,
    },
  });

  // Reactive watch so the conditional `customSchoolType` input toggles
  // immediately when the user picks `overig` (Phase 27 R4 D-17 sub-component).
  const watchedSchoolType = watch('schoolType');

  useImperativeHandle(ref, () => ({
    submit: () =>
      new Promise<boolean>((resolve) => {
        handleSubmit(
          async (data) => {
            setLevels(data.levels);
            setSchoolName(data.schoolName);
            // Phase 27 Plan 03 — persist R3 + R4 fields to store. WizardShell's
            // auto-save flow (handleNext) writes the new store state to Supabase.
            setCustomerType(data.customerType);
            setSchoolType(data.schoolType);
            setCustomSchoolType(
              data.schoolType === 'overig' ? data.customSchoolType ?? null : null,
            );
            setGrowthTrajectory(data.growthTrajectory);

            // Update slug and name in Dexie if school name changed
            if (activeSchoolId && data.schoolName !== schoolName) {
              const newSlug = await uniqueSlug(data.schoolName, activeSchoolId);
              await updateSchoolData(activeSchoolId, {
                slug: newSlug,
                name: data.schoolName,
              });
            }

            resolve(true);
          },
          () => {
            resolve(false);
          },
        )();
      }),
  }));

  return (
    <StepContainer title="Schoolgegevens en niveaus">
      {/* School name field */}
      <div className="mb-6">
        <label htmlFor="schoolName" className="block text-sm font-semibold text-neutral-700 mb-1.5">
          Schoolnaam
        </label>
        <input
          id="schoolName"
          type="text"
          placeholder="Bijv. Montessori College Oost"
          {...register('schoolName')}
          className={`
            w-full h-[44px] px-4 text-base border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-cito-primary/20 focus:border-cito-primary
            ${errors.schoolName ? 'border-red-400' : 'border-neutral-200'}
          `}
        />
        {errors.schoolName && (
          <p className="mt-1 text-[14px] text-red-600" role="alert">
            {errors.schoolName.message}
          </p>
        )}
      </div>

      {/* Level checkboxes */}
      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
        Welke niveaus biedt uw school aan?
      </label>
      <div className="space-y-0 mb-6">
        {SCHOOL_LEVELS.map((level) => (
          <label
            key={level}
            className="flex items-center w-full h-12 px-4 cursor-pointer hover:bg-neutral-50 rounded-md"
          >
            <input
              type="checkbox"
              value={level}
              {...register('levels')}
              className="
                w-5 h-5 rounded border-2 border-neutral-200
                checked:bg-cito-primary checked:border-cito-primary
                focus:ring-2 focus:ring-cito-primary focus:ring-offset-2
                cursor-pointer accent-cito-primary
              "
            />
            <span className="ml-3 text-base text-neutral-900">
              {SCHOOL_LEVEL_LABELS[level]}
            </span>
          </label>
        ))}
      </div>

      {errors.levels && (
        <p className="mt-3 text-[14px] text-red-600" role="alert">
          {errors.levels.message}
        </p>
      )}

      {/* Phase 27 R3 — Customer type */}
      <CustomerTypeRadio
        registerProps={register('customerType')}
        value={customerType}
        error={errors.customerType?.message}
      />

      {/* Phase 27 R4 — Schoolsoort + optional custom label */}
      <SchoolTypeFields
        selectRegisterProps={register('schoolType')}
        customInputRegisterProps={register('customSchoolType')}
        value={watchedSchoolType ?? schoolType}
        schoolTypeError={errors.schoolType?.message}
        customSchoolTypeError={errors.customSchoolType?.message}
      />

      {/* Phase 27 R4 — Growth trajectory */}
      <GrowthTrajectoryRadio
        registerProps={register('growthTrajectory')}
        value={growthTrajectory}
        error={errors.growthTrajectory?.message}
      />
    </StepContainer>
  );
});

export default WizardStep1;
