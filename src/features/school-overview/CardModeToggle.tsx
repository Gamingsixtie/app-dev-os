interface CardModeToggleProps {
  mode: 'compact' | 'extended';
  onModeChange: (mode: 'compact' | 'extended') => void;
}

export default function CardModeToggle({ mode, onModeChange }: CardModeToggleProps) {
  return (
    <div className="inline-flex bg-neutral-100 rounded-lg p-1">
      <button
        type="button"
        onClick={() => onModeChange('compact')}
        className={`h-[36px] px-3 rounded-md text-[14px] font-medium transition-all ${
          mode === 'compact'
            ? 'bg-white shadow-sm text-neutral-700'
            : 'text-neutral-500 hover:text-neutral-700'
        }`}
      >
        Compact
      </button>
      <button
        type="button"
        onClick={() => onModeChange('extended')}
        className={`h-[36px] px-3 rounded-md text-[14px] font-medium transition-all ${
          mode === 'extended'
            ? 'bg-white shadow-sm text-neutral-700'
            : 'text-neutral-500 hover:text-neutral-700'
        }`}
      >
        Uitgebreid
      </button>
    </div>
  );
}
