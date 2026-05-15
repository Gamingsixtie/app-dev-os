/**
 * StichtingDetailTabs — Overzicht | Scholen | Export (Phase 27 Plan 02 R1, D-05).
 *
 * Scholen-tab shows the linked schools table with an unlink-per-row action
 * (Plan 27-07 will add the bulk-link smart-suggestion flow).
 * Export-tab is a placeholder until Plan 27-11 (R2) implements CSV + PDF.
 */
import { useState } from 'react';
import type { StichtingRecord } from '@/models/stichting';
import {
  useSchoolsForStichting,
  useUnlinkSchoolFromStichting,
} from '../hooks/useStichting';

interface StichtingDetailTabsProps {
  stichting: StichtingRecord;
}

type TabId = 'overzicht' | 'scholen' | 'export';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overzicht', label: 'Overzicht' },
  { id: 'scholen', label: 'Scholen' },
  { id: 'export', label: 'Export' },
];

const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export default function StichtingDetailTabs({ stichting }: StichtingDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overzicht');
  const { data: linkedSchools, isLoading } = useSchoolsForStichting(stichting.id);
  const unlinkMutation = useUnlinkSchoolFromStichting();

  return (
    <div>
      {/* Tab nav — same anatomy as TabNavigation but local-state driven */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-0" aria-label="Stichting tabs">
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  inline-flex items-center h-11 px-4 text-[14px] font-semibold whitespace-nowrap
                  border-b-2 transition-colors
                  ${active
                    ? 'text-cito-primary border-cito-primary'
                    : 'text-neutral-500 border-transparent hover:text-neutral-700 hover:bg-neutral-50'
                  }
                `}
                aria-selected={active}
                role="tab"
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="py-6">
        {activeTab === 'overzicht' && (
          <div className="space-y-4 max-w-2xl">
            <dl className="grid grid-cols-3 gap-y-3 text-sm">
              <dt className="text-neutral-500 font-medium">Naam</dt>
              <dd className="col-span-2 text-neutral-900">{stichting.name}</dd>

              <dt className="text-neutral-500 font-medium">Regio</dt>
              <dd className="col-span-2 text-neutral-900">
                {stichting.region || <span className="text-neutral-400">—</span>}
              </dd>

              <dt className="text-neutral-500 font-medium">Aantal scholen</dt>
              <dd className="col-span-2 text-neutral-900">
                {isLoading ? (
                  <span className="text-neutral-400">Laden...</span>
                ) : (
                  (linkedSchools?.length ?? 0)
                )}
              </dd>

              <dt className="text-neutral-500 font-medium">Aangemaakt op</dt>
              <dd className="col-span-2 text-neutral-900">
                {dateFormatter.format(new Date(stichting.createdAt))}
              </dd>

              <dt className="text-neutral-500 font-medium">Laatste wijziging</dt>
              <dd className="col-span-2 text-neutral-900">
                {dateFormatter.format(new Date(stichting.updatedAt))}
              </dd>
            </dl>
          </div>
        )}

        {activeTab === 'scholen' && (
          <div>
            {isLoading && (
              <p className="text-sm text-neutral-500">Scholen laden...</p>
            )}
            {!isLoading && (linkedSchools?.length ?? 0) === 0 && (
              <div className="text-center py-12 border border-dashed border-neutral-200 rounded-lg">
                <p className="text-sm text-neutral-500">
                  Nog geen scholen gekoppeld aan deze stichting.
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Bulk-koppelen via smart-suggestion komt in Plan 27-07.
                </p>
              </div>
            )}
            {!isLoading && linkedSchools && linkedSchools.length > 0 && (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Naam</th>
                    <th className="py-2 pr-4 font-medium">Pipeline</th>
                    <th className="py-2 pr-4 font-medium">Bijgewerkt</th>
                    <th className="py-2 pr-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {linkedSchools.map((school) => (
                    <tr key={school.id} className="border-b border-neutral-100">
                      <td className="py-2 pr-4 text-neutral-900">{school.name}</td>
                      <td className="py-2 pr-4 text-neutral-600 capitalize">
                        {school.pipelineStatus}
                      </td>
                      <td className="py-2 pr-4 text-neutral-500">
                        {dateFormatter.format(new Date(school.updatedAt))}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            unlinkMutation.mutate({
                              schoolId: school.id,
                              stichtingId: stichting.id,
                            })
                          }
                          disabled={unlinkMutation.isPending}
                          className="text-xs text-neutral-500 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          Loskoppelen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'export' && (
          <div className="text-center py-12 border border-dashed border-neutral-200 rounded-lg">
            <p className="text-sm font-medium text-neutral-700">
              Stichting-export
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              CSV + DMU-PDF-aggregatie komt in Plan 27-11 (R2).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
