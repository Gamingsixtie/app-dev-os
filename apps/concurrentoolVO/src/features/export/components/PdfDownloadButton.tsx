import { useState } from 'react';
import type { ExportConfig, ReportData } from '../types';

interface PdfDownloadButtonProps {
  config: ExportConfig;
  data: ReportData;
  disabled: boolean;
}

export function PdfDownloadButton({ config, data, disabled }: PdfDownloadButtonProps) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      // Dynamic import to avoid loading @react-pdf/renderer until needed
      const [{ pdf }, { ReportDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../pdf/ReportDocument'),
      ]);

      const blob = await pdf(<ReportDocument config={config} data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const slugName = data.schoolName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      a.download = `${slugName}-${config.reportType}-${data.date}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || generating}
      className={`
        w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg
        font-semibold text-sm transition-colors
        ${disabled || generating
          ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          : 'bg-cito-primary text-white hover:bg-cito-primary/90 active:bg-cito-primary/80'
        }
      `}
    >
      {generating ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          PDF genereren...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download PDF
        </>
      )}
    </button>
  );
}
