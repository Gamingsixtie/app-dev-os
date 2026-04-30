import { useState } from 'react';

interface PipelineReasonDialogProps {
  fromLabel: string;
  toLabel: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function PipelineReasonDialog({
  fromLabel,
  toLabel,
  onConfirm,
  onCancel,
}: PipelineReasonDialogProps) {
  const [reason, setReason] = useState('');

  const canConfirm = reason.trim().length > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
    >
      <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg">
        <h2 className="text-[20px] font-semibold text-neutral-900 mb-4">
          Status terugzetten
        </h2>

        <p className="text-[16px] text-neutral-700 mb-4">
          U zet de status terug van <strong>{fromLabel}</strong> naar{' '}
          <strong>{toLabel}</strong>. Geef een korte toelichting.
        </p>

        <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
          Toelichting <span className="text-red-600">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Waarom wordt de status teruggezet?"
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
