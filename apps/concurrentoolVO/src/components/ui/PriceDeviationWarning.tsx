import { checkPriceDeviation } from '../../models/pricing';

interface PriceDeviationWarningProps {
  moduleId: string;
  provider: string;
  amount: number;
}

/**
 * Inline amber warning badge shown when a price deviates >50% from the publication price.
 * Renders nothing if no deviation or no publication price exists.
 */
export function PriceDeviationWarning({ moduleId, provider, amount }: PriceDeviationWarningProps) {
  const { hasDeviation, publicationPrice } = checkPriceDeviation(moduleId, provider, amount);

  if (!hasDeviation || publicationPrice === null) return null;

  const formattedPrice = new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(publicationPrice);

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-sm font-medium text-amber-800"
      title={`Ongebruikelijk: publicatieprijs ${formattedPrice}. Controleer het bedrag.`}
    >
      {/* Warning triangle icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
        aria-label={`Prijsafwijking: publicatieprijs ${formattedPrice}`}
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.345 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      Prijsafwijking
    </span>
  );
}
