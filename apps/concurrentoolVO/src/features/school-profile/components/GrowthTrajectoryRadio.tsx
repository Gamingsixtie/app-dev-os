import { forwardRef } from 'react';
import {
  GROWTH_TRAJECTORIES,
  GROWTH_TRAJECTORY_LABELS,
  type GrowthTrajectory,
} from '@/models/school';

/**
 * Phase 27 Plan 03 (R4) — radio-group voor groei-trajectorie.
 *
 * Stateless: ouder controleert `value` (via react-hook-form `register`).
 * Bevat alle 4 opties uit `GROWTH_TRAJECTORIES`. Dutch labels (locked).
 * ARIA: wrapping `<fieldset>` + `<legend>` levert group-semantiek.
 */

export interface GrowthTrajectoryRadioProps {
  /** react-hook-form register-spread (`{...register('growthTrajectory')}`) */
  registerProps: React.InputHTMLAttributes<HTMLInputElement> & { name: string };
  /** Current selected value — drives the `checked` state */
  value: GrowthTrajectory | null | undefined;
  /** Optional validation error message (Dutch) */
  error?: string;
}

const GrowthTrajectoryRadio = forwardRef<HTMLFieldSetElement, GrowthTrajectoryRadioProps>(
  function GrowthTrajectoryRadio({ registerProps, value, error }, ref) {
    return (
      <fieldset ref={ref} className="mb-6">
        <legend className="block text-sm font-semibold text-neutral-700 mb-1.5">
          Hoe ontwikkelt het leerlingaantal zich?
        </legend>
        <div className="space-y-0">
          {GROWTH_TRAJECTORIES.map((option) => (
            <label
              key={option}
              className="flex items-center w-full h-12 px-4 cursor-pointer hover:bg-neutral-50 rounded-md"
            >
              <input
                type="radio"
                {...registerProps}
                value={option}
                defaultChecked={value === option}
                className="
                  w-5 h-5 border-2 border-neutral-200
                  checked:bg-cito-primary checked:border-cito-primary
                  focus:ring-2 focus:ring-cito-primary focus:ring-offset-2
                  cursor-pointer accent-cito-primary
                "
              />
              <span className="ml-3 text-base text-neutral-900">
                {GROWTH_TRAJECTORY_LABELS[option]}
              </span>
            </label>
          ))}
        </div>
        {error && (
          <p className="mt-1 text-[14px] text-red-600" role="alert">
            {error}
          </p>
        )}
      </fieldset>
    );
  },
);

export default GrowthTrajectoryRadio;
