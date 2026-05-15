import { useState, useRef } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useSchoolProfileStore } from '../store';
import { useSchool } from '@/hooks/useSchools';
import { setPipelineStatus, validatePipelineTransition } from '@/db/operations';
import {
  PIPELINE_STATUSES,
  PIPELINE_STATUS_LABELS,
} from '@/models/school';
import type { PipelineStatus } from '@/models/school';
import PipelineReasonDialog from './PipelineReasonDialog';
import { AuditMeta } from '@/components/ui/AuditMeta';
import { SCHOOL_TAB_ROUTES } from '@/router/routes';

// Context-smart CTA configuration per pipeline status
const SMART_CTA: Record<PipelineStatus, { label: string; tab: string }> = {
  prospect: { label: 'Vergelijking maken', tab: 'vergelijking' },
  'contact-gelegd': { label: 'Demo inplannen', tab: 'gesprekken' },
  'demo-presentatie': { label: 'Offerte klaarmaken', tab: 'vergelijking' },
  offerte: { label: 'Status bijwerken', tab: '_focus_dropdown' },
  gewonnen: { label: 'Producten bijwerken', tab: 'producten' },
  verloren: { label: 'Laatste gesprek bekijken', tab: 'gesprekken' },
};

export default function ProfileHeader() {
  const { slug } = useParams({ from: '/scholen/$slug' });
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLSelectElement>(null);

  const schoolName = useSchoolProfileStore((s) => s.schoolName);
  const activeSchoolId = useSchoolProfileStore((s) => s.activeSchoolId);
  const pipelineStatus = useSchoolProfileStore((s) => s.pipelineStatus);
  const { data: school } = useSchool(slug);

  const [pendingStatus, setPendingStatus] = useState<PipelineStatus | null>(null);
  const [showReasonDialog, setShowReasonDialog] = useState(false);

  // Format the "Laatst bewerkt" date (fallback to current date if no school data)
  const lastEdited = new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(school?.updatedAt ? new Date(school.updatedAt) : new Date());

  const handleStatusChange = (newStatus: PipelineStatus) => {
    if (!activeSchoolId || newStatus === pipelineStatus) return;

    const validation = validatePipelineTransition(pipelineStatus, newStatus);

    // Phase 28: LostDealDialog is verwijderd — lost-deal-info wordt geregistreerd
    // op de Uitkomst-tab via DealAfsluitenDialog/LostDealForm. Pipeline-status
    // muteert hier atomair zonder dialog; eventuele reden-vereiste blijft via
    // PipelineReasonDialog lopen.
    if (validation.requiresReason && !validation.requiresLostDeal) {
      setPendingStatus(newStatus);
      setShowReasonDialog(true);
      return;
    }

    // Direct transition — including the previous LostDealDialog branch.
    // The user is steered toward the Uitkomst-tab via the helper text below
    // the dropdown (rendered when pipelineStatus === 'verloren').
    setPipelineStatus(activeSchoolId, newStatus);
  };

  const handleReasonConfirm = (reason: string) => {
    if (!activeSchoolId || !pendingStatus) return;
    setPipelineStatus(activeSchoolId, pendingStatus, reason);
    setShowReasonDialog(false);
    setPendingStatus(null);
  };

  const handleDialogCancel = () => {
    setShowReasonDialog(false);
    setPendingStatus(null);
  };

  const handleSmartCTA = () => {
    const cta = SMART_CTA[pipelineStatus];
    if (cta.tab === '_focus_dropdown') {
      dropdownRef.current?.focus();
      return;
    }
    const to = SCHOOL_TAB_ROUTES[cta.tab as keyof typeof SCHOOL_TAB_ROUTES] ?? SCHOOL_TAB_ROUTES.overzicht;
    navigate({ to, params: { slug } });
  };

  return (
    <>
      <div className="px-8 pt-6 pb-4 max-sm:px-4">
        {/* Back link */}
        <Link
          to="/scholen"
          className="inline-flex items-center text-[14px] text-cito-primary hover:underline min-h-[44px]"
        >
          &lt; Overzicht
        </Link>

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mt-1">
          {/* Left side: name + date */}
          <div>
            <h1 className="text-[28px] font-semibold text-cito-primary leading-tight">
              {schoolName}
            </h1>
            <p className="text-[14px] text-neutral-500 mt-1">
              Laatst bewerkt: {lastEdited}
            </p>
            {school && (
              <AuditMeta
                createdBy={school.createdBy}
                updatedBy={school.updatedBy}
                createdAt={school.createdAt}
                updatedAt={school.updatedAt}
              />
            )}
          </div>

          {/* Right side: pipeline dropdown + CTA */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-3">
              <select
                ref={dropdownRef}
                value={pipelineStatus}
                onChange={(e) => handleStatusChange(e.target.value as PipelineStatus)}
                className="h-11 px-4 bg-white border border-neutral-200 rounded-lg text-[14px] text-neutral-700 cursor-pointer"
              >
                {PIPELINE_STATUSES.map((status) => (
                  <option
                    key={status}
                    value={status}
                    title={
                      status === 'verloren'
                        ? 'Tip: leg de deal-uitkomst vast op de Uitkomst-tab voor markt-inzicht.'
                        : undefined
                    }
                  >
                    {PIPELINE_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleSmartCTA}
                className="h-11 px-6 bg-cito-accent text-white text-[14px] font-semibold rounded-lg hover:opacity-90 whitespace-nowrap"
              >
                {SMART_CTA[pipelineStatus].label}
              </button>
            </div>
            {pipelineStatus === 'verloren' && (
              <p className="text-[12px] text-neutral-500 mt-1">
                Tip: leg de deal-uitkomst vast op de{' '}
                <Link
                  to={SCHOOL_TAB_ROUTES.uitkomst}
                  params={{ slug }}
                  className="underline text-cito-primary hover:opacity-80"
                >
                  Uitkomst-tab
                </Link>{' '}
                voor markt-inzicht.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reason dialog (lost-deal-info is registered via Uitkomst-tab, see Phase 28) */}
      {showReasonDialog && pendingStatus && (
        <PipelineReasonDialog
          fromLabel={PIPELINE_STATUS_LABELS[pipelineStatus]}
          toLabel={PIPELINE_STATUS_LABELS[pendingStatus]}
          onConfirm={handleReasonConfirm}
          onCancel={handleDialogCancel}
        />
      )}
    </>
  );
}
