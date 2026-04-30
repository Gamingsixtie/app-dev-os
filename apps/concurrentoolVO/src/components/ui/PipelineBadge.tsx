import type { PipelineStatus } from '@/models/school';
import { PIPELINE_STATUS_LABELS } from '@/models/school';

const PIPELINE_BADGE_STYLES: Record<PipelineStatus, string> = {
  prospect: 'bg-neutral-100 text-neutral-600 border-neutral-300',
  'contact-gelegd': 'bg-blue-50 text-blue-700 border-blue-200',
  'demo-presentatie': 'bg-purple-50 text-purple-700 border-purple-200',
  offerte: 'bg-orange-50 text-orange-700 border-orange-200',
  gewonnen: 'bg-green-50 text-green-700 border-green-200',
  verloren: 'bg-red-50 text-red-700 border-red-200',
};

interface PipelineBadgeProps {
  status: PipelineStatus;
  size?: 'sm' | 'md';
}

export default function PipelineBadge({ status, size = 'md' }: PipelineBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0 text-[12px]' : 'px-2 py-0.5 text-[14px]';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-normal ${sizeClasses} ${PIPELINE_BADGE_STYLES[status]}`}
    >
      {PIPELINE_STATUS_LABELS[status]}
    </span>
  );
}
