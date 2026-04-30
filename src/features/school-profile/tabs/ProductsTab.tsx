import { useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSchoolProfileStore } from '../store';
import { usePriceComparisonStore } from '@/features/price-comparison/store';
import { useSchoolPrices, useCreateSchoolPrice } from '@/hooks/useSchoolPrices';
import { MODULE_CATALOG } from '@/models/modules';
import { CURRENT_PROVIDER_LABELS, toPriceProvider } from '@/models/school';
import type { PriceAdjustmentType } from '@/models/school';
import { DEFAULT_PRICES } from '@/data/default-prices';
import { formatCurrency } from '@/lib/format';
import { getPriceStatus } from '@/models/pricing';
import type { PriceRecord } from '@/models/pricing';
import { PriceManager } from '../components/PriceManager';
import { PriceProposalModal } from '@/features/review/PriceProposalModal';
import DocumentDropzone from '../components/DocumentDropzone';
import DocumentExtractionPreview from '../components/DocumentExtractionPreview';
import { uploadAndExtract, type ExtractedDocumentPrice } from '@/lib/document-parser';
import { updateSchoolData } from '@/db/operations';
import { useAuth } from '@/features/auth/AuthProvider';

export default function ProductsTab() {
  const { slug } = useParams({ from: '/scholen/$slug' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);
  const activeSchoolId = useSchoolProfileStore((s) => s.activeSchoolId);
  const setModuleSetups = useSchoolProfileStore((s) => s.setModuleSetups);
  const productPricesDirty = usePriceComparisonStore((s) => s.productPricesDirty);
  const markProductPricesDirty = usePriceComparisonStore((s) => s.markProductPricesDirty);

  // Update pricePerStudent for a single module (prijswijziging mode)
  const handlePriceChange = useCallback(
    (moduleId: string, value: string) => {
      const numValue = value === '' ? null : parseFloat(value);
      if (value !== '' && isNaN(numValue!)) return;
      const updated = moduleSetups.map((s) =>
        s.moduleId === moduleId
          ? { ...s, pricePerStudent: numValue, priceAdjustmentType: numValue !== null ? ('prijswijziging' as const) : undefined, discountPercentage: undefined }
          : s,
      );
      setModuleSetups(updated);
      markProductPricesDirty();
    },
    [moduleSetups, setModuleSetups, markProductPricesDirty],
  );

  // Update discount percentage for a single module (korting mode)
  const handleDiscountChange = useCallback(
    (moduleId: string, value: string, publicationPrice: number) => {
      const pct = value === '' ? null : parseFloat(value);
      if (value !== '' && (isNaN(pct!) || pct! < 0 || pct! > 100)) return;
      const effectivePrice = pct !== null ? publicationPrice * (1 - pct / 100) : null;
      const updated = moduleSetups.map((s) =>
        s.moduleId === moduleId
          ? { ...s, pricePerStudent: effectivePrice !== null ? Math.round(effectivePrice * 100) / 100 : null, priceAdjustmentType: pct !== null ? ('korting' as const) : undefined, discountPercentage: pct ?? undefined }
          : s,
      );
      setModuleSetups(updated);
      markProductPricesDirty();
    },
    [moduleSetups, setModuleSetups, markProductPricesDirty],
  );

  // Toggle between prijswijziging and korting
  const handleAdjustmentTypeChange = useCallback(
    (moduleId: string, type: PriceAdjustmentType) => {
      const updated = moduleSetups.map((s) => {
        if (s.moduleId !== moduleId) return s;
        if (type === 'korting') {
          return { ...s, priceAdjustmentType: type, pricePerStudent: null, discountPercentage: undefined };
        }
        return { ...s, priceAdjustmentType: type, discountPercentage: undefined };
      });
      setModuleSetups(updated);
    },
    [moduleSetups, setModuleSetups],
  );

  // Recalculate and navigate to results
  const handleRecalculate = useCallback(async () => {
    // Save current state to Dexie
    const state = useSchoolProfileStore.getState();
    if (state.activeSchoolId) {
      await updateSchoolData(state.activeSchoolId, {
        levels: state.levels,
        studentCounts: state.studentCounts,
        selectedModules: state.selectedModules,
        moduleSetups: state.moduleSetups,
        scenario: state.scenario,
        name: state.schoolName,
      });
      await queryClient.invalidateQueries({ queryKey: ['school', slug] });
    }

    // Recalculate with new prices
    usePriceComparisonStore.getState().initialize();

    // Navigate to Vergelijking tab — ComparisonTab handles scenario routing internally
    navigate({ to: '/scholen/$slug/vergelijking', params: { slug } });
  }, [slug, navigate, queryClient]);

  // Fetch school-specific prices from school_prices table
  const { data: schoolPrices = [] } = useSchoolPrices(activeSchoolId ?? '');
  const createPrice = useCreateSchoolPrice();

  // Price proposal modal state
  const [proposalTarget, setProposalTarget] = useState<{
    moduleId: string;
    provider: string;
    currentPrice: number;
    moduleName: string;
  } | null>(null);

  // Document upload state
  const [showDropzone, setShowDropzone] = useState(false);
  const [isDocProcessing, setIsDocProcessing] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [extractedPrices, setExtractedPrices] = useState<ExtractedDocumentPrice[] | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Handle file selection from DocumentDropzone
  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!activeSchoolId) return;
      setIsDocProcessing(true);
      setDocError(null);
      try {
        const prices = await uploadAndExtract(activeSchoolId, userProfile?.teamId ?? '', file);
        setExtractedPrices(prices);
        setUploadedFileName(file.name);
      } catch (err) {
        setDocError(err instanceof Error ? err.message : 'Extractie mislukt');
      } finally {
        setIsDocProcessing(false);
      }
    },
    [activeSchoolId],
  );

  // Handle confirm from DocumentExtractionPreview
  const handleConfirmPrices = useCallback(
    async (selectedPrices: ExtractedDocumentPrice[]) => {
      if (!activeSchoolId || !uploadedFileName) return;

      for (const price of selectedPrices) {
        await createPrice.mutateAsync({
          schoolId: activeSchoolId,
          data: {
            moduleId: price.moduleId,
            provider: price.provider,
            amount: price.amount,
            priceType: price.priceType,
            source: uploadedFileName,
            verifiedAt: new Date().toISOString(),
            note: `Geextraheerd uit ${uploadedFileName}`,
          },
        });
      }

      // Clear extraction state
      setExtractedPrices(null);
      setUploadedFileName(null);
      setShowDropzone(false);
    },
    [activeSchoolId, uploadedFileName, createPrice],
  );

  // Handle cancel from DocumentExtractionPreview
  const handleCancelExtraction = useCallback(() => {
    setExtractedPrices(null);
    setUploadedFileName(null);
    // Keep dropzone visible so user can try again
  }, []);

  if (selectedModules.length === 0) {
    return (
      <div className="p-8 max-sm:p-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
          <p className="text-[16px] text-neutral-500">
            Geen modules geselecteerd. Selecteer modules via de wizard.
          </p>
          <Link
            to="/scholen/$slug/wizard/$step"
            params={{ slug, step: '3' }}
            className="inline-block mt-4 text-[14px] text-cito-primary hover:underline"
          >
            Naar module-selectie
          </Link>
        </div>
      </div>
    );
  }

  // Build module info map
  const moduleMap = new Map(MODULE_CATALOG.map((m) => [m.id, m]));

  // Find publication price for a module and provider
  const getPublicationPrice = (moduleId: string, provider: string) => {
    return DEFAULT_PRICES.find(
      (p) => p.moduleId === moduleId && p.provider === provider,
    )?.amountPerStudent ?? null;
  };


  return (
    <div className="p-8 max-sm:p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[20px] font-semibold text-neutral-900">
          Productgebruik{' '}
          <span className="text-[14px] font-normal text-neutral-500">
            ({selectedModules.length})
          </span>
        </h2>
        <div className="flex items-center gap-3">
          {activeSchoolId && (
            <button
              type="button"
              onClick={() => setShowDropzone(!showDropzone)}
              className="h-[44px] px-4 rounded-lg text-[14px] font-semibold text-white bg-cito-primary hover:bg-cito-primary/90 transition-colors"
            >
              Document uploaden
            </button>
          )}
          <Link
            to="/scholen/$slug/wizard/$step"
            params={{ slug, step: '3' }}
            className="text-[14px] text-cito-primary hover:underline"
          >
            Modules aanpassen
          </Link>
        </div>
      </div>

      {/* Document upload area */}
      {showDropzone && activeSchoolId && (
        <div className="mb-6">
          {extractedPrices !== null ? (
            <DocumentExtractionPreview
              prices={extractedPrices}
              schoolId={activeSchoolId}
              fileName={uploadedFileName ?? ''}
              existingPrices={schoolPrices}
              onConfirm={handleConfirmPrices}
              onCancel={handleCancelExtraction}
            />
          ) : (
            <DocumentDropzone
              onFileSelected={handleFileSelected}
              isProcessing={isDocProcessing}
              error={docError ?? undefined}
            />
          )}
        </div>
      )}

      <h3 className="text-[20px] font-semibold text-neutral-900 mb-4">
        Prijsbeheer
      </h3>

      <div className="flex flex-col gap-4">
        {selectedModules.map((moduleId) => {
          const moduleDef = moduleMap.get(moduleId);
          const moduleName = moduleDef?.name ?? moduleId;
          const setup = moduleSetups.find((s) => s.moduleId === moduleId);
          const currentProvider = setup?.currentProvider ?? 'geen';
          const providerLabel = CURRENT_PROVIDER_LABELS[currentProvider];

          // Determine publication price for discount calculation
          const priceProvider = toPriceProvider(currentProvider);
          const publicationPrice = priceProvider ? getPublicationPrice(moduleId, priceProvider) : null;

          const adjustmentType = setup?.priceAdjustmentType ?? 'prijswijziging';

          return (
            <div
              key={moduleId}
              className="bg-white border border-neutral-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[16px] font-semibold text-neutral-900">
                    {moduleName}
                  </h3>
                  <p className="text-[14px] text-neutral-500 mt-1">
                    {providerLabel}
                    {setup?.customProviderName && ` (${setup.customProviderName})`}
                  </p>
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                  {/* Adjustment type toggle */}
                  {publicationPrice !== null && (
                    <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleAdjustmentTypeChange(moduleId, 'prijswijziging')}
                        className={`px-3 py-1 text-[12px] font-medium transition-colors ${
                          adjustmentType === 'prijswijziging'
                            ? 'bg-cito-primary text-white'
                            : 'bg-white text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        Prijswijziging
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustmentTypeChange(moduleId, 'korting')}
                        className={`px-3 py-1 text-[12px] font-medium transition-colors ${
                          adjustmentType === 'korting'
                            ? 'bg-cito-primary text-white'
                            : 'bg-white text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        Korting
                      </button>
                    </div>
                  )}

                  {/* Price input based on adjustment type */}
                  {adjustmentType === 'korting' && publicationPrice !== null ? (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          placeholder="0"
                          value={setup?.discountPercentage ?? ''}
                          onChange={(e) => handleDiscountChange(moduleId, e.target.value, publicationPrice)}
                          className="w-[70px] h-[36px] px-2 text-right text-[14px] font-semibold border border-neutral-200 rounded-lg focus:border-cito-primary focus:ring-1 focus:ring-cito-primary outline-none"
                        />
                        <span className="text-[13px] text-neutral-500">% korting</span>
                      </div>
                      {setup?.discountPercentage != null && (
                        <p className="text-[12px] text-green-600 font-semibold">
                          {formatCurrency(publicationPrice * (1 - setup.discountPercentage / 100))} per leerling
                          <span className="text-neutral-400 font-normal"> (was {formatCurrency(publicationPrice)})</span>
                        </p>
                      )}
                      {setup?.discountPercentage == null && (
                        <p className="text-[12px] text-neutral-400">
                          Publicatieprijs: {formatCurrency(publicationPrice)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] text-neutral-500">&euro;</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={publicationPrice !== null ? publicationPrice.toFixed(2) : '0.00'}
                          value={setup?.pricePerStudent ?? ''}
                          onChange={(e) => handlePriceChange(moduleId, e.target.value)}
                          className="w-[90px] h-[36px] px-2 text-right text-[14px] font-semibold border border-neutral-200 rounded-lg focus:border-cito-primary focus:ring-1 focus:ring-cito-primary outline-none"
                        />
                        <span className="text-[13px] text-neutral-500">per leerling</span>
                      </div>

                      {/* Discount/markup indicator */}
                      {(() => {
                        const enteredPrice = setup?.pricePerStudent;
                        if (enteredPrice !== null && enteredPrice !== undefined && publicationPrice !== null && publicationPrice > 0) {
                          const diff = Math.round(((enteredPrice - publicationPrice) / publicationPrice) * 100);
                          if (diff !== 0) {
                            return (
                              <p className={`text-[12px] font-semibold ${diff < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {diff < 0 ? '' : '+'}{diff}% t.o.v. publicatieprijs ({formatCurrency(publicationPrice)})
                              </p>
                            );
                          }
                          return (
                            <p className="text-[12px] text-neutral-400">
                              Gelijk aan publicatieprijs
                            </p>
                          );
                        }
                        if (publicationPrice !== null) {
                          return (
                            <p className="text-[12px] text-neutral-400">
                              Publicatieprijs: {formatCurrency(publicationPrice)}
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                  {/* Staleness indicator and "Klopt niet?" link for publication prices */}
                  {publicationPrice !== null && priceProvider && (() => {
                    const priceRecord = DEFAULT_PRICES.find(
                      (p: PriceRecord) => p.moduleId === moduleId && p.provider === priceProvider,
                    );
                    if (!priceRecord) return null;
                    const status = getPriceStatus(priceRecord);
                    return (
                      <div className="flex items-center gap-2 mt-1">
                        {status === 'stale' && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] text-amber-600"
                            title={`Prijs niet geverifieerd sinds ${priceRecord.verifiedAt.toLocaleDateString('nl-NL')}`}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                            </svg>
                            Mogelijk verouderd
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProposalTarget({
                              moduleId,
                              provider: priceProvider,
                              currentPrice: publicationPrice,
                              moduleName,
                            });
                          }}
                          className="text-xs text-blue-600 hover:underline cursor-pointer"
                        >
                          Klopt niet?
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* PriceManager collapsible section */}
              {activeSchoolId && priceProvider && (
                <PriceManager
                  schoolId={activeSchoolId}
                  moduleId={moduleId}
                  provider={priceProvider}
                  moduleName={moduleName}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky recalculation banner */}
      {productPricesDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-50 border-t border-amber-300 shadow-lg px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-[14px] font-medium text-amber-800">
              Prijzen zijn gewijzigd. Wil je opnieuw berekenen?
            </p>
          </div>
          <button
            type="button"
            onClick={handleRecalculate}
            className="h-[40px] px-5 rounded-lg text-[14px] font-semibold text-white bg-cito-primary hover:bg-cito-primary/90 transition-colors"
          >
            Opnieuw berekenen
          </button>
        </div>
      )}

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
