/**
 * Inline display of old price -> new price with percentage delta.
 *
 * Per UI-SPEC:
 * - Old price: line-through text-neutral-500
 * - New price: font-semibold
 * - Delta: green if cheaper, red if duurder
 * - EUR formatting with nl-NL locale
 */

const eurFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
});

interface PriceDiffDisplayProps {
  oldPrice: number;
  newPrice: number;
}

export function PriceDiffDisplay({ oldPrice, newPrice }: PriceDiffDisplayProps) {
  const delta = ((newPrice - oldPrice) / oldPrice) * 100;
  const isIncrease = newPrice > oldPrice;
  const deltaFormatted = `${isIncrease ? '+' : ''}${delta.toFixed(1).replace('.', ',')}%`;
  const deltaColor = isIncrease ? 'text-red-600' : 'text-green-600';

  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="line-through text-neutral-500">
        {eurFormatter.format(oldPrice)}
      </span>
      <span aria-hidden="true">&rarr;</span>
      <span className="font-semibold">
        {eurFormatter.format(newPrice)}
      </span>
      {oldPrice !== newPrice && (
        <span className={`${deltaColor} font-semibold`}>
          ({deltaFormatted})
        </span>
      )}
    </span>
  );
}
