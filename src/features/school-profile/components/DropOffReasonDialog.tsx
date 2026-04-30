import { useState } from 'react';

interface DropOffReasonDialogProps {
  contactName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function DropOffReasonDialog({
  contactName,
  onConfirm,
  onCancel,
}: DropOffReasonDialogProps) {
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
      role="dialog"
      aria-label="Contact afgehaakt"
    >
      <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg">
        <h2 className="text-[20px] font-semibold text-neutral-900 mb-4">
          Contact afgehaakt
        </h2>

        <p className="text-[14px] text-neutral-600 mb-4">
          {contactName} wordt als afgehaakt gemarkeerd.
        </p>

        <label className="block text-[14px] font-semibold text-neutral-700 mb-1">
          Reden <span className="text-red-600">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Waarom is dit contact afgehaakt?"
          rows={3}
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg bg-white text-[16px] text-neutral-700 resize-none mb-6"
          autoFocus
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
