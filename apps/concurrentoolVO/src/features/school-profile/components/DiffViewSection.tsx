import { useState, type ReactNode } from 'react';

interface DiffViewSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

/**
 * Collapsible section within DiffView with chevron toggle.
 * Header uses section label sub-role styling per UI-SPEC.
 */
export default function DiffViewSection({
  title,
  children,
  defaultExpanded = true,
}: DiffViewSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-neutral-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
          {title}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-5 w-5 text-neutral-400 transition-transform duration-200 ${
            expanded ? 'rotate-90' : ''
          }`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {expanded && <div className="pb-3">{children}</div>}
    </div>
  );
}
