import type { ConcurrentieSubTab } from '../types';

interface ConcurrentieSubTabsProps {
  active: ConcurrentieSubTab;
  onChange: (sub: ConcurrentieSubTab) => void;
}

const SUB_TABS: ReadonlyArray<{ key: ConcurrentieSubTab; label: string; group: 'provider' | 'category' }> = [
  { key: 'dia', label: 'DIA', group: 'provider' },
  { key: 'jij', label: 'JIJ!', group: 'provider' },
  { key: 'sociaal-emotioneel', label: 'Sociaal-emotioneel', group: 'category' },
  { key: 'executieve', label: 'Executieve functies', group: 'category' },
  { key: 'overig', label: 'Overig', group: 'category' },
];

/**
 * Sub-tab navigation for the Concurrentie hoofdtab.
 * Five sub-tabs: 2 provider-specific (DIA, JIJ) + 3 cross-provider category views.
 * Provider sub-tabs show that provider's full pricing form;
 * category sub-tabs show modules across all providers in that category.
 */
export function ConcurrentieSubTabs({ active, onChange }: ConcurrentieSubTabsProps) {
  return (
    <div className="border-b border-gray-100 mb-4">
      <nav className="-mb-px flex flex-wrap gap-x-4" aria-label="Sub-tabs concurrentie">
        {SUB_TABS.map((t, i) => {
          // Insert a subtle visual divider between provider-group and category-group.
          const prev = SUB_TABS[i - 1];
          const showDivider = prev && prev.group === 'provider' && t.group === 'category';
          return (
            <div key={t.key} className="flex items-center">
              {showDivider && <span className="mr-3 text-neutral-300" aria-hidden="true">|</span>}
              <button
                type="button"
                onClick={() => onChange(t.key)}
                className={`py-2 px-1 border-b-2 text-xs font-medium transition-colors ${
                  active === t.key
                    ? 'border-cito-primary text-cito-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t.label}
              </button>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
