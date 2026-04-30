import type { DMUPosition } from '@/models/school';
import { DMU_POSITION_LABELS } from '@/models/school';

const DMU_BADGE_STYLES: Record<DMUPosition, string> = {
  beslisser: 'bg-purple-100 text-purple-800',
  inkoper: 'bg-green-100 text-green-800',
  adviseur: 'bg-sky-100 text-sky-800',
  gebruiker: 'bg-blue-100 text-blue-800',
  beinvloeder: 'bg-amber-100 text-amber-800',
  overig: 'bg-neutral-100 text-neutral-700',
};

interface DMUBadgeProps {
  position: DMUPosition;
  size?: 'sm' | 'md';
}

export default function DMUBadge({ position, size = 'sm' }: DMUBadgeProps) {
  const sizeClass = size === 'md' ? 'text-[14px] px-3 py-1' : 'text-[14px] px-2 py-0.5';
  return (
    <span
      className={`inline-flex items-center rounded-full ${sizeClass} ${DMU_BADGE_STYLES[position]}`}
    >
      {DMU_POSITION_LABELS[position]}
    </span>
  );
}
