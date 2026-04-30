interface SchoolplanUploadProps {
  fileName: string;
  uploadedAt: string;
  pageCount: number | null;
  onReplace: () => void;
}

/**
 * Document metadata bar shown after a schoolplan has been uploaded.
 * Displays filename, upload date, optional page count, and a replace button.
 */
export default function SchoolplanUpload({
  fileName,
  uploadedAt,
  pageCount,
  onReplace,
}: SchoolplanUploadProps) {
  const formattedDate = new Date(uploadedAt).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="flex items-center gap-3 bg-white border-b border-neutral-200 px-6 py-3 flex-wrap">
      {/* PDF icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5 text-neutral-400 flex-shrink-0"
        aria-hidden="true"
      >
        <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
        <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
      </svg>

      {/* Filename */}
      <span className="text-sm text-neutral-700 font-medium">{fileName}</span>

      <span className="text-neutral-300" aria-hidden="true">|</span>

      {/* Upload date */}
      <span className="text-sm text-neutral-500">Geupload {formattedDate}</span>

      {/* Page count (conditional) */}
      {pageCount !== null && (
        <>
          <span className="text-neutral-300" aria-hidden="true">|</span>
          <span className="text-sm text-neutral-500">{pageCount} pagina's</span>
        </>
      )}

      {/* Replace button */}
      <button
        type="button"
        onClick={onReplace}
        className="text-sm text-red-600 hover:text-red-700 font-medium ml-auto"
      >
        Vervang schoolplan
      </button>
    </div>
  );
}
