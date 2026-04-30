import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button on open and trap Escape
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="alertdialog"
      aria-describedby="confirm-dialog-body"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />

      {/* Card */}
      <div className="relative bg-white rounded-lg p-8 max-w-[420px] w-full mx-4 shadow-xl">
        <h2
          id="confirm-dialog-title"
          className="text-[20px] font-semibold text-neutral-900 mb-4"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-body"
          className="text-base text-neutral-600 mb-6"
        >
          {body}
        </p>
        <div className="flex justify-end gap-4">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="h-[44px] px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-[44px] px-4 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
