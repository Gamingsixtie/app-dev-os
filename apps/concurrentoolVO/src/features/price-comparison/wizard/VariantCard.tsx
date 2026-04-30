/**
 * Selectable card for a DIA package or JIJ license tier.
 * Shows price, description, included modules, and "Aanbevolen" badge.
 */

interface VariantCardProps {
  type: 'dia-package' | 'jij-tier';
  id: string;
  name: string;
  priceLabel: string;
  description: string;
  includedModules?: string[];
  isSelected: boolean;
  isRecommended: boolean;
  onClick: () => void;
}

export function VariantCard({
  name,
  priceLabel,
  description,
  includedModules,
  isSelected,
  isRecommended,
  onClick,
}: VariantCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative w-full text-left bg-white rounded-lg border p-4 cursor-pointer min-h-[48px]
        transition-all
        ${isSelected
          ? 'border-cito-accent ring-2 ring-cito-accent/20'
          : 'border-neutral-200 hover:border-neutral-300'
        }
      `}
    >
      {/* Aanbevolen badge */}
      {isRecommended && (
        <span className="absolute top-2 right-2 bg-cito-accent/10 text-cito-accent border border-cito-accent/30 text-[11px] font-semibold px-2 py-0.5 rounded-full">
          Aanbevolen
        </span>
      )}

      {/* Card content */}
      <div className="pr-20">
        <span className="text-sm font-semibold text-neutral-900 block">
          {name}
        </span>
        <span className="text-sm text-neutral-600 block mt-0.5">
          {priceLabel}
        </span>
        {description && (
          <span className="text-[11px] text-neutral-500 block mt-1">
            {description}
          </span>
        )}
      </div>

      {/* Included module tags */}
      {includedModules && includedModules.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {includedModules.map((mod) => (
            <span
              key={mod}
              className="inline-block bg-neutral-100 text-neutral-600 text-[11px] px-1.5 py-0.5 rounded"
            >
              {mod}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
