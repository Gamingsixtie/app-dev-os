import { useEffect, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { priceProposalSchema, type PriceProposalInput } from './schemas/proposal.schema';
import { useCreateProposal } from '@/hooks/usePriceProposals';
import { checkPriceDeviation } from '@/models/pricing';
import { normalizePrice, type NormalizedPriceResult, type NormalizedPrice } from '@/lib/ai-price-normalization';
import { formatCurrency } from '@/lib/format';

const eurFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
});

interface PriceProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  provider: string;
  currentPrice: number;
  moduleName: string;
  schoolId?: string;
  schoolName?: string;
}

export function PriceProposalModal({
  isOpen,
  onClose,
  moduleId,
  provider,
  currentPrice,
  moduleName,
  schoolId,
  schoolName,
}: PriceProposalModalProps) {
  const createProposal = useCreateProposal();
  const [showDeviationWarning, setShowDeviationWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<PriceProposalInput | null>(null);
  const [showToast, setShowToast] = useState(false);

  // AI normalization state
  const [freeformText, setFreeformText] = useState('');
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [normalizedResult, setNormalizedResult] = useState<NormalizedPriceResult | null>(null);
  const [normalizationError, setNormalizationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PriceProposalInput>({
    resolver: zodResolver(priceProposalSchema),
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({ proposed_price: undefined as unknown as number, source: '', explanation: '', scope: schoolId ? 'school' : 'global' });
      setShowDeviationWarning(false);
      setPendingSubmit(null);
      setShowToast(false);
      setFreeformText('');
      setIsNormalizing(false);
      setNormalizedResult(null);
      setNormalizationError(null);
    }
  }, [isOpen, reset]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const submitProposal = async (data: PriceProposalInput) => {
    try {
      await createProposal.mutateAsync({
        module_id: moduleId,
        provider,
        current_price: currentPrice,
        proposed_price: data.proposed_price,
        source: data.source,
        explanation: data.explanation,
        scope: data.scope,
        school_id: data.scope === 'school' ? (schoolId ?? null) : null,
        school_name: data.scope === 'school' ? (schoolName ?? null) : null,
      });
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onClose();
      }, 2000);
    } catch {
      // Error handled by React Query
    }
  };

  const onSubmit = async (data: PriceProposalInput) => {
    // Check for price deviation > 50%
    const deviation = checkPriceDeviation(moduleId, provider, data.proposed_price);
    if (deviation.hasDeviation && !pendingSubmit) {
      setShowDeviationWarning(true);
      setPendingSubmit(data);
      return;
    }
    await submitProposal(data);
  };

  const confirmDeviation = async () => {
    if (pendingSubmit) {
      setShowDeviationWarning(false);
      await submitProposal(pendingSubmit);
      setPendingSubmit(null);
    }
  };

  const cancelDeviation = () => {
    setShowDeviationWarning(false);
    setPendingSubmit(null);
  };

  // AI normalization handler
  const handleNormalize = async () => {
    if (!freeformText.trim()) return;
    setIsNormalizing(true);
    setNormalizationError(null);
    setNormalizedResult(null);

    try {
      const result = await normalizePrice(freeformText);
      setNormalizedResult(result);

      // Auto-fill if high confidence match for current module/provider
      const matchingPrice = result.prices.find(
        (p) => p.moduleId === moduleId && p.provider === provider,
      );

      if (matchingPrice && matchingPrice.confidence === 'high') {
        setValue('proposed_price', matchingPrice.amountPerStudent);
        setValue('source', `AI-normalisatie: "${freeformText.slice(0, 80)}${freeformText.length > 80 ? '...' : ''}"`);
        setValue('explanation', `Genormaliseerd uit vrije tekst. Module: ${matchingPrice.moduleId}, Aanbieder: ${matchingPrice.provider}, Bedrag: ${formatCurrency(matchingPrice.amountPerStudent)}/lln/jr`);
      }
    } catch {
      setNormalizationError('AI-normalisatie niet beschikbaar — voer de gegevens handmatig in');
    } finally {
      setIsNormalizing(false);
    }
  };

  // Apply a normalized price to the form fields
  const applyNormalizedPrice = (price: NormalizedPrice) => {
    setValue('proposed_price', price.amountPerStudent);
    setValue('source', `AI-normalisatie: "${freeformText.slice(0, 80)}${freeformText.length > 80 ? '...' : ''}"`);
    setValue('explanation', `Genormaliseerd uit vrije tekst. Module: ${price.moduleId}, Aanbieder: ${price.provider}, Bedrag: ${formatCurrency(price.amountPerStudent)}/lln/jr`);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg max-w-[520px] w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-semibold text-neutral-900">
            Prijsvoorstel indienen
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 text-xl leading-none"
            aria-label="Sluiten"
          >
            &times;
          </button>
        </div>

        {/* Read-only info */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-[14px]">
            <span className="text-neutral-500">Module:</span>
            <span className="font-semibold">{moduleName} ({provider.toUpperCase()})</span>
          </div>
          <div className="flex items-center gap-2 text-[14px]">
            <span className="text-neutral-500">Huidige prijs:</span>
            <span className="font-semibold">{eurFormatter.format(currentPrice)}</span>
          </div>
        </div>

        {/* Scope selector */}
        <div className="mb-4">
          <label className="block text-[14px] font-semibold text-neutral-700 mb-2">
            Bereik
          </label>
          <div className="flex gap-2">
            <label
              className={`flex-1 flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                !errors.scope ? 'border-neutral-200' : 'border-red-400'
              }`}
            >
              <input
                type="radio"
                value="global"
                className="accent-[#003082]"
                {...register('scope')}
              />
              <div>
                <span className="text-[14px] font-semibold text-neutral-900">Alle scholen</span>
                <p className="text-[12px] text-neutral-500">Nieuwe prijslijst — geldt overal</p>
              </div>
            </label>
            <label
              className={`flex-1 flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                !errors.scope ? 'border-neutral-200' : 'border-red-400'
              }`}
            >
              <input
                type="radio"
                value="school"
                className="accent-[#003082]"
                {...register('scope')}
              />
              <div>
                <span className="text-[14px] font-semibold text-neutral-900">Alleen deze school</span>
                <p className="text-[12px] text-neutral-500">
                  {schoolName ? `Korting voor ${schoolName}` : 'Specifieke korting of afspraak'}
                </p>
              </div>
            </label>
          </div>
          {errors.scope && (
            <p className="text-[14px] text-red-600 mt-1">{errors.scope.message}</p>
          )}
        </div>

        {/* AI normalization section (D-12) */}
        <div className="mb-4 border border-neutral-200 rounded-lg p-3 bg-neutral-50">
          <label htmlFor="freeform-text" className="block text-[13px] font-semibold text-neutral-600 mb-1">
            Vrije tekst invoer
          </label>
          <p className="text-[12px] text-neutral-400 mb-2">
            Plak hier prijsinformatie uit e-mails, offertes of notities — AI herkent de juiste module en prijs.
          </p>
          <textarea
            id="freeform-text"
            rows={3}
            value={freeformText}
            onChange={(e) => setFreeformText(e.target.value)}
            placeholder="Bijv. 'DIA rekenen kost 3,36 per leerling' of 'Engels JIJ 4,50/lln'"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cito-primary resize-y bg-white"
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={handleNormalize}
              disabled={isNormalizing || !freeformText.trim()}
              className="inline-flex items-center gap-2 px-3 h-[32px] text-[13px] font-semibold border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
            >
              {isNormalizing ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyseren...
                </>
              ) : (
                'Normaliseer'
              )}
            </button>
          </div>

          {/* Normalization error */}
          {normalizationError && (
            <div className="mt-2 text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {normalizationError}
            </div>
          )}

          {/* Normalized results */}
          {normalizedResult && normalizedResult.prices.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[12px] font-semibold text-neutral-600">Herkende prijzen:</p>
              {normalizedResult.prices.map((price, idx) => (
                <div
                  key={`${price.moduleId}-${price.provider}-${idx}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[13px] ${
                    price.confidence === 'high'
                      ? 'bg-green-50 border-green-200'
                      : price.confidence === 'medium'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-neutral-50 border-neutral-200'
                  }`}
                >
                  <div>
                    <span className="font-semibold">{price.moduleId}</span>
                    <span className="text-neutral-500 mx-1">|</span>
                    <span className="uppercase text-neutral-600">{price.provider}</span>
                    <span className="text-neutral-500 mx-1">|</span>
                    <span className="font-semibold">{formatCurrency(price.amountPerStudent)}/lln/jr</span>
                    {price.warning && (
                      <span className="ml-2 text-amber-600 text-[11px]">({price.warning})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${
                      price.confidence === 'high'
                        ? 'bg-green-200 text-green-700'
                        : price.confidence === 'medium'
                          ? 'bg-amber-200 text-amber-700'
                          : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {price.confidence}
                    </span>
                    <button
                      type="button"
                      onClick={() => applyNormalizedPrice(price)}
                      className="text-[12px] text-cito-primary hover:underline font-semibold"
                    >
                      Overnemen
                    </button>
                  </div>
                </div>
              ))}
              {normalizedResult.unmatched.length > 0 && (
                <p className="text-[11px] text-neutral-400 mt-1">
                  Niet herkend: {normalizedResult.unmatched.join(', ')}
                </p>
              )}
            </div>
          )}

          {normalizedResult && normalizedResult.prices.length === 0 && (
            <div className="mt-2 text-[13px] text-neutral-500">
              Geen prijzen herkend in de tekst. Voer de gegevens handmatig in.
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Proposed price */}
          <div>
            <label htmlFor="proposed_price" className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Nieuwe prijs
            </label>
            <div className="relative">
              <input
                id="proposed_price"
                type="number"
                step="0.01"
                className={`w-full h-[44px] px-3 pr-12 border rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-cito-primary ${
                  errors.proposed_price ? 'border-red-500' : 'border-neutral-300'
                }`}
                {...register('proposed_price', { valueAsNumber: true })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[14px]">
                EUR
              </span>
            </div>
            {errors.proposed_price && (
              <p className="text-[14px] text-red-600 mt-1">{errors.proposed_price.message}</p>
            )}
          </div>

          {/* Source */}
          <div>
            <label htmlFor="source" className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Bron
            </label>
            <input
              id="source"
              type="text"
              placeholder="Bijv. offerte, website, telefoongesprek"
              className={`w-full h-[44px] px-3 border rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-cito-primary ${
                errors.source ? 'border-red-500' : 'border-neutral-300'
              }`}
              {...register('source')}
            />
            {errors.source && (
              <p className="text-[14px] text-red-600 mt-1">{errors.source.message}</p>
            )}
          </div>

          {/* Explanation */}
          <div>
            <label htmlFor="explanation" className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Toelichting
            </label>
            <textarea
              id="explanation"
              rows={3}
              placeholder="Leg uit waarom deze prijs klopt (min. 10 tekens)"
              className={`w-full px-3 py-2 border rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-cito-primary resize-y ${
                errors.explanation ? 'border-red-500' : 'border-neutral-300'
              }`}
              {...register('explanation')}
            />
            {errors.explanation && (
              <p className="text-[14px] text-red-600 mt-1">{errors.explanation.message}</p>
            )}
          </div>

          {/* Deviation warning */}
          {showDeviationWarning && (
            <div className="bg-modified-bg border border-modified-border rounded-lg p-3">
              <p className="text-[14px] text-neutral-800 font-semibold mb-2">
                Deze prijs wijkt meer dan 50% af van de huidige prijs. Weet u het zeker?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={confirmDeviation}
                  className="bg-cito-primary text-white text-[14px] font-semibold px-4 h-[36px] rounded-lg hover:opacity-90"
                >
                  Ja, indienen
                </button>
                <button
                  type="button"
                  onClick={cancelDeviation}
                  className="text-[14px] text-neutral-700 hover:text-neutral-900 px-4 h-[36px]"
                >
                  Annuleren
                </button>
              </div>
            </div>
          )}

          {/* Toast */}
          {showToast && (
            <div className="bg-status-verified-bg text-status-verified-text rounded-lg p-3 text-[14px] font-semibold">
              Prijsvoorstel ingediend — een manager beoordeelt dit binnenkort
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[14px] text-neutral-700 hover:text-neutral-900 px-4 h-[44px]"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSubmitting || showDeviationWarning}
              className="bg-cito-primary text-white text-[14px] font-semibold px-6 h-[44px] rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Indienen...' : 'Voorstel indienen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
