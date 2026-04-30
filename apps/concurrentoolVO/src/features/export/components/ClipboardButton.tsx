import { useState } from 'react';
import { buildClipboardContent, copyToClipboard } from '@/lib/clipboard';
import type { ExportConfig, ReportData } from '../types';

interface ClipboardButtonProps {
  config: ExportConfig;
  data: ReportData;
  disabled: boolean;
}

export function ClipboardButton({ config, data, disabled }: ClipboardButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const { html, plain } = buildClipboardContent(data, config.dmuTarget);
    const success = await copyToClipboard(html, plain);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      disabled={disabled || copied}
      className={`
        w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg
        font-semibold text-sm transition-colors border-2
        ${copied
          ? 'border-green-600 text-green-600 bg-green-50 cursor-default'
          : disabled
            ? 'border-neutral-200 text-neutral-400 cursor-not-allowed'
            : 'border-cito-primary text-cito-primary hover:bg-cito-primary/5 active:bg-cito-primary/10'
        }
      `}
    >
      {copied ? (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Gekopieerd!
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
            />
          </svg>
          Kopieer naar clipboard
        </>
      )}
    </button>
  );
}
