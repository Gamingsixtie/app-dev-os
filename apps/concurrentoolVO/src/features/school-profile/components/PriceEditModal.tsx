import { useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { priceEntrySchema, type PriceEntryFormInput } from '../schemas/price-entry.schema';
import { useCreateSchoolPrice, useUpdateSchoolPrice } from '@/hooks/useSchoolPrices';
import { PriceDeviationWarning } from '@/components/ui/PriceDeviationWarning';
import { DEFAULT_PRICES } from '@/data/default-prices';
import type { SchoolPriceEntry } from '@/db/types';

interface PriceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  moduleId: string;
  provider: string;
  existingEntry?: SchoolPriceEntry;
}

export function PriceEditModal({
  isOpen,
  onClose,
  schoolId,
  moduleId,
  provider,
  existingEntry,
}: PriceEditModalProps) {
  const createPrice = useCreateSchoolPrice();
  const updatePrice = useUpdateSchoolPrice();
  const isEdit = !!existingEntry;

  const todayStr = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PriceEntryFormInput>({
    resolver: zodResolver(priceEntrySchema),
    defaultValues: existingEntry
      ? {
          moduleId: existingEntry.moduleId,
          provider: existingEntry.provider,
          amount: existingEntry.amount,
          priceType: existingEntry.priceType,
          discountPercentage: existingEntry.discountPercentage,
          source: existingEntry.source,
          verifiedAt: existingEntry.verifiedAt ?? todayStr,
          note: existingEntry.note,
        }
      : {
          moduleId,
          provider,
          priceType: 'publication' as const,
          discountPercentage: 0,
          source: '',
          verifiedAt: todayStr,
          note: '',
        },
  });

  const priceType = watch('priceType');
  const watchedAmount = watch('amount');

  // Look up publication price for this module/provider
  const publicationPrice = useMemo(() => {
    return DEFAULT_PRICES.find(
      (p) => p.moduleId === moduleId && p.provider === provider,
    )?.amountPerStudent ?? null;
  }, [moduleId, provider]);

  // Auto-calculate discount percentage based on publication price
  const calculatedDiscount = useMemo(() => {
    if (!publicationPrice || publicationPrice <= 0 || !watchedAmount || watchedAmount <= 0) return null;
    if (watchedAmount >= publicationPrice) return null;
    return Math.round(((publicationPrice - watchedAmount) / publicationPrice) * 1000) / 10;
  }, [publicationPrice, watchedAmount]);

  // Reset form when modal opens with different data
  useEffect(() => {
    if (isOpen) {
      reset(
        existingEntry
          ? {
              moduleId: existingEntry.moduleId,
              provider: existingEntry.provider,
              amount: existingEntry.amount,
              priceType: existingEntry.priceType,
              discountPercentage: existingEntry.discountPercentage,
              source: existingEntry.source,
              verifiedAt: existingEntry.verifiedAt ?? todayStr,
              note: existingEntry.note,
            }
          : {
              moduleId,
              provider,
              priceType: 'publication' as const,
              discountPercentage: 0,
              source: '',
              verifiedAt: todayStr,
              note: '',
            },
      );
    }
  }, [isOpen, existingEntry, moduleId, provider, reset, todayStr]);

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

  const onSubmit = async (data: PriceEntryFormInput) => {
    if (isEdit && existingEntry) {
      await updatePrice.mutateAsync({
        schoolId,
        priceId: existingEntry.id,
        data: {
          amount: data.amount,
          priceType: data.priceType,
          discountPercentage: data.discountPercentage,
          source: data.source,
          verifiedAt: data.verifiedAt,
          note: data.note,
        },
      });
    } else {
      await createPrice.mutateAsync({
        schoolId,
        data: {
          moduleId: data.moduleId,
          provider: data.provider,
          amount: data.amount,
          priceType: data.priceType,
          discountPercentage: data.discountPercentage,
          source: data.source,
          verifiedAt: data.verifiedAt,
          note: data.note,
        },
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg max-w-[480px] w-full mx-4 p-6">
        <h2 className="text-[20px] font-semibold text-neutral-900 mb-4">
          {isEdit ? 'Prijs bewerken' : 'Prijs toevoegen'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Hidden fields */}
          <input type="hidden" {...register('moduleId')} />
          <input type="hidden" {...register('provider')} />

          {/* Amount */}
          <div>
            <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Bedrag per leerling
            </label>
            <input
              type="number"
              step="0.01"
              className={`w-full h-[44px] px-3 border rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-cito-primary ${
                errors.amount ? 'border-red-500' : 'border-neutral-300'
              }`}
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-[14px] text-red-600 mt-1">{errors.amount.message}</p>
            )}
            {watchedAmount > 0 && publicationPrice !== null && publicationPrice > 0 && (
              <div className="mt-1.5 flex items-center gap-2 text-[13px]">
                <span className="text-neutral-500">
                  Publicatieprijs: {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(publicationPrice)}
                </span>
                {watchedAmount !== publicationPrice && (
                  <span className={`font-semibold ${watchedAmount < publicationPrice ? 'text-green-600' : 'text-red-600'}`}>
                    ({watchedAmount < publicationPrice ? '-' : '+'}
                    {Math.abs(Math.round(((watchedAmount - publicationPrice) / publicationPrice) * 1000) / 10)}%)
                  </span>
                )}
              </div>
            )}
            {watchedAmount > 0 && (
              <div className="mt-1">
                <PriceDeviationWarning
                  moduleId={moduleId}
                  provider={provider}
                  amount={watchedAmount}
                />
              </div>
            )}
          </div>

          {/* Price type radio */}
          <div>
            <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Prijstype
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="publication"
                  className="accent-cito-primary w-4 h-4"
                  {...register('priceType')}
                />
                <span className="text-[16px]">Publicatieprijs (bruto)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="agreed"
                  className="accent-cito-primary w-4 h-4"
                  {...register('priceType')}
                />
                <span className="text-[16px]">Afgesproken prijs</span>
              </label>
            </div>
          </div>

          {/* Discount percentage — only for agreed price type */}
          {priceType === 'agreed' && (
            <div>
              <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
                Kortingspercentage
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className={`w-full h-[44px] px-3 border rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-cito-primary ${
                    errors.discountPercentage ? 'border-red-500' : 'border-neutral-300'
                  }`}
                  {...register('discountPercentage', { valueAsNumber: true })}
                />
                {calculatedDiscount !== null && (
                  <button
                    type="button"
                    onClick={() => setValue('discountPercentage', calculatedDiscount)}
                    className="flex-shrink-0 text-[13px] text-cito-primary hover:underline whitespace-nowrap"
                  >
                    Bereken ({calculatedDiscount}%)
                  </button>
                )}
              </div>
              {errors.discountPercentage && (
                <p className="text-[14px] text-red-600 mt-1">
                  {errors.discountPercentage.message}
                </p>
              )}
            </div>
          )}

          {/* Source */}
          <div>
            <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Bron
            </label>
            <input
              type="text"
              placeholder="Bijv. offerte, website, telefoongesprek"
              className="w-full h-[44px] px-3 border border-neutral-300 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-cito-primary"
              {...register('source')}
            />
          </div>

          {/* Verified date */}
          <div>
            <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Verificatiedatum
            </label>
            <input
              type="date"
              className="w-full h-[44px] px-3 border border-neutral-300 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-cito-primary"
              {...register('verifiedAt')}
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Notitie
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-cito-primary resize-y"
              {...register('note')}
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[14px] text-neutral-700 hover:text-neutral-900 px-4 h-[44px]"
            >
              Bewerken annuleren
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-cito-accent text-white text-[14px] font-semibold px-6 h-[44px] rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Opslaan...' : 'Prijs opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
