import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { moduleCurrentSetupSchema, type ModuleCurrentSetupData } from '../schemas/step4-schema.ts';
import { CURRENT_PROVIDER_LABELS, type CurrentProvider } from '../../../models/school.ts';
import { useSchoolProfileStore } from '../store.ts';
import StepContainer from '../../../components/wizard/StepContainer.tsx';
import { forwardRef, useImperativeHandle } from 'react';
import type { WizardStepRef } from './WizardStep1.tsx';
import { MODULE_CATALOG } from '../../../models/modules.ts';
import { DEFAULT_PRICES } from '../../../data/default-prices.ts';
import { formatCurrency } from '../../../lib/format.ts';
import DifferentiatorComparison from '../../../components/wizard/DifferentiatorComparison.tsx';
import { useWizardInsights } from '../../../hooks/useWizardInsights.ts';
import { checkPriceDeviation } from '../../../models/pricing.ts';

// Providers for which a price input is relevant
const PRICE_RELEVANT_PROVIDERS: CurrentProvider[] = ['dia', 'jij', 'saqi', 'overig'];

// Provider-specific context hints shown when a provider is selected
const PROVIDER_HINTS: Partial<Record<CurrentProvider, (moduleId: string) => string | null>> = {
  dia: (moduleId) => {
    if (moduleId === 'nederlands') {
      return 'DIA verkoopt Nederlands als Pakket NE (lezen + woordenschat) voor \u20AC5,84 of alleen Diatekst (lezen) voor \u20AC3,36. De meeste scholen nemen het pakket af. LAS-koppeling (Magister/Somtoday) is gratis bij DIA.';
    }
    if (moduleId === 'engels') {
      return 'DIA Pakket EN compleet (lezen + woordenschat): \u20AC5,84/lln. LAS-koppeling gratis.';
    }
    if (moduleId === 'taalverzorging') {
      return 'DIA Diaspel (spelling): \u20AC3,36 los, of in Pakket NE compleet (\u20AC8,58 incl. lezen + woordenschat). LAS-koppeling gratis.';
    }
    return 'LAS-koppeling (Magister/Somtoday) is gratis bij DIA. Staffelkorting: 500+ = 5%, 1000+ = 10%.';
  },
  jij: () => {
    return 'JIJ! werkt met \u00E9\u00E9n licentie + toetsprijs-model. De prijs per leerling hangt af van het totaal afnames en de schoolgrootte. Magister/Somtoday-koppeling is betaald (\u20AC195-\u20AC500/jaar).';
  },
};

// Publication price lookup helper
function getPublicationPrice(moduleId: string, provider: CurrentProvider): number | null {
  const providerKey = provider === 'dia' ? 'dia' : provider === 'jij' ? 'jij' : provider === 'saqi' ? 'saqi' : null;
  if (!providerKey) return null;
  const record = DEFAULT_PRICES.find((p) => p.moduleId === moduleId && p.provider === providerKey);
  return record?.amountPerStudent ?? null;
}

const BASE_PROVIDER_OPTIONS: CurrentProvider[] = ['cito-oud', 'cito-nieuw', 'dia', 'jij', 'overig', 'geen'];

/** SAQI only available for sociaal-emotioneel module */
function getProviderOptions(moduleId: string): CurrentProvider[] {
  if (moduleId === 'sociaal-emotioneel') {
    return ['cito-oud', 'cito-nieuw', 'dia', 'jij', 'saqi', 'overig', 'geen'];
  }
  return BASE_PROVIDER_OPTIONS;
}

