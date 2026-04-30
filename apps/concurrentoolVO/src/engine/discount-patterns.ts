/**
 * Discount pattern detection engine.
 *
 * Detects when 3+ schools report similar discounts for the same provider+module
 * combination, surfacing real market pricing intelligence from aggregated data.
 *
 * Pure function — no side effects, no store/hook imports.
 */

export interface SchoolPriceInput {
  schoolId: string;
  moduleId: string;
  provider: string;
  amount: number;
  source: string;
}

export interface PublicationPriceInput {
  moduleId: string;
  provider: string;
  amountPerStudent: number;
}

export interface DiscountPattern {
  provider: string;
  moduleId: string;
  /** Average discount percentage (0-100) */
  averageDiscount: number;
  schoolCount: number;
  minDiscount: number;
  maxDiscount: number;
  /** Average actual price paid across schools */
  marketPrice: number;
}

const TRUSTED_SOURCES = new Set(['document', 'verified']);

/**
 * Detect discount patterns from aggregated school price data.
 *
 * Algorithm:
 * 1. Filter to trusted sources only (document, verified)
 * 2. Group by provider:moduleId
 * 3. For each group, calculate discount % vs publication price
 * 4. Filter out negative discounts (school pays more than publication)
 * 5. If group >= minSchools entries, emit DiscountPattern
 */
export function detectDiscountPatterns(
  schoolPrices: SchoolPriceInput[],
  publicationPrices: PublicationPriceInput[],
  options?: { minSchools?: number },
): DiscountPattern[] {
  const minSchools = options?.minSchools ?? 3;

  // Step 1: Filter to trusted sources
  const trusted = schoolPrices.filter((p) => TRUSTED_SOURCES.has(p.source));

  // Step 2: Group by provider:moduleId
  const groups = new Map<string, SchoolPriceInput[]>();
  for (const price of trusted) {
    const key = `${price.provider}:${price.moduleId}`;
    const group = groups.get(key);
    if (group) {
      group.push(price);
    } else {
      groups.set(key, [price]);
    }
  }

  // Build publication price lookup
  const pubPriceLookup = new Map<string, number>();
  for (const pub of publicationPrices) {
    pubPriceLookup.set(`${pub.provider}:${pub.moduleId}`, pub.amountPerStudent);
  }

  const patterns: DiscountPattern[] = [];

  for (const [key, group] of groups) {
    // Step 3: Look up publication price
    const pubPrice = pubPriceLookup.get(key);
    if (pubPrice === undefined || pubPrice === 0) continue; // avoid division by zero

    // Step 4: Calculate discount percentages, filter out negative discounts
    const discounts: { discount: number; amount: number }[] = [];
    for (const entry of group) {
      const discount = ((pubPrice - entry.amount) / pubPrice) * 100;
      if (discount > 0) {
        discounts.push({ discount, amount: entry.amount });
      }
    }

    // Step 5: Check threshold
    if (discounts.length < minSchools) continue;

    const [provider, moduleId] = key.split(':');
    const discountValues = discounts.map((d) => d.discount);
    const amounts = discounts.map((d) => d.amount);

    patterns.push({
      provider,
      moduleId,
      averageDiscount: Math.round(
        (discountValues.reduce((a, b) => a + b, 0) / discountValues.length) * 100,
      ) / 100,
      schoolCount: discounts.length,
      minDiscount: Math.round(Math.min(...discountValues) * 100) / 100,
      maxDiscount: Math.round(Math.max(...discountValues) * 100) / 100,
      marketPrice: Math.round(
        (amounts.reduce((a, b) => a + b, 0) / amounts.length) * 100,
      ) / 100,
    });
  }

  return patterns;
}
