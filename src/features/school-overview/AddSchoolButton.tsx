import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { createSchool } from '@/db/operations';
import SchoolListImportDialog from './SchoolListImportDialog';
import SchoolPickerDialog from './SchoolPickerDialog';
import SchoolNameDialog from './SchoolNameDialog';
import { useSchoolListStore } from './school-list-store';

export default function AddSchoolButton() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasImportedList = useSchoolListStore((s) => s.entries.length > 0);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleManual = () => {
    setMenuOpen(false);
    setShowNameDialog(true);
  };

  const handleNameConfirm = async (name: string) => {
    setShowNameDialog(false);
    const school = await createSchool(name);
    navigate({
      to: '/scholen/$slug/wizard/$step',
      params: { slug: school.slug, step: '1' },
    });
  };

  const handleFromList = () => {
    setMenuOpen(false);
    if (hasImportedList) {
      setShowPicker(true);
    } else {
      setShowImport(true);
    }
  };

  const handlePickerCreate = async (name: string) => {
    setShowPicker(false);
    const school = await createSchool(name);
    navigate({
      to: '/scholen/$slug/wizard/$step',
      params: { slug: school.slug, step: '1' },
    });
  };

  const handleImportDone = () => {
    setShowImport(false);
    setShowPicker(true);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* Split button */}
        <div className="inline-flex rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={handleManual}
            className="inline-flex items-center gap-2 bg-cito-accent text-white font-semibold h-[40px] px-4 hover:bg-cito-accent-hover transition-colors text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            School toevoegen
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex items-center bg-cito-accent text-white h-[40px] px-2 border-l border-white/20 hover:bg-cito-accent-hover transition-colors"
            aria-label="Meer opties"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>

        {/* Dropdown menu */}
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
            <button
              type="button"
              onClick={handleManual}
              className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-neutral-400"
                aria-hidden="true"
              >
                <path d="M12 20h9" />
                <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.855z" />
              </svg>
              Handmatig invoeren
            </button>
            <button
              type="button"
              onClick={handleFromList}
              className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-neutral-400"
                aria-hidden="true"
              >
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M10 13H8" />
                <path d="M16 17H8" />
                <path d="M16 13h-2" />
              </svg>
              {hasImportedList
                ? 'Kies uit schoolenlijst'
                : 'Importeer schoolenlijst'}
            </button>
            {hasImportedList && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setShowImport(true);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-neutral-500 hover:bg-neutral-50 flex items-center gap-2.5 border-t border-neutral-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-neutral-400"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                Nieuwe lijst importeren
              </button>
            )}
          </div>
        )}
      </div>

      {/* Import dialog */}
      {showImport && (
        <SchoolListImportDialog
          onClose={() => setShowImport(false)}
          onImported={handleImportDone}
        />
      )}

      {/* Picker dialog */}
      {showPicker && (
        <SchoolPickerDialog
          onClose={() => setShowPicker(false)}
          onSelect={handlePickerCreate}
        />
      )}

      {/* Name dialog for manual creation */}
      {showNameDialog && (
        <SchoolNameDialog
          onClose={() => setShowNameDialog(false)}
          onConfirm={handleNameConfirm}
        />
      )}
    </>
  );
}