const WizardStep4 = forwardRef<WizardStepRef>(function WizardStep4(_props, ref) {
  const { moduleSetups, setModuleSetups, selectedModules } = useSchoolProfileStore();
  const { schijnvoordelen } = useWizardInsights();

  const defaultSetups = selectedModules.map((moduleId) => {
    const existing = moduleSetups.find((s) => s.moduleId === moduleId);
    return existing ?? { moduleId, currentProvider: 'geen' as CurrentProvider, pricePerStudent: null };
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ModuleCurrentSetupData>({
    resolver: zodResolver(moduleCurrentSetupSchema),
    defaultValues: { moduleSetups: defaultSetups },
  });

  const watchedSetups = watch('moduleSetups');

  useImperativeHandle(ref, () => ({
    submit: () =>
      new Promise<boolean>((resolve) => {
        handleSubmit(
          (data) => {
            setModuleSetups(
              data.moduleSetups.map((s) => ({
                ...s,
                currentProvider: s.currentProvider as CurrentProvider,
              })),
            );
            resolve(true);
          },
          () => {
            resolve(false);
          },
        )();
      }),
  }));

  return (
    <StepContainer title="Wat is de huidige situatie?">
      <p className="text-sm text-neutral-500 mb-6">
        Selecteer per module de huidige aanbieder en de prijs per leerling per jaar.
        De publicatieprijs wordt als standaard ingevuld — pas aan bij een speciale overeenkomst.
      </p>

      <div className="space-y-4">
        {selectedModules.map((moduleId, index) => {
          const moduleDef = MODULE_CATALOG.find((m) => m.id === moduleId);
          const moduleName = moduleDef?.name ?? moduleId;
          const currentSetup = watchedSetups?.[index];
          const provider = currentSetup?.currentProvider as CurrentProvider | undefined;
          const showPrice = provider ? PRICE_RELEVANT_PROVIDERS.includes(provider) : false;
          const showCustomName = provider === 'overig';
          const pubPrice = provider ? getPublicationPrice(moduleId, provider) : null;

          return (
            <div
              key={moduleId}
              className="rounded-lg border border-neutral-200 bg-white p-4"
            >
              <div className="font-semibold text-[15px] text-neutral-900 mb-3">
                {moduleName}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Aanbieder dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">
                    Huidige aanbieder
                  </label>
                  <Controller
                    control={control}
                    name={`moduleSetups.${index}.currentProvider`}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm focus:border-cito-primary focus:border-2 focus:outline-none"
                        onChange={(e) => {
                          field.onChange(e);
                          const newProvider = e.target.value as CurrentProvider;
                          // Set default price when provider changes
                          const defPrice = getPublicationPrice(moduleId, newProvider);
                          setValue(`moduleSetups.${index}.pricePerStudent`, defPrice, { shouldValidate: false });
                          if (newProvider !== 'overig') {
                            setValue(`moduleSetups.${index}.customProviderName`, '', { shouldValidate: false });
                          }
                        }}
                      >
                        {getProviderOptions(moduleId).map((p) => (
                          <option key={p} value={p}>
                            {CURRENT_PROVIDER_LABELS[p]}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                {/* Provider context hint */}
                {provider && PROVIDER_HINTS[provider] && (() => {
                  const hint = PROVIDER_HINTS[provider]!(moduleId);
                  if (!hint) return null;
                  return (
                    <div className="col-span-full">
                      <div className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded px-2 py-1.5">
                        {hint}
                      </div>
                    </div>
                  );
                })()}

                {/* Prijs per leerling */}
                {showPrice && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 mb-1">
                      Prijs per leerling / jaar
                      {pubPrice !== null && (
                        <span className="ml-1 font-normal text-neutral-400">
                          (publicatieprijs: {formatCurrency(pubPrice)})
                        </span>
                      )}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-500">€</span>
                      <Controller
                        control={control}
                        name={`moduleSetups.${index}.pricePerStudent`}
                        render={({ field }) => (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))
                            }
                            className="w-24 h-10 text-center bg-white rounded-md border border-neutral-200 focus:border-cito-primary focus:border-2 focus:outline-none text-sm"
                          />
                        )}
                      />
                      {currentSetup?.pricePerStudent !== null &&
                        pubPrice !== null &&
                        currentSetup?.pricePerStudent !== pubPrice && (
                          <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                            Afwijkende prijs
                          </span>
                        )}
                      {currentSetup?.pricePerStudent === pubPrice && pubPrice !== null && (
                        <span className="text-xs bg-neutral-50 text-neutral-500 border border-neutral-200 rounded-full px-2 py-0.5">
                          Publicatieprijs
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Price deviation context */}
                {showPrice && currentSetup?.pricePerStudent !== null && provider && (
                  (() => {
                    const providerKey = provider === 'dia' ? 'dia' : provider === 'jij' ? 'jij' : provider === 'saqi' ? 'saqi' : null;
                    if (!providerKey) return null;
                    const actualPrice = currentSetup.pricePerStudent ?? 0;
                    const deviation = checkPriceDeviation(moduleId, providerKey, actualPrice);
                    if (!deviation.hasDeviation || deviation.publicationPrice === null) return null;
                    const isMoreExpensive = actualPrice > deviation.publicationPrice;
                    const pctDisplay = Math.round(deviation.percentDiff * 100);
                    return (
                      <div className="col-span-full">
                        <div className="text-xs text-neutral-500 flex items-center gap-2">
                          <span>Publicatieprijs: {formatCurrency(deviation.publicationPrice)}</span>
                          <span>|</span>
                          <span>Uw prijs: {formatCurrency(actualPrice)}</span>
                          <span>|</span>
                          <span className={isMoreExpensive ? 'text-red-600' : 'text-green-600'}>
                            {isMoreExpensive ? '+' : '-'}{pctDisplay}%
                          </span>
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* Naam andere aanbieder */}
                {showCustomName && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 mb-1">
                      Naam van de aanbieder
                    </label>
                    <Controller
                      control={control}
                      name={`moduleSetups.${index}.customProviderName`}
                      render={({ field }) => (
                        <input
                          type="text"
                          {...field}
                          value={field.value ?? ''}
                          placeholder="bijv. Boom Toetsing"
                          className="w-full h-10 rounded-md border border-neutral-200 px-3 text-sm focus:border-cito-primary focus:border-2 focus:outline-none"
                        />
                      )}
                    />
                    {errors.moduleSetups?.[index]?.customProviderName && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.moduleSetups[index].customProviderName?.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Schijnvoordeel tip for this module + provider */}
              {provider && provider !== 'geen' && (() => {
                const relevantWarnings = schijnvoordelen.filter(
                  (w) => w.affectedModules.includes(moduleId),
                );
                if (relevantWarnings.length === 0) return null;
                return (
                  <div className="mt-2 space-y-1">
                    {relevantWarnings.map((w, wi) => (
                      <div key={wi} className={`text-xs rounded px-2 py-1 ${
                        w.severity === 'critical'
                          ? 'bg-red-50 text-red-700'
                          : w.severity === 'warning'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-blue-50 text-blue-700'
                      }`}>
                        {w.title}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Differentiator comparison */}
              {provider && !['geen', 'cito-oud', 'cito-nieuw'].includes(provider) && (
                <DifferentiatorComparison
                  moduleId={moduleId}
                  currentProvider={provider}
                />
              )}
            </div>
          );
        })}
      </div>

      {selectedModules.length === 0 && (
        <p className="text-sm text-neutral-500">
          Geen modules geselecteerd. Ga terug naar stap 3.
        </p>
      )}
    </StepContainer>
  );
});

export default WizardStep4;
