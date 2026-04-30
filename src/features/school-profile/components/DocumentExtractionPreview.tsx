import { useState, useMemo, useCallback } from 'react';
import type { ExtractedDocumentPrice } from '@/lib/document-parser';
import type { SchoolPriceEntry } from '@/db/types';
import { MODULE_CATALOG } from '@/models/modules';
import { formatCurrency } from '@/lib/format';
import { PriceDeviationWarning } from '@/components/ui/PriceDeviationWarning';
import DiffViewItem from './DiffViewItem';
import DiffViewSection from './DiffViewSection';

// ─── Provider labels ────────────────────────────────────────────────────────

const PROVIDER_LABELS: Record<string, string> = {
  cito: 'Cito',
  dia: 'DIA',
  jij: 'JIJ (IEP)',
  onbekend: 'Onbekend',
};

// ─── Module name lookup ─────────────────────────────────────────────────────

const moduleNameMap = new Map(MODULE_CATALOG.map((m) => [m.id, m.name]));

function getModuleName(moduleId: string): string {
  return moduleNameMap.get(moduleId) ?? moduleId;
}

function getProviderLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider;
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface DocumentExtractionPreviewProps {
  prices: ExtractedDocumentPrice[];
  schoolId: string;
  fileName: string;
  existingPrices: SchoolPriceEntry[];
  onConfirm: (selectedPrices: ExtractedDocumentPrice[]) => void;
  onCancel: () => void;
}

/**
 * Extracted prices from document shown in DiffView format with checkboxes.
 * Per D-16: same diff-view pattern, per-price checkboxes, never auto-saved.
 */
export default function DocumentExtractionPreview({
  prices,
  fileName,
  existingPrices,
  onConfirm,
  onCancel,
}: DocumentExtractionPreviewProps) {
  // Default: all new prices checked
  const [checkedIndices, setCheckedIndices] = useState<Set<number>>(() => {
    return new Set(prices.map((_, i) => i));
  });

  // Find existing price for same module+provider
  const findExisting = useCallback(
    (moduleId: string, provider: string) => {
      return existingPrices.find(
        (p) => p.moduleId === moduleId && p.provider === provider && p.isActive,
      );
    },
    [existingPrices],
  );

  // Compute diff statuses
  const priceItems = useMemo(() => {
    return prices.map((price, index) => {
      const existing = findExisting(price.moduleId, price.provider);
      const status = existing ? 'conflict' as const : 'new' as const;
      const label = `${getModuleName(price.moduleId)} \u2014 ${getProviderLabel(price.provider)}`;
      const newValue = `${formatCurrency(price.amount)} per leerling`;
      const existingValue = existing
        ? `${formatCurrency(existing.amount)} per leerling`
        : undefined;

      return { price, index, status, label, newValue, existingValue, existing };
    });
  }, [prices, findExisting]);

  const handleToggle = useCallback((index: number, checked: boolean) => {
    setCheckedIndices((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(index);
      } else {
        next.delete(index);
      }
      return next;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    const selected = prices.filter((_, i) => checkedIndices.has(i));
    onConfirm(selected);
  }, [prices, checkedIndices, onConfirm]);

  const hasChecked = checkedIndices.size > 0;

  if (prices.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <p className="text-[14px] text-neutral-500">
          Geen prijzen gevonden in dit document. Voer prijzen handmatig in.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 text-[14px] text-neutral-700 hover:underline"
        >
          Upload annuleren
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6">
      {/* Heading */}
      <h3 className="text-[20px] font-semibold text-neutral-900">
        Herkende prijzen uit document
      </h3>
      <p className="text-[14px] text-neutral-500 mt-1 mb-4">
        Vink aan welke prijzen u wilt overnemen.
      </p>
      <p className="text-[12px] text-neutral-400 mb-4">
        Bron: {fileName}
      </p>

      {/* Price items in DiffView format */}
      <DiffViewSection title="Prijzen" defaultExpanded>
        {priceItems.map((item) => (
          <div key={item.index}>
            <DiffViewItem
              label={item.label}
              newValue={item.newValue}
              existingValue={item.existingValue}
              status={item.status}
              checked={checkedIndices.has(item.index)}
              onChange={(checked) => handleToggle(item.index, checked)}
            />
            {/* Inline price deviation warning */}
            <div className="ml-8 mb-1">
              <PriceDeviationWarning
                moduleId={item.price.moduleId}
                provider={item.price.provider}
                amount={item.price.amount}
              />
            </div>
          </div>
        ))}
      </DiffViewSection>

      {/* Bottom CTA bar */}
      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-neutral-100">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!hasChecked}
          className={`h-[44px] px-6 rounded-lg text-[14px] font-semibold text-white transition-colors ${
            hasChecked
              ? 'bg-cito-accent hover:bg-cito-accent/90 cursor-pointer'
              : 'bg-neutral-300 cursor-not-allowed'
          }`}
        >
          Prijzen overnemen
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-[44px] px-4 text-[14px] text-neutral-700 hover:underline"
        >
          Upload annuleren
        </button>
      </div>
    </div>
  );
}
