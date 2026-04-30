import { useState } from 'react';
import { usePriceComparisonStore } from './store';
import { PROVIDERS, PROVIDER_LABELS } from '../../engine/price-comparison';
import type { ProviderKey } from '../../engine/price-comparison';
import { MODULE_DIFFERENTIATORS } from '../../data/differentiators';
import { getModuleContent } from '../../data/provider-module-content';
import type { ProviderModuleContent } from '../../data/provider-module-content';
import { formatCurrency } from '../../lib/format';
import { PriceBadge } from '../../components/ui/PriceBadge';
import type { PriceRecord } from '../../models/pricing';
import { DIA_PACKAGES } from '../../data/dia-packages';

interface ModuleDetailPanelProps {
  moduleId: string;
}

const CheckmarkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-cito-primary flex-shrink-0"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const InfoCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-neutral-500 flex-shrink-0"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const WarningIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-neutral-500 flex-shrink-0"
    aria-hidden="true"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ResetIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311V15a.75.75 0 01-1.5 0v-3.5a.75.75 0 01.75-.75H8.5a.75.75 0 010 1.5H7.058l.174.174a4 4 0 006.588-1.79.75.75 0 011.492.164z"
      clipRule="evenodd"
    />
  </svg>
);

export function ModuleDetailPanel({ moduleId }: ModuleDetailPanelProps) {
  const result = usePriceComparisonStore((s) => s.result);
  const visibleProviders = usePriceComparisonStore((s) => s.visibleProviders);
  const draftOverrides = usePriceComparisonStore((s) => s.draftOverrides);
  const appliedOverrides = usePriceComparisonStore((s) => s.appliedOverrides);
  const hasPendingChanges = usePriceComparisonStore((s) => s.hasPendingChanges);
  const setDraftOverride = usePriceComparisonStore((s) => s.setDraftOverride);
  const resetOverride = usePriceComparisonStore((s) => s.resetOverride);
  const recalculate = usePriceComparisonStore((s) => s.recalculate);
  const diaPackageResult = usePriceComparisonStore((s) => s.diaPackageResult);
  const sensitivityResult = usePriceComparisonStore((s) => s.sensitivityResult);
  const isInternalMode = usePriceComparisonStore((s) => s.isInternalMode);

  const moduleData = result?.modules.find((m) => m.moduleId === moduleId);
  const differentiators = MODULE_DIFFERENTIATORS.find(
    (d) => d.moduleId === moduleId,
  );
  const moduleContent = getModuleContent(moduleId);

  // Active providers: visible AND have data for this module's result set
  const activeProviders = visibleProviders.filter((p) =>
    result?.modules.some((m) => m.providers[p] !== null),
  );

  // DIA package info for this module
  const isInDiaPackage =
    diaPackageResult?.selectedPackage !== null &&
    diaPackageResult?.coveredModuleIds.includes(moduleId);
  const diaPackageDef = isInDiaPackage
    ? DIA_PACKAGES.find((p) => p.id === diaPackageResult?.selectedPackage?.id)
    : null;

  // Per-module break-even from sensitivity result
  const moduleBreakEven = sensitivityResult?.breakEven.perModule.find(
    (m) => m.moduleId === moduleId,
  );

  if (!moduleData) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Section A: Prijsopbouw — step-by-step breakdown per provider */}
      <section>
        <h4 className="text-sm font-semibold text-neutral-700 mb-3">Prijsopbouw</h4>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${activeProviders.length}, 1fr)` }}>
          {activeProviders.map((provider) => {
            const cost = moduleData.providers[provider];
            if (!cost) {
              return (
                <div key={provider} className="text-sm text-neutral-400">Niet beschikbaar</div>
              );
            }

            // DIA package annotation
            const isDiaPackage = provider === 'dia' && isInDiaPackage && diaPackageDef;

            return (
              <div key={provider}>
                <div className="text-xs font-semibold text-neutral-500 uppercase mb-2">
                  {PROVIDER_LABELS[provider]}
                </div>
                {cost.breakdown.map((step, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-neutral-100 last:border-0">
                    <span className="text-neutral-600">{step.label}</span>
                    <span className="font-mono text-neutral-900">{formatCurrency(step.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-2 mt-1 border-t border-neutral-300">
                  <span>Totaal</span>
                  <span className="font-mono">{formatCurrency(cost.totalCost)}</span>
                </div>
                {isDiaPackage && diaPackageResult && diaPackageResult.savings > 0 && (
                  <div className="text-xs text-green-700 mt-1">
                    Pakketkorting ({diaPackageDef!.name}): besparing{' '}
                    {formatCurrency(diaPackageResult.savings * cost.studentCount)}
                  </div>
                )}
                {cost.priceRecord.sourceLabel && (
                  <div className="text-xs text-neutral-400 mt-1">
                    Bron: {cost.priceRecord.sourceLabel}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Section: Break-even analyse (per D-13, only internal mode) */}
      {isInternalMode && moduleBreakEven && sensitivityResult && (
        <section>
          <h4 className="text-sm font-semibold mb-2">Break-even analyse</h4>
          <p className="text-sm text-neutral-700">
            {moduleBreakEven.percent !== null
              ? `${sensitivityResult.competitorLabel} wordt goedkoper bij ${moduleBreakEven.percent}% korting`
              : `${sensitivityResult.competitorLabel} is nu al goedkoper`}
          </p>
        </section>
      )}

      {/* Section: Wat zit erin per aanbieder */}
      {moduleContent && (
        <ModuleContentSection
          moduleId={moduleId}
          moduleContent={moduleContent}
        />
      )}

      {/* Section B: Onderscheidend vermogen — per-provider columnar */}
      <section>
        <h4 className="text-sm font-semibold mb-3">Onderscheidend vermogen</h4>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${activeProviders.length}, 1fr)` }}>
          {activeProviders.map((provider) => {
            const diffs = differentiators?.[provider] ?? [];
            const cost = moduleData.providers[provider];

            return (
              <div key={provider}>
                <div className="text-xs font-semibold text-neutral-500 uppercase mb-2">
                  {PROVIDER_LABELS[provider]}
                </div>
                {cost === null && diffs.length === 0 ? (
                  <div className="flex items-start gap-2 text-sm text-neutral-500">
                    <WarningIcon />
                    <span>Niet aangeboden</span>
                  </div>
                ) : diffs.length > 0 ? (
                  <ul className="space-y-1">
                    {diffs.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        {provider === 'cito' ? <CheckmarkIcon /> : <InfoCircleIcon />}
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-neutral-400">Geen differentiators</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Section C: Prijs aanpassen */}
      <section>
        <h4 className="text-sm font-semibold mb-2">Prijs aanpassen</h4>
        <div className="space-y-3">
          {activeProviders.map((provider) => (
            <PriceOverrideRow
              key={provider}
              moduleId={moduleId}
              provider={provider}
              cost={moduleData.providers[provider]}
              draftOverrides={draftOverrides}
              appliedOverrides={appliedOverrides}
              onSetOverride={setDraftOverride}
              onResetOverride={resetOverride}
            />
          ))}
        </div>

        {/* Herbereken button */}
        {hasPendingChanges && (
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={() => recalculate()}
              className="bg-cito-accent text-white text-sm font-semibold py-2 px-4 rounded-lg hover:opacity-90 active:opacity-80 animate-[pulse-once_300ms_ease-in-out_1]"
            >
              Herbereken vergelijking
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function ModuleContentSection({
  moduleContent,
}: {
  moduleId: string;
  moduleContent: { providers: Partial<Record<ProviderKey, ProviderModuleContent>> };
}) {
  const [expandedProvider, setExpandedProvider] = useState<ProviderKey | null>(null);

  const providersWithContent = PROVIDERS.filter(
    (p) => moduleContent.providers[p] != null,
  );

  if (providersWithContent.length === 0) return null;

  return (
    <section>
      <h4 className="text-sm font-semibold mb-2">Wat zit erin per aanbieder?</h4>
      <div className="space-y-2">
        {providersWithContent.map((provider) => {
          const content = moduleContent.providers[provider]!;
          const isExpanded = expandedProvider === provider;

          return (
            <div key={provider} className="border border-neutral-200 rounded-lg overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-left hover:bg-neutral-50"
                onClick={() => setExpandedProvider(isExpanded ? null : provider)}
              >
                <span>
                  <span className={provider === 'cito' ? 'text-cito-primary' : 'text-neutral-700'}>
                    {PROVIDER_LABELS[provider]}
                  </span>
                  <span className="text-neutral-500 font-normal ml-2">
                    {content.productName}
                  </span>
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 text-sm space-y-3 border-t border-neutral-100">
                  {/* Sub-products */}
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Onderdelen</p>
                    <ul className="space-y-0.5">
                      {content.subProducts.map((sp, i) => (
                        <li key={i} className="flex items-baseline gap-2">
                          <span className="text-neutral-400">•</span>
                          <span>
                            <span className="font-medium">{sp.name}</span>
                            <span className="text-neutral-500"> — {sp.description}</span>
                            {sp.separatePrice !== null && (
                              <span className="text-neutral-400 ml-1">(€{sp.separatePrice.toFixed(2).replace('.', ',')} los)</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>
                      <span className="text-neutral-500">Afname:</span>{' '}
                      <span>{content.testFormat}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Frequentie:</span>{' '}
                      <span>{content.measurementFrequency}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Doelgroep:</span>{' '}
                      <span>{content.targetGroup}</span>
                    </div>
                    {content.integrations.length > 0 && (
                      <div>
                        <span className="text-neutral-500">Koppelingen:</span>{' '}
                        <span>{content.integrations.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Constructs */}
                  {content.constructs.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Gemeten vaardigheden</p>
                      <div className="flex flex-wrap gap-1">
                        {content.constructs.map((c, i) => (
                          <span key={i} className="inline-block px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded text-xs">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PriceOverrideRow({
  moduleId,
  provider,
  cost,
  draftOverrides,
  appliedOverrides,
  onSetOverride,
  onResetOverride,
}: {
  moduleId: string;
  provider: ProviderKey;
  cost: { pricePerStudent: number; priceRecord: PriceRecord } | null;
  draftOverrides: { moduleId: string; provider: string; amount: number }[];
  appliedOverrides: { moduleId: string; provider: string; amount: number }[];
  onSetOverride: (override: { moduleId: string; provider: ProviderKey; amount: number }) => void;
  onResetOverride: (moduleId: string, provider: string) => void;
}) {
  const hasDraftOverride = draftOverrides.some(
    (o) => o.moduleId === moduleId && o.provider === provider,
  );
  const hasAppliedOverride = appliedOverrides.some(
    (o) => o.moduleId === moduleId && o.provider === provider,
  );
  const isOverridden = hasDraftOverride || hasAppliedOverride;

  const currentValue = cost?.pricePerStudent ?? '';
  const draftValue = draftOverrides.find(
    (o) => o.moduleId === moduleId && o.provider === provider,
  )?.amount;

  const [inputValue, setInputValue] = useState(
    draftValue !== undefined
      ? String(draftValue)
      : currentValue !== ''
        ? String(currentValue)
        : '',
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    const parsed = parseFloat(raw.replace(',', '.'));
    if (!isNaN(parsed)) {
      onSetOverride({ moduleId, provider, amount: parsed });
    }
  };

  const handleReset = () => {
    onResetOverride(moduleId, provider);
    setInputValue(cost?.pricePerStudent !== undefined ? String(cost.pricePerStudent) : '');
  };

  // Build a synthetic PriceRecord for the badge when overridden
  const badgeRecord: PriceRecord | null = isOverridden && cost
    ? {
        ...cost.priceRecord,
        source: 'manual',
        sourceLabel: 'Handmatig ingevoerd',
        isPublicationPrice: false,
      }
    : cost?.priceRecord ?? null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-12">{PROVIDER_LABELS[provider]}</span>
      <span className="text-sm text-neutral-500">EUR</span>
      <input
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleChange}
        placeholder={cost === null ? 'Vul prijs in' : undefined}
        disabled={cost === null}
        className="w-[120px] h-10 border border-neutral-200 rounded-md px-3 text-right focus:border-cito-primary focus:ring-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Prijs per leerling ${PROVIDER_LABELS[provider]}`}
      />
      {badgeRecord && <PriceBadge record={badgeRecord} />}
      {isOverridden && (
        <button
          type="button"
          onClick={handleReset}
          aria-label={`Terugzetten naar publicatieprijs voor ${PROVIDER_LABELS[provider]}`}
          className="text-neutral-500 hover:text-cito-primary"
          title="Terugzetten naar publicatieprijs"
        >
          <ResetIcon />
        </button>
      )}
    </div>
  );
}
