import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { moduleSelectionSchema, type ModuleSelectionData } from '../schemas/step3-schema.ts';
import { MODULE_CATALOG } from '../../../models/modules.ts';
import { useSchoolProfileStore } from '../store.ts';
import StepContainer from '../../../components/wizard/StepContainer.tsx';
import ModulePriceBadges from '../../../components/wizard/ModulePriceBadges.tsx';
import SchijnvoordeelBadge from '../../../components/wizard/SchijnvoordeelBadge.tsx';
import { useWizardInsights } from '../../../hooks/useWizardInsights.ts';
import { forwardRef, useImperativeHandle } from 'react';
import type { WizardStepRef } from './WizardStep1.tsx';
import type { ProviderKey } from '../../../engine/price-comparison.ts';
import { PROVIDER_LABELS } from '../../../engine/price-comparison.ts';

// Phase 27 R7 — WizardStep3 visual restructure into 2 sections:
//   1. Basisvaardigheden — kernvakken: Rekenen, Nederlands, Engels, Taalverzorging
//   2. Extra Modules — al het andere, incl. SLO-verplichte Burgerschap +
//      Digitale geletterdheid (Plan 27-04) en MVT subgroep (Frans/Duits/Spaans)
//
// We groeperen hier op section-niveau (WizardStep3-only concept) en NIET op
// MODULE_CATEGORIES uit het model. Die data-model categorieën zijn diep
// verweven met de price-comparison engine + reporting (ComparisonTable
// gebruikt `'leerlingvolgsysteem'` / `'overige-instrumenten'` als group key);
// een data-model rename zou 20+ files raken zonder R7-meerwaarde. R7 vraagt
// een UI-restructure — die landt hier.
const BASICS_MODULE_IDS: readonly string[] = [
  'rekenwiskunde',
  'nederlands',
  'engels',
  'taalverzorging',
];

const MVT_MODULE_IDS: readonly string[] = ['frans', 'duits', 'spaans'];

const PROVIDER_COLORS: Record<ProviderKey, string> = {
  cito: 'bg-[#003082]',    // Cito blauw
  dia: 'bg-orange-500',     // DIA oranje
  jij: 'bg-emerald-500',    // JIJ groen
  saqi: 'bg-purple-500',    // SAQI paars
};

const QUICK_PICKS = [
  // "LVS Basis" = de drie kern-LVS-vakken (zonder taalverzorging) — label
  // behouden voor backward-compat (D-16: minimale audit, label-change geen
  // R7-eis).
  { label: 'LVS Basis', ids: ['rekenwiskunde', 'nederlands', 'engels'] },
  // "LVS Compleet" = drie kernvakken + taalverzorging (de Basisvaardigheden-set).
  { label: 'LVS Compleet', ids: [...BASICS_MODULE_IDS] },
  { label: 'Alles', ids: MODULE_CATALOG.map(m => m.id) },
];

