import { useState } from 'react';

export interface EditableFieldProps {
  label: string;
  value: number;
  unit: string;
  onChange: (v: number) => void;
}

export function EditableField({ label, value, unit, onChange }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed >= 0) onChange(parsed);
    else setDraft(String(value));
    setEditing(false);
  };

  const startEditing = () => {
    setDraft(String(value));
    setEditing(true);
  };

  return (
    <div className="flex items-center gap-2 min-h-[44px]">
      {label && <span className="text-sm text-neutral-500">{label}</span>}
      {editing ? (
        <input
          type="number"
          min="0"
          step="0.5"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(String(value));
              setEditing(false);
            }
          }}
          className="w-20 h-8 text-center border border-cito-primary rounded-md text-sm focus:outline-none"
        />
      ) : (
        <button
          type="button"
          role="button"
          tabIndex={0}
          onClick={startEditing}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              startEditing();
            }
          }}
          className="text-sm font-semibold text-cito-primary underline decoration-dashed underline-offset-2"
        >
          {value} {unit}
        </button>
      )}
    </div>
  );
}
