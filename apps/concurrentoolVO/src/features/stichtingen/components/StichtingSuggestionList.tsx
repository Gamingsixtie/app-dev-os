/**
 * StichtingSuggestionList — stateless render of smart-suggestion matches
 * (Phase 27 Plan 07, R11, D-03).
 *
 * Each row is a checkbox-row with:
 *   - school name
 *   - confidence percentage (transparancy voor sales, per D-03)
 *   - pre-checked badge when score crosses the threshold
 *   - reasons tooltip (`naam-similarity X.XX`, `regio-match`, ...)
 *
 * Stateless: the parent (`BulkLinkSchoolsDialog`) owns `selectedIds` and the
 * `onToggle` handler. Renders an empty-state with explicit Dutch copy when
 * `suggestions.length === 0`.
 */
import type { MatchSuggestion } from '@/lib/stichtingMatcher';

interface StichtingSuggestionListProps {
  suggestions: MatchSuggestion[];
  selectedIds: Set<string>;
  onToggle: (schoolId: string) => void;
}

export default function StichtingSuggestionList({
  suggestions,
  selectedIds,
  onToggle,
}: StichtingSuggestionListProps) {
  if (suggestions.length === 0) {
    return (
      <div className="text-center py-6 border border-dashed border-neutral-200 rounded-lg">
        <p className="text-sm text-neutral-500">
          Geen automatische suggesties.
        </p>
        <p className="text-xs text-neutral-400 mt-1">
          Voeg handmatig scholen toe via de sectie hieronder.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden">
      {suggestions.map((suggestion) => {
        const checked = selectedIds.has(suggestion.schoolId);
        const percentage = Math.round(suggestion.score * 100);
        const reasonsTitle = suggestion.reasons.length > 0
          ? suggestion.reasons.join(' • ')
          : 'Geen extra context';
        return (
          <li
            key={suggestion.schoolId}
            className={`flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 transition-colors ${
              checked ? 'bg-cito-primary/5' : 'bg-white'
            }`}
          >
            <input
              id={`suggestion-${suggestion.schoolId}`}
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(suggestion.schoolId)}
              className="w-4 h-4 rounded border-neutral-300 text-cito-primary focus:ring-cito-primary/30"
            />
            <label
              htmlFor={`suggestion-${suggestion.schoolId}`}
              className="flex-1 flex items-center justify-between min-w-0 cursor-pointer"
            >
              <span className="text-sm font-medium text-neutral-900 truncate">
                {suggestion.schoolName}
              </span>
              <span className="flex items-center gap-2 ml-3 shrink-0">
                <span
                  className="text-xs text-neutral-500 tabular-nums"
                  title={reasonsTitle}
                >
                  {percentage}%
                </span>
                {suggestion.preChecked && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded bg-green-100 text-green-700">
                    Sterke match
                  </span>
                )}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
