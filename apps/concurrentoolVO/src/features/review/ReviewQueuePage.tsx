import { useState, useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { usePriceProposals } from '@/hooks/usePriceProposals';
import ReviewFilterBar from './ReviewFilterBar';
import ReviewQueueItem from './ReviewQueueItem';
import type { ReviewFilters } from './ReviewFilterBar';
import type { PriceProposal } from '@/db/pricing-types';

const DEMO_PROPOSALS: PriceProposal[] = [
  {
    id: 'demo-1', team_id: 'demo', module_id: 'Begrijpend lezen',
    provider: 'dia', current_price: 3.20, proposed_price: 2.85,
    source: 'Offerte school', explanation: 'Offerte ontvangen van Het Stedelijk Lyceum — DIA biedt 2,85 per leerling bij 3-jarig contract.',
    evidence_path: null, scope: 'school', school_id: 'demo-school-1', school_name: 'Het Stedelijk Lyceum',
    status: 'open', rejection_reason: null,
    submitted_by: 'demo-user', reviewed_by: null, reviewed_at: null,
    created_at: '2026-03-30T14:22:00Z', updated_at: '2026-03-30T14:22:00Z',
  },
  {
    id: 'demo-2', team_id: 'demo', module_id: 'Rekenen-Wiskunde',
    provider: 'jij', current_price: 4.10, proposed_price: 3.50,
    source: 'Gesprek consultant', explanation: 'Tijdens schoolbezoek aangegeven dat JIJ! korting geeft bij afname van 3+ modules. Bevestigd per mail.',
    evidence_path: '/uploads/jij-korting-mail.pdf', scope: 'school', school_id: 'demo-school-2', school_name: 'Marnix College',
    status: 'open', rejection_reason: null,
    submitted_by: 'demo-user', reviewed_by: null, reviewed_at: null,
    created_at: '2026-03-29T09:15:00Z', updated_at: '2026-03-29T09:15:00Z',
  },
  {
    id: 'demo-3', team_id: 'demo', module_id: 'Engels',
    provider: 'cito', current_price: 3.80, proposed_price: 4.20,
    source: 'Prijslijst 2026', explanation: 'Nieuwe Cito-prijslijst 2026-2027 — Engels is verhoogd van €3,80 naar €4,20 per leerling.',
    evidence_path: null, scope: 'global', school_id: null, school_name: null,
    status: 'approved', rejection_reason: null,
    submitted_by: 'demo-user', reviewed_by: 'demo-manager', reviewed_at: '2026-03-28T16:00:00Z',
    created_at: '2026-03-27T11:30:00Z', updated_at: '2026-03-28T16:00:00Z',
  },
  {
    id: 'demo-4', team_id: 'demo', module_id: 'Spelling',
    provider: 'dia', current_price: 2.90, proposed_price: 1.95,
    source: 'Website concurrent', explanation: 'DIA website toont actieprijs van €1,95 voor Spelling bij nieuwe klanten.',
    evidence_path: null, scope: 'global', school_id: null, school_name: null,
    status: 'rejected', rejection_reason: 'Actieprijs is tijdelijk (geldig t/m april). Reguliere prijs blijft €2,90.',
    submitted_by: 'demo-user', reviewed_by: 'demo-manager', reviewed_at: '2026-03-26T10:45:00Z',
    created_at: '2026-03-25T08:00:00Z', updated_at: '2026-03-26T10:45:00Z',
  },
  {
    id: 'demo-5', team_id: 'demo', module_id: 'Woordenschat',
    provider: 'jij', current_price: 3.60, proposed_price: 3.10,
    source: 'Offerte school', explanation: 'Offerte voor Marnix College — JIJ! biedt staffelkorting bij 500+ leerlingen.',
    evidence_path: '/uploads/jij-offerte-marnix.pdf', scope: 'school', school_id: 'demo-school-2', school_name: 'Marnix College',
    status: 'open', rejection_reason: null,
    submitted_by: 'demo-user', reviewed_by: null, reviewed_at: null,
    created_at: '2026-03-31T08:45:00Z', updated_at: '2026-03-31T08:45:00Z',
  },
];

export default function ReviewQueuePage() {
  const { userProfile } = useAuth();
  const [filters, setFilters] = useState<ReviewFilters>({});
  // Demo data is only shown in `vite dev`; production and vitest render the
  // real (or empty) list so users don't see fake proposals as real data.
  // (Note: vitest sets DEV=true by default, so we check MODE explicitly.)
  const [showDemo, setShowDemo] = useState(import.meta.env.MODE === 'development');

  const { data: proposals, isLoading, error } = usePriceProposals(filters);

  // Use demo data when no real proposals exist (dev only) or query fails
  const displayProposals = useMemo(() => {
    const real = (!error && proposals) ? proposals : [];
    if (real.length > 0) return real;
    if (!showDemo) return real;
    // Apply filters to demo data
    return DEMO_PROPOSALS.filter((p) => {
      if (filters.status && p.status !== filters.status) return false;
      if (filters.provider && p.provider !== filters.provider) return false;
      return true;
    });
  }, [proposals, error, showDemo, filters]);

  // Access control: manager only
  if (userProfile?.role !== 'manager' && userProfile?.role !== 'accountmanager') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">Geen toegang</h2>
        <p className="text-sm text-neutral-500">
          Deze pagina is alleen toegankelijk voor managers.
        </p>
      </div>
    );
  }

  // Error state — surface load failures explicitly rather than silently
  // falling back to demo data, so users know when data is stale or missing.
  if (!isLoading && error) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-8">
        <h1 className="text-xl font-semibold text-neutral-900 mb-2">Prijsvoorstellen</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 mt-4">
          <h2 className="text-base font-semibold text-red-900 mb-2">
            Prijsvoorstellen konden niet worden geladen
          </h2>
          <p className="text-sm text-red-700">
            Er ging iets mis bij het ophalen van de prijsvoorstellen. Probeer de
            pagina opnieuw te laden of neem contact op met support als het
            probleem aanhoudt.
          </p>
        </div>
      </div>
    );
  }

  // Sort proposals: newest first
  const sortedProposals = [...displayProposals].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const hasFiltersActive = filters.status !== undefined || filters.provider !== undefined;
  const isDemo = (proposals ?? []).length === 0 && showDemo;

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <h1 className="text-xl font-semibold text-neutral-900 mb-2">Prijsvoorstellen</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Beoordeel en verwerk ingediende prijswijzigingen van uw team.
      </p>

      {/* Demo banner */}
      {isDemo && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Voorbeelddata</span> — deze voorstellen zijn demo-data om het ontwerp te tonen.
          </p>
          <button
            type="button"
            onClick={() => setShowDemo(false)}
            className="text-xs font-medium text-amber-700 hover:text-amber-900 underline"
          >
            Verbergen
          </button>
        </div>
      )}

      {/* Filter bar */}
      <ReviewFilterBar filters={filters} onFilterChange={setFilters} />

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2 mt-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-neutral-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <>
          {sortedProposals.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center mt-4">
              <h2 className="text-base font-semibold text-neutral-900 mb-2">
                {hasFiltersActive ? 'Geen resultaten' : 'Geen openstaande voorstellen'}
              </h2>
              <p className="text-sm text-neutral-500">
                {hasFiltersActive
                  ? 'Er zijn geen voorstellen die aan deze filters voldoen. Pas de filters aan of bekijk alle voorstellen.'
                  : 'Er zijn momenteel geen prijsvoorstellen ter beoordeling. Voorstellen verschijnen hier zodra een teamlid een prijswijziging indient.'}
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-0">
              {sortedProposals.map((proposal) => (
                <ReviewQueueItem key={proposal.id} proposal={proposal} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
