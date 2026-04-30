import type { ComparisonResult } from './price-comparison';
import type { ModuleCurrentSetup } from '@/models/school';
import { DIA_PACKAGES } from '@/data/dia-packages';
import { DEFAULT_PRICES } from '@/data/default-prices';
import { CITO_BUNDLES } from '@/data/cito-bundles';
import { JIJ_LICENSE_TIERS } from '@/data/jij-license-tiers';
import { getDiaVolumeDiscountPercent } from './dia-packages';
import { MODULE_DIFFERENTIATORS } from '@/data/differentiators';
import { getTotalStudents } from './price-comparison';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SchijnvoordeelType =
  | 'dia-pakket-illusie'
  | 'jij-gratis-module-illusie'
  | 'appels-peren-vergelijking'
  | 'bundel-effecten'
  | 'volume-illusie'
  | 'functionele-gap';

export type SchijnvoordeelSeverity = 'info' | 'warning' | 'critical';

export interface SchijnvoordeelWarning {
  type: SchijnvoordeelType;
  severity: SchijnvoordeelSeverity;
  title: string;
  explanation: string;
  affectedModules: string[];
  citoAdvantage: string;
}

// ─── Detection functions ──────────────────────────────────────────────────────

/**
 * DIA lijkt goedkoop per module (€3,36) maar bij 2+ modules stijgt de
 * pakketprijs en wordt het verschil met Cito kleiner dan verwacht.
 */
export function detectDiaPakketIllusie(
  selectedModules: string[],
): SchijnvoordeelWarning | null {
  // Only relevant when 2+ modules selected that DIA offers
  const diaModules = selectedModules.filter((m) =>
    DEFAULT_PRICES.some((p) => p.moduleId === m && p.provider === 'dia'),
  );
  if (diaModules.length < 2) return null;

  // Calculate individual DIA cost
  const individualTotal = diaModules.reduce((sum, m) => {
    const price = DEFAULT_PRICES.find((p) => p.moduleId === m && p.provider === 'dia');
    return sum + (price?.amountPerStudent ?? 0);
  }, 0);

  // Find best DIA package
  const matchingPkgs = DIA_PACKAGES.filter(
    (pkg) =>
      pkg.includedModuleIds.filter((id) => diaModules.includes(id)).length >= pkg.minModules,
  ).sort((a, b) => a.pricePerStudent - b.pricePerStudent);

  if (matchingPkgs.length === 0) return null;

  const bestPkg = matchingPkgs[0];
  // If package is MORE expensive than individual, that's the illusion
  if (bestPkg.pricePerStudent <= individualTotal * 0.95) return null;

  return {
    type: 'dia-pakket-illusie',
    severity: 'warning',
    title: 'DIA pakketprijs-illusie',
    explanation: (() => {
      const savingsPct = (1 - bestPkg.pricePerStudent / individualTotal) * 100;
      const savingsText = savingsPct >= 0
        ? `slechts ${savingsPct.toFixed(0)}% korting`
        : `${Math.abs(savingsPct).toFixed(0)}% duurder dan individueel`;
      return `DIA lijkt goedkoop per module (€${individualTotal.toFixed(2)} voor ${diaModules.length} modules individueel), maar het pakket "${bestPkg.name}" kost €${bestPkg.pricePerStudent.toFixed(2)}/lln — ${savingsText}. Het Cito Basis-pakket biedt 3 kernmodules voor €23,45/lln.`;
    })(),
    affectedModules: diaModules,
    citoAdvantage: 'Cito Basis bundel biedt 3 kernmodules met adaptieve toetsing en remediëring in één pakket.',
  };
}

/**
 * JIJ! SEF/Hart & Handen = €0 per module, maar de school betaalt al
 * een forse basislicentie (€290-€5.330/jaar).
 */
export function detectJijGratisModuleIllusie(
  selectedModules: string[],
  studentCounts: Partial<Record<string, Record<number, number>>>,
): SchijnvoordeelWarning | null {
  if (!selectedModules.includes('sociaal-emotioneel')) return null;

  const jijSef = DEFAULT_PRICES.find(
    (p) => p.moduleId === 'sociaal-emotioneel' && p.provider === 'jij',
  );
  if (!jijSef || jijSef.amountPerStudent !== 0) return null;

  const totalStudents = getTotalStudents(studentCounts);
  if (totalStudents === 0) return null;

  // Find the tier this school would fall in
  const totalAdmin = totalStudents * 2;
  const tier = JIJ_LICENSE_TIERS.find(
    (t) => totalAdmin >= t.minAdministrations && totalAdmin <= t.maxAdministrations,
  ) ?? JIJ_LICENSE_TIERS[JIJ_LICENSE_TIERS.length - 1];

  return {
    type: 'jij-gratis-module-illusie',
    severity: 'critical',
    title: 'JIJ! "gratis" sociaal-emotioneel is niet gratis',
    explanation: `JIJ! Hart & Handen staat als €0/lln, maar vereist een basislicentie van €${tier.annualFee.toLocaleString('nl-NL')}/jaar (${tier.label}). De werkelijke kosten zijn inbegrepen in de licentieprijs. Cito SEF kost €3,00/lln zónder verplichte basislicentie.`,
    affectedModules: ['sociaal-emotioneel'],
    citoAdvantage: 'Cito SEF: transparante prijs per leerling, geen verplichte basislicentie.',
  };
}

