import { forwardRef } from 'react';
import { SCHOOL_TYPES, SCHOOL_TYPE_LABELS, type SchoolType } from '@/models/school';

/**
 * Phase 27 Plan 03 (R4) — schoolsoort + optioneel custom-label.
 *
 * Stateless. Native `<select>` met 6 opties (SCHOOL_TYPE_LABELS). Wanneer
 * `value === 'overig'` rendert een extra free-text input voor `customSchoolType`
 * (max 50 chars per T-27-03-01 threat-mitigation in plan-frontmatter).
 */

export interface SchoolTypeFieldsProps {
  /** react-hook-form register-spread voor `schoolType` */
  selectRegisterProps: React.SelectHTMLAttributes<HTMLSelectElement> & { name: string };
  /** react-hook-form register-spread voor `customSchoolType` (alleen gebruikt als value==='overig') */
  customInputRegisterProps: React.InputHTMLAttributes<HTMLInputElement> & { name: string };
  /** Huidig geselecteerd schoolType — bepaalt of het custom-veld zichtbaar is */
  value: SchoolType | null | undefined;
  /** Validation error voor schoolType */
  schoolTypeError?: string;
  /** Validation error voor customSchoolType (alleen relevant bij value==='overig') */
  customSchoolTypeError?: string;
}

const SchoolTypeFields = forwardRef<HTMLDivElement, SchoolTypeFieldsProps>(
  function SchoolTypeFields(
    {
      selectRegisterProps,
      customInputRegisterProps,
      value,
      schoolTypeError,
      customSchoolTypeError,
    },
    ref,
  ) {
    const showCustomInput = value === 'overig';
    return (
      <div ref={ref} className="mb-6">
        <label
          htmlFor="schoolType"
          className="block text-sm font-semibold text-neutral-700 mb-1.5"
        >
          Schoolsoort:
        </label>
        <select
          id="schoolType"
          {...selectRegisterProps}
          className={`
            w-full h-[44px] px-4 text-base border rounded-lg bg-white
            focus:outline-none focus:ring-2 focus:ring-cito-primary/20 focus:border-cito-primary
            ${schoolTypeError ? 'border-red-400' : 'border-neutral-200'}
          `}
        >
          <option value="">Maak een keuze...</option>
          {SCHOOL_TYPES.map((option) => (
            <option key={option} value={option}>
              {SCHOOL_TYPE_LABELS[option]}
            </option>
          ))}
        </select>
        {schoolTypeError && (
          <p className="mt-1 text-[14px] text-red-600" role="alert">
            {schoolTypeError}
          </p>
        )}

        {showCustomInput && (
          <div className="mt-3">
            <label
              htmlFor="customSchoolType"
              className="block text-sm font-semibold text-neutral-700 mb-1.5"
            >
              Naam van het schooltype
            </label>
            <input
              id="customSchoolType"
              type="text"
              maxLength={50}
              placeholder="Bijv. Technasium"
              {...customInputRegisterProps}
              className={`
                w-full h-[44px] px-4 text-base border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-cito-primary/20 focus:border-cito-primary
                ${customSchoolTypeError ? 'border-red-400' : 'border-neutral-200'}
              `}
            />
            {customSchoolTypeError && (
              <p className="mt-1 text-[14px] text-red-600" role="alert">
                {customSchoolTypeError}
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);

export default SchoolTypeFields;
