/**
 * StichtingForm — used both for create (no `defaultValues`) and edit.
 * Phase 27 Plan 02 R1, D-02.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  stichtingFormSchema,
  type StichtingFormInput,
  type StichtingFormValues,
} from '../schemas/stichting.schema';

interface StichtingFormProps {
  /** Filled-in values when editing an existing Stichting. */
  defaultValues?: Partial<StichtingFormInput>;
  /** Called with the parsed (Zod-validated) values on successful submit. */
  onSubmit: (values: StichtingFormValues) => void | Promise<void>;
  /** Optional cancel handler — shown next to the submit button. */
  onCancel?: () => void;
  /** Submit-button label. Defaults to "Aanmaken" for create, override for edit. */
  submitLabel?: string;
  /** When true, disables the submit button (e.g. while the mutation is in-flight). */
  isSubmitting?: boolean;
}

export default function StichtingForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Aanmaken',
  isSubmitting = false,
}: StichtingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StichtingFormInput>({
    resolver: zodResolver(stichtingFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      region: defaultValues?.region ?? '',
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values as StichtingFormValues))}
      className="space-y-4"
      noValidate
    >
      <div>
        <label
          htmlFor="stichting-naam"
          className="block text-sm font-medium text-neutral-700 mb-1"
        >
          Naam stichting
        </label>
        <input
          id="stichting-naam"
          type="text"
          autoComplete="off"
          autoFocus
          {...register('name')}
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'stichting-naam-error' : undefined}
          className="w-full h-10 px-3 rounded-lg border border-neutral-300 focus:border-cito-primary focus:outline-2 focus:outline-cito-primary/30 transition-colors"
          placeholder="Bijv. Stichting Voortgezet Onderwijs Amsterdam"
        />
        {errors.name && (
          <p id="stichting-naam-error" className="mt-1 text-xs text-red-600">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="stichting-regio"
          className="block text-sm font-medium text-neutral-700 mb-1"
        >
          Regio <span className="text-neutral-400 font-normal">(optioneel)</span>
        </label>
        <input
          id="stichting-regio"
          type="text"
          autoComplete="off"
          {...register('region')}
          aria-invalid={errors.region ? 'true' : 'false'}
          aria-describedby={errors.region ? 'stichting-regio-error' : undefined}
          className="w-full h-10 px-3 rounded-lg border border-neutral-300 focus:border-cito-primary focus:outline-2 focus:outline-cito-primary/30 transition-colors"
          placeholder="Bijv. Noord-Holland"
        />
        {errors.region && (
          <p id="stichting-regio-error" className="mt-1 text-xs text-red-600">
            {errors.region.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Annuleren
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 text-sm font-medium text-white bg-cito-primary rounded-lg hover:bg-cito-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Bezig...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
