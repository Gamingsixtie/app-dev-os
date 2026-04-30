/**
 * Step 1: Gespreksnotities — conversation notes input with AI extraction trigger.
 * User enters notes or skips with "Niet bekend" to proceed to variant selection.
 */

import { useState } from 'react';
import { useWizardStore } from './wizard-store';
import { useSchoolProfileStore } from '@/features/school-profile/store';
import { extractVariantsFromNotes } from '@/lib/ai-wizard';

export function WizardStep1Notes() {
  const conversationNotes = useWizardStore((s) => s.conversationNotes);
  const setConversationNotes = useWizardStore((s) => s.setConversationNotes);
  const isExtracting = useWizardStore((s) => s.isExtracting);
  const setIsExtracting = useWizardStore((s) => s.setIsExtracting);
  const setExtractionResult = useWizardStore((s) => s.setExtractionResult);
  const setStep = useWizardStore((s) => s.setStep);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);

  const [error, setError] = useState<string | null>(null);

  const handleSkip = () => {
    setExtractionResult({ selections: [], uitleg: '' });
    setStep(1);
  };

  const handleNext = async () => {
    if (!conversationNotes.trim()) return;

    setError(null);
    setIsExtracting(true);

    try {
      const result = await extractVariantsFromNotes(conversationNotes, selectedModules);
      setExtractionResult(result);
      setStep(1);
    } catch {
      setError('De notities konden niet worden geanalyseerd. U kunt de varianten handmatig selecteren in de volgende stap.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-[15px] font-semibold text-neutral-900">
        Wat weet u over het huidige gebruik van deze school?
      </h3>

      <textarea
        value={conversationNotes}
        onChange={(e) => setConversationNotes(e.target.value)}
        disabled={isExtracting}
        rows={4}
        placeholder="Beschrijf het gesprek met de school: welke toetsaanbieders worden gebruikt, welke pakketten, bijzonderheden..."
        className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm leading-relaxed placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-cito-accent/30 focus:border-cito-accent disabled:opacity-50 disabled:cursor-not-allowed resize-y"
      />

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          type="button"
          onClick={handleSkip}
          disabled={isExtracting}
          className="text-sm font-medium text-neutral-500 hover:text-neutral-700 transition-colors min-h-[44px] px-4 disabled:opacity-50"
        >
          Niet bekend &mdash; handmatig selecteren
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!conversationNotes.trim() || isExtracting}
          className={`
            inline-flex items-center justify-center gap-2 px-6 min-h-[44px] rounded-lg text-sm font-semibold text-white
            transition-colors
            ${isExtracting
              ? 'bg-cito-accent/70 cursor-not-allowed animate-pulse'
              : 'bg-cito-accent hover:bg-cito-accent/90 disabled:opacity-50 disabled:cursor-not-allowed'
            }
          `}
        >
          {isExtracting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyseren...
            </>
          ) : (
            'Volgende stap'
          )}
        </button>
      </div>

      {/* Allow advancing even after error */}
      {error && (
        <button
          type="button"
          onClick={() => {
            setExtractionResult({ selections: [], uitleg: '' });
            setStep(1);
          }}
          className="text-sm font-medium text-cito-primary hover:text-cito-primary/80 transition-colors min-h-[44px] px-4"
        >
          Doorgaan zonder analyse
        </button>
      )}
    </div>
  );
}
