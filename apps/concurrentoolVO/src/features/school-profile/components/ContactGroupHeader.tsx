import { useState } from 'react';
import type { DMUPosition } from '@/models/school';
import DMUBadge from '@/components/ui/DMUBadge';

interface ContactGroupHeaderProps {
  role: DMUPosition;
  count: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export default function ContactGroupHeader({
  role,
  count,
  defaultExpanded = true,
  children,
}: ContactGroupHeaderProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full h-[44px] text-left"
        aria-expanded={expanded}
      >
        <DMUBadge position={role} size="md" />
        <span className="text-[14px] text-neutral-500">
          {count} {count === 1 ? 'contact' : 'contacten'}
        </span>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16"
          fill="none"
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {expanded && <div className="flex flex-col gap-4 mt-2">{children}</div>}
    </div>
  );
}
