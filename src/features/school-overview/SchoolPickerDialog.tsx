import { useState, useMemo } from 'react';
import { useSchoolListStore } from './school-list-store';

interface SchoolPickerDialogProps {
  onClose: () => void;
  onSelect: (schoolName: string) => void;
}

export default function SchoolPickerDialog({ onClose, onSelect }: SchoolPickerDialogProps) {
  const entries = useSchoolListStore((s) => s.entries);
  const fileName = useSchoolListStore((s) => s.fileName);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return entries;
    const q = query.toLowerCase();
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.brinCode.toLowerCase().includes(q) ||
        e.region.toLowerCase().includes(q),
    );
  }, [entries, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-neutral-800">School selecteren</h2>
            {fileName && (
              <p className="text-xs text-neutral-400 mt-0.5">
                Uit: {fileName} ({entries.length} scholen)
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            aria-label="Sluiten"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-neutral-100 flex-shrink-0">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek op naam, plaats, BRIN-code..."
              className="w-full h-10 pl-9 pr-4 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cito-primary/20 focus:border-cito-primary"
              autoFocus
            />
          </div>
        </div>

        {/* School list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">
              Geen scholen gevonden{query ? ` voor '${query}'` : ''}
            </p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onSelect(entry.name)}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate group-hover:text-cito-primary transition-colors">
                        {entry.name}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 text-[12px] text-neutral-500">
                        {entry.city && (
                          <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-300" aria-hidden="true">
                              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" />
                            </svg>
                            {entry.city}
                          </span>
                        )}
                        {entry.region && (
                          <span>{entry.region}</span>
                        )}
                        {entry.brinCode && (
                          <span className="text-neutral-400">BRIN: {entry.brinCode}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {entry.levels && (
                        <span className="text-[11px] text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded">
                          {entry.levels}
                        </span>
                      )}
                      {entry.studentCount && (
                        <span className="text-[11px] text-neutral-400">
                          {entry.studentCount.toLocaleString('nl-NL')} ll.
                        </span>
                      )}
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-300 group-hover:text-cito-primary transition-colors flex-shrink-0" aria-hidden="true">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-100 flex-shrink-0">
          <p className="text-xs text-neutral-400">
            {filtered.length} van {entries.length} scholen
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors"
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}
