import { useState, useEffect, useCallback } from 'react';
import { usePriceComparisonStore } from './store';
import { useSchoolProfileStore } from '../school-profile/store';
import { PROVIDER_LABELS, getTotalStudents } from '../../engine/price-comparison';
import type { ComparisonResult } from '../../engine/price-comparison';
import { getCitoBundle } from '../../data/providers/cito';
import { formatCurrency } from '../../lib/format';
import { ComparisonChart } from './ComparisonChart';
import { ComparisonTable } from './ComparisonTable';
import { DisclaimerFooter } from '../../components/ui/DisclaimerFooter';
import { PeriodToggle } from './PeriodToggle';
import { CitoBundleSelector } from './CitoBundleSelector';
import { DiaBundleSelector } from './DiaBundleSelector';
import { AiAdviesSection } from './ai-advies/AiAdviesSection';
import { MeerwaardePanel } from './MeerwaardePanel';
import { SectionBand } from './components/SectionBand';
import { ProviderToolbar } from './components/ProviderToolbar';
import { OfflinePriceBanner } from '../../components/ui/OfflinePriceBanner';
import { usePricingDataStore } from '@/stores/pricing-data-store';
import { MarktKortingToggle } from './MarktKortingToggle';
import { KortingsPatroonAlert } from './KortingsPatroonAlert';
import { useDiscountPatterns } from '@/hooks/useDiscountPatterns';

interface PriceComparisonPageProps {
  onBack?: () => void;
}

// ─── Samenvatting boven de tabel ────────────────────────────────────────────

