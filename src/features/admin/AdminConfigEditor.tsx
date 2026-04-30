import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import { PROVIDER_CONFIGS } from '@/data/providers/index';
import { updatePricingConfig } from '@/db/pricing-operations';
import { usePricingDataStore } from '@/stores/pricing-data-store';
import { usePricingConfigs } from '@/hooks/usePricingConfigs';
import type { PricingStrategy } from '@/models/pricing';
import { ProviderConfigForm } from './ProviderConfigForm';

/** Provider display configuration for the tab UI */
const PROVIDER_TABS = [
  { key: 'cito', label: 'Cito' },
  { key: 'dia', label: 'DIA' },
  { key: 'jij', label: 'JIJ!' },
  { key: 'saqi', label: 'SAQI' },
] as const;

/**
 * Admin config editor page — manager-only access.
 *
 * Shows per-provider tabs to edit pricing structures (bundles, tiers, packages).
 * Validates configs before saving to prevent invalid pricing data.
 */
export function AdminConfigEditor() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('cito');
  const queryClient = useQueryClient();
  const { data: dbConfigs } = usePricingConfigs();

  // Manager-only access check
  if (userProfile?.role !== 'manager') {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Geen toegang</h2>
          <p className="text-sm text-yellow-700">
            Alleen managers kunnen de prijsconfiguratie bewerken.
          </p>
        </div>
      </div>
    );
  }

  const activeConfig = PROVIDER_CONFIGS[activeTab as keyof typeof PROVIDER_CONFIGS];
  // Find matching DB config to get its ID for updates
  const activeDbConfig = dbConfigs?.find(
    (c) => c.provider === activeTab && c.is_active,
  );

  const handleSave = async (newConfig: PricingStrategy) => {
    if (!activeDbConfig) {
      // No DB config exists yet for this provider — cannot save
      // This can happen if seed migration hasn't run
      console.warn(`[AdminConfigEditor] No DB config found for ${activeTab} — seed migration may not have run`);
      return;
    }

    await updatePricingConfig(activeDbConfig.id, newConfig as unknown as Record<string, unknown>);

    // Reload pricing data store so engine uses updated config
    await usePricingDataStore.getState().loadFromSupabase();

    // Invalidate React Query cache so UI reflects changes
    queryClient.invalidateQueries({ queryKey: ['pricing-configs'] });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-[#003082] mb-6">
        Prijsstructuur configuratie
      </h1>

      {/* Provider tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-6" aria-label="Provider tabs">
          {PROVIDER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-[#003082] text-[#003082]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Active provider form */}
      {activeConfig && (
        <ProviderConfigForm
          provider={activeTab}
          config={activeConfig.pricingStrategy}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default AdminConfigEditor;
