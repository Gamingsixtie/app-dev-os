/**
 * Scenario detection for the AI comparison wizard.
 * Determines which wizard flow to use based on the school's current provider setup.
 */

import type { ModuleCurrentSetup } from '@/models/school';
import type { WizardScenario } from './types';

/**
 * Detect which scenario applies based on current module setups.
 *
 * - 'alles-oud-cito': all modules use cito-oud (migration scenario)
 * - 'alles-nieuw-cito': all modules use cito-nieuw (already on new platform)
 * - 'deels-concurrent': mixed providers, empty list, or any other case
 */
export function detectScenario(moduleSetups: ModuleCurrentSetup[]): WizardScenario {
  if (moduleSetups.length === 0) {
    return 'deels-concurrent';
  }

  const allOudCito = moduleSetups.every((s) => s.currentProvider === 'cito-oud');
  if (allOudCito) {
    return 'alles-oud-cito';
  }

  const allNieuwCito = moduleSetups.every((s) => s.currentProvider === 'cito-nieuw');
  if (allNieuwCito) {
    return 'alles-nieuw-cito';
  }

  return 'deels-concurrent';
}
