import { useState } from 'react';
import type { ComparisonResult, ProviderKey } from '../../engine/price-comparison';
import { PROVIDER_LABELS, getTotalStudents } from '../../engine/price-comparison';
import { MODULE_CATEGORIES } from '../../models/modules';
import type { ModuleCategory } from '../../models/modules';
import { formatCurrency } from '../../lib/format';
import { getPriceStatus } from '../../models/pricing';
import { DEFAULT_PRICES } from '../../data/default-prices';
import { ModuleDetailPanel } from './ModuleDetailPanel';
import { PriceProposalModal } from '../review/PriceProposalModal';
import { usePriceComparisonStore } from './store';
import { useSchoolProfileStore } from '../school-profile/store';
import { CitoBundleSelector } from './CitoBundleSelector';
import { DiaBundleSelector } from './DiaBundleSelector';
import { getCitoBundle } from '../../data/providers/cito';

interface ComparisonTableProps {
  result: ComparisonResult;
  onBarHighlight?: string | null;
}

/** Subtle column background per provider — matches chart colors at low opacity */
const PROVIDER_COL_BG: Record<ProviderKey, string> = {
  cito: 'bg-[#003082]/[0.04]',
  dia: 'bg-[#FF6600]/[0.04]',
  jij: 'bg-[#22C55E]/[0.04]',
  saqi: 'bg-[#8B5CF6]/[0.04]',
};

/** Header background per provider */
const PROVIDER_HEADER_BG: Record<ProviderKey, string> = {
  cito: 'bg-[#003082]',
  dia: 'bg-[#FF6600]',
  jij: 'bg-[#22C55E]',
  saqi: 'bg-[#8B5CF6]',
};

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
    aria-hidden="true"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/** Find the cheapest provider for a module (null = not available) */
function getCheapestProvider(mod: ComparisonResult['modules'][number], providers: readonly ProviderKey[]): ProviderKey | null {
  let cheapest: ProviderKey | null = null;
  let lowestCost = Infinity;
  for (const p of providers) {
    const cost = mod.providers[p];
    if (cost !== null && cost.totalCost < lowestCost) {
      lowestCost = cost.totalCost;
      cheapest = p;
    }
  }
  return cheapest;
}

