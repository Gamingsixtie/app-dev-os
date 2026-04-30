import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schoolNameSchema = z.object({
  schoolName: z.string().min(1, 'Schoolnaam is verplicht').trim(),
});

type SchoolNameFormData = z.infer<typeof schoolNameSchema>;

interface SchoolNameDialogProps {
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export default function SchoolNameDialog({ onClose, onConfirm }: SchoolNameDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SchoolNameFormData>({
    resolver: zodResolver(schoolNameSchema),
    mode: 'onChange',
    defaultValues: { schoolName: '' },
  });

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-800">Nieuwe school</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            aria-label="Sluiten"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit((data) => onConfirm(data.schoolName))}>
          <div className="px-6 py-5">
            <label htmlFor="schoolName" className="block text-sm font-medium text-neutral-700 mb-1.5">
              Schoolnaam
            </label>
            <input
              id="schoolName"
              type="text"
              placeholder="Bijv. Stedelijk Gymnasium Arnhem"
              autoFocus
              className="w-full h-11 px-4 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cito-primary/20 focus:border-cito-primary"
              {...register('schoolName')}
            />
            {errors.schoolName && (
              <p className="mt-1.5 text-sm text-red-600">{errors.schoolName.message}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="px-6 py-2.5 text-sm font-semibold bg-cito-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start wizard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
