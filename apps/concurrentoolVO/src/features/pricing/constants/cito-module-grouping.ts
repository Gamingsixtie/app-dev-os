/**
 * Module categorization for the /prijzen Concurrentie tab cross-provider views.
 *
 * Categories are provider-agnostic and apply to any provider's module-ids.
 * Used by:
 * - Concurrentie sub-tabs "Sociaal-emotioneel" / "Executieve functies" / "Overig"
 *   to show modules of that category across DIA + JIJ + SAQI side-by-side.
 *
 * Cito Basisvaardigheden tab does NOT use this — Cito renders via its own
 * platform+module pricing form (basis/plus/individueel bundles).
 */

/** Category sub-tab on the Concurrentie tab (cross-provider category views). */
export type ConcurrentieCategory = 'sociaal-emotioneel' | 'executieve' | 'overig';

/** "Basisvaardigheden": kern-skills die Cito ook aanbiedt — alternatieven hiervoor
 * staan onder de provider-sub-tabs (DIA/JIJ), niet in een eigen categorie-sub-tab. */
export const BASISVAARDIGHEDEN_MODULE_IDS: ReadonlySet<string> = new Set([
  'rekenwiskunde',
  'nederlands',
  'engels',
  'taalverzorging',
]);

/** Sociaal-emotioneel: SocEmo-functioneren en welzijns-indicatoren. */
export const SOCIAAL_EMOTIONEEL_MODULE_IDS: ReadonlySet<string> = new Set([
  'sociaal-emotioneel',
]);

/** Executieve functies: leer-werkhouding + cognitieve capaciteiten. */
export const EXECUTIEVE_MODULE_IDS: ReadonlySet<string> = new Set([
  'leer-werkhouding',
  'cognitieve-capaciteiten',
]);

/** Returns the category for a given module id, or 'overig' if not classified. */
export function getModuleCategory(moduleId: string): ConcurrentieCategory | 'basisvaardigheden' {
  if (BASISVAARDIGHEDEN_MODULE_IDS.has(moduleId)) return 'basisvaardigheden';
  if (SOCIAAL_EMOTIONEEL_MODULE_IDS.has(moduleId)) return 'sociaal-emotioneel';
  if (EXECUTIEVE_MODULE_IDS.has(moduleId)) return 'executieve';
  return 'overig';
}

/** True if the module id falls in the given Concurrentie category sub-tab. */
export function moduleInCategory(moduleId: string, category: ConcurrentieCategory): boolean {
  if (category === 'sociaal-emotioneel') return SOCIAAL_EMOTIONEEL_MODULE_IDS.has(moduleId);
  if (category === 'executieve') return EXECUTIEVE_MODULE_IDS.has(moduleId);
  // 'overig': not basisvaardigheden + not sociaal-emotioneel + not executieve
  return (
    !BASISVAARDIGHEDEN_MODULE_IDS.has(moduleId) &&
    !SOCIAAL_EMOTIONEEL_MODULE_IDS.has(moduleId) &&
    !EXECUTIEVE_MODULE_IDS.has(moduleId)
  );
}

/** Human-readable NL labels for each Concurrentie category sub-tab. */
export const CONCURRENTIE_CATEGORY_LABELS: Record<ConcurrentieCategory, string> = {
  'sociaal-emotioneel': 'Sociaal-emotioneel',
  executieve: 'Executieve functies',
  overig: 'Overig',
};
