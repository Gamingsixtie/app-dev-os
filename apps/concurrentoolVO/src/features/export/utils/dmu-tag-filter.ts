import type { DmuTarget } from '@/features/export/types';

export type DmuTag =
  | 'tijdwinst'
  | 'financieel'
  | 'strategisch'
  | 'dagelijks-gebruik'
  | 'kwaliteit'
  | 'compliance';

/**
 * Maps each DMU target role to the tags that are relevant for that audience.
 */
export const DMU_TAG_MAP: Record<DmuTarget, DmuTag[]> = {
  coordinator: ['tijdwinst', 'dagelijks-gebruik', 'kwaliteit'],
  mt: ['strategisch', 'kwaliteit', 'compliance'],
  finance: ['financieel', 'tijdwinst'],
  generiek: ['tijdwinst', 'financieel', 'strategisch', 'dagelijks-gebruik', 'kwaliteit', 'compliance'],
};

/**
 * Filter items by DMU role relevance. Items must have at least one tag
 * that overlaps with the target role's tag set.
 */
export function filterByDmuTags<T extends { tags: DmuTag[] }>(
  items: T[],
  dmuTarget: DmuTarget,
): T[] {
  const relevantTags = DMU_TAG_MAP[dmuTarget];
  return items.filter((item) => item.tags.some((tag) => relevantTags.includes(tag)));
}

/**
 * Keyword-based tag assignment for schoolplan opportunities.
 * Matches theme + explanation text (lowercased) to assign relevant DMU tags.
 */
export function tagSchoolplanOpportunity(opp: {
  theme: string;
  explanation: string;
}): DmuTag[] {
  const text = `${opp.theme} ${opp.explanation}`.toLowerCase();

  const keywordMap: Array<{ keywords: string[]; tag: DmuTag }> = [
    { keywords: ['tijd', 'effici'], tag: 'tijdwinst' },
    { keywords: ['kosten', 'besparing', 'budget'], tag: 'financieel' },
    { keywords: ['visie', 'strateg', 'toekomst', 'beleid'], tag: 'strategisch' },
    { keywords: ['docent', 'gebruik', 'afname'], tag: 'dagelijks-gebruik' },
    { keywords: ['kwaliteit', 'validatie', 'betrouwba'], tag: 'kwaliteit' },
  ];

  const matched: DmuTag[] = [];

  for (const { keywords, tag } of keywordMap) {
    if (keywords.some((kw) => text.includes(kw))) {
      matched.push(tag);
    }
  }

  // Default: show for all major roles when no keywords match
  if (matched.length === 0) {
    return ['tijdwinst', 'financieel', 'strategisch'];
  }

  return matched;
}
