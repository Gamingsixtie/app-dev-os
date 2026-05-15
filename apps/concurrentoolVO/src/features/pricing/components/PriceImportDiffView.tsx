/**
 * PriceImportDiffView — step 2 of the AI Excel-import modal flow.
 *
 * Renders the per-row diff (huidig → voorgesteld) with a checkbox per row,
 * an "Alles selecteren" toggle, and Annuleer / Bevestig actions.
 *
 * Per CONTEXT.md D-09: this is a NEW component (not a re-use of
 * features/intake/DiffView). The data shape is different (path-based rows
 * vs intake's field-key rows).
 */

import { useMemo, useState } from 'react';
import type { DiffRow } from '../import/price-diff';

interface PriceImportDiffViewProps {
  diff: DiffRow[];
  notes?: string;
  onConfirm: (acceptedPaths: ReadonlySet<string>) => void;
  onCancel: () => void;
  saving: boolean;
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '(leeg)';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export function PriceImportDiffView({
  diff,
  notes,
  onConfirm,
  onCancel,
  saving,
}: PriceImportDiffViewProps) {
  const changedRows = useMemo(() => diff.filter((r) => r.changed), [diff]);
  const [accepted, setAccepted] = useState<Set<string>>(
    () => new Set(changedRows.map((r) => r.path)),
  );

  const toggle = (path: string) => {
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const allSelected = changedRows.length > 0 && changedRows.every((r) => accepted.has(r.path));

  const toggleAll = () => {
    setAccepted(allSelected ? new Set() : new Set(changedRows.map((r) => r.path)));
  };

  if (changedRows.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-neutral-700">
          Geen wijzigingen gevonden — de Excel bevat dezelfde prijzen als de huidige configuratie.
        </p>
        {notes && (
          <p className="text-xs text-neutral-500 italic bg-yellow-50 border border-yellow-200 rounded p-2">
            AI-notitie: {notes}
          </p>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900"
          >
            Sluiten
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-700">
        AI stelt {changedRows.length} wijziging{changedRows.length === 1 ? '' : 'en'} voor. Vink aan welke je wilt toepassen.
      </p>

      {notes && (
        <p className="text-xs text-neutral-700 italic bg-yellow-50 border border-yellow-200 rounded p-2">
          AI-notitie: {notes}
        </p>
      )}

      <div className="border border-neutral-200 rounded">
        <div className="flex items-center justify-between bg-neutral-50 px-3 py-2 border-b border-neutral-200">
          <label className="text-sm font-medium text-neutral-700 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              disabled={saving}
            />
            Alles selecteren ({changedRows.length})
          </label>
          <span className="text-xs text-neutral-500">{accepted.size} geselecteerd</span>
        </div>

        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 text-xs font-medium text-neutral-500 px-3 py-2 border-b border-neutral-100 bg-neutral-50/50">
          <span></span>
          <span>Pad</span>
          <span>Huidig</span>
          <span>Voorgesteld</span>
        </div>

        <ul className="divide-y divide-neutral-100 max-h-96 overflow-y-auto">
          {changedRows.map((r) => (
            <li key={r.path} className="px-3 py-2">
              <label className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 items-center text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted.has(r.path)}
                  onChange={() => toggle(r.path)}
                  disabled={saving}
                />
                <span className="font-mono text-xs text-neutral-600 truncate" title={r.path}>{r.path}</span>
                <span className="text-red-600 line-through text-right">{formatValue(r.currentValue)}</span>
                <span className="text-green-700 font-medium text-right">{formatValue(r.proposedValue)}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900"
          disabled={saving}
        >
          Annuleer
        </button>
        <button
          type="button"
          onClick={() => onConfirm(accepted)}
          disabled={saving || accepted.size === 0}
          className="px-4 py-2 bg-cito-primary text-white rounded-md text-sm font-medium hover:bg-cito-primary/90 disabled:opacity-50"
        >
          {saving
            ? 'Opslaan…'
            : `Bevestig ${accepted.size} wijziging${accepted.size === 1 ? '' : 'en'}`}
        </button>
      </div>
    </div>
  );
}
