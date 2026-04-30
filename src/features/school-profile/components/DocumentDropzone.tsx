import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react';

interface DocumentDropzoneProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
  error?: string;
}

const ACCEPTED_EXTENSIONS = new Set(['pdf', 'xlsx', 'xls', 'docx', 'csv', 'txt']);
const ACCEPT_ATTRIBUTE = '.pdf,.xlsx,.xls,.docx,.csv,.txt';
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function isValidFileType(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return !!ext && ACCEPTED_EXTENSIONS.has(ext);
}

function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE_BYTES;
}

/**
 * Drag-and-drop file upload zone with format validation.
 * Accepts PDF, Excel, Word, and CSV files.
 * Per D-15: upload button in ProductsTab, drag & drop zone.
 */
export default function DocumentDropzone({
  onFileSelected,
  isProcessing,
  error,
}: DocumentDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!isValidFileType(file)) {
        setValidationError(
          'Niet-ondersteund bestandsformaat. Upload een PDF, Excel, Word of CSV bestand.',
        );
        return;
      }
      if (!isValidFileSize(file)) {
        setValidationError(
          `Bestand is te groot (max ${MAX_FILE_SIZE_MB} MB). Kies een kleiner bestand.`,
        );
        return;
      }
      setValidationError(null);
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isProcessing) setDragActive(true);
    },
    [isProcessing],
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (isProcessing) return;

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [isProcessing, handleFile],
  );

  const handleClick = useCallback(() => {
    if (!isProcessing) fileInputRef.current?.click();
  }, [isProcessing]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so the same file can be selected again
      e.target.value = '';
    },
    [handleFile],
  );

  const displayError = error || validationError;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-dashed border-2 rounded-lg min-h-[120px] flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer ${
          isProcessing
            ? 'border-neutral-200 bg-neutral-50 cursor-wait'
            : dragActive
              ? 'border-cito-primary bg-cito-primary/5'
              : 'border-neutral-300 bg-neutral-50 hover:border-neutral-400'
        }`}
      >
        {isProcessing ? (
          <>
            {/* Spinner */}
            <svg
              className="animate-spin h-6 w-6 text-neutral-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-[14px] text-neutral-500">
              Document wordt verwerkt...
            </span>
          </>
        ) : (
          <>
            {/* Upload icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6 text-neutral-400"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-[14px] text-neutral-500 text-center px-4">
              Sleep een document hierheen of klik om te selecteren
            </span>
            <span className="text-[12px] text-neutral-400">
              PDF, Excel, Word of CSV
            </span>
          </>
        )}
      </div>

      {displayError && (
        <p className="mt-2 text-[14px] text-red-600">{displayError}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
