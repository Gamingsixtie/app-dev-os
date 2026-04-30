import { useState } from 'react';
import type { LostDealInfo } from '@/db/types';

interface LostDealDialogProps {
  onConfirm: (info: LostDealInfo) => void;
  onCancel: () => void;
}

const COMPETITOR_OPTIONS: { value: LostDealInfo['competitor']; label: string }[] = [
  { value: 'dia', label: 'DIA' },
  { value: 'jij', label: 'JIJ (IEP)' },
  { value: 'overig', label: 'Overig' },
];

export default function LostDealDialog({ onConfirm, onCancel }: LostDealDialogProps) {
  const [competitor, setCompetitor] = useState<LostDealInfo['competitor'] | null>(null);
  const [competitorName, setCompetitorName] = useState('');
  const [reason, setReason] = useState('');

  const canConfirm = competitor !== null && (competitor !== 'overig' || competitorName.trim().length > 0);

  const handleConfirm = () => {
    if (!canConfirm || competitor === null) return;
    onConfirm({
      competitor,
      ...(competitor === 'overig' ? { competitorName: competitorName.trim() } : {}),
      ...(reason.trim() ? { reason: reason.trim() } : {}),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
    >
      <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg">
        <h2 className="text-[20px] font-semibold text-neutral-900 mb-4">
          Deal verloren
        </h2>

        <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
          Concurrent <span className="text-red-600">*</span>
        </label>
        <select
          value={competitor ?? ''}
          onChange={(e) => setCompetitor(e.target.value ? e.target.value as LostDealInfo['competitor'] : null)}
          className="w-full h-11 px-4 border border-neutral-200 rounded-lg bg-white text-[16px] text-neutral-700 mb-4"
        >
          <option value="">Selecteer concurrent...</option>
          {COMPETITOR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {competitor === 'overig' && (
          <>
            <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Naam concurrent <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={competitorName}
              onChange={(e) => setCompetitorName(e.target.value)}
              placeholder="Naam van de concurrent"
              className="w-full h-11 px-4 border border-neutral-200 rounded-lg bg-white text-[16px] text-neutral-700 mb-4"
            />
          </>
        )}

        <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
          Reden (optioneel)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Waarom is de deal verloren?"
          rows={3}
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg bg-white text-[16px] text-neutral-700 resize-none mb-6"
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 px-6 text-[14px] font-semibold text-cito-primary hover:bg-neutral-50 rounded-lg"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="h-11 px-6 text-[14px] font-semibold text-white bg-cito-accent rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Bevestigen
          </button>
        </div>
      </div>
    </div>
  );
}
