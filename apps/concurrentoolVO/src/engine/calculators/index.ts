import type { ProviderPriceCalculator } from './types';
import type { ProviderConfig } from '@/data/providers/index';
import type { CitoBundleType } from '@/data/providers/cito';
import { CitoCalculator } from './cito-calculator';
import { DiaCalculator } from './dia-calculator';
import { JijCalculator } from './jij-calculator';
import { FlatCalculator } from './flat-calculator';

export type { ProviderPriceCalculator, ModulePriceResult, PriceBreakdownStep } from './types';

/**
 * Factory function: create the appropriate calculator for a provider config.
 * Switch on pricingStrategy.type with exhaustive check.
 */
export function createCalculator(
  config: ProviderConfig,
  options?: { citoBundleType?: CitoBundleType; selectedModules?: string[]; forceDiaPackageId?: string | null },
): ProviderPriceCalculator {
  switch (config.pricingStrategy.type) {
    case 'platform+module':
      return new CitoCalculator(
        config as import('@/data/providers/cito').CitoProviderConfig,
        options?.citoBundleType ?? 'individual',
        options?.selectedModules ?? [],
      );
    case 'package-bundle':
      return new DiaCalculator(
        config as import('@/data/providers/dia').DiaProviderConfig,
        options?.forceDiaPackageId,
      );
    case 'tiered-license':
      return new JijCalculator(
        config as import('@/data/providers/jij').JijProviderConfig,
        options?.selectedModules ?? [],
      );
    case 'flat':
      return new FlatCalculator(
        config as import('@/data/providers/saqi').SaqiProviderConfig,
      );
  }
}
