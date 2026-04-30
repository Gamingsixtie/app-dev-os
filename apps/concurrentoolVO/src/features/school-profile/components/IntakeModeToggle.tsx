interface IntakeModeToggleProps {
  mode: 'manual' | 'ai';
  onChange: (mode: 'manual' | 'ai') => void;
}

/**
 * Segmented control toggle between "Handmatig" and "AI-intake" modes.
 * Rendered at the top of the ConversationForm when creating a new conversation.
 */
export default function IntakeModeToggle({ mode, onChange }: IntakeModeToggleProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="inline-flex rounded-lg border border-neutral-200 overflow-hidden">
        <button
          type="button"
          onClick={() => onChange('manual')}
          className={`h-[44px] px-5 text-[14px] font-semibold transition-colors ${
            mode === 'manual'
              ? 'bg-cito-primary text-white'
              : 'bg-white text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          Handmatig
        </button>
        <button
          type="button"
          onClick={() => onChange('ai')}
          className={`h-[44px] px-5 text-[14px] font-semibold transition-colors ${
            mode === 'ai'
              ? 'bg-cito-primary text-white'
              : 'bg-white text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          AI-intake
        </button>
      </div>

      {mode === 'ai' && (
        <span className="inline-flex items-center bg-cito-primary/10 text-cito-primary rounded px-2 py-1 text-sm font-semibold">
          AI-modus actief
        </span>
      )}
    </div>
  );
}