/** Check if two arrays contain the same elements (order-independent) */
function arraysMatchSorted(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

const WizardStep3 = forwardRef<WizardStepRef>(function WizardStep3(_props, ref) {
  const { selectedModules, setSelectedModules } = useSchoolProfileStore();
  const { schijnvoordelen, totalStudents, upsellOpportunities } = useWizardInsights();

  const {
    watch,
    setValue,
    handleSubmit,
  } = useForm<ModuleSelectionData>({
    resolver: zodResolver(moduleSelectionSchema),
    defaultValues: {
      selectedModules: selectedModules,
    },
  });

  const currentModules = watch('selectedModules');

  // Phase 27 R7 section split — preserve MODULE_CATALOG declaration order
  // (matches existing snapshot/test expectations for module ordering).
  const basicsModules = MODULE_CATALOG.filter((m) =>
    BASICS_MODULE_IDS.includes(m.id),
  );
  const extraModules = MODULE_CATALOG.filter(
    (m) => !BASICS_MODULE_IDS.includes(m.id),
  );
  const extraRegularModules = extraModules.filter(
    (m) => !MVT_MODULE_IDS.includes(m.id),
  );
  const extraMvtModules = extraModules.filter((m) =>
    MVT_MODULE_IDS.includes(m.id),
  );

  const toggleModule = (moduleId: string) => {
    const updated = currentModules.includes(moduleId)
      ? currentModules.filter((id) => id !== moduleId)
      : [...currentModules, moduleId];
    setValue('selectedModules', updated);
    setSelectedModules(updated);
  };

  const applyQuickPick = (ids: string[]) => {
    setValue('selectedModules', ids);
    setSelectedModules(ids);
  };

  useImperativeHandle(ref, () => ({
    submit: () =>
      new Promise<boolean>((resolve) => {
        handleSubmit(
          (data) => {
            setSelectedModules(data.selectedModules);
            resolve(true);
          },
          () => {
            resolve(false);
          },
        )();
      }),
  }));

  return (
    <StepContainer title="Welke toetsen en instrumenten gebruikt uw school?">
      {totalStudents > 0 && (
        <p className="text-[13px] text-neutral-500 mb-4">
          Prijzen per leerling/jaar op basis van {totalStudents.toLocaleString('nl-NL')} leerlingen
        </p>
      )}

      {/* Quick-pick buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {QUICK_PICKS.map((qp) => {
          const isActive = arraysMatchSorted(currentModules, qp.ids);
          return (
            <button
              key={qp.label}
              type="button"
              onClick={() => applyQuickPick(qp.ids)}
              className={`
                px-3 py-1.5 text-xs font-medium border rounded-full transition-colors
                ${isActive
                  ? 'bg-cito-primary text-white border-cito-primary'
                  : 'border-neutral-300 text-neutral-700 hover:bg-cito-primary/10 hover:border-cito-primary/30'
                }
              `}
            >
              {qp.label}
            </button>
          );
        })}
      </div>

      {/* Basisvaardigheden: kern-vakken die elke VO-school aanbiedt
          (Rekenen, NL, EN, Taalverzorging) */}
      <section
        aria-labelledby="basisvaardigheden-heading"
        className="mb-6"
      >
        <h2
          id="basisvaardigheden-heading"
          className="text-[16px] font-semibold text-cito-primary mb-1"
        >
          Basisvaardigheden
        </h2>
        <p className="text-[13px] text-neutral-500 mb-4">
          De kern-vakken die elke VO-school aanbiedt.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {basicsModules.map((mod) => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              isSelected={currentModules.includes(mod.id)}
              onToggle={toggleModule}
            />
          ))}
        </div>
      </section>

      {/* Extra Modules: aanvullend aanbod incl. wettelijk verplichte
          SLO-modules (Burgerschap, Digitale geletterdheid) en MVT-subgroep */}
      <section
        aria-labelledby="extra-modules-heading"
        className="mt-6"
      >
        <h2
          id="extra-modules-heading"
          className="text-[16px] font-semibold text-cito-primary mb-1"
        >
          Extra Modules
        </h2>
        <p className="text-[13px] text-neutral-500 mb-4">
          Aanvullend aanbod voor verdieping en SLO-aansluiting.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {extraRegularModules.map((mod) => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              isSelected={currentModules.includes(mod.id)}
              onToggle={toggleModule}
            />
          ))}
        </div>

        {/* MVT subgroep blijft binnen Extra Modules */}
        {extraMvtModules.length > 0 && (
          <div className="mt-5">
            <h3 className="text-[14px] font-semibold text-neutral-600 mb-3">
              Moderne Vreemde Talen
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {extraMvtModules.map((mod) => (
                <ModuleCard
                  key={mod.id}
                  mod={mod}
                  isSelected={currentModules.includes(mod.id)}
                  onToggle={toggleModule}
                  showJijOnlyBadge
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Upsell hints for modules not yet selected */}
      {upsellOpportunities.length > 0 && (
        <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3">
          <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
            Upsell-kansen
          </div>
          {upsellOpportunities.map((u) => (
            <p key={u.moduleId} className="text-sm text-green-800">
              {u.moduleName}: school gebruikt {u.currentProvider}, Cito biedt meerwaarde
              {u.savingsPerStudent !== null && u.savingsPerStudent > 0 && ` (€${u.savingsPerStudent.toFixed(2)}/lln besparing)`}
            </p>
          ))}
        </div>
      )}

      {/* Schijnvoordeel warnings */}
      {currentModules.length > 0 && (
        <SchijnvoordeelBadge warnings={schijnvoordelen} />
      )}

      {currentModules.length === 0 && (
        <p className="mt-4 text-[14px] text-neutral-500">
          U kunt altijd later modules toevoegen of verwijderen
        </p>
      )}
    </StepContainer>
  );
});

/** Extracted module card component for reuse across category sections */
function ModuleCard({
  mod,
  isSelected,
  onToggle,
  showJijOnlyBadge = false,
}: {
  mod: (typeof MODULE_CATALOG)[number];
  isSelected: boolean;
  onToggle: (id: string) => void;
  showJijOnlyBadge?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(mod.id)}
      className={`
        text-left rounded-lg p-4 shadow-sm transition-colors
        flex flex-col gap-2
        ${isSelected
          ? 'border-2 border-cito-accent bg-[#fff7ed]'
          : 'border border-neutral-200 bg-white'
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-semibold text-neutral-900">
              {mod.name}
            </span>
            {showJijOnlyBadge && (
              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded">
                Alleen JIJ
              </span>
            )}
          </div>
          <div className="text-[14px] text-neutral-500 mt-1">
            {mod.description}
          </div>

          {/* Provider availability badges */}
          <div className="flex gap-1 mt-1">
            {mod.availableFrom.map(p => (
              <span
                key={p}
                className={`w-2 h-2 rounded-full ${PROVIDER_COLORS[p]}`}
                title={PROVIDER_LABELS[p]}
              />
            ))}
          </div>

          {mod.separateLicense && (
            <div className="text-[14px] italic text-neutral-500 mt-1">
              Losse licentie
            </div>
          )}
          {mod.differentiator && (
            <div className="text-[14px] text-cito-primary mt-1">
              &bull; {mod.differentiator}
            </div>
          )}
        </div>

        {/* Toggle pill */}
        <div
          className={`
            relative flex-shrink-0 w-11 h-6 rounded-full transition-colors mt-1
            ${isSelected ? 'bg-cito-primary' : 'bg-neutral-200'}
          `}
          aria-hidden="true"
        >
          <div
            className={`
              absolute top-[2px] w-5 h-5 rounded-full bg-white shadow transition-transform
              ${isSelected ? 'translate-x-[22px]' : 'translate-x-[2px]'}
            `}
          />
        </div>
      </div>

      {/* Inline price badges */}
      <ModulePriceBadges moduleId={mod.id} />
    </button>
  );
}

export default WizardStep3;
