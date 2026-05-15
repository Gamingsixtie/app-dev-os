/**
 * Pure snapshot builder — single source of truth for all 4 price-list export
 * formats (PDF / HTML / Word / TXT). Reads from PROVIDER_CONFIGS and produces
 * a flat, render-agnostic view model.
 *
 * No DOM, no React, no Node-only deps — works in any JS runtime.
 */

import type { PROVIDER_CONFIGS as ConfigsType } from '@/data/providers/index';
import type { ProviderKey } from '@/engine/price-comparison';

export const PRICE_LIST_DISCLAIMER =
  'Prijzen zijn indicatief en kunnen aangepast worden. Voor actuele bevestiging: contact Cito.';

export interface PriceListSnapshotRow {
  provider: ProviderKey;
  providerLabel: string;
  pricingType: string;
  description: string;
}

export interface PriceListSnapshot {
  title: string;
  dateLabel: string;
  rows: PriceListSnapshotRow[];
  disclaimer: string;
}

const NL_MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

/** Format a Date as NL long format (e.g. "14 mei 2026"). Pure, no locale dependency. */
export function formatDateNL(d: Date): string {
  return `${d.getDate()} ${NL_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const PROVIDER_ORDER: ProviderKey[] = ['cito', 'dia', 'jij', 'saqi'];

/**
 * Build a flat view-model of the current PROVIDER_CONFIGS for export.
 * The `description` field humanises the provider's pricing strategy in NL.
 */
export function buildPriceListSnapshot(
  configs: typeof ConfigsType,
  now: Date = new Date(),
): PriceListSnapshot {
  const rows: PriceListSnapshotRow[] = [];

  for (const key of PROVIDER_ORDER) {
    const cfg = configs[key];
    if (!cfg) continue;
    const strat = cfg.pricingStrategy;
    let description = '';

    switch (strat.type) {
      case 'platform+module': {
        const bundleParts = strat.bundles
          .filter((b) => b.pricePerStudent !== null)
          .map((b) => `${b.name}: €${b.pricePerStudent?.toFixed(2)}/lln`);
        const individualParts = Object.entries(strat.individualPrices).map(
          ([mod, price]) => `${mod} €${price.toFixed(2)}`,
        );
        description = `${bundleParts.join(' • ')}. Individueel: ${individualParts.join(', ')}.`;
        break;
      }
      case 'package-bundle': {
        description = strat.packages
          .map(
            (p) =>
              `${p.name}: €${p.pricePerStudent.toFixed(2)}/lln (modules: ${p.includedModuleIds.join(', ')})`,
          )
          .join(' • ');
        break;
      }
      case 'tiered-license': {
        description = strat.tiers
          .map(
            (t) =>
              `${t.label}: €${t.annualFee.toFixed(2)}/jr + €${t.pricePerTest.toFixed(2)}/toets`,
          )
          .join(' • ');
        break;
      }
      case 'flat': {
        description = `€${strat.pricePerStudent.toFixed(2)}/lln`;
        break;
      }
      default: {
        // exhaustiveness fallback — should never hit at runtime.
        description = '(onbekend prijsmodel)';
      }
    }

    rows.push({
      provider: key,
      providerLabel: cfg.label,
      pricingType: strat.type,
      description,
    });
  }

  return {
    title: 'Cito Rekentool — Prijslijst',
    dateLabel: formatDateNL(now),
    rows,
    disclaimer: PRICE_LIST_DISCLAIMER,
  };
}