function ComparisonSummary({ result }: { result: ComparisonResult }) {
  const { citoVsDia, citoVsJij } = result.differences;
  const citoBundleType = usePriceComparisonStore((s) => s.citoBundleType);
  const contractPeriod = usePriceComparisonStore((s) => s.contractPeriod);

  const bundleLabel = citoBundleType === 'individual' ? 'Per module' : citoBundleType === 'basis' ? 'Basis' : 'Plus';
  const periodLabel = contractPeriod === 'annual' ? 'per jaar' : contractPeriod === 'three-year' ? '3-jarig contract' : '3-jarig + DUO';

  return (
    <div>
      <h2 className="text-[15px] font-semibold text-cito-primary mb-5">
        Samenvatting vergelijking
      </h2>

      {/* Totalen per aanbieder */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Cito — baseline */}
        {(() => {
          const bundle = getCitoBundle(citoBundleType);
          const bundlePrice = bundle.contractPrices?.[contractPeriod] ?? bundle.pricePerStudent;
          return (
            <div className="rounded-lg bg-cito-primary p-4 text-white">
              <div className="text-xs font-semibold opacity-70 mb-1 uppercase tracking-wide">
                {PROVIDER_LABELS.cito}
              </div>
              <div className="text-[22px] font-semibold leading-none">
                {formatCurrency(result.totals.cito)}
              </div>
              <div className="text-xs opacity-60 mt-1">{periodLabel} · {bundleLabel}</div>
              {bundlePrice !== null && (
                <div className="mt-2 pt-2 border-t border-white/20">
                  <span className="text-sm font-semibold">
                    {bundleLabel} bundel: {formatCurrency(bundlePrice)}/lln/jr
                  </span>
                </div>
              )}
            </div>
          );
        })()}

        {/* DIA */}
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
          <div className="text-xs font-semibold text-neutral-500 mb-1 uppercase tracking-wide">
            {PROVIDER_LABELS.dia}
          </div>
          <div className="text-[22px] font-semibold leading-none text-neutral-900">
            {formatCurrency(result.totals.dia)}
          </div>
          {citoVsDia !== null && (
            <div className="text-xs mt-1 font-medium text-neutral-500">
              {citoVsDia === 0
                ? 'Gelijk aan Cito'
                : citoVsDia < 0
                  ? `${formatCurrency(Math.abs(citoVsDia))} goedkoper dan Cito`
                  : `${formatCurrency(citoVsDia)} duurder dan Cito`}
            </div>
          )}
          {citoVsDia === null && (
            <div className="text-xs mt-1 text-neutral-400">Geen overeenkomende modules</div>
          )}
        </div>

        {/* JIJ */}
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
          <div className="text-xs font-semibold text-neutral-500 mb-1 uppercase tracking-wide">
            {PROVIDER_LABELS.jij}
          </div>
          <div className="text-[22px] font-semibold leading-none text-neutral-900">
            {formatCurrency(result.totals.jij)}
          </div>
          {citoVsJij !== null && (
            <div className="text-xs mt-1 font-medium text-neutral-500">
              {citoVsJij === 0
                ? 'Gelijk aan Cito'
                : citoVsJij < 0
                  ? `${formatCurrency(Math.abs(citoVsJij))} goedkoper dan Cito`
                  : `${formatCurrency(citoVsJij)} duurder dan Cito`}
            </div>
          )}
          {citoVsJij === null && (
            <div className="text-xs mt-1 text-neutral-400">Geen overeenkomende modules</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Hoofd component ─────────────────────────────────────────────────────────

export function PriceComparisonPage({ onBack }: PriceComparisonPageProps) {
  const result = usePriceComparisonStore((s) => s.result);
  const initialize = usePriceComparisonStore((s) => s.initialize);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);
  const activeSchoolId = useSchoolProfileStore((s) => s.activeSchoolId);
  const visibleProviders = usePriceComparisonStore((s) => s.visibleProviders);
  const { patterns } = useDiscountPatterns();
  const isOffline = usePricingDataStore((s) => s.isOffline);

  const [chartHighlight] = useState<string | null>(null);
  const [useMarketPricing, setUseMarketPricing] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleBarClick = useCallback((moduleId: string) => {
    const row = document.getElementById(`module-row-${moduleId}`);
    if (row) {
      const top = row.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    row?.click();
  }, []);

  const totalStudents = getTotalStudents(studentCounts);

  const BackButton = onBack ? (
    <button
      type="button"
      onClick={onBack}
      className="text-sm text-cito-primary hover:underline mb-8 inline-flex items-center gap-1"
    >
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
        aria-hidden="true"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Terug naar schoolprofiel
    </button>
  ) : null;

  // Empty state — uses its own container, not SectionBand
  if (selectedModules.length === 0 || result === null) {
    return (
      <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-16">
        {BackButton}
        <h2 className="text-xl font-semibold mb-2">Geen modules geselecteerd</h2>
        <p className="text-base text-neutral-500 mb-6">
          Ga terug naar uw schoolprofiel en selecteer minimaal een module om de
          prijsvergelijking te bekijken.
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="bg-cito-primary text-white text-sm font-semibold py-2 px-4 rounded-lg hover:opacity-90"
          >
            Terug naar schoolprofiel
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Offline price data banner */}
      {isOffline && <OfflinePriceBanner />}

      {/* 1. AI Advies Hero */}
      <SectionBand bg="bg-neutral-50">
        <AiAdviesSection schoolId={activeSchoolId ?? undefined} />
      </SectionBand>

      {/* 2. Bundel/Periode bediening (D-02) */}
      <SectionBand bg="bg-white">
        {BackButton}
        <div className="mb-4">
          <h1 className="text-xl font-semibold leading-[1.2] text-cito-primary">
            Prijsvergelijking
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Vergelijk de kosten van Cito, DIA en JIJ per module op basis van publicatieprijzen
            {totalStudents > 0 && ` \u00b7 ${totalStudents} leerlingen`}.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-6">
          <span title="Een bundel combineert meerdere modules met volumekorting">
            <CitoBundleSelector />
          </span>
          <DiaBundleSelector />
          <span title="Langere contractperiode geeft korting op de jaarprijs">
            <PeriodToggle />
          </span>
          <MarktKortingToggle
            patterns={patterns}
            isEnabled={useMarketPricing}
            onToggle={setUseMarketPricing}
          />
        </div>
      </SectionBand>

      {/* Discount pattern alerts (D-13, D-14) */}
      {patterns.length > 0 && useMarketPricing && (
        <SectionBand bg="bg-white">
          <KortingsPatroonAlert
            patterns={patterns}
            visibleProviders={visibleProviders}
          />
        </SectionBand>
      )}

      {/* 3. Totaal-kaarten */}
      <SectionBand bg="bg-neutral-50">
        <ComparisonSummary result={result} />
      </SectionBand>

      {/* 4. Provider Toolbar + Grafiek (visueel overzicht eerst) */}
      <SectionBand bg="bg-white">
        <ProviderToolbar />
        <div className="mt-6">
          <ComparisonChart result={result} onBarClick={handleBarClick} />
        </div>
      </SectionBand>

      {/* 5. Detail-tabel (drill-down per module) */}
      <SectionBand bg="bg-neutral-50">
        <div className="mb-4">
          <h2 className="text-[15px] font-semibold text-cito-primary">Detail per module</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Klik op een module voor prijsopbouw, productdetails en differentiators.
          </p>
        </div>
        <ComparisonTable result={result} onBarHighlight={chartHighlight} />
      </SectionBand>

      {/* 7. MeerwaardePanel (collapsed by default per D-11) */}
      <SectionBand bg="bg-white">
        <details className="group">
          <summary className="cursor-pointer list-none flex items-center justify-between py-3">
            <h2 className="text-base font-semibold text-cito-primary">Meerwaarde en tijdwinst</h2>
            <svg
              className="w-4 h-4 text-neutral-400 transition-transform duration-200 group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="pb-2">
            <MeerwaardePanel />
          </div>
        </details>
      </SectionBand>

      {/* 8. Disclaimer */}
      <SectionBand bg="bg-neutral-50">
        <DisclaimerFooter
          showDisclaimer={true}
          dataSources={[
            { provider: 'Cito', label: 'Publicatieprijzen Cito VO 2025-2026' },
            { provider: 'DIA', label: 'DIA Webshop (shop.dia.nl), geverifieerd maart 2026' },
            { provider: 'JIJ! (Bureau ICE)', label: 'Deskresearch MediaTest juni 2024 (R-5043), in opdracht van Cito' },
          ]}
        />
      </SectionBand>
    </div>
  );
}
