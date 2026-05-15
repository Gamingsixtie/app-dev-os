/**
 * PriceImportDropzone — step 1 of the AI Excel-import modal flow.
 *
 * Provider dropdown + .xlsx file picker + submit button. Validates the file
 * client-side via `validateExcelInput` and surfaces errors in Dutch. Parent
 * (PriceImportFlow) handles the actual parsing + AI call.
 *
 * Per CONTEXT.md D-11: single-provider per upload — user MUST pick a provider
 * before submit.
 */

import { useState } from 'react';
import type { ProviderImportKey } from '../import/price-import-schemas';
import { validateExcelInput } from '../import/excel-parser';

const PROVIDER_OPTIONS: Array<{ key: ProviderImportKey; label: string }> = [
  { key: 'cito', label: 'Cito' },
  { key: 'dia', label: 'DIA' },
  { key: 'jij', label: 'JIJ!' },
  { key: 'saqi', label: 'SAQI' },
];

interface PriceImportDropzoneProps {
  onSubmit: (args: { provider: ProviderImportKey; file: File }) => void;
  onCancel: () => void;
  busy: boolean;
}

export function PriceImportDropzone({ onSubmit, onCancel, busy }: PriceImportDropzoneProps) {
  const [provider, setProvider] = useState<ProviderImportKey>('dia');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    const v = validateExcelInput(file);
    if (!v.valid) {
      setError(v.error ?? 'Ongeldig bestand');
      return;
    }
    if (!file) return; // defensive — already covered by validateExcelInput
    onSubmit({ provider, file });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Voor welke aanbieder zijn deze prijzen?
        </label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as ProviderImportKey)}
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cito-primary/40"
          disabled={busy}
        >
          {PROVIDER_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-neutral-500">
          Eén Excel-bestand wordt gemapt naar één aanbieder.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Excel-bestand (.xlsx, max 5MB)
        </label>
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setError(null);
          }}
          disabled={busy}
          className="text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900"
          disabled={busy}
        >
          Annuleer
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={busy || !file}
          className="px-4 py-2 bg-cito-primary text-white rounded-md text-sm font-medium hover:bg-cito-primary/90 disabled:opacity-50"
        >
          {busy ? 'AI verwerkt…' : 'Verwerk met AI'}
        </button>
      </div>
    </div>
  );
}
