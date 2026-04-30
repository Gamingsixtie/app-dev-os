/**
 * Variant suggestion functions for the AI comparison wizard.
 * Recommends the cheapest DIA package and correct JIJ tier for a school.
 */

import type { DiaPackage } from '@/models/dia-packages';
import { DIA_PACKAGES } from '@/data/providers/dia';
import type { JijLicenseTier } from '@/data/providers/jij';
import { JIJ_LICENSE_TIERS } from '@/data/providers/jij';

/**
 * Suggest the cheapest DIA package that covers ALL selected module IDs
 * that are available in DIA's catalog.
 *
 * Returns null if no package covers any of the selected modules.
 */
export function suggestDiaPackage(selectedModuleIds: string[]): DiaPackage | null {
  if (selectedModuleIds.length === 0) {
    return null;
  }

  // Find which of the selected modules are available in any DIA package
  const diaAvailableModules = selectedModuleIds.filter((moduleId) =>
    DIA_PACKAGES.some((pkg) => pkg.includedModuleIds.includes(moduleId)),
  );

  if (diaAvailableModules.length === 0) {
    return null;
  }

  // Filter packages where ALL DIA-available selected modules are included
  const qualifyingPackages = DIA_PACKAGES.filter((pkg) =>
    diaAvailableModules.every((moduleId) => pkg.includedModuleIds.includes(moduleId)),
  );

  if (qualifyingPackages.length === 0) {
    return null;
  }

  // Sort by price ascending and return cheapest
  qualifyingPackages.sort((a, b) => a.pricePerStudent - b.pricePerStudent);
  return qualifyingPackages[0];
}

/**
 * Suggest the appropriate JIJ license tier based on total students and tests per student.
 *
 * Falls back to the smallest tier (tier 4) if total administrations fall below all ranges.
 */
export function suggestJijTier(
  totalStudents: number,
  testsPerStudent: number = 2,
): JijLicenseTier {
  const totalAdmins = totalStudents * testsPerStudent;

  const matchingTier = JIJ_LICENSE_TIERS.find(
    (t) => totalAdmins >= t.minAdministrations && totalAdmins <= t.maxAdministrations,
  );

  // Default to last tier (smallest) if below all ranges
  return matchingTier ?? JIJ_LICENSE_TIERS[JIJ_LICENSE_TIERS.length - 1];
}
