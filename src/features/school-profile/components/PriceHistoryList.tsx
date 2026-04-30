import { useState } from 'react';
import { SchoolPriceBadge } from '@/components/ui/PriceBadge';
import { PriceDeviationWarning } from '@/components/ui/PriceDeviationWarning';
import { formatCurrency } from '@/lib/format';
import type { SchoolPriceEntry } from '@/db/types';

interface PriceHistoryListProps {
  prices: SchoolPriceEntry[];
  publicationPrice: number | null;
  moduleId: string;
  provider: string;
  onEditPrice: (entry: SchoolPriceEntry) => void;
  onActivatePrice: (priceId: string) => void;
  activationReason: string;
  onActivationReasonChange: (reason: string) => void;
  pendingActivationId: string | null;
}

export function PriceHistoryList({
  prices,
  publicationPrice,
  moduleId,
  provider,
  onEditPrice,
  onActivatePrice,
  activationReason,
  onActivationReasonChange,
  pendingActivationId,
}: PriceHistoryListProps) {
  const [selectedRadioId, setSelectedRadioId] = useState<string | null>(null);

  // Sort newest first
  const sortedPrices = [...prices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Empty state
  if (sortedPrices.length === 0 && publicationPrice === null) {
    return (
      <p className="text-[14px] text-neutral-500 py-4">
        Nog geen prijzen vastgelegd. Klik op &apos;+ Prijs toevoegen&apos; om te beginnen.
      </p>
    );
  }

  const handleRadioClick = (priceId: string) => {
    setSelectedRadioId(priceId);
    onActivationReasonChange('');
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Publication price reference row */}
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200">
        <div className="flex-shrink-0">
          {/* Empty radio placeholder for alignment */}
          <div className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          {publicationPrice !== null ? (
            <>
              <span className="text-[16px] font-semibold text-neutral-400">
                {formatCurrency(publicationPrice)}
              </span>
              <span className="ml-2 text-[14px] text-neutral-400">
                per leerling
              </span>
              <p className="text-[14px] text-neutral-400">Publicatieprijs</p>
            </>
          ) : (
            <p className="text-[14px] text-neutral-400">
              Geen publicatieprijs bekend
            </p>
          )}
        </div>
      </div>

      {/* Price entries */}
      {sortedPrices.map((entry) => {
        const isActive = entry.isActive;
        const isPendingActivation = pendingActivationId === entry.id || selectedRadioId === entry.id;
        const showActivationInput = isPendingActivation && !isActive;

        return (
          <div
            key={entry.id}
            className={`px-3 py-2 rounded-lg border ${
              isActive
                ? 'border-cito-primary bg-blue-50/30'
                : 'border-neutral-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Radio button */}
              <button
                type="button"
                onClick={() => {
                  if (!isActive) handleRadioClick(entry.id);
                }}
                className="flex-shrink-0 mt-1"
                aria-label={
                  isActive
                    ? 'Actieve prijs voor vergelijking'
                    : 'Selecteer als actieve prijs'
                }
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isActive
                      ? 'border-cito-primary'
                      : 'border-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  {isActive && (
                    <div className="w-3 h-3 rounded-full bg-cito-primary" />
                  )}
                </div>
              </button>

              {/* Center content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[16px] font-semibold text-neutral-900">
                    {formatCurrency(entry.amount)}
                  </span>
                  <span className="text-[14px] text-neutral-500">
                    per leerling
                  </span>
                  {publicationPrice !== null && publicationPrice > 0 && entry.amount !== publicationPrice && (
                    <span className={`text-[12px] font-semibold ${entry.amount < publicationPrice ? 'text-green-600' : 'text-red-600'}`}>
                      ({entry.amount < publicationPrice ? '-' : '+'}
                      {Math.abs(Math.round(((entry.amount - publicationPrice) / publicationPrice) * 100))}%)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[14px] text-neutral-600">
                    {entry.priceType === 'publication'
                      ? 'Publicatieprijs'
                      : 'Afgesproken prijs'}
                  </span>
                  {entry.source && (
                    <>
                      <span className="text-neutral-300">|</span>
                      <span className="text-[14px] text-neutral-500">
                        {entry.source}
                      </span>
                    </>
                  )}
                  {entry.verifiedAt && (
                    <>
                      <span className="text-neutral-300">|</span>
                      <span className="text-[14px] text-neutral-500">
                        {new Date(entry.verifiedAt).toLocaleDateString('nl-NL')}
                      </span>
                    </>
                  )}
                </div>
                {/* Price deviation warning */}
                <div className="mt-1">
                  <PriceDeviationWarning
                    moduleId={moduleId}
                    provider={provider}
                    amount={entry.amount}
                  />
                </div>
              </div>

              {/* Right side: badge + edit */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <SchoolPriceBadge entry={entry} />
                <button
                  type="button"
                  onClick={() => onEditPrice(entry)}
                  className="p-1 text-neutral-400 hover:text-neutral-700"
                  aria-label="Prijs bewerken"
                >
                  {/* Pencil icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Activation reason input */}
            {showActivationInput && (
              <div className="mt-2 ml-8 flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
                    Waarom deze prijs?
                  </label>
                  <input
                    type="text"
                    value={activationReason}
                    onChange={(e) => onActivationReasonChange(e.target.value)}
                    placeholder="Bijv. offerte 2026, afspraak met regiomanager"
                    className="w-full h-[36px] px-3 border border-neutral-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cito-primary"
                  />
                </div>
                <button
                  type="button"
                  disabled={!activationReason.trim()}
                  onClick={() => {
                    onActivatePrice(entry.id);
                    setSelectedRadioId(null);
                  }}
                  className="self-end h-[36px] px-3 text-[14px] font-semibold text-white bg-cito-primary rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Activeren
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Empty state when only publication price exists */}
      {sortedPrices.length === 0 && publicationPrice !== null && (
        <p className="text-[14px] text-neutral-500 py-2">
          Nog geen prijzen vastgelegd. Klik op &apos;+ Prijs toevoegen&apos; om te beginnen.
        </p>
      )}
    </div>
  );
}
