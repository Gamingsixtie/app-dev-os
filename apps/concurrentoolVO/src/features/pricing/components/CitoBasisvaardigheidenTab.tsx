import { useQueryClient } from '@tanstack/react-query';
import { PROVIDER_CONFIGS } from '@/data/providers/index';
import { usePricingConfigs } from '@/hooks/usePricingConfigs';
import { updatePricingConfig } from '@/db/pricing-operations';
import { usePricingDataStore } from '@/stores/pricing-data-store';
import { ProviderConfigForm } from '@/features/admin/ProviderConfigForm';
import type { PricingStrategy } from '@/models/pricing';

/**
 * Cito Basisvaardigheden tab — renders the full Cito provider form
 * (Basis / Plus / Individueel bundles + individual module prices).
 *
 * No sub-tabs: Cito's bundle-structure (CITO_BUNDLES) already provides the
 * Basis/Plus split, and individual module rows handle the rest. The cross-
 * provider category sub-tabs (sociaal-emotioneel / executieve / overig) live
 * under the Concurrentie tab, not here.
 */
export function CitoBasisvaardigheidenTab() {
  const { data: dbConfigs } = usePricingConfigs();
  const queryClient = useQueryClient();
  const citoDbConfig = dbConfigs?.find((c) => c.provider === 'cito' && c.is_active);
  const citoConfig = PROVIDER_CONFIGS.cito;

  const handleSave = async (newConfig: PricingStrategy) => {
    if (!citoDbConfig) {
      console.warn('[CitoBasisvaardigheidenTab] No DB config for cito — seed migration may not have run');
      return;
    }
    await updatePricingConfig(citoDbConfig.id, newConfig as unknown as Record<string, unknown>);
    await usePricingDataStore.getState().loadFromSupabase();
    queryClient.invalidateQueries({ queryKey: ['pricing-configs'] });
  };

  return (
    <ProviderConfigForm
      provider="cito"
      config={citoConfig.pricingStrategy}
      onSave={handleSave}
    />
  );
}
