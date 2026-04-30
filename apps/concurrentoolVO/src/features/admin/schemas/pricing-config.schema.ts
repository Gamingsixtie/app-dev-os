import { z } from 'zod';
import type { PricingStrategy } from '@/models/pricing';
import { PROVIDER_CONFIGS, type ProviderConfig } from '@/data/providers/index';
import { createCalculator } from '@/engine/calculators/index';

// ─── Flat Pricing ──────────────────────────────────────────────────────────────

export const flatConfigSchema = z.object({
  type: z.literal('flat'),
  pricePerStudent: z.number().min(0, 'Prijs moet >= 0 zijn'),
});

// ─── Tiered License (JIJ!) ─────────────────────────────────────────────────────

const jijTierSchema = z.object({
  tier: z.number().int().min(1),
  label: z.string().min(1, 'Label is verplicht'),
  annualFee: z.number().min(0, 'Jaarlijkse vergoeding moet >= 0 zijn'),
  pricePerTest: z.number().positive('Prijs per toets moet positief zijn'),
  minAdministrations: z.number().int().min(0),
  maxAdministrations: z.number().int().min(1),
  schoolExamPrice: z.number().min(0),
  magisterSomtodayFee: z.number().min(0),
}).refine(d => d.maxAdministrations > d.minAdministrations, {
  message: 'Maximum afnames moet groter zijn dan minimum afnames',
});

export const tieredLicenseConfigSchema = z.object({
  type: z.literal('tiered-license'),
  tiers: z.array(jijTierSchema).min(1, 'Minimaal 1 tier vereist'),
  defaultTestsPerStudent: z.number().int().positive('Standaard toetsen per leerling moet positief zijn'),
});

// ─── Package Bundle (DIA) ──────────────────────────────────────────────────────

const diaPackageSchema = z.object({
  id: z.string().min(1, 'ID is verplicht'),
  name: z.string().min(1, 'Naam is verplicht'),
  includedModuleIds: z.array(z.string()).min(1, 'Minimaal 1 module vereist'),
  pricePerStudent: z.number().positive('Prijs moet positief zijn'),
  minModules: z.number().int().min(1),
  description: z.string().optional(),
});

export const packageBundleConfigSchema = z.object({
  type: z.literal('package-bundle'),
  packages: z.array(diaPackageSchema).min(1, 'Minimaal 1 pakket vereist'),
  individualPrices: z.record(z.string(), z.number()),
});

// ─── Platform + Module (Cito) ──────────────────────────────────────────────────

const citoBundleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Naam is verplicht'),
  description: z.string(),
  includedModuleIds: z.array(z.string()),
  pricePerStudent: z.number().nullable(),
  contractPrices: z.record(z.string(), z.number()).optional(),
});

const contractPeriodSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  shortLabel: z.string().min(1),
  years: z.number().int().positive(),
  citoFactor: z.number().min(0),
  otherFactor: z.number().min(0),
  note: z.string().nullable(),
});

export const platformModuleConfigSchema = z.object({
  type: z.literal('platform+module'),
  bundles: z.array(citoBundleSchema),
  contractPeriods: z.array(contractPeriodSchema),
  individualPrices: z.record(z.string(), z.number()),
});

// ─── Discriminated Union ───────────────────────────────────────────────────────

export const pricingConfigSchema = z.discriminatedUnion('type', [
  flatConfigSchema,
  tieredLicenseConfigSchema,
  packageBundleConfigSchema,
  platformModuleConfigSchema,
]);

// ─── Runtime Validation ────────────────────────────────────────────────────────

/**
 * Map provider key to a ProviderConfig with proposed pricing strategy.
 * Uses the existing static config as base and replaces the pricing strategy.
 */
function buildTestConfig(provider: string, strategy: PricingStrategy): ProviderConfig {
  const baseConfig = PROVIDER_CONFIGS[provider as keyof typeof PROVIDER_CONFIGS];
  if (!baseConfig) {
    throw new Error(`Onbekende provider: ${provider}`);
  }
  return { ...baseConfig, pricingStrategy: strategy } as ProviderConfig;
}

/**
 * Validate a pricing config by:
 * 1. Parsing with Zod schema (structural validation)
 * 2. Running a test calculation with the engine calculator (runtime validation)
 *
 * Returns { valid: true } if both pass, or { valid: false, error: string } on failure.
 */
export function validatePricingConfig(
  provider: string,
  config: PricingStrategy,
): { valid: boolean; error?: string } {
  try {
    // Step 1: Zod schema validation
    pricingConfigSchema.parse(config);

    // Step 2: Test calculation to catch runtime errors
    const testConfig = buildTestConfig(provider, config);
    const calculator = createCalculator(testConfig, {
      selectedModules: ['rekenwiskunde'],
    });
    calculator.calculateModule('rekenwiskunde', 100);

    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : 'Ongeldige configuratie',
    };
  }
}
