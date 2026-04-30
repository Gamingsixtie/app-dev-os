import type { ModuleCurrentSetup, Scenario } from '../models/school';

export interface DetectScenarioOptions {
  /** When true, recommends 'C' instead of 'B' for all-cito-oud scenarios */
  forRetentionComparison?: boolean;
}

export interface ScenarioDetection {
  /** Recommended scenario: 'A' (current vs. Cito), 'B' (migration old → new Cito platform), or 'C' (retention: current Cito vs. competitor). */
  recommended: Scenario;
  /** At least one module on 'cito-oud' — candidate for migration. */
  hasMigrationModules: boolean;
  /** At least one module on dia/jij/saqi/overig — competitor switch. */
  hasCompetitorModules: boolean;
  /** At least one module with 'geen' — upsell opportunity. */
  hasUpsellModules: boolean;
  /** Module IDs currently on cito-oud. */
  migrationModuleIds: string[];
  /** Module IDs currently on dia/jij/saqi/overig. */
  competitorModuleIds: string[];
  /** Module IDs not in use — potential upsell. */
  upsellModuleIds: string[];
  /** Both migration and competitor modules present. */
  isMixed: boolean;
}

const COMPETITOR_PROVIDERS = new Set(['dia', 'jij', 'saqi', 'overig']);

/**
 * Pure function: detect the best comparison scenario from a school's module setups.
 * Does not modify any external state.
 */
export function detectScenario(moduleSetups: ModuleCurrentSetup[], options?: DetectScenarioOptions): ScenarioDetection {
  const migrationModuleIds: string[] = [];
  const competitorModuleIds: string[] = [];
  const upsellModuleIds: string[] = [];

  for (const setup of moduleSetups) {
    if (setup.currentProvider === 'cito-oud') {
      migrationModuleIds.push(setup.moduleId);
    } else if (COMPETITOR_PROVIDERS.has(setup.currentProvider)) {
      competitorModuleIds.push(setup.moduleId);
    } else if (setup.currentProvider === 'geen') {
      upsellModuleIds.push(setup.moduleId);
    }
    // 'cito-nieuw' = already on new platform, no action needed
  }

  const hasMigrationModules = migrationModuleIds.length > 0;
  const hasCompetitorModules = competitorModuleIds.length > 0;
  const hasUpsellModules = upsellModuleIds.length > 0;
  const isMixed = hasMigrationModules && (hasCompetitorModules || hasUpsellModules);

  // Only recommend B (migration) or C (retention comparison) when ALL active modules are on cito-oud
  // Mixed or competitor → A (current-vs-proposed handles everything, with CTA to migration)
  const recommended: Scenario =
    hasMigrationModules && !hasCompetitorModules && !hasUpsellModules
      ? (options?.forRetentionComparison ? 'C' : 'B')
      : 'A';

  return {
    recommended,
    hasMigrationModules,
    hasCompetitorModules,
    hasUpsellModules,
    migrationModuleIds,
    competitorModuleIds,
    upsellModuleIds,
    isMixed,
  };
}