export function ComparisonTable({ result, onBarHighlight }: ComparisonTableProps) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [proposalTarget, setProposalTarget] = useState<{
    moduleId: string;
    provider: string;
    currentPrice: number;
    moduleName: string;
  } | null>(null);
  const scenario = useSchoolProfileStore((s) => s.scenario);

  const getProviderLabel = (provider: ProviderKey) => {
    if (provider === 'cito' && scenario === 'C') return 'Huidig Cito';
    return PROVIDER_LABELS[provider];
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModule((prev) => (prev === moduleId ? null : moduleId));
  };

  const categoryOrder: ModuleCategory[] = ['leerlingvolgsysteem', 'overige-instrumenten'];
  const groupedModules = categoryOrder
    .map((category) => ({
      category,
      label: MODULE_CATEGORIES[category],
      modules: result.modules.filter((m) => m.moduleCategory === category),
    }))
    .filter((group) => group.modules.length > 0);

  const visibleProviders = usePriceComparisonStore((s) => s.visibleProviders);
  const activeProviders = visibleProviders.filter((provider) =>
    result.modules.some((m) => m.providers[provider] !== null),
  );
  const providerWidth = `${Math.floor(70 / activeProviders.length)}%`;

  return (
    <div>
      <table className="w-full border-collapse text-sm">
        {/* Header — each provider gets its own brand color */}
        <thead>
          <tr>
            <th className="w-[30%] text-left py-2 px-3 bg-neutral-100 text-neutral-600 text-xs font-semibold uppercase tracking-wide">
              Module
            </th>
            {activeProviders.map((provider) => {
              const sampleCost = result.modules.find(m => m.providers[provider])?.providers[provider];
              const tierBadge = provider === 'jij' && sampleCost?.tierId
                ? `Licentie ${sampleCost.tierId}`
                : provider === 'dia' && sampleCost?.packageId
                ? sampleCost.packageId
                : null;

              return (
                <th
                  key={provider}
                  style={{ width: providerWidth }}
                  className={`text-right py-2 px-3 text-white text-xs font-semibold ${PROVIDER_HEADER_BG[provider]}`}
                >
                  <div>{getProviderLabel(provider)}</div>
                  {provider === 'cito' && scenario === 'C' && (
                    <div className="text-[10px] font-normal opacity-80">(huidig platform)</div>
                  )}
                  {provider === 'cito' && <CitoBundleSelector compact />}
                  {provider === 'dia' && <DiaBundleSelector compact />}
                  {tierBadge && provider !== 'cito' && provider !== 'dia' && (
                    <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-white/20 rounded-full">
                      {tierBadge}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {groupedModules.map((group) => (
            <CategoryGroup
              key={group.category}
              label={group.label}
              modules={group.modules}
              expandedModule={expandedModule}
              onBarHighlight={onBarHighlight}
              onToggle={toggleModule}
              activeProviders={activeProviders}
              onProposalClick={setProposalTarget}
            />
          ))}

          <TotaalRow result={result} activeProviders={activeProviders} />
        </tbody>
      </table>

      {/* Price proposal modal */}
      <PriceProposalModal
        isOpen={!!proposalTarget}
        onClose={() => setProposalTarget(null)}
        moduleId={proposalTarget?.moduleId ?? ''}
        provider={proposalTarget?.provider ?? ''}
        currentPrice={proposalTarget?.currentPrice ?? 0}
        moduleName={proposalTarget?.moduleName ?? ''}
      />
    </div>
  );
}

/** Detect which modules are part of a Cito bundle (2+ modules with isPackagePrice). */
function getBundleModuleIds(modules: ComparisonResult['modules']): Set<string> {
  const bundled = modules.filter((m) => m.providers.cito?.isPackagePrice);
  if (bundled.length < 2) return new Set();
  return new Set(bundled.map((m) => m.moduleId));
}

function CategoryGroup({
  label,
  modules,
  expandedModule,
  onBarHighlight,
  onToggle,
  activeProviders,
  onProposalClick,
}: {
  label: string;
  modules: ComparisonResult['modules'];
  expandedModule: string | null;
  onBarHighlight?: string | null;
  onToggle: (moduleId: string) => void;
  activeProviders: readonly ProviderKey[];
  onProposalClick: (target: { moduleId: string; provider: string; currentPrice: number; moduleName: string }) => void;
}) {
  const bundleModuleIds = getBundleModuleIds(modules);

  return (
    <>
      {/* Category subheader */}
      <tr>
        <td
          colSpan={1 + activeProviders.length}
          className="py-1.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide bg-neutral-50 border-b border-neutral-200"
        >
          {label}
        </td>
      </tr>

      {modules.map((mod, idx) => {
        const isExpanded = expandedModule === mod.moduleId;
        const isHighlighted = onBarHighlight === mod.moduleId;
        const isBundled = bundleModuleIds.has(mod.moduleId);
        const isLastBundled = isBundled && !modules.slice(idx + 1).some((m) => bundleModuleIds.has(m.moduleId));

        return (
          <BundleGroupWrapper key={mod.moduleId}>
            <ModuleRow
              mod={mod}
              isExpanded={isExpanded}
              isHighlighted={isHighlighted}
              onToggle={onToggle}
              activeProviders={activeProviders}
              isBundleGrouped={isBundled}
              onProposalClick={onProposalClick}
            />
            {isLastBundled && (
              <BundelSubtotaalRow
                bundleModules={modules.filter((m) => bundleModuleIds.has(m.moduleId))}
                activeProviders={activeProviders}
              />
            )}
          </BundleGroupWrapper>
        );
      })}
    </>
  );
}

function BundleGroupWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function BundelSubtotaalRow({
  bundleModules,
  activeProviders,
}: {
  bundleModules: ComparisonResult['modules'];
  activeProviders: readonly ProviderKey[];
}) {
  const citoBundleType = usePriceComparisonStore((s) => s.citoBundleType);
  const contractPeriod = usePriceComparisonStore((s) => s.contractPeriod);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);
  const totalStudents = getTotalStudents(studentCounts);

  const bundle = getCitoBundle(citoBundleType);
  const bundleLabel = bundle.name;
  const bundlePricePerStudent = bundle.contractPrices?.[contractPeriod] ?? bundle.pricePerStudent;

  return (
    <tr className="border-t border-cito-primary/10">
      <td className="py-1.5 px-3 pl-8 text-xs font-semibold text-cito-primary bg-cito-primary/[0.03]">
        Subtotaal {bundleLabel} bundel
      </td>
      {activeProviders.map((provider) => {
        const perStudent = bundleModules.reduce((sum, m) => {
          const cost = m.providers[provider];
          return sum + (cost?.pricePerStudent ?? 0);
        }, 0);

        const isCito = provider === 'cito';
        const displayPerStudent = isCito && bundlePricePerStudent !== null
          ? bundlePricePerStudent
          : perStudent;
        const displayTotal = isCito && bundlePricePerStudent !== null
          ? bundlePricePerStudent * totalStudents
          : perStudent * totalStudents;

        const hasAnyPrice = bundleModules.some((m) => m.providers[provider] !== null);
        if (!hasAnyPrice) {
          return <td key={provider} className={`py-1.5 px-3 text-xs text-neutral-400 text-right ${PROVIDER_COL_BG[provider]}`}>—</td>;
        }

        return (
          <td key={provider} className={`py-1.5 px-3 text-right tabular-nums ${PROVIDER_COL_BG[provider]}`}>
            <span className="text-xs font-semibold text-neutral-700">
              {formatCurrency(displayTotal)}
            </span>
            <span className="text-[11px] text-neutral-400 ml-1">
              ({formatCurrency(displayPerStudent)}/lln)
            </span>
          </td>
        );
      })}
    </tr>
  );
}

function ModuleRow({
  mod,
  isExpanded,
  isHighlighted,
  onToggle,
  activeProviders,
  isBundleGrouped = false,
  onProposalClick,
}: {
  mod: ComparisonResult['modules'][number];
  isExpanded: boolean;
  isHighlighted: boolean;
  onToggle: (moduleId: string) => void;
  activeProviders: readonly ProviderKey[];
  isBundleGrouped?: boolean;
  onProposalClick: (target: { moduleId: string; provider: string; currentPrice: number; moduleName: string }) => void;
}) {
  const cheapest = getCheapestProvider(mod, activeProviders);

  return (
    <>
      <tr
        id={`module-row-${mod.moduleId}`}
        className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors duration-150 cursor-pointer ${
          isHighlighted ? 'bg-neutral-100' : ''
        }`}
        onClick={() => onToggle(mod.moduleId)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle(mod.moduleId);
          }
        }}
        aria-expanded={isExpanded}
      >
        {/* Module name */}
        <td
          className={`py-2 px-3 select-none ${
            isBundleGrouped ? 'border-l-2 border-l-cito-primary/30' : ''
          }`}
        >
          <span className="inline-flex items-center gap-1.5 text-sm text-neutral-800">
            <ChevronIcon expanded={isExpanded} />
            {mod.moduleName}
          </span>
        </td>

        {/* Price per provider */}
        {activeProviders.map((provider) => (
          <ProviderCell
            key={provider}
            cost={mod.providers[provider]}
            provider={provider}
            isCheapest={provider === cheapest && activeProviders.length > 1}
            moduleId={mod.moduleId}
            moduleName={mod.moduleName}
            onProposalClick={onProposalClick}
          />
        ))}
      </tr>

      {/* Expanded detail row */}
      {isExpanded && (
        <tr>
          <td colSpan={1 + activeProviders.length} className="p-0">
            <div className="border-l-[3px] border-l-cito-primary bg-white p-6">
              <ModuleDetailPanel moduleId={mod.moduleId} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function TotaalRow({ result, activeProviders }: { result: ComparisonResult; activeProviders: readonly ProviderKey[] }) {
  const diaPackageResult = usePriceComparisonStore((s) => s.diaPackageResult);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);
  const totalStudents = getTotalStudents(studentCounts);

  const hasPackageDiscount =
    diaPackageResult?.selectedPackage !== null && (diaPackageResult?.savings ?? 0) > 0;
  const savingsEuros = hasPackageDiscount
    ? diaPackageResult!.savings * totalStudents
    : 0;

  // Find cheapest total
  let cheapestTotal: ProviderKey | null = null;
  let lowestTotal = Infinity;
  for (const p of activeProviders) {
    if (result.totals[p] < lowestTotal) {
      lowestTotal = result.totals[p];
      cheapestTotal = p;
    }
  }

  return (
    <tr className="border-t-2 border-neutral-300 font-semibold">
      <td className="py-2.5 px-3 text-sm bg-neutral-100">Totaal</td>
      {activeProviders.map((provider) => (
        <td
          key={provider}
          className={`py-2.5 px-3 text-right tabular-nums ${PROVIDER_COL_BG[provider]} ${
            provider === cheapestTotal && activeProviders.length > 1 ? 'text-green-700' : 'text-neutral-900'
          }`}
        >
          <span className="text-sm">{formatCurrency(result.totals[provider])}</span>
          {provider === 'dia' && hasPackageDiscount && (
            <div className="text-[11px] font-normal text-green-600 mt-0.5">
              Pakketkorting: {formatCurrency(savingsEuros)} besparing
            </div>
          )}
        </td>
      ))}
    </tr>
  );
}

function ProviderCell({
  cost,
  provider,
  isCheapest,
  moduleId,
  moduleName,
  onProposalClick,
}: {
  cost: ComparisonResult['modules'][number]['providers'][ProviderKey];
  provider: ProviderKey;
  isCheapest: boolean;
  moduleId: string;
  moduleName: string;
  onProposalClick: (target: { moduleId: string; provider: string; currentPrice: number; moduleName: string }) => void;
}) {
  if (cost === null) {
    return (
      <td className={`py-2 px-3 text-right ${PROVIDER_COL_BG[provider]}`}>
        <span className="text-xs text-neutral-400">n.v.t.</span>
      </td>
    );
  }

  // Check staleness of publication price
  const priceRecord = DEFAULT_PRICES.find(
    (p) => p.moduleId === moduleId && p.provider === provider,
  );
  const isStale = priceRecord ? getPriceStatus(priceRecord) === 'stale' : false;

  return (
    <td className={`py-2 px-3 text-right tabular-nums ${PROVIDER_COL_BG[provider]}`}>
      <div className="flex flex-col items-end">
        <span className={`text-sm font-semibold ${isCheapest ? 'text-green-700' : 'text-neutral-800'}`}>
          {formatCurrency(cost.totalCost)}
        </span>
        {cost.isPackagePrice && (
          <span className="text-[10px] text-cito-primary font-medium">bundel</span>
        )}
        <div className="flex items-center gap-1 mt-0.5">
          {isStale && priceRecord && (
            <span
              className="text-[10px] text-amber-600"
              title={`Prijs niet geverifieerd sinds ${priceRecord.verifiedAt.toLocaleDateString('nl-NL')}`}
            >
              <svg className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
            </span>
          )}
          {priceRecord && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onProposalClick({
                  moduleId,
                  provider,
                  currentPrice: priceRecord.amountPerStudent,
                  moduleName,
                });
              }}
              className="text-[10px] text-blue-600 hover:underline cursor-pointer"
            >
              Klopt niet?
            </button>
          )}
        </div>
      </div>
    </td>
  );
}
