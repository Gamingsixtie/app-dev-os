import { useState, useRef } from 'react';
import { useSchoolListStore } from './school-list-store';

interface SchoolListImportDialogProps {
  onClose: () => void;
  onImported: () => void;
}

export default function SchoolListImportDialog({ onClose, onImported }: SchoolListImportDialogProps) {
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ count: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFromFile = useSchoolListStore((s) => s.importFromFile);

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['xlsx', 'xls', 'csv'].includes(ext)) {
      setResult({ count: 0, errors: ['Ongeldig bestandstype. Upload een Excel (.xlsx, .xls) of CSV bestand.'] });
      return;
    }

    setImporting(true);
    try {
      const res = await importFromFile(file);
      setResult(res);
      if (res.count > 0) {
        setTimeout(() => onImported(), 1500);
      }
    } catch {
      setResult({ count: 0, errors: ['Fout bij het verwerken van het bestand.'] });
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-800">Schoolenlijst importeren</h2>
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

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-sm text-neutral-600 mb-4">
            Upload een Excel-bestand met schoolgegevens van je regio. Het bestand moet minimaal een kolom
            <strong> &quot;Schoolnaam&quot;</strong> of <strong>&quot;Naam&quot;</strong> bevatten.
            Optioneel: Plaats, Regio, BRIN-code, Niveaus, Leerlingen.
          </p>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-cito-primary bg-cito-primary/5'
                : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                dragOver ? 'bg-cito-primary/10' : 'bg-neutral-100'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={dragOver ? 'text-cito-primary' : 'text-neutral-400'} aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
              </div>
              {importing ? (
                <p className="text-sm text-cito-primary font-medium">Bestand verwerken...</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-neutral-700">
                    Sleep je Excel-bestand hierheen
                  </p>
                  <p className="text-xs text-neutral-400">
                    of klik om een bestand te kiezen (.xlsx, .xls, .csv)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Result feedback */}
          {result && (
            <div className={`mt-4 rounded-lg p-3 text-sm ${
              result.count > 0
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {result.count > 0 && (
                <p className="font-medium">
                  {result.count} {result.count === 1 ? 'school' : 'scholen'} geïmporteerd
                </p>
              )}
              {result.errors.map((err, i) => (
                <p key={i} className="mt-1">{err}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
