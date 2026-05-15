// Prijs-editor page.
// Tab structure (after refinement):
//   Cito Basisvaardigheden — full Cito ProviderConfigForm (Basis/Plus bundels)
//   Concurrentie          — 5 sub-tabs:
//     2 provider-specific: DIA, JIJ (full ProviderConfigForm per provider)
//     3 cross-provider categories: Sociaal-emotioneel, Executieve functies, Overig
// Tab state lives in the URL via TanStack Router search params (D-02).

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import { PROVIDER_CONFIGS } from '@/data/providers/index';
import { usePricingConfigs } from '@/hooks/usePricingConfigs';
import { updatePricingConfig } from '@/db/pricing-operations';
import { usePricingDataStore } from '@/stores/pricing-data-store';
import { ProviderConfigForm } from '@/features/admin/ProviderConfigForm';
import { PrijzenTabs } from './components/PrijzenTabs';
import { ConcurrentieSubTabs } from './components/ConcurrentieSubTabs';
import { CitoBasisvaardigheidenTab } from './components/CitoBasisvaardigheidenTab';
import { ConcurrentieCategoryView } from './components/ConcurrentieCategoryView';
import { PriceListExportButton } from './components/PriceListExportButton';
import { PriceImportFlow } from './components/PriceImportFlow';
import { usePrijzenSearch } from './hooks/usePrijzenSearch';
import type { PricingStrategy } from '@/models/pricing';
import type { ConcurrentieSubTab } from './types';
import type { ConcurrentieCategory } from './constants/cito-module-grouping';

// Dev-bypass: when VITE_SKIP_AUTH=true (local development), treat user as manager
// so the editor is visible without role-switching. Production deploys never have this set.
const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true';

// Map of which Concurrentie sub-tabs are provider-edit vs category-readonly.
function isProviderSub(sub: ConcurrentieSubTab): sub is 'dia' | 'jij' {
  return sub === 'dia' || sub === 'jij';
}

function asCategory(sub: ConcurrentieSubTab): ConcurrentieCategory {
  // Caller guarantees isProviderSub(sub) === false; narrow remaining type.
  return sub as ConcurrentieCategory;
}

export function PrijzenPage() {
  const { userProfile } = useAuth();
  const { tab, sub, setTab, setSub } = usePrijzenSearch();
  const queryClient = useQueryClient();
  const { data: dbConfigs } = usePricingConfigs();
  const [importOpen, setImportOpen] = useState(false);

  // Manager-only access check (UX layer; data-level protection is via Supabase RLS).
  if (!SKIP_AUTH && userProfile?.role !== 'manager') {
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

  // Save-handler for the DIA / JIJ provider sub-tabs.
  const handleProviderSave = async (provider: 'dia' | 'jij', newConfig: PricingStrategy) => {
    const dbConfig = dbConfigs?.find((c) => c.provider === provider && c.is_active);
    if (!dbConfig) {
      console.warn(`[PrijzenPage] No DB config for ${provider} — seed migration may not have run`);
      return;
    }
    await updatePricingConfig(dbConfig.id, newConfig as unknown as Record<string, unknown>);
    await usePricingDataStore.getState().loadFromSupabase();
    queryClient.invalidateQueries({ queryKey: ['pricing-configs'] });
  };

  const activeProvider = isProviderSub(sub) ? sub : 'dia';
  const activeProviderConfig = isProviderSub(sub) ? PROVIDER_CONFIGS[activeProvider] : null;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-cito-primary mb-6">Cito Prijzen + Concurrentie</h1>
      <div className="flex justify-end gap-2 mb-4">
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="px-4 py-2 border border-cito-primary text-cito-primary rounded-md text-sm font-medium hover:bg-cito-primary/10"
        >
          Importeer prijzen uit Excel
        </button>
        <PriceListExportButton />
      </div>
      <PriceImportFlow open={importOpen} onClose={() => setImportOpen(false)} />
      <PrijzenTabs activeTab={tab} onTabChange={setTab} />

      {tab === 'basis' && <CitoBasisvaardigheidenTab />}

      {tab === 'concurrentie' && (
        <div>
          <ConcurrentieSubTabs active={sub} onChange={setSub} />
          {isProviderSub(sub) && activeProviderConfig && (
            <ProviderConfigForm
              provider={activeProvider}
              config={activeProviderConfig.pricingStrategy}
              onSave={(newConfig) => handleProviderSave(activeProvider, newConfig)}
            />
          )}
          {!isProviderSub(sub) && <ConcurrentieCategoryView category={asCategory(sub)} />}
        </div>
      )}
    </div>
  );
}

export default PrijzenPage;
