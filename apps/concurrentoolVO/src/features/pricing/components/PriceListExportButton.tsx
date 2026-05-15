import { useState, useRef, useEffect } from 'react';
import { PROVIDER_CONFIGS } from '@/data/providers/index';
import { buildPriceListSnapshot } from '../export/price-list-snapshot';

type Format = 'pdf' | 'html' | 'word' | 'txt';

const FORMAT_LABELS: Record<Format, string> = {
  pdf: 'PDF',
  html: 'HTML',
  word: 'Word (.docx)',
  txt: 'Tekst (.txt)',
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function PriceListExportButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Format | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const exportAs = async (format: Format) => {
    setBusy(format);
    setError(null);
    try {
      const snapshot = buildPriceListSnapshot(PROVIDER_CONFIGS, new Date());
      const dateSlug = snapshot.dateLabel.replace(/\s/g, '-').toLowerCase();
      const baseName = `cito-prijslijst-${dateSlug}`;

      if (format === 'txt') {
        const { renderPriceListTxt } = await import('../export/price-list-txt');
        const txt = renderPriceListTxt(snapshot);
        downloadBlob(new Blob([txt], { type: 'text/plain;charset=utf-8' }), `${baseName}.txt`);
      } else if (format === 'html') {
        const { renderPriceListHtml } = await import('../export/price-list-html');
        const html = renderPriceListHtml(snapshot);
        downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `${baseName}.html`);
      } else if (format === 'word') {
        const { renderPriceListWordBlob } = await import('../export/price-list-word');
        const blob = await renderPriceListWordBlob(snapshot);
        downloadBlob(blob, `${baseName}.docx`);
      } else {
        // PDF — lazy load @react-pdf/renderer + template
        const [{ pdf }, { PriceListPdf }] = await Promise.all([
          import('@react-pdf/renderer'),
          import('../pdf/PriceListPdf'),
        ]);
        const blob = await pdf(<PriceListPdf snapshot={snapshot} />).toBlob();
        downloadBlob(blob, `${baseName}.pdf`);
      }
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export mislukt');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative inline-block" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy !== null}
        className="px-4 py-2 bg-cito-primary text-white rounded-md text-sm font-medium hover:bg-cito-primary/90 disabled:opacity-50"
      >
        {busy ? `Bezig met ${FORMAT_LABELS[busy]}...` : 'Exporteer prijslijst ▾'}
      </button>
      {open && busy === null && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-48 bg-white border border-neutral-200 rounded-md shadow-lg z-10"
        >
          {(Object.keys(FORMAT_LABELS) as Format[]).map((f) => (
            <button
              key={f}
              type="button"
              role="menuitem"
              onClick={() => exportAs(f)}
              className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-cito-primary/10 hover:text-cito-primary"
            >
              Exporteer als {FORMAT_LABELS[f]}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
