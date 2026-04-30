/**
 * Types for the AI comparison wizard.
 * Manages 3-step wizard state: notes extraction, variant selection, AI advice.
 */

export type WizardScenario = 'deels-concurrent' | 'alles-oud-cito' | 'alles-oud-cito-concurrent' | 'alles-nieuw-cito';

export type VariantConfidence = 'high' | 'low' | 'unknown';

export interface ModuleVariantSelection {
  moduleId: string;
  provider: 'dia' | 'jij' | 'geen';
  variantId: string | null; // DIA package ID (e.g. 'pakket-ne') or JIJ tier number as string (e.g. '1')
  confidence: VariantConfidence;
}

export interface WizardAdviceResult {
  samenvatting: string;
  matchingUitleg: string;
  aanbevolenCitoBundel: 'individual' | 'basis' | 'plus';
  adviezen: Array<{
    titel: string;
    tekst: string;
    type: 'prijs' | 'meerwaarde' | 'bezwaar' | 'kans' | 'strategie';
  }>;
  dmuStrategie?: Record<string, string>;
}

export interface ExtraContextInput {
  korting: string;
  dmuFocus: string;
  bijzonderheden: string;
}

export interface ExtractedVariantResult {
  selections: ModuleVariantSelection[];
  uitleg: string; // AI explanation of what was/wasn't found
}

/** Context from wizard advice that feeds into the analysis panel for progressive enrichment */
export interface WizardNarrativeContext {
  samenvatting: string;
  matchingUitleg: string;
  aanbevolenCitoBundel: string;
  adviezen: Array<{ titel: string; tekst: string; type: string }>;
  dmuStrategie?: Record<string, string>;
}
