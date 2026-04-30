import { usePriceComparisonStore } from './store';
import { useSchoolProfileStore } from '../school-profile/store';
import { DIA_PACKAGES, DIA_CONFIG } from '../../data/providers/dia';

export function DiaBundleSelector({ compact = false }: { compact?: boolean }) {
  const forceDiaPackageId = usePriceComparisonStore((s) => s.forceDiaPackageId);
  const setForceDiaPackageId = usePriceComparisonStore((s) => s.setForceDiaPackageId);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const visibleProviders = usePriceComparisonStore((s) => s.visibleProviders);

  if (!visibleProviders.includes('dia')) return null;

  // DIA modules that the school selected
  const diaModuleIds = selectedModules.filter(
    (id) => DIA_CONFIG.pricingStrategy.individualPrices[id] !== undefined,
  );

  // Build options: individual + qualifying packages
  const options: Array<{
    id: string | null;
    name: string;
    description: string;
    pricePerStudent: number | null;
    available: boolean;
  }> = [
    {
      id: null,
      name: 'Per module',
      description: 'Individuele DIA-moduleprijzen',
      pricePerStudent: null,
      available: true,
    },
    ...DIA_PACKAGES.filter((pkg) =>
      // Package must contain at least some of the selected modules
      pkg.includedModuleIds.some((id) => diaModuleIds.includes(id)),
    ).map((pkg) => {
      const overlap = pkg.includedModuleIds.filter((id) => diaModuleIds.includes(id));
      return {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description ?? '',
        pricePerStudent: pkg.pricePerStudent,
        available: overlap.length >= pkg.minModules,
      };
    }),
  ];

  // Determine active selection
  const activeId = forceDiaPackageId === undefined ? null : forceDiaPackageId;

  if (compact) {
    return (
      <div className="flex mt-1 bg-white/10 rounded-md overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt.id ?? 'individual'}
            type="button"
            onClick={() => opt.available && setForceDiaPackageId(opt.id)}
            disabled={!opt.available}
            className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
              !opt.available
                ? 'text-white/30 cursor-not-allowed'
                : activeId === opt.id
                  ? 'bg-white text-orange-600'
                  : 'text-white/70 hover:text-white'
            }`}
            title={opt.available ? opt.description : 'Niet genoeg modules geselecteerd'}
          >
            {opt.name.replace('VO ', '')}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
        DIA prijsmodel
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.id ?? 'individual'}
            type="button"
            onClick={() => opt.available && setForceDiaPackageId(opt.id)}
            disabled={!opt.available}
            className={`flex flex-col items-start text-left rounded-lg border px-4 py-3 transition-colors min-w-[160px] ${
              !opt.available
                ? 'border-neutral-100 bg-neutral-50 opacity-60 cursor-not-allowed'
                : activeId === opt.id
                  ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
                  : 'border-neutral-200 bg-white hover:bg-neutral-50'
            }`}
            aria-pressed={activeId === opt.id}
          >
            <span className={`text-sm font-semibold ${
              !opt.available ? 'text-neutral-400' : activeId === opt.id ? 'text-orange-600' : 'text-neutral-900'
            }`}>
              {opt.name.replace('VO ', '')}
            </span>
            <span className="text-xs text-neutral-500 mt-0.5">{opt.description}</span>
            {opt.pricePerStudent !== null && (
              <span className={`text-xs font-medium mt-1 ${activeId === opt.id ? 'text-orange-700' : 'text-neutral-700'}`}>
                {'\u20AC'}{opt.pricePerStudent.toFixed(2)}/leerling/jr
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
