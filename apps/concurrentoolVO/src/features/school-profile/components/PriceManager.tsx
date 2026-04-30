import { useState } from 'react';
import { useSchoolPrices, useActivateSchoolPrice } from '@/hooks/useSchoolPrices';
import { DEFAULT_PRICES } from '@/data/default-prices';
import { PriceHistoryList } from './PriceHistoryList';
import { PriceEditModal } from './PriceEditModal';
import type { SchoolPriceEntry } from '@/db/types';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface PriceManagerProps {
  schoolId: string;
  moduleId: string;
  provider: string;
  moduleName: string;
}

export function PriceManager({
  schoolId,
  moduleId,
  provider,
}: PriceManagerProps) {
  const { data: allPrices = [] } = useSchoolPrices(schoolId);
  const activatePrice = useActivateSchoolPrice();
  const queryClient = useQueryClient();

  // Filter prices for this module + provider
  const prices = allPrices.filter(
    (p) => p.moduleId === moduleId && p.provider === provider,
  );

  // Publication price from DEFAULT_PRICES
  const publicationPrice =
    DEFAULT_PRICES.find(
      (p) => p.moduleId === moduleId && p.provider === provider,
    )?.amountPerStudent ?? null;

  // Local state
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SchoolPriceEntry | null>(null);
  const [activationReason, setActivationReason] = useState('');
  const [pendingActivationId, setPendingActivationId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleActivatePrice = async (priceId: string) => {
    if (!activationReason.trim()) return;
    await activatePrice.mutateAsync({
      schoolId,
      priceId,
      moduleId,
      provider,
      reason: activationReason.trim(),
    });
    setActivationReason('');
    setPendingActivationId(null);
  };

  const handleResetToPublication = async () => {
    // Deactivate all school prices for this module/provider
    await supabase
      .from('school_prices')
      .update({ is_active: false })
      .eq('school_id', schoolId)
      .eq('module_id', moduleId)
      .eq('provider', provider);

    queryClient.invalidateQueries({ queryKey: ['school-prices', schoolId] });
    setShowResetConfirm(false);
  };

  return (
    <div className="mt-2">
      {/* Collapsible toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-[14px] text-neutral-600 hover:text-neutral-900"
      >
        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
            clipRule="evenodd"
          />
        </svg>
        Prijsbeheer
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-3 pl-2">
          <PriceHistoryList
            prices={prices}
            publicationPrice={publicationPrice}
            moduleId={moduleId}
            provider={provider}
            onEditPrice={(entry) => setEditingEntry(entry)}
            onActivatePrice={handleActivatePrice}
            activationReason={activationReason}
            onActivationReasonChange={setActivationReason}
            pendingActivationId={pendingActivationId}
          />

          {/* Action buttons */}
          <div className="flex items-center gap-4 mt-3">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="text-[14px] text-cito-primary hover:underline font-semibold"
            >
              + Prijs toevoegen
            </button>
            {prices.length > 0 && (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-[14px] text-neutral-500 hover:text-neutral-700"
              >
                Reset naar publicatieprijs
              </button>
            )}
          </div>

          {/* Reset confirmation */}
          {showResetConfirm && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-[14px] text-amber-800">
                Weet u zeker dat u wilt terugkeren naar de publicatieprijs?
                Schoolspecifieke prijzen worden gedeactiveerd.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleResetToPublication}
                  className="text-[14px] font-semibold text-amber-800 hover:text-amber-900 px-3 h-[36px] bg-amber-100 rounded-lg"
                >
                  Bevestigen
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="text-[14px] text-neutral-600 hover:text-neutral-800 px-3 h-[36px]"
                >
                  Annuleren
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add modal */}
      <PriceEditModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        schoolId={schoolId}
        moduleId={moduleId}
        provider={provider}
      />

      {/* Edit modal */}
      {editingEntry && (
        <PriceEditModal
          isOpen={!!editingEntry}
          onClose={() => setEditingEntry(null)}
          schoolId={schoolId}
          moduleId={moduleId}
          provider={provider}
          existingEntry={editingEntry}
        />
      )}
    </div>
  );
}
