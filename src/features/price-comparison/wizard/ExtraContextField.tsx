/**
 * Structured extra context input for AI advice generation (D-21).
 * 3 labeled input fields for optional context: korting, DMU-focus, bijzonderheden.
 */

import type { ExtraContextInput } from './types';

interface ExtraContextFieldProps {
  value: ExtraContextInput;
  onChange: (update: Partial<ExtraContextInput>) => void;
}

const inputClasses =
  'w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cito-accent/20 focus:border-cito-accent outline-none transition-colors';

const labelClasses = 'text-sm font-semibold text-neutral-700 mb-1 block';

export function ExtraContextField({ value, onChange }: ExtraContextFieldProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-cito-primary">
        Aanvullende context (optioneel)
      </h3>

      {/* Korting */}
      <div>
        <label className={labelClasses}>
          Eventuele korting concurrent
        </label>
        <input
          type="text"
          value={value.korting}
          onChange={(e) => onChange({ korting: e.target.value })}
          placeholder="bijv. 15% korting op DIA Basis"
          className={inputClasses}
        />
      </div>

      {/* DMU-focus */}
      <div>
        <label className={labelClasses}>
          DMU-focus
        </label>
        <input
          type="text"
          value={value.dmuFocus}
          onChange={(e) => onChange({ dmuFocus: e.target.value })}
          placeholder="bijv. MT is prijsbewust, coordinator wil tijdwinst"
          className={inputClasses}
        />
      </div>

      {/* Bijzonderheden */}
      <div>
        <label className={labelClasses}>
          Bijzonderheden
        </label>
        <textarea
          rows={2}
          value={value.bijzonderheden}
          onChange={(e) => onChange({ bijzonderheden: e.target.value })}
          placeholder="Andere relevante informatie voor het advies..."
          className={inputClasses}
        />
      </div>
    </div>
  );
}
