import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import type { SchoolRecord } from '@/db/types';
import { SCHOOL_LEVEL_LABELS } from '@/models/school';
import type { SchoolLevel, PipelineStatus } from '@/models/school';
import IncompleteIndicator from '@/components/ui/IncompleteIndicator';
import PipelineBadge from '@/components/ui/PipelineBadge';
import { OwnerBadge } from '@/components/ui/OwnerBadge';
import { UpsellBadge } from '@/components/ui/UpsellBadge';
import DmuProgressIndicator from './DmuProgressIndicator';
import { useAuth } from '@/features/auth/AuthProvider';
import { calculateComparison } from '@/engine/price-comparison';
import { calculateUpsell } from '@/engine/upsell';

interface SchoolCardProps {
  school: SchoolRecord;
  onDelete: (school: SchoolRecord) => void;
  mode: 'compact' | 'extended';
}

const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const PIPELINE_BORDER_COLORS: Record<PipelineStatus, string> = {
  prospect: 'border-l-neutral-300',
  'contact-gelegd': 'border-l-blue-400',
  'demo-presentatie': 'border-l-purple-400',
  offerte: 'border-l-orange-400',
  gewonnen: 'border-l-green-500',
  verloren: 'border-l-red-400',
};

function totalStudents(studentCounts: SchoolRecord['studentCounts']): number {
  let total = 0;
  for (const level of Object.values(studentCounts)) {
    if (level) {
      for (const count of Object.values(level)) {
        total += count;
      }
    }
  }
  return total;
}

export default function SchoolCard({
  school,
  onDelete,
  mode,
}: SchoolCardProps) {
  const { userProfile } = useAuth();
  const levelLabels = school.levels
    .map((l) => SCHOOL_LEVEL_LABELS[l as SchoolLevel] || l)
    .join(' / ');
  const studentCount = totalStudents(school.studentCounts);

  const moduleCount = school.selectedModules.length;
  const moduleText =
    moduleCount > 0
      ? moduleCount === 1
        ? '1 module'
        : `${moduleCount} modules`
      : 'Geen modules';

  const diaModules =
    school.moduleSetups?.filter((m) => m.currentProvider === 'dia').length ?? 0;
  const moduleSummary =
    diaModules > 0 ? `${moduleText}, ${diaModules} bij DIA` : moduleText;

  const primaryContact = school.contacts?.find((c) => c.isPrimary);

  const latestConversation = school.conversations?.length
    ? school.conversations.reduce((latest, conv) =>
        new Date(conv.date) > new Date(latest.date) ? conv : latest,
      )
    : null;

  const nextAction = school.actions?.find((a) => a.status === 'todo');

  const upsellData = useMemo(() => {
    if (!school.moduleSetups || school.moduleSetups.length === 0) {
      return { count: 0, hasGreenSignals: false };
    }
    try {
      const comparisonResult = calculateComparison(
        school.selectedModules,
        school.studentCounts,
      );
      const opportunities = calculateUpsell(
        school.moduleSetups,
        comparisonResult,
      );
      return {
        count: opportunities.length,
        hasGreenSignals: opportunities.some(
          (o) => o.signalStrength === 'green',
        ),
      };
    } catch {
      return { count: 0, hasGreenSignals: false };
    }
  }, [school.selectedModules, school.studentCounts, school.moduleSetups]);

  const isCompact = mode === 'compact';
  const borderColor =
    PIPELINE_BORDER_COLORS[school.pipelineStatus] || 'border-l-neutral-200';

  return (
    <Link
      to={school.isComplete ? '/scholen/$slug' : '/scholen/$slug/wizard/$step'}
      params={school.isComplete ? { slug: school.slug } : { slug: school.slug, step: '1' }}
      className={`block bg-white border border-neutral-200 border-l-[3px] ${borderColor} rounded-lg hover:shadow-md hover:border-neutral-300 transition-all duration-150 focus:outline-2 focus:outline-cito-primary focus:outline-offset-2 relative group ${
        isCompact ? 'p-4' : 'p-5'
      }`}
    >
      {/* Delete button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(school);
        }}
        className="absolute top-3 right-3 p-1.5 rounded-md text-neutral-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
        aria-label={`${school.name} verwijderen`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>

      {/* Header: school name */}
      <div className="pr-8 mb-1.5">
        <h3
          className={`font-semibold text-cito-primary truncate ${isCompact ? 'text-[15px]' : 'text-base'}`}
        >
          {school.name}
        </h3>
      </div>

      {/* Meta row: date + badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[12px] text-neutral-400">
          {dateFormatter.format(new Date(school.updatedAt))}
        </span>
        <PipelineBadge status={school.pipelineStatus} size="sm" />
        {!school.isComplete && <IncompleteIndicator />}
        <UpsellBadge
          count={upsellData.count}
          hasGreenSignals={upsellData.hasGreenSignals}
        />
      </div>

      {/* Extended mode details */}
      {!isCompact && (
        <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2">
          {/* Level + students row */}
          <div className="flex items-center gap-4 text-[13px]">
            {levelLabels && (
              <span className="flex items-center gap-1.5 text-neutral-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-neutral-400 flex-shrink-0"
                  aria-hidden="true"
                >
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 12 3 12 0v-5" />
                </svg>
                <span className="truncate">{levelLabels}</span>
              </span>
            )}
            {studentCount > 0 && (
              <span className="flex items-center gap-1.5 text-neutral-600 flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-neutral-400"
                  aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {studentCount.toLocaleString('nl-NL')}
              </span>
            )}
          </div>

          {/* Modules */}
          <div className="flex items-center gap-1.5 text-[13px] text-neutral-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-neutral-400 flex-shrink-0"
              aria-hidden="true"
            >
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
            </svg>
            <span className="truncate">{moduleSummary}</span>
          </div>

          {/* Contact */}
          {primaryContact && (
            <div className="flex items-center gap-1.5 text-[13px] text-neutral-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-neutral-400 flex-shrink-0"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="truncate">{primaryContact.name}</span>
            </div>
          )}

          {/* Footer: badges + signals */}
          <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
            <DmuProgressIndicator contacts={school.contacts ?? []} />
            {school.ownerName && (
              <OwnerBadge
                ownerName={school.ownerName}
                isCurrentUser={school.ownerId === userProfile?.id}
              />
            )}
            {latestConversation && (
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-neutral-300"
                  aria-hidden="true"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {dateFormatter.format(new Date(latestConversation.date))}
              </span>
            )}
          </div>

          {/* Next action */}
          {nextAction && (
            <div className="flex items-center gap-1.5 text-[12px] text-cito-accent font-medium bg-orange-50 rounded-md px-2 py-1 -mx-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="flex-shrink-0"
                aria-hidden="true"
              >
                <path d="m9 11-6 6v3h9l3-3" />
                <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
              </svg>
              <span className="truncate">{nextAction.title}</span>
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
