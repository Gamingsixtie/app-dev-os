import { useState } from 'react';
import type { PricingStrategy, PlatformModulePricing, PackageBundlePricing, TieredLicensePricing, FlatPricing } from '@/models/pricing';
import type { JijLicenseTier } from '@/data/providers/jij';
import { validatePricingConfig } from './schemas/pricing-config.schema';

interface ProviderConfigFormProps {
  provider: string;
  config: PricingStrategy;
  onSave: (config: PricingStrategy) => Promise<void>;
}

// ─── Flat Config Form ──────────────────────────────────────────────────────────

function FlatConfigFields({
  config,
  onChange,
}: {
  config: FlatPricing;
  onChange: (c: FlatPricing) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Prijs per leerling
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={config.pricePerStudent}
          onChange={(e) =>
            onChange({ ...config, pricePerStudent: parseFloat(e.target.value) || 0 })
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#003082] focus:ring-1 focus:ring-[#003082]"
        />
      </div>
    </div>
  );
}

// ─── Tiered License Config Form (JIJ!) ─────────────────────────────────────────

function TieredLicenseFields({
  config,
  onChange,
  errors,
}: {
  config: TieredLicensePricing;
  onChange: (c: TieredLicensePricing) => void;
  errors: Record<string, string>;
}) {
  const updateTier = (index: number, field: keyof JijLicenseTier, value: number | string) => {
    const newTiers = config.tiers.map((t, i) =>
      i === index ? { ...t, [field]: value } as JijLicenseTier : t,
    );
    onChange({ ...config, tiers: newTiers });
  };

  const addTier = () => {
    const tierNumber = Math.min(config.tiers.length + 1, 4) as JijLicenseTier['tier'];
    const newTier: JijLicenseTier = {
      tier: tierNumber,
      label: `Licentie ${config.tiers.length + 1}`,
      annualFee: 0,
      pricePerTest: 0,
      minAdministrations: 0,
      maxAdministrations: 100,
      schoolExamPrice: 0,
      magisterSomtodayFee: 0,
    };
    onChange({ ...config, tiers: [...config.tiers, newTier] });
  };

  const removeTier = (index: number) => {
    onChange({ ...config, tiers: config.tiers.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Standaard toetsen per leerling
        </label>
        <input
          type="number"
          min="1"
          value={config.defaultTestsPerStudent}
          onChange={(e) =>
            onChange({ ...config, defaultTestsPerStudent: parseInt(e.target.value) || 1 })
          }
          className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <h4 className="font-medium text-gray-900">Licentie-tiers</h4>

      {config.tiers.map((tier, i) => (
        <div key={i} className={`border rounded-lg p-4 space-y-3 ${errors[`tier-${i}`] ? 'border-red-500' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm">{tier.label}</span>
            {config.tiers.length > 1 && (
              <button
                type="button"
                onClick={() => removeTier(i)}
                className="text-red-600 text-sm hover:underline"
              >
                Verwijderen
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Label</label>
              <input
                type="text"
                value={tier.label}
                onChange={(e) => updateTier(i, 'label', e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Jaarvergoeding</label>
              <input
                type="number"
                step="0.01"
                value={tier.annualFee}
                onChange={(e) => updateTier(i, 'annualFee', parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prijs per toets</label>
              <input
                type="number"
                step="0.01"
                value={tier.pricePerTest}
                onChange={(e) => updateTier(i, 'pricePerTest', parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min. afnames</label>
              <input
                type="number"
                value={tier.minAdministrations}
                onChange={(e) => updateTier(i, 'minAdministrations', parseInt(e.target.value) || 0)}
                className={`w-full rounded border px-2 py-1 text-sm ${errors[`tier-${i}`] ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Max. afnames</label>
              <input
                type="number"
                value={tier.maxAdministrations}
                onChange={(e) => updateTier(i, 'maxAdministrations', parseInt(e.target.value) || 0)}
                className={`w-full rounded border px-2 py-1 text-sm ${errors[`tier-${i}`] ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Magister/SomToday</label>
              <input
                type="number"
                step="0.01"
                value={tier.magisterSomtodayFee}
                onChange={(e) => updateTier(i, 'magisterSomtodayFee', parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
          </div>

          {errors[`tier-${i}`] && (
            <p className="text-red-600 text-xs">{errors[`tier-${i}`]}</p>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addTier}
        className="text-sm text-[#003082] hover:underline"
      >
        + Tier toevoegen
      </button>
    </div>
  );
}

// ─── Package Bundle Config Form (DIA) ──────────────────────────────────────────

function PackageBundleFields({
  config,
  onChange,
  errors,
}: {
  config: PackageBundlePricing;
  onChange: (c: PackageBundlePricing) => void;
  errors: Record<string, string>;
}) {
  const updatePackage = (index: number, field: string, value: unknown) => {
    const newPackages = [...config.packages];
    newPackages[index] = { ...newPackages[index], [field]: value };
    onChange({ ...config, packages: newPackages });
  };

  const addPackage = () => {
    const newPkg = {
      id: `pakket-${Date.now()}`,
      name: 'Nieuw pakket',
      includedModuleIds: ['rekenwiskunde'],
      pricePerStudent: 0,
      minModules: 1,
      description: '',
    };
    onChange({ ...config, packages: [...config.packages, newPkg] });
  };

  const removePackage = (index: number) => {
    onChange({ ...config, packages: config.packages.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Pakketten</h4>

      {config.packages.map((pkg, i) => (
        <div key={i} className={`border rounded-lg p-4 space-y-3 ${errors[`pkg-${i}`] ? 'border-red-500' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm">{pkg.name}</span>
            {config.packages.length > 1 && (
              <button
                type="button"
                onClick={() => removePackage(i)}
                className="text-red-600 text-sm hover:underline"
              >
                Verwijderen
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Naam</label>
              <input
                type="text"
                value={pkg.name}
                onChange={(e) => updatePackage(i, 'name', e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prijs per leerling</label>
              <input
                type="number"
                step="0.01"
                value={pkg.pricePerStudent}
                onChange={(e) => updatePackage(i, 'pricePerStudent', parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Modules (komma-gescheiden module IDs)
            </label>
            <input
              type="text"
              value={pkg.includedModuleIds.join(', ')}
              onChange={(e) =>
                updatePackage(
                  i,
                  'includedModuleIds',
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                )
              }
              className={`w-full rounded border px-2 py-1 text-sm ${errors[`pkg-${i}`] ? 'border-red-500' : 'border-gray-300'}`}
            />
          </div>

          {errors[`pkg-${i}`] && (
            <p className="text-red-600 text-xs">{errors[`pkg-${i}`]}</p>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addPackage}
        className="text-sm text-[#003082] hover:underline"
      >
        + Pakket toevoegen
      </button>
    </div>
  );
}

// ─── Platform + Module Config Form (Cito) ──────────────────────────────────────

function PlatformModuleFields({
  config,
  onChange,
}: {
  config: PlatformModulePricing;
  onChange: (c: PlatformModulePricing) => void;
}) {
  const updateBundle = (index: number, field: string, value: unknown) => {
    const newBundles = [...config.bundles];
    newBundles[index] = { ...newBundles[index], [field]: value };
    onChange({ ...config, bundles: newBundles });
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Bundels</h4>

      {config.bundles.map((bundle, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm">{bundle.name}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Naam</label>
              <input
                type="text"
                value={bundle.name}
                onChange={(e) => updateBundle(i, 'name', e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prijs per leerling</label>
              <input
                type="number"
                step="0.01"
                value={bundle.pricePerStudent ?? ''}
                onChange={(e) => updateBundle(i, 'pricePerStudent', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Modules</label>
            <input
              type="text"
              value={bundle.includedModuleIds.join(', ')}
              onChange={(e) =>
                updateBundle(
                  i,
                  'includedModuleIds',
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                )
              }
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
        </div>
      ))}

      <h4 className="font-medium text-gray-900 mt-6">Contractperioden</h4>

      {config.contractPeriods.map((period, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
          <span className="font-medium text-sm">{period.label}</span>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Jaren</label>
              <input
                type="number"
                value={period.years}
                readOnly
                className="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cito-factor</label>
              <input
                type="number"
                step="0.01"
                value={period.citoFactor}
                onChange={(e) => {
                  const newPeriods = [...config.contractPeriods];
                  newPeriods[i] = { ...newPeriods[i], citoFactor: parseFloat(e.target.value) || 0 };
                  onChange({ ...config, contractPeriods: newPeriods });
                }}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Overig-factor</label>
              <input
                type="number"
                step="0.01"
                value={period.otherFactor}
                onChange={(e) => {
                  const newPeriods = [...config.contractPeriods];
                  newPeriods[i] = { ...newPeriods[i], otherFactor: parseFloat(e.target.value) || 0 };
                  onChange({ ...config, contractPeriods: newPeriods });
                }}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>
      ))}

      <h4 className="font-medium text-gray-900 mt-6">Individuele moduleprijzen</h4>

      <div className="space-y-2">
        {Object.entries(config.individualPrices).map(([moduleId, price]) => (
          <div key={moduleId} className="flex items-center gap-3">
            <label className="text-sm text-gray-700 w-48">{moduleId}</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => {
                onChange({
                  ...config,
                  individualPrices: {
                    ...config.individualPrices,
                    [moduleId]: parseFloat(e.target.value) || 0,
                  },
                });
              }}
              className="w-32 rounded border border-gray-300 px-2 py-1 text-sm"
            />
            <span className="text-xs text-gray-500">/lln</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Form Component ───────────────────────────────────────────────────────

export function ProviderConfigForm({ provider, config, onSave }: ProviderConfigFormProps) {
  const [localConfig, setLocalConfig] = useState<PricingStrategy>(config);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setFieldErrors({});

    // Validate before saving
    const validation = validatePricingConfig(provider, localConfig);
    if (!validation.valid) {
      setError(validation.error ?? 'Ongeldige configuratie -- controleer de gemarkeerde velden');

      // Extract field-level errors for inline display
      const errors: Record<string, string> = {};
      if (validation.error) {
        errors['_form'] = validation.error;
      }
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      await onSave(localConfig);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          Prijsmodel: <span className="font-medium">{localConfig.type}</span>
        </p>
      </div>

      {localConfig.type === 'flat' && (
        <FlatConfigFields
          config={localConfig}
          onChange={setLocalConfig}
        />
      )}

      {localConfig.type === 'tiered-license' && (
        <TieredLicenseFields
          config={localConfig}
          onChange={setLocalConfig}
          errors={fieldErrors}
        />
      )}

      {localConfig.type === 'package-bundle' && (
        <PackageBundleFields
          config={localConfig}
          onChange={setLocalConfig}
          errors={fieldErrors}
        />
      )}

      {localConfig.type === 'platform+module' && (
        <PlatformModuleFields
          config={localConfig}
          onChange={setLocalConfig}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-700">Configuratie succesvol opgeslagen</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-[#003082] text-white rounded-md text-sm font-medium hover:bg-[#002060] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Opslaan...' : 'Configuratie opslaan'}
      </button>
    </div>
  );
}
