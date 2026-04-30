import KansCard from './KansCard';
import type {
  SchoolplanOpportunity,
  AlsoRelevantItem,
  OpportunityAnnotation,
  RelevanceScore,
} from '../schemas/schoolplan-analysis.schema';

interface KansCardListProps {
  opportunities: SchoolplanOpportunity[];
  alsoRelevant: AlsoRelevantItem[];
  annotations: Record<string, OpportunityAnnotation>;
  onAnnotationChange: (index: number, annotation: OpportunityAnnotation) => void;
}

const RELEVANCE_ORDER: Record<RelevanceScore, number> = {
  hoog: 0,
  midden: 1,
  laag: 2,
};

/**
 * Sorted list of KansCards with main opportunities and "Mogelijk ook relevant" section.
 * Opportunities are sorted by relevance: hoog first, then midden, then laag.
 */
export default function KansCardList({
  opportunities,
  alsoRelevant,
  annotations,
  onAnnotationChange,
}: KansCardListProps) {
  // Sort opportunities by relevance (hoog first)
  const sorted = [...opportunities].sort(
    (a, b) => RELEVANCE_ORDER[a.relevance] - RELEVANCE_ORDER[b.relevance],
  );

  return (
    <div>
      {/* Main kansen section */}
      <h3 className="text-xl font-semibold text-cito-primary mb-6">Kansen uit uw schoolplan</h3>
      <div className="flex flex-col gap-6">
        {sorted.map((opp) => {
          // Find the original index for annotation tracking
          const originalIndex = opportunities.indexOf(opp);
          return (
            <KansCard
              key={originalIndex}
              opportunity={opp}
              index={originalIndex}
              annotation={annotations[String(originalIndex)]}
              onAnnotationChange={onAnnotationChange}
              variant="full"
            />
          );
        })}
      </div>

      {/* "Mogelijk ook relevant" section */}
      {alsoRelevant.length > 0 && (
        <div className="border-t border-neutral-200 mt-12 pt-12">
          <h3 className="text-lg font-semibold text-neutral-700">Mogelijk ook relevant</h3>
          <p className="text-sm text-neutral-400 mb-6">
            Kansen die niet in het schoolplan staan maar relevant kunnen zijn op basis van schooltype
            en huidig productgebruik
          </p>
          <div className="flex flex-col gap-6">
            {alsoRelevant.map((item, i) => {
              // Map AlsoRelevantItem to SchoolplanOpportunity shape for KansCard reuse
              const mappedOpp: SchoolplanOpportunity = {
                theme: '',
                citoProduct: item.citoProduct,
                moduleId: item.moduleId,
                explanation: item.reason,
                conversationTip: item.reason,
                relevance: item.relevance,
                quote: '',
                competitorVulnerabilities: [],
              };
              return (
                <KansCard
                  key={`also-${i}`}
                  opportunity={mappedOpp}
                  index={opportunities.length + i}
                  annotation={undefined}
                  onAnnotationChange={onAnnotationChange}
                  variant="compact"
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
