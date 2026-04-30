import { useState } from 'react';
import type { SchoolplanOpportunity, OpportunityAnnotation, RelevanceScore } from '../schemas/schoolplan-analysis.schema';

interface KansCardProps {
  opportunity: SchoolplanOpportunity;
  index: number;
  annotation?: OpportunityAnnotation;
  onAnnotationChange: (index: number, annotation: OpportunityAnnotation) => void;
  variant?: 'full' | 'compact';
}

const RELEVANCE_CLASSES: Record<RelevanceScore, string> = {
  hoog: 'bg-[#003082] text-white',
  midden: 'bg-amber-500 text-white',
  laag: 'bg-neutral-200 text-neutral-700',
};

const RELEVANCE_LABELS: Record<RelevanceScore, string> = {
  hoog: 'Hoog',
  midden: 'Midden',
  laag: 'Laag',
};

const PROVIDER_LABELS: Record<string, string> = {
  dia: 'DIA',
  jij: 'JIJ!',
};

/**
 * Opportunity card displaying a single kans from the schoolplan analysis.
 * Full variant shows all sections including quote, competitor info, and annotation controls.
 * Compact variant shows only product name, relevance, and explanation (for "Mogelijk ook relevant").
 */
export default function KansCard({
  opportunity,
  index,
  annotation,
  onAnnotationChange,
  variant = 'full',
}: KansCardProps) {
  const [noteText, setNoteText] = useState(annotation?.note ?? '');
  const currentStatus = annotation?.status ?? 'open';
  const isNietRelevant = currentStatus === 'niet-relevant';

  const handleToggleStatus = (targetStatus: OpportunityAnnotation['status']) => {
    const newStatus = currentStatus === targetStatus ? 'open' : targetStatus;
    onAnnotationChange(index, {
      status: newStatus,
      note: annotation?.note ?? '',
      updatedAt: new Date().toISOString(),
      updatedBy: '',
    });
  };

  const handleSaveNote = () => {
    onAnnotationChange(index, {
      status: currentStatus,
      note: noteText,
      updatedAt: new Date().toISOString(),
      updatedBy: '',
    });
  };

  const noteChanged = noteText !== (annotation?.note ?? '');

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-neutral-200 p-6 ${
        isNietRelevant ? 'opacity-60' : ''
      }`}
    >
      {/* Title row */}
      <div className="flex justify-between items-start">
        <h4 className="text-lg font-semibold text-cito-primary">{opportunity.citoProduct}</h4>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ml-3 flex-shrink-0 ${
            RELEVANCE_CLASSES[opportunity.relevance]
          }`}
        >
          {RELEVANCE_LABELS[opportunity.relevance]}
        </span>
      </div>

      {/* Schoolplan-thema */}
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1 mt-4">
        Schoolplan-thema
      </p>
      <p className="text-sm text-neutral-700">{opportunity.theme}</p>

      {/* Toelichting */}
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1 mt-4">
        Toelichting
      </p>
      <p className="text-sm text-neutral-700">{opportunity.explanation}</p>

      {/* Gesprekstip */}
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1 mt-4">
        Gesprekstip
      </p>
      <p className="text-sm text-neutral-700">{opportunity.conversationTip}</p>

      {/* Citaat uit schoolplan (full variant only) */}
      {variant === 'full' && opportunity.quote && (
        <>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1 mt-4">
            Citaat uit schoolplan
          </p>
          <p className="text-sm text-neutral-700 italic border-l-2 border-cito-primary pl-3">
            {opportunity.quote}
          </p>
        </>
      )}

      {/* Concurrentie (full variant only, if vulnerabilities exist) */}
      {variant === 'full' && opportunity.competitorVulnerabilities.length > 0 && (
        <>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1 mt-4">
            Concurrentie
          </p>
          <div className="bg-orange-50 border-l-2 border-[#FF6600] p-3 rounded-r mt-1">
            {opportunity.competitorVulnerabilities.map((v, vi) => (
              <p key={vi} className="text-sm text-neutral-700">
                {PROVIDER_LABELS[v.provider] ?? v.provider}: {v.description}
              </p>
            ))}
          </div>
        </>
      )}

      {/* Status actions row (full variant only) */}
      {variant === 'full' && (
        <div className="flex items-center gap-2 border-t border-neutral-100 pt-4 mt-4 flex-wrap">
          {/* Besproken toggle */}
          <button
            type="button"
            onClick={() => handleToggleStatus('besproken')}
            className={`px-3 py-1 text-xs font-semibold rounded-full border cursor-pointer ${
              currentStatus === 'besproken'
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            Besproken
          </button>

          {/* Niet relevant toggle */}
          <button
            type="button"
            onClick={() => handleToggleStatus('niet-relevant')}
            className={`px-3 py-1 text-xs font-semibold rounded-full border cursor-pointer ${
              currentStatus === 'niet-relevant'
                ? 'bg-neutral-100 text-neutral-500 border-neutral-300'
                : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            Niet relevant
          </button>

          {/* Note input */}
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Notitie toevoegen..."
            className="text-sm border border-neutral-200 rounded px-2 py-1 flex-1 min-h-[44px]"
          />

          {/* Save note button (only when changed) */}
          {noteChanged && (
            <button
              type="button"
              onClick={handleSaveNote}
              className="text-sm text-cito-primary font-semibold hover:underline"
            >
              Notitie opslaan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
