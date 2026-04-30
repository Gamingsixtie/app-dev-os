import type { SalesSignal, SalesSignalType } from '@/engine/sales-signals';

const SIGNAL_STYLES: Record<SalesSignalType, string> = {
  'emphasize-price': 'bg-green-100 text-green-800 border-green-300',
  'focus-value': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'vulnerable': 'bg-red-100 text-red-800 border-red-300',
};

export function SalesSignalBadge({ signal }: { signal: SalesSignal }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${SIGNAL_STYLES[signal.type]}`}
      title={signal.description}
    >
      {signal.label}
    </span>
  );
}
