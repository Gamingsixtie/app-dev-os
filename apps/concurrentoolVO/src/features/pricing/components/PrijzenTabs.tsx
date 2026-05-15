import type { PrijzenTab } from '../types';

interface PrijzenTabsProps {
  activeTab: PrijzenTab;
  onTabChange: (tab: PrijzenTab) => void;
}

const TABS: ReadonlyArray<{ key: PrijzenTab; label: string }> = [
  { key: 'basis', label: 'Cito Basisvaardigheden' },
  { key: 'concurrentie', label: 'Concurrentie' },
];

/**
 * Top-level tab navigation for the /prijzen editor.
 * Controlled component: caller owns the active-tab state (typically from usePrijzenSearch).
 */
export function PrijzenTabs({ activeTab, onTabChange }: PrijzenTabsProps) {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-6" aria-label="Hoofd-tabs prijs-editor">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'border-cito-primary text-cito-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
