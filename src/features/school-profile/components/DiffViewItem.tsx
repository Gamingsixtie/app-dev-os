import { useState, useRef, useEffect } from 'react';

export type DiffStatus = 'new' | 'existing' | 'conflict';

interface DiffViewItemProps {
  label: string;
  newValue: string;
  existingValue?: string;
  status: DiffStatus;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  editable?: boolean;
  onValueChange?: (value: string) => void;
}

const STATUS_BADGES: Record<DiffStatus, { bg: string; text: string; border: string; label: string }> = {
  new: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', label: 'Nieuw' },
  existing: { bg: 'bg-neutral-50', text: 'text-neutral-500', border: 'border-neutral-200', label: 'Bestaand' },
  conflict: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', label: 'Verschilt' },
};

/**
 * Single row in the DiffView with checkbox, label, editable new value, existing value, and status badge.
 * Per INTAKE-03: new and conflict items have inline editable text inputs.
 */
export default function DiffViewItem({
  label,
  newValue,
  existingValue,
  status,
  checked,
  onChange,
  disabled = false,
  editable = false,
  onValueChange,
}: DiffViewItemProps) {
  const badge = STATUS_BADGES[status];
  const isDisabled = disabled || status === 'existing';
  const [editValue, setEditValue] = useState(newValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    setEditValue(newValue);
  }, [newValue]);

  const handleBlur = () => {
    if (onValueChange && editValue !== newValue) {
      onValueChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <div className="flex items-start gap-3 py-2 max-sm:flex-col max-sm:gap-1">
      {/* Checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={isDisabled}
        onClick={() => onChange(!checked)}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5 ${
          isDisabled
            ? 'border-neutral-200 bg-neutral-100 cursor-not-allowed'
            : checked
              ? 'border-cito-primary bg-cito-primary cursor-pointer'
              : 'border-neutral-300 bg-white cursor-pointer hover:border-cito-primary'
        }`}
      >
        {checked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-3.5 w-3.5 text-white"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {/* Label + values */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-neutral-700">{label}</span>

        <div className="flex items-baseline gap-2 mt-0.5 max-sm:flex-col max-sm:gap-0.5">
          {/* New value - editable or static */}
          {editable && !isDisabled ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="text-sm bg-transparent border-b border-dashed border-neutral-300 outline-none focus:border-cito-primary px-0.5 py-0 min-w-[120px] text-neutral-900"
            />
          ) : (
            <span className="text-sm text-neutral-900">{newValue}</span>
          )}

          {/* Existing value (strikethrough) for conflict items */}
          {status === 'conflict' && existingValue && (
            <span className="text-sm text-neutral-400 line-through">{existingValue}</span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <span
        className={`flex-shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.text} ${badge.border}`}
      >
        {badge.label}
      </span>
    </div>
  );
}
