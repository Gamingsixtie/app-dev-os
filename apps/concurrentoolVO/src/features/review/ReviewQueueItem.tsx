import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { approveProposal, rejectProposal, fetchAuditLog } from '@/db/pricing-operations';
import { usePricingDataStore } from '@/stores/pricing-data-store';
import { ProposalBadge } from '@/components/ui/ProposalBadge';
import { PriceDiffDisplay } from '@/components/ui/PriceDiffDisplay';
import { PROVIDER_LABELS } from '@/engine/price-comparison';
import type { ProviderKey } from '@/engine/price-comparison';
import type { PriceProposal } from '@/db/pricing-types';

interface ReviewQueueItemProps {
  proposal: PriceProposal;
}

export default function ReviewQueueItem({ proposal }: ReviewQueueItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const queryClient = useQueryClient();

  // Fetch audit log when expanded
  const { data: auditEntries } = useQuery({
    queryKey: ['audit-log', 'price_proposal', proposal.id],
    queryFn: () => fetchAuditLog('price_proposal', proposal.id),
    enabled: expanded,
  });

  const approveMutation = useMutation({
    mutationFn: () => approveProposal(proposal.id),
    onSuccess: () => {
      // Invalidate queries for automatic UI refresh
      queryClient.invalidateQueries({ queryKey: ['publication-prices'] });
      queryClient.invalidateQueries({ queryKey: ['price-proposals'] });
      // Trigger store refresh for recalculation
      usePricingDataStore.getState().loadFromSupabase();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectProposal(proposal.id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-proposals'] });
      setRejecting(false);
      setRejectionReason('');
    },
  });

  const handleApprove = useCallback(() => {
    approveMutation.mutate();
  }, [approveMutation]);

  const handleStartReject = useCallback(() => {
    setRejecting(true);
  }, []);

  const handleConfirmReject = useCallback(() => {
    if (rejectionReason.trim().length >= 10) {
      rejectMutation.mutate(rejectionReason.trim());
    }
  }, [rejectionReason, rejectMutation]);

  const providerLabel = PROVIDER_LABELS[proposal.provider as ProviderKey] ?? proposal.provider;

  return (
    <div
      data-testid="review-queue-item"
      className="border border-neutral-200 rounded-lg bg-white mb-2"
    >
      {/* Summary row */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
      >
        {/* Provider pill */}
        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-700">
          {providerLabel}
        </span>

        {/* Scope pill */}
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          proposal.scope === 'school'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-purple-100 text-purple-700'
        }`}>
          {proposal.scope === 'school' ? 'School' : 'Globaal'}
        </span>

        {/* Module name */}
        <span className="text-sm font-medium text-neutral-900 flex-1">
          {proposal.module_id}
          {proposal.scope === 'school' && proposal.school_name && (
            <span className="text-xs text-neutral-500 ml-1.5">({proposal.school_name})</span>
          )}
        </span>

        {/* Price diff */}
        <PriceDiffDisplay
          oldPrice={proposal.current_price}
          newPrice={proposal.proposed_price}
        />

        {/* Date */}
        <span className="text-xs text-neutral-500 whitespace-nowrap">
          {new Date(proposal.created_at).toLocaleDateString('nl-NL')}
        </span>

        {/* Status badge */}
        <ProposalBadge status={proposal.status} />

        {/* Expand chevron */}
        <svg
          className={`h-4 w-4 text-neutral-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-neutral-100 px-4 py-4">
          {/* Explanation */}
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Toelichting
            </h4>
            <p className="text-sm text-neutral-700">{proposal.explanation}</p>
          </div>

          {/* Source */}
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Bron
            </h4>
            <p className="text-sm text-neutral-700">{proposal.source}</p>
          </div>

          {/* Evidence link */}
          {proposal.evidence_path && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Bewijs
              </h4>
              <a
                href={proposal.evidence_path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#003082] underline"
              >
                Bewijsbestand bekijken
              </a>
            </div>
          )}

          {/* Audit trail */}
          {auditEntries && auditEntries.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Wijzigingshistorie
              </h4>
              <ul className="space-y-1">
                {auditEntries.map((entry) => (
                  <li key={entry.id} className="text-xs text-neutral-500">
                    {new Date(entry.created_at).toLocaleString('nl-NL')} — {entry.action}
                    {entry.reason && `: ${entry.reason}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons (only for open proposals) */}
          {proposal.status === 'open' && (
            <div className="flex items-start gap-3 mt-4 pt-3 border-t border-neutral-100">
              {!rejecting ? (
                <>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={approveMutation.isPending}
                    className="rounded-lg bg-[#003082] px-4 py-2 text-sm font-semibold text-white hover:bg-[#002060] transition-colors disabled:opacity-50"
                  >
                    {approveMutation.isPending ? 'Bezig...' : 'Goedkeuren'}
                  </button>
                  <button
                    type="button"
                    onClick={handleStartReject}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                  >
                    Afwijzen
                  </button>
                </>
              ) : (
                <div className="flex-1 space-y-2">
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reden voor afwijzing (minimaal 10 tekens)"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#003082] focus:outline-none focus:ring-1 focus:ring-[#003082]"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmReject}
                      disabled={rejectionReason.trim().length < 10 || rejectMutation.isPending}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {rejectMutation.isPending ? 'Bezig...' : 'Bevestig afwijzing'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejecting(false);
                        setRejectionReason('');
                      }}
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Toast messages are shown via mutation success */}
          {approveMutation.isSuccess && (
            <p className="mt-2 text-sm text-green-600">
              Prijs bijgewerkt — vergelijkingen worden automatisch herberekend
            </p>
          )}
          {rejectMutation.isSuccess && (
            <p className="mt-2 text-sm text-orange-600">
              Voorstel afgewezen — de indiener wordt geinformeerd
            </p>
          )}
        </div>
      )}
    </div>
  );
}
