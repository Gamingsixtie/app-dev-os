interface ViewToggleProps {
  activeView: 'list' | 'pipeline';
  onViewChange: (view: 'list' | 'pipeline') => void;
}

export default function ViewToggle({
  activeView,
  onViewChange,
}: ViewToggleProps) {
  return (
    <div className="inline-flex bg-neutral-100 rounded-lg p-0.5">
      <button
        type="button"
        onClick={() => onViewChange('list')}
        className={`h-8 px-2.5 rounded-md inline-flex items-center gap-1.5 text-[13px] font-medium transition-all ${
          activeView === 'list'
            ? 'bg-white shadow-sm text-neutral-700'
            : 'text-neutral-500 hover:text-neutral-700'
        }`}
        aria-label="Lijstweergave"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
        <span className="hidden sm:inline">Lijst</span>
      </button>

      <button
        type="button"
        onClick={() => onViewChange('pipeline')}
        className={`h-8 px-2.5 rounded-md inline-flex items-center gap-1.5 text-[13px] font-medium transition-all ${
          activeView === 'pipeline'
            ? 'bg-white shadow-sm text-neutral-700'
            : 'text-neutral-500 hover:text-neutral-700'
        }`}
        aria-label="Pipelineweergave"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="3" width="6" height="18" rx="1" />
          <rect x="9" y="3" width="6" height="12" rx="1" />
          <rect x="16" y="3" width="6" height="15" rx="1" />
        </svg>
        <span className="hidden sm:inline">Pipeline</span>
      </button>
    </div>
  );
}
