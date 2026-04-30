import { useState } from 'react';
import type { SchoolRecord } from '@/db/types';
import { deleteSchool } from '@/db/operations';

interface DeleteSchoolDialogProps {
  school: SchoolRecord | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteSchoolDialog({ school, onClose, onDeleted }: DeleteSchoolDialogProps) {
  const [deleting, setDeleting] = useState(false);

  if (!school) return null;

  const handleDelete = async () => {
    if (!school.id) return;
    setDeleting(true);
    await deleteSchool(school.id);
    setDeleting(false);
    onDeleted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="alertdialog"
        aria-describedby="delete-dialog-desc"
        className="relative bg-white rounded-lg p-8 max-w-[420px] w-full mx-4 shadow-xl"
      >
        <h2 className="text-[20px] font-semibold text-neutral-900 mb-4">
          Schoolprofiel verwijderen
        </h2>
        <p id="delete-dialog-desc" className="text-base text-neutral-600 mb-6">
          Weet u zeker dat u &ldquo;<strong>{school.name}</strong>&rdquo; wilt verwijderen?
          Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="h-[44px] px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="h-[44px] px-4 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Verwijderen...' : 'Profiel verwijderen'}
          </button>
        </div>
      </div>
    </div>
  );
}
