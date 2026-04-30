import { useState, useRef, useEffect } from 'react';
import { isModified } from '../../models/assumptions';
import type { Assumption } from '../../models/assumptions';

interface EditableAssumptionProps {
  assumption: Assumption;
  onChange: (value: number) => void;
}

export function EditableAssumption({ assumption, onChange }: EditableAssumptionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(assumption.currentValue));
  const inputRef = useRef<HTMLInputElement>(null);
  const modified = isModified(assumption);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.select();
    }
  }, [editing]);

  function startEditing() {
    setDraft(String(assumption.currentValue));
    setEditing(true);
  }

  function commitEdit() {
    setEditing(false);
    const parsed = parseFloat(draft);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  }

  function handleReset() {
    onChange(assumption.defaultValue);
  }

  const containerClasses = modified
    ? 'inline-flex items-center gap-2 bg-modified-bg border-l-2 border-l-modified-border pl-2'
    : 'inline-flex items-center gap-2';

  return (
    <div className={containerClasses}>
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="w-16 h-10 text-center bg-white border border-neutral-200 rounded-md focus:border-cito-primary focus:ring-0 outline-none"
        />
      ) : (
        <span
          className="border-b border-dashed border-neutral-200 cursor-pointer"
          onClick={startEditing}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') startEditing(); }}
        >
          {assumption.currentValue}
        </span>
      )}
      <span className="text-neutral-500 text-sm">{assumption.unit}</span>
      {modified && (
        <button
          onClick={handleReset}
          aria-label={`Terugzetten naar standaard (${assumption.defaultValue})`}
          className="text-neutral-500 hover:text-cito-primary"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path
              fillRule="evenodd"
              d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311V15a.75.75 0 01-1.5 0v-3.5a.75.75 0 01.75-.75H8.5a.75.75 0 010 1.5H7.058l.174.174a4 4 0 006.588-1.79.75.75 0 011.492.164z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
