/**
 * Step 2: Variant-selectie — per-module selection of DIA package or JIJ tier.
 * Pre-fills from moduleSetups as base (D-07), overlays AI extraction results.
 * Shows smart suggestions via "Aanbevolen" badge.
 *
 * Basisvaardigheden (RE+NL+EN) can be grouped or set individually:
 * - Grouped: single section with group-level DIA packages (Pakket compleet, Basisvaardigheden 2/1+)
 * - Individual: per-module cards with module-specific packages only
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useWizardStore } from './wizard-store';
import { useSchoolProfileStore } from '@/features/school-profile/store';
import { MODULE_CATALOG } from '@/models/modules';
import { DIA_PACKAGES, getDiaGroupPackages, getDiaModulePackages, BASISVAARDIGHEDEN_MODULE_IDS, DIA_CONFIG } from '@/data/providers/dia';
import { JIJ_LICENSE_TIERS } from '@/data/providers/jij';
import { suggestDiaPackage, suggestJijTier } from './variant-suggestions';
import { getTotalStudents } from '@/engine/price-comparison';
import { VariantCard } from './VariantCard';
import { CitoBundleSelector } from '../CitoBundleSelector';
import type { ModuleVariantSelection, VariantConfidence } from './types';

// Sentinel value for explicit individual pricing selection
const DIA_INDIVIDUAL_SENTINEL = 'dia-individual';

// ─── Confidence indicator ─────────────────────────────────────────────────────

const CONFIDENCE_CONFIG: Record<VariantConfidence, { label: string; dotClass: string; bgClass: string; textClass: string }> = {
  high: { label: 'Uit notities afgeleid', dotClass: 'bg-green-500', bgClass: 'bg-green-50', textClass: 'text-green-800' },
  low: { label: 'Onzeker -- controleer', dotClass: 'bg-orange-500', bgClass: 'bg-orange-50', textClass: 'text-orange-800' },
  unknown: { label: 'Niet bekend', dotClass: 'bg-neutral-400', bgClass: 'bg-neutral-50', textClass: 'text-neutral-500' },
};

function ConfidenceBadge({ confidence }: { confidence: VariantConfidence }) {
  const config = CONFIDENCE_CONFIG[confidence];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${config.bgClass} ${config.textClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}

// ─── Provider radio group ─────────────────────────────────────────────────────

function ProviderRadio({
  moduleId,
  selected,
  onChange,
}: {
  moduleId: string;
  selected: 'dia' | 'jij' | 'geen';
  onChange: (provider: 'dia' | 'jij' | 'geen') => void;
}) {
  const options: Array<{ value: 'dia' | 'jij' | 'geen'; label: string }> = [
    { value: 'dia', label: 'DIA' },
    { value: 'jij', label: 'JIJ' },
    { value: 'geen', label: 'Geen' },
  ];

  return (
    <div className="flex gap-2" role="radiogroup" aria-label={`Provider selectie voor ${moduleId}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={selected === opt.value}
          onClick={() => onChange(opt.value)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors min-h-[44px]
            ${selected === opt.value
              ? 'bg-cito-primary text-white border-cito-primary'
              : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
            }
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Basisvaardigheden module IDs ────────────────────────────────────────────

const BASISVAARDIGHEDEN_IDS: readonly string[] = BASISVAARDIGHEDEN_MODULE_IDS;

// ─── Main component ───────────────────────────────────────────────────────────

export function WizardStep2Variants() {
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);

  const variantSelections = useWizardStore((s) => s.variantSelections);
  const extractionResult = useWizardStore((s) => s.extractionResult);
  const setVariantSelections = useWizardStore((s) => s.setVariantSelections);
  const updateVariantSelection = useWizardStore((s) => s.updateVariantSelection);

  const totalStudents = useMemo(() => getTotalStudents(studentCounts), [studentCounts]);

  // Basisvaardigheden consistency: track if user wants individual control
  const [basisIndividueel, setBasisIndividueel] = useState(false);

  // Selected basisvaardigheden modules in this school's selection
  const activeBasisModules = useMemo(
    () => selectedModules.filter((id) => BASISVAARDIGHEDEN_IDS.includes(id)),
    [selectedModules],
  );
  const hasBasisGroup = activeBasisModules.length > 1;

  // DIA group packages for the grouped basisvaardigheden section
  const diaGroupPackages = useMemo(
    () => getDiaGroupPackages(activeBasisModules),
    [activeBasisModules],
  );

  // Sum of individual DIA prices for the basis modules (for "Individueel" option)
  const basisIndividualTotal = useMemo(() => {
    return activeBasisModules.reduce(
      (sum, id) => sum + (DIA_CONFIG.pricingStrategy.individualPrices[id] ?? 0),
      0,
    );
  }, [activeBasisModules]);

  // Group selection state (read from the first active basis module)
  const groupSelection = useMemo(() => {
    return variantSelections.find((v) => activeBasisModules.includes(v.moduleId));
  }, [variantSelections, activeBasisModules]);

  // Pre-fill logic on mount: moduleSetups as base (D-07), AI extraction overlay
  useEffect(() => {
    // Only pre-fill if variantSelections is empty or doesn't match current modules
    const existingIds = new Set(variantSelections.map((v) => v.moduleId));
    const needsInit = selectedModules.some((id) => !existingIds.has(id));
    if (!needsInit && variantSelections.length > 0) return;

    const selections: ModuleVariantSelection[] = selectedModules.map((moduleId) => {
      // Layer 1: Base from moduleSetups (D-07 -- startpunt)
      const setup = moduleSetups.find((s) => s.moduleId === moduleId);
      let provider: 'dia' | 'jij' | 'geen' = 'geen';
      let variantId: string | null = null;
      let confidence: VariantConfidence = 'unknown';

      if (setup && (setup.currentProvider === 'dia' || setup.currentProvider === 'jij')) {
        provider = setup.currentProvider;
      }

      // Layer 2: AI extraction overlay (higher priority when available)
      const extraction = extractionResult?.selections.find((s) => s.moduleId === moduleId);
      if (extraction && (extraction.confidence === 'high' || extraction.confidence === 'low')) {
        provider = extraction.provider;
        variantId = extraction.variantId;
        confidence = extraction.confidence;
      }

      return { moduleId, provider, variantId, confidence };
    });

    setVariantSelections(selections);
  }, [selectedModules, moduleSetups, extractionResult]); // eslint-disable-line react-hooks/exhaustive-deps

  // Smart suggestions
  const suggestedDia = useMemo(() => suggestDiaPackage(selectedModules), [selectedModules]);
  const suggestedJij = useMemo(() => suggestJijTier(totalStudents), [totalStudents]);

  // ─── Handlers for individual modules ──────────────────────────────────────

  const handleProviderChange = useCallback((moduleId: string, provider: 'dia' | 'jij' | 'geen') => {
    const existing = variantSelections.find((v) => v.moduleId === moduleId);
    updateVariantSelection(moduleId, {
      provider,
      variantId: null,
      confidence: existing?.confidence ?? 'unknown',
    });

    // Auto-sync basisvaardigheden to same provider when not in individual mode
    if (!basisIndividueel && hasBasisGroup && BASISVAARDIGHEDEN_IDS.includes(moduleId)) {
      for (const basisId of activeBasisModules) {
        if (basisId !== moduleId) {
          const bExisting = variantSelections.find((v) => v.moduleId === basisId);
          updateVariantSelection(basisId, {
            provider,
            variantId: null,
            confidence: bExisting?.confidence ?? 'unknown',
          });
        }
      }
    }
  }, [variantSelections, updateVariantSelection, basisIndividueel, hasBasisGroup, activeBasisModules]);

  const handleVariantClick = (moduleId: string, variantId: string) => {
    updateVariantSelection(moduleId, { variantId });
  };

  // ─── Handlers for grouped basisvaardigheden ───────────────────────────────

  const handleGroupProviderChange = useCallback((provider: 'dia' | 'jij' | 'geen') => {
    for (const basisId of activeBasisModules) {
      const existing = variantSelections.find((v) => v.moduleId === basisId);
      updateVariantSelection(basisId, {
        provider,
        variantId: null,
        confidence: existing?.confidence ?? 'unknown',
      });
    }
  }, [activeBasisModules, variantSelections, updateVariantSelection]);

  const handleGroupVariantClick = useCallback((variantId: string | null) => {
    for (const basisId of activeBasisModules) {
      updateVariantSelection(basisId, { variantId });
    }
  }, [activeBasisModules, updateVariantSelection]);

  // ─── Switch handlers for grouped/individual mode ──────────────────────────

  const switchToGrouped = useCallback(() => {
    setBasisIndividueel(false);
    // Sync all basis modules to match the first one's provider
    const first = variantSelections.find((v) => activeBasisModules.includes(v.moduleId));
    if (first) {
      for (const basisId of activeBasisModules) {
        if (basisId !== first.moduleId) {
          updateVariantSelection(basisId, {
            provider: first.provider,
            variantId: null,
            confidence: 'unknown',
          });
        }
      }
    }
  }, [activeBasisModules, variantSelections, updateVariantSelection]);

  const switchToIndividual = useCallback(() => {
    setBasisIndividueel(true);
    // Clear group package variantIds (they are invalid in individual mode)
    const groupPkgIds = new Set(diaGroupPackages.map((p) => p.id));
    for (const basisId of activeBasisModules) {
      const sel = variantSelections.find((v) => v.moduleId === basisId);
      if (sel?.variantId && (groupPkgIds.has(sel.variantId) || sel.variantId === DIA_INDIVIDUAL_SENTINEL)) {
        updateVariantSelection(basisId, { variantId: null });
      }
    }
  }, [activeBasisModules, variantSelections, updateVariantSelection, diaGroupPackages]);

  // ─── Render ───────────────────────────────────────────────────────────────

  const groupProvider = groupSelection?.provider ?? 'geen';

  return (
    <div className="space-y-6">
      <h3 className="text-[15px] font-semibold text-neutral-900">
        Bevestig de variant per module
      </h3>

      {/* Cito bundel selectie */}
      <div className="border border-neutral-200 rounded-lg p-4">
        <CitoBundleSelector />
      </div>

      {/* ─── Grouped basisvaardigheden section ─────────────────────────────── */}
      {hasBasisGroup && !basisIndividueel && (
        <>
          {/* Toggle banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start justify-between gap-3">
            <p className="text-sm text-blue-800">
              Basisvaardigheden (rekenen, taal, Engels) zijn ingesteld op dezelfde aanbieder.
            </p>
            <button
              type="button"
              onClick={switchToIndividual}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap underline"
            >
              Individueel aanpassen
            </button>
          </div>

          {/* Combined basisvaardigheden card */}
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50/30">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-sm font-semibold text-neutral-900">
                Basisvaardigheden
                <span className="text-neutral-500 font-normal ml-1.5">
                  ({activeBasisModules.map((id) => MODULE_CATALOG.find((m) => m.id === id)?.name ?? id).join(', ')})
                </span>
              </span>
            </div>

            {/* Provider radio for the group */}
            <div className="mb-4">
              <ProviderRadio
                moduleId="basisvaardigheden-groep"
                selected={groupProvider}
                onChange={handleGroupProviderChange}
              />
            </div>

            {/* DIA group packages */}
            {groupProvider === 'dia' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Individual pricing option */}
                <VariantCard
                  type="dia-package"
                  id={DIA_INDIVIDUAL_SENTINEL}
                  name="Individuele modules"
                  priceLabel={`\u20AC${basisIndividualTotal.toFixed(2)}/leerling/jaar`}
                  description={`Losse DIA-modules zonder pakketbundeling (${activeBasisModules.map((id) => {
                    const price = DIA_CONFIG.pricingStrategy.individualPrices[id];
                    return `\u20AC${price?.toFixed(2) ?? '?'}`;
                  }).join(' + ')})`}
                  isSelected={groupSelection?.variantId === DIA_INDIVIDUAL_SENTINEL}
                  isRecommended={false}
                  onClick={() => handleGroupVariantClick(DIA_INDIVIDUAL_SENTINEL)}
                />

                {/* Group packages */}
                {diaGroupPackages.map((pkg) => {
                  const moduleNames = pkg.includedModuleIds.map((id) => {
                    const mod = MODULE_CATALOG.find((m) => m.id === id);
                    return mod?.name ?? id;
                  });

                  return (
                    <VariantCard
                      key={pkg.id}
                      type="dia-package"
                      id={pkg.id}
                      name={pkg.name}
                      priceLabel={`\u20AC${pkg.pricePerStudent.toFixed(2)}/leerling/jaar`}
                      description={pkg.description ?? `Bevat ${pkg.includedModuleIds.length} module(s)`}
                      includedModules={moduleNames}
                      isSelected={groupSelection?.variantId === pkg.id}
                      isRecommended={suggestedDia?.id === pkg.id}
                      onClick={() => handleGroupVariantClick(pkg.id)}
                    />
                  );
                })}

                {diaGroupPackages.length === 0 && (
                  <p className="text-sm text-neutral-500 italic col-span-2">
                    Geen groepspakketten beschikbaar voor {activeBasisModules.length} modules. Kies individuele modules of selecteer alle 3 basisvaardigheden.
                  </p>
                )}
              </div>
            )}

            {/* JIJ tier cards for the group */}
            {groupProvider === 'jij' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {JIJ_LICENSE_TIERS.map((tier) => (
                  <VariantCard
                    key={String(tier.tier)}
                    type="jij-tier"
                    id={String(tier.tier)}
                    name={tier.label}
                    priceLabel={`\u20AC${tier.annualFee.toLocaleString('nl-NL')}/jaar + \u20AC${tier.pricePerTest.toFixed(2)}/afname`}
                    description={`${tier.minAdministrations.toLocaleString('nl-NL')}\u2013${tier.maxAdministrations.toLocaleString('nl-NL')} afnames per jaar`}
                    isSelected={groupSelection?.variantId === String(tier.tier)}
                    isRecommended={suggestedJij.tier === tier.tier}
                    onClick={() => handleGroupVariantClick(String(tier.tier))}
                  />
                ))}
              </div>
            )}

            {/* No provider selected */}
            {groupProvider === 'geen' && (
              <p className="text-sm text-neutral-500 italic">
                Selecteer welk aanbod de concurrent gebruikt voor de basisvaardigheden.
              </p>
            )}
          </div>
        </>
      )}

      {/* ─── Individual basisvaardigheden banner ─────────────────────────────── */}
      {hasBasisGroup && basisIndividueel && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 flex items-start justify-between gap-3">
          <p className="text-sm text-neutral-600">
            Basisvaardigheden worden individueel ingesteld.
          </p>
          <button
            type="button"
            onClick={switchToGrouped}
            className="text-sm font-medium text-cito-primary hover:opacity-80 whitespace-nowrap underline"
          >
            Groepeer weer
          </button>
        </div>
      )}

      {/* ─── Individual module cards ──────────────────────────────────────── */}
      {/* When grouped: skip basis modules (handled above). When individual: show all. */}
      {selectedModules.map((moduleId) => {
        // Skip basisvaardigheden when grouped — they're rendered in the group section above
        if (!basisIndividueel && hasBasisGroup && BASISVAARDIGHEDEN_IDS.includes(moduleId)) {
          return null;
        }

        const moduleDef = MODULE_CATALOG.find((m) => m.id === moduleId);
        const selection = variantSelections.find((v) => v.moduleId === moduleId);
        const provider = selection?.provider ?? 'geen';
        const confidence = selection?.confidence ?? 'unknown';

        // In individual mode for basis modules: only show module-specific packages (not group packages)
        const isBasisModule = BASISVAARDIGHEDEN_IDS.includes(moduleId);
        const applicablePackages = (basisIndividueel && isBasisModule)
          ? getDiaModulePackages(moduleId)
          : DIA_PACKAGES.filter((pkg) => pkg.includedModuleIds.includes(moduleId));

        return (
          <div key={moduleId} className="border border-neutral-200 rounded-lg p-4">
            {/* Module header with confidence badge */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-sm font-semibold text-neutral-900">
                {moduleDef?.name ?? moduleId}
              </span>
              <ConfidenceBadge confidence={confidence} />
            </div>

            {/* Provider radio */}
            <div className="mb-4">
              <ProviderRadio
                moduleId={moduleId}
                selected={provider}
                onChange={(p) => handleProviderChange(moduleId, p)}
              />
            </div>

            {/* Selected variant price hint */}
            {provider !== 'geen' && selection?.variantId && selection.variantId !== DIA_INDIVIDUAL_SENTINEL && (
              <p className="text-xs text-neutral-500 mb-3">
                {provider === 'dia' && (() => {
                  const pkg = DIA_PACKAGES.find((p) => p.id === selection.variantId);
                  if (!pkg) return null;
                  return (
                    <>
                      Geselecteerd: <span className="font-medium">{pkg.name}</span>{' '}
                      — {'\u20AC'}{pkg.pricePerStudent.toFixed(2)}/leerling/jaar
                      {pkg.includedModuleIds.length > 1 && (
                        <span className="text-neutral-400 ml-1">
                          (onderdeel van pakket met {pkg.includedModuleIds.length} modules)
                        </span>
                      )}
                    </>
                  );
                })()}
                {provider === 'jij' && (() => {
                  const tier = JIJ_LICENSE_TIERS.find((t) => String(t.tier) === selection.variantId);
                  if (!tier) return null;
                  return (
                    <>
                      Geselecteerd: <span className="font-medium">{tier.label}</span>{' '}
                      — {'\u20AC'}{tier.annualFee.toLocaleString('nl-NL')}/jaar + {'\u20AC'}{tier.pricePerTest.toFixed(2)}/afname
                    </>
                  );
                })()}
              </p>
            )}

            {/* DIA variant cards */}
            {provider === 'dia' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {applicablePackages.map((pkg) => {
                  const moduleNames = pkg.includedModuleIds.map((id) => {
                    const mod = MODULE_CATALOG.find((m) => m.id === id);
                    return mod?.name ?? id;
                  });

                  return (
                    <VariantCard
                      key={pkg.id}
                      type="dia-package"
                      id={pkg.id}
                      name={pkg.name}
                      priceLabel={`\u20AC${pkg.pricePerStudent.toFixed(2)}/leerling/jaar`}
                      description={pkg.description ?? `Bevat ${pkg.includedModuleIds.length} module(s)`}
                      includedModules={moduleNames}
                      isSelected={selection?.variantId === pkg.id}
                      isRecommended={suggestedDia?.id === pkg.id}
                      onClick={() => handleVariantClick(moduleId, pkg.id)}
                    />
                  );
                })}

                {/* When individual mode and no packages available for this module, show hint */}
                {applicablePackages.length === 0 && isBasisModule && (
                  <p className="text-sm text-neutral-500 italic col-span-2">
                    Alleen individuele prijs beschikbaar: {'\u20AC'}{(DIA_CONFIG.pricingStrategy.individualPrices[moduleId] ?? 0).toFixed(2)}/leerling/jaar
                  </p>
                )}
              </div>
            )}

            {/* JIJ variant cards */}
            {provider === 'jij' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {JIJ_LICENSE_TIERS.map((tier) => (
                  <VariantCard
                    key={String(tier.tier)}
                    type="jij-tier"
                    id={String(tier.tier)}
                    name={tier.label}
                    priceLabel={`\u20AC${tier.annualFee.toLocaleString('nl-NL')}/jaar + \u20AC${tier.pricePerTest.toFixed(2)}/afname`}
                    description={`${tier.minAdministrations.toLocaleString('nl-NL')}\u2013${tier.maxAdministrations.toLocaleString('nl-NL')} afnames per jaar`}
                    isSelected={selection?.variantId === String(tier.tier)}
                    isRecommended={suggestedJij.tier === tier.tier}
                    onClick={() => handleVariantClick(moduleId, String(tier.tier))}
                  />
                ))}
              </div>
            )}

            {/* Geen provider selected */}
            {provider === 'geen' && (
              <p className="text-sm text-neutral-500 italic">
                Selecteer welk aanbod de concurrent gebruikt voor deze module.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
