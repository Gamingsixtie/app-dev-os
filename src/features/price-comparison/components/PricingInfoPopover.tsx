import { useState, useEffect } from 'react';
import { PROVIDER_CONFIGS } from '@/data/providers';
import { PROVIDER_LABELS } from '@/engine/price-comparison';
import type { ProviderKey } from '@/engine/price-comparison';

/** Descriptions per pricing strategy type */
const PRICING_STRATEGY_DESCRIPTIONS: Record<string, string> = {
  'platform+module':
    'Platform + module-prijzen per leerling. Bundels (Basis, Plus) bieden korting bij meerdere modules. Meerjarencontracten verlagen de prijs verder.',
  'package-bundle':
    'Pakketprijzen per leerling. Modules zijn gebundeld in vaste pakketten \u2014 het goedkoopste kwalificerende pakket wordt automatisch geselecteerd.',
  'tiered-license':
    'Staffellicentie op basis van schoolgrootte. Eenmalige licentie + kosten per afname. Grotere scholen betalen meer licentie maar minder per leerling.',
  flat: 'Vaste prijs per leerling, onafhankelijk van schoolgrootte of combinatie met andere modules.',
};

export { PRICING_STRATEGY_DESCRIPTIONS };

interface PricingInfoPopoverProps {
  provider: ProviderKey;
}

/** Click-to-show popover with pricing model description (D-08, D-14). */
export function PricingInfoPopover({ provider }: PricingInfoPopoverProps) {
  const [open, setOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const config = PROVIDER_CONFIGS[provider];
  const description =
    PRICING_STRATEGY_DESCRIPTIONS[config.pricingStrategy.type] ??
    config.pricingStrategy.type;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-neutral-400 hover:text-neutral-600 ml-1"
        aria-label={`Prijsmodel ${PROVIDER_LABELS[provider]}`}
      >
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
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Content */}
          <div className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg p-3 text-sm text-neutral-600">
            <div className="font-semibold text-neutral-900 mb-1">
              {PROVIDER_LABELS[provider]}
            </div>
            {description}
          </div>
        </>
      )}
    </div>
  );
}