/**
 * JIJ! rekent per toetsafname, DIA per leerling, Cito per leerling.
 * Directe vergelijking is misleidend.
 */
export function detectAppelsPerenVergelijking(
  selectedModules: string[],
  studentCounts: Partial<Record<string, Record<number, number>>>,
): SchijnvoordeelWarning | null {
  const totalStudents = getTotalStudents(studentCounts);
  if (totalStudents === 0) return null;

  // Check if JIJ modules are selected
  const jijModules = selectedModules.filter((m) =>
    DEFAULT_PRICES.some((p) => p.moduleId === m && p.provider === 'jij'),
  );
  if (jijModules.length === 0) return null;

  return {
    type: 'appels-peren-vergelijking',
    severity: 'info',
    title: 'Verschillende prijsmodellen — niet direct vergelijkbaar',
    explanation: `JIJ! hanteert een licentie + toetsprijs-model (vast bedrag + €${JIJ_LICENSE_TIERS[2].pricePerTest.toFixed(2)}/afname). DIA rekent per leerling. De vergelijking is genormaliseerd naar prijs per leerling, maar werkelijke JIJ!-kosten variëren sterk met schoolgrootte (${totalStudents} lln) en aantal afnames.`,
    affectedModules: jijModules,
    citoAdvantage: 'Cito: eenvoudig per-leerling model, voorspelbare kosten ongeacht afnamefrequentie.',
  };
}

/**
 * Cito Basis bundel (3 kern voor €23,45) vs. DIA los (3× €3,36 = €10,08)
 * lijkt een groot verschil, maar Cito biedt meer functionaliteit.
 */
export function detectBundelEffecten(
  selectedModules: string[],
): SchijnvoordeelWarning | null {
  const basisBundle = CITO_BUNDLES.find((b) => b.id === 'basis');
  if (!basisBundle) return null;

  const kernModules = basisBundle.includedModuleIds;
  const selectedKern = selectedModules.filter((m) => kernModules.includes(m));

  if (selectedKern.length < 2) return null;

  // Calculate DIA individual for these modules
  const diaTotal = selectedKern.reduce((sum, m) => {
    const price = DEFAULT_PRICES.find((p) => p.moduleId === m && p.provider === 'dia');
    return sum + (price?.amountPerStudent ?? 0);
  }, 0);

  const citoPerModule = (basisBundle.pricePerStudent ?? 23.45) / kernModules.length;
  const citoTotal = citoPerModule * selectedKern.length;

  if (diaTotal >= citoTotal) return null; // No illusion if DIA is not cheaper

  const diff = citoTotal - diaTotal;

  return {
    type: 'bundel-effecten',
    severity: 'warning',
    title: `DIA €${diff.toFixed(2)}/lln goedkoper — maar vergelijk de inhoud`,
    explanation: `DIA biedt ${selectedKern.length} kernmodules voor €${diaTotal.toFixed(2)}/lln vs. Cito Basis €${citoTotal.toFixed(2)}/lln. Het verschil van €${diff.toFixed(2)}/lln omvat echter Cito's adaptieve toetsafname en remediëring in samenwerking met methodeaanbieders — functies die DIA niet biedt.`,
    affectedModules: selectedKern,
    citoAdvantage: 'Cito Basis bevat adaptieve toetsing en remediëring — de meerprijs levert concreet tijdwinst op.',
  };
}

/**
 * DIA staffelkorting (5%/10%) klinkt aantrekkelijk maar is
 * absoluut gezien < €1 per leerling.
 */
