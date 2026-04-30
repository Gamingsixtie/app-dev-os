import { useState } from 'react';
import type { SchijnvoordeelWarning } from '@/engine/schijnvoordeel';

interface SchijnvoordeelBadgeProps {
  warnings: SchijnvoordeelWarning[];
}

const SEVERITY_STYLES = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  critical: 'bg-red-50 border-red-200 text-red-800',
} as const;

const SEVERITY_ICON_COLOR = {
  info: 'text-blue-500',
  warning: 'text-amber-500',
  critical: 'text-red-500',
} as const;

export default function SchijnvoordeelBadge({ warnings }: SchijnvoordeelBadgeProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (warnings.length === 0) return null;

  // Sort: critical first, then warning, then info
  const sorted = [...warnings].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 flex-shrink-0" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
          {warnings.length} schijnvoordeel{warnings.length !== 1 ? 'en' : ''} ontdekt
        </span>
      </div>

      {sorted.map((w, i) => {
        const isExpanded = expandedIndex === i;
        return (
          <div
            key={`${w.type}-${i}`}
            className={`rounded-lg border p-3 ${SEVERITY_STYLES[w.severity]}`}
          >
            <button
              type="button"
              onClick={() => setExpandedIndex(isExpanded ? null : i)}
              className="w-full text-left flex items-start gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`flex-shrink-0 mt-0.5 ${SEVERITY_ICON_COLOR[w.severity]}`}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{w.title}</div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`flex-shrink-0 mt-0.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isExpanded && (
              <div className="mt-2 pl-6 space-y-2">
                <p className="text-sm">{w.explanation}</p>
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <span className="bg-cito-primary/10 text-cito-primary px-2 py-0.5 rounded-full">
                    Cito voordeel
                  </span>
                  <span className="text-neutral-600 font-normal">{w.citoAdvantage}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
