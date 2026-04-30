interface BusinessCaseCTAProps {
  disabled?: boolean;
}

export function BusinessCaseCTA({ disabled }: BusinessCaseCTAProps) {
  return (
    <div
      className={`group w-full bg-white border border-neutral-200 rounded-lg p-6 flex items-center justify-between ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${!disabled ? 'opacity-75' : ''}`}
      role="banner"
      aria-label="Beschikbaar in volgende versie"
    >
      <span className="text-base font-semibold text-cito-accent group-hover:underline">
        Bekijk de totale waarde inclusief tijdsbesparing
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-cito-accent group-hover:translate-x-1 transition-transform duration-200 flex-shrink-0 ml-2"
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
}
