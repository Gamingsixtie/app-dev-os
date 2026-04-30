import type { Contact } from '@/db/types';
import type { PipelineStatus } from '@/models/school';
import { PIPELINE_STATUS_LABELS, PIPELINE_STATUS_ORDER, ENGAGEMENT_STATUS_LABELS } from '@/models/school';

interface DmuMismatchBannerProps {
  contacts: Contact[];
  pipelineStatus: PipelineStatus;
  onNavigateToPipeline: () => void;
}

/**
 * Detects mismatch between DMU engagement statuses and school pipeline status.
 * Returns null if no mismatch or no contacts.
 */
export default function DmuMismatchBanner({
  contacts,
  pipelineStatus,
  onNavigateToPipeline,
}: DmuMismatchBannerProps) {
  if (contacts.length === 0) return null;

  // Count contacts in positive stages (positief + akkoord)
  const positiveCount = contacts.filter(
    (c) => c.engagementStatus === 'positief' || c.engagementStatus === 'akkoord',
  ).length;

  const akkoordCount = contacts.filter(
    (c) => c.engagementStatus === 'akkoord',
  ).length;

  const majority = contacts.length / 2;

  // DMU ahead of pipeline: most contacts are positive/akkoord but pipeline is early
  const pipelineOrder = PIPELINE_STATUS_ORDER[pipelineStatus];
  const dmuAhead =
    akkoordCount >= majority &&
    pipelineOrder < PIPELINE_STATUS_ORDER['offerte'];

  // Pipeline ahead of DMU: pipeline is advanced but DMU is still early
  const earlyDmuCount = contacts.filter(
    (c) =>
      c.engagementStatus === 'nog-niet-benaderd' ||
      c.engagementStatus === 'in-gesprek',
  ).length;
  const pipelineAhead =
    pipelineOrder >= PIPELINE_STATUS_ORDER['offerte'] &&
    earlyDmuCount >= majority;

  if (!dmuAhead && !pipelineAhead) return null;

  const dominantStatus = dmuAhead
    ? (akkoordCount >= positiveCount ? 'akkoord' : 'positief')
    : (earlyDmuCount > 0 ? 'in-gesprek' : 'nog-niet-benaderd');

  const message = dmuAhead
    ? `Meeste DMU-leden staan op ${ENGAGEMENT_STATUS_LABELS[dominantStatus]}, maar school is nog op ${PIPELINE_STATUS_LABELS[pipelineStatus]}.`
    : `School staat op ${PIPELINE_STATUS_LABELS[pipelineStatus]}, maar DMU-leden staan nog in een eerdere fase.`;

  const actionLabel = dmuAhead ? 'Pipeline bijwerken?' : 'DMU-status bijwerken?';

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 mb-4">
      {/* Amber info icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-amber-600 flex-shrink-0"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <p className="text-[14px] text-amber-800 flex-1">
        {message}{' '}
        <button
          type="button"
          onClick={onNavigateToPipeline}
          className="text-[14px] font-semibold text-amber-900 underline"
        >
          {actionLabel}
        </button>
      </p>
    </div>
  );
}