export function detectVolumeIllusie(
  selectedModules: string[],
  studentCounts: Partial<Record<string, Record<number, number>>>,
): SchijnvoordeelWarning | null {
  const totalStudents = getTotalStudents(studentCounts);
  const discountPercent = getDiaVolumeDiscountPercent(totalStudents);
  if (discountPercent === 0) return null;

  const diaModules = selectedModules.filter((m) =>
    DEFAULT_PRICES.some((p) => p.moduleId === m && p.provider === 'dia'),
  );
  if (diaModules.length === 0) return null;

  // Calculate absolute savings per student
  const avgDiaPrice =
    diaModules.reduce((sum, m) => {
      const price = DEFAULT_PRICES.find((p) => p.moduleId === m && p.provider === 'dia');
      return sum + (price?.amountPerStudent ?? 0);
    }, 0) / diaModules.length;

  const absoluteSaving = avgDiaPrice * (discountPercent / 100);

  if (absoluteSaving >= 1.0) return null; // Meaningful discount, no illusion

  return {
    type: 'volume-illusie',
    severity: 'info',
    title: `DIA ${discountPercent}% staffelkorting = slechts €${absoluteSaving.toFixed(2)}/lln`,
    explanation: `Bij ${totalStudents.toLocaleString('nl-NL')} leerlingen geeft DIA ${discountPercent}% korting. Dat klinkt aantrekkelijk, maar is gemiddeld slechts €${absoluteSaving.toFixed(2)} per leerling per module — minder dan €1.`,
    affectedModules: diaModules,
    citoAdvantage: 'Cito biedt meerjarencontracten met 5-10% korting én DUO-subsidie — structureel hogere besparing.',
  };
}

/**
 * Concurrent is goedkoper maar mist key differentiators
 * (adaptief, remediëring, etc.)
 */
export function detectFunctioneleGap(
  _selectedModules: string[],
  comparisonResult: ComparisonResult,
): SchijnvoordeelWarning[] {
  const warnings: SchijnvoordeelWarning[] = [];

  for (const mod of comparisonResult.modules) {
    const citoPrice = mod.providers.cito?.pricePerStudent;
    if (citoPrice == null) continue;

    const diffEntry = MODULE_DIFFERENTIATORS.find((d) => d.moduleId === mod.moduleId);
    if (!diffEntry) continue;

    const citoDiffs = diffEntry.cito;
    if (citoDiffs.length === 0) continue;

    for (const providerKey of ['dia', 'jij'] as const) {
      const providerPrice = mod.providers[providerKey]?.pricePerStudent;
      if (providerPrice == null || providerPrice >= citoPrice) continue;

      const providerDiffs = diffEntry[providerKey];
      const citoExclusive = citoDiffs.filter((d) => !providerDiffs.includes(d));

      if (citoExclusive.length === 0) continue;

      const providerLabel = providerKey === 'dia' ? 'DIA' : 'JIJ!';
      const saving = citoPrice - providerPrice;

      warnings.push({
        type: 'functionele-gap',
        severity: 'warning',
        title: `${providerLabel} €${saving.toFixed(2)}/lln goedkoper voor ${mod.moduleName} — maar mist functionaliteit`,
        explanation: `${providerLabel} biedt ${mod.moduleName} voor €${providerPrice.toFixed(2)}/lln vs. Cito €${citoPrice.toFixed(2)}/lln. Cito biedt echter: ${citoExclusive.join(', ')}.`,
        affectedModules: [mod.moduleId],
        citoAdvantage: citoExclusive.join(' | '),
      });
    }
  }

  return warnings;
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Detect all schijnvoordelen (apparent advantages that are misleading)
 * for the current wizard state.
 *
 * Pure function: no side effects, no state mutations.
 */
export function detectSchijnvoordelen(
  selectedModules: string[],
  studentCounts: Partial<Record<string, Record<number, number>>>,
  comparisonResult: ComparisonResult,
  _moduleSetups?: ModuleCurrentSetup[],
): SchijnvoordeelWarning[] {
  if (selectedModules.length === 0) return [];

  const warnings: SchijnvoordeelWarning[] = [];

  const diaPakket = detectDiaPakketIllusie(selectedModules);
  if (diaPakket) warnings.push(diaPakket);

  const jijGratis = detectJijGratisModuleIllusie(selectedModules, studentCounts);
  if (jijGratis) warnings.push(jijGratis);

  const appelsPeren = detectAppelsPerenVergelijking(selectedModules, studentCounts);
  if (appelsPeren) warnings.push(appelsPeren);

  const bundel = detectBundelEffecten(selectedModules);
  if (bundel) warnings.push(bundel);

  const volume = detectVolumeIllusie(selectedModules, studentCounts);
  if (volume) warnings.push(volume);

  const functioneel = detectFunctioneleGap(selectedModules, comparisonResult);
  warnings.push(...functioneel);

  return warnings;
}
