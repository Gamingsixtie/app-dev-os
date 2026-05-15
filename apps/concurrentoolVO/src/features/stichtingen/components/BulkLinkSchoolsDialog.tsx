/**
 * BulkLinkSchoolsDialog — multi-select dialog for linking N schools to a
 * Stichting in one transaction (Phase 27 Plan 07, R11, D-03).
 *
 * Layout:
 *   - Header: "Scholen koppelen aan {stichting.name}"
 *   - Section 1: "Voorgestelde matches" — `StichtingSuggestionList` rendered
 *     from `suggestSchoolsForStichting(stichting, ongekoppeldeSchools)`. The
 *     initial `selectedIds` are the pre-checked suggestions.
 *   - Section 2: "Handmatig toevoegen" — collapsible list of schools NOT in
 *     the suggestion set (anything that scored below `MIN_SCORE_SUGGESTED`).
 *   - Footer: "{N} scholen geselecteerd" + Annuleren + Koppelen (disabled when
 *     `selectedIds.size === 0` or the mutation is in-flight).
 *
 * On submit calls `useBulkLinkSchools()`; cache invalidation is handled by
 * the hook. Parent reads success/close via the `onLinked` callback.
 */
import { useMemo, useState } from 'react';
import type { SchoolRecord } from '@/db/types';
import type { StichtingRecord } from '@/models/stichting';
import { suggestSchoolsForStichting } from '@/lib/stichtingMatcher';
import { useBulkLinkSchools } from '../hooks/useStichtingen';
import StichtingSuggestionList from './StichtingSuggestionList';

interface BulkLinkSchoolsDialogProps {
  stichting: StichtingRecord;
  ongekoppeldeSchools: SchoolRecord[];
  open: boolean;
  onClose: () => void;
  /** Called with the count of newly-linked schools on success (for toasts/UI). */
  onLinked?: (count: number) => void;
}

export default function BulkLinkSchoolsDialog({
  stichting,
  ongekoppeldeSchools,
  open,
  onClose,
  onLinked,
}: BulkLinkSchoolsDialogProps) {
  const bulkLinkMutation = useBulkLinkSchools();
  const [error, setError] = useState<string | null>(null);
  const [handmatigOpen, setHandmatigOpen] = useState(false);

  // Compute suggestions + the "rest" set deterministically per render.
  const { suggestions, restSchools, initialSelectedIds } = useMemo(() => {
    const suggestionsList = suggestSchoolsForStichting(
      { name: stichting.name, region: stichting.region },
      ongekoppeldeSchools,
    );
    const suggestionIds = new Set(suggestionsList.map((s) => s.schoolId));
    const rest = ongekoppeldeSchools
      .filter((s) => !suggestionIds.has(s.id))
      // Stable nl-collation sort for the handmatig list.
      .sort((a, b) => a.name.localeCompare(b.name, 'nl'));
    const initial = new Set(
      suggestionsList.filter((s) => s.preChecked).map((s) => s.schoolId),
    );
    return {
      suggestions: suggestionsList,
      restSchools: rest,
      initialSelectedIds: initial,
    };
    // We intentionally recompute when the inputs identity changes; stichting
    // id is the natural cache key since the dialog re-mounts per Stichting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stichting.id, stichting.name, stichting.region, ongekoppeldeSchools]);

  // Selection state is owned by this component; seeded from `initialSelectedIds`.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(initialSelectedIds);

  // Re-seed selection when the underlying suggestion-set changes (e.g. when
  // a different Stichting opens the dialog without unmounting).
  const [seedSnapshot, setSeedSnapshot] = useState(stichting.id);
  if (seedSnapshot !== stichting.id) {
    setSelectedIds(new Set(initialSelectedIds));
    setSeedSnapshot(stichting.id);
  }

  if (!open) return null;

  const toggle = (schoolId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(schoolId)) next.delete(schoolId);
      else next.add(schoolId);
      return next;
    });
  };

  const handleSubmit = async () => {
    setError(null);
    const schoolIds = Array.from(selectedIds);
    if (schoolIds.length === 0) return;
    try {
      await bulkLinkMutation.mutateAsync({
        stichtingId: stichting.id,
        schoolIds,
      });
      onLinked?.(schoolIds.length);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Koppelen mislukt');
    }
  };

  const selectedCount = selectedIds.size;
  const totalOngekoppeld = ongekoppeldeSchools.length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-link-title"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h2
            id="bulk-link-title"
            className="text-lg font-semibold text-cito-primary"
          >
            Scholen koppelen aan {stichting.name}
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {totalOngekoppeld === 0
              ? 'Er zijn geen ongekoppelde scholen meer.'
              : `${totalOngekoppeld} ${totalOngekoppeld === 1 ? 'ongekoppelde school' : 'ongekoppelde scholen'} beschikbaar.`}
          </p>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-5">
          {/* Section 1: suggestions */}
          <section>
            <h3 className="text-sm font-medium text-neutral-700 mb-2">
              Voorgestelde matches
              {suggestions.length > 0 && (
                <span className="ml-2 text-xs text-neutral-400 font-normal">
                  ({suggestions.length})
                </span>
              )}
            </h3>
            <StichtingSuggestionList
              suggestions={suggestions}
              selectedIds={selectedIds}
              onToggle={toggle}
            />
          </section>

          {/* Section 2: handmatig — collapsible */}
          <section>
            <button
              type="button"
              onClick={() => setHandmatigOpen((v) => !v)}
              className="w-full flex items-center justify-between text-sm font-medium text-neutral-700 hover:text-cito-primary transition-colors py-1"
              aria-expanded={handmatigOpen}
            >
              <span>
                Handmatig toevoegen
                {restSchools.length > 0 && (
                  <span className="ml-2 text-xs text-neutral-400 font-normal">
                    ({restSchools.length})
                  </span>
                )}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                className={`transition-transform ${handmatigOpen ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {handmatigOpen && (
              <div className="mt-2">
                {restSchools.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-neutral-200 rounded-lg">
                    <p className="text-xs text-neutral-500">
                      Alle ongekoppelde scholen staan al bij de voorgestelde
                      matches.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden">
                    {restSchools.map((school) => {
                      const checked = selectedIds.has(school.id);
                      return (
                        <li
                          key={school.id}
                          className={`flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 transition-colors ${
                            checked ? 'bg-cito-primary/5' : 'bg-white'
                          }`}
                        >
                          <input
                            id={`handmatig-${school.id}`}
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(school.id)}
                            className="w-4 h-4 rounded border-neutral-300 text-cito-primary focus:ring-cito-primary/30"
                          />
                          <label
                            htmlFor={`handmatig-${school.id}`}
                            className="flex-1 flex items-center justify-between min-w-0 cursor-pointer"
                          >
                            <span className="text-sm text-neutral-900 truncate">
                              {school.name}
                            </span>
                            {school.region && (
                              <span className="text-xs text-neutral-500 ml-3 shrink-0">
                                {school.region}
                              </span>
                            )}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-neutral-200">
          <span className="text-sm text-neutral-600">
            {selectedCount} {selectedCount === 1 ? 'school' : 'scholen'} geselecteerd
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Annuleren
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedCount === 0 || bulkLinkMutation.isPending}
              className="px-5 py-2 text-sm font-medium text-white bg-cito-primary rounded-lg hover:bg-cito-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {bulkLinkMutation.isPending ? 'Bezig...' : 'Koppelen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
