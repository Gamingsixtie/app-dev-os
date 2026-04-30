/**
 * Seed script: converts existing TypeScript pricing data to Supabase records.
 *
 * This script reads PROVIDER_CONFIGS and DEFAULT_PRICES from the TS source files
 * and inserts them into the publication_prices and pricing_configs tables.
 *
 * Usage (via Vite/tsx with path alias support):
 *   npx tsx --tsconfig tsconfig.json supabase/seed-pricing-data.ts
 *
 * Prerequisites:
 *   - VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set in .env.local
 *   - Supabase user authenticated (service role key recommended for seeding)
 *   - Migrations 009-012 already applied
 *
 * This script is idempotent: uses upsert with ON CONFLICT for publication_prices.
 */

import { createClient } from '@supabase/supabase-js';
import { PROVIDER_CONFIGS } from '../src/data/providers/index';
import { DEFAULT_PRICES } from '../src/data/default-prices';

// --- Configuration ---

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Config type mapping ---

function getConfigType(strategy: { type: string }): string {
  const typeMap: Record<string, string> = {
    'platform+module': 'platform+module',
    'package-bundle': 'package-bundle',
    'tiered-license': 'tiered-license',
    'flat': 'flat',
  };
  return typeMap[strategy.type] || 'flat';
}

// --- Main seed function ---

async function seedPricingData(teamId: string, userId: string) {
  console.log(`Seeding pricing data for team ${teamId}...`);

  let priceCount = 0;
  let configCount = 0;

  // 1. Seed pricing configs from PROVIDER_CONFIGS
  for (const [providerKey, config] of Object.entries(PROVIDER_CONFIGS)) {
    const { error } = await supabase
      .from('pricing_configs')
      .upsert(
        {
          team_id: teamId,
          provider: providerKey,
          config_type: getConfigType(config.pricingStrategy),
          config_data: config.pricingStrategy as unknown as Record<string, unknown>,
          version: 1,
          is_active: true,
          created_by: userId,
          updated_by: userId,
        },
        { onConflict: 'team_id,provider', ignoreDuplicates: false },
      );

    if (error) {
      console.error(`Error seeding config for ${providerKey}:`, error.message);
    } else {
      configCount++;
      console.log(`  Seeded pricing config: ${providerKey} (${config.pricingStrategy.type})`);
    }
  }

  // 2. Seed publication prices from DEFAULT_PRICES
  for (const price of DEFAULT_PRICES) {
    const { error } = await supabase
      .from('publication_prices')
      .upsert(
        {
          team_id: teamId,
          module_id: price.moduleId,
          provider: price.provider,
          amount_per_student: price.amountPerStudent,
          source: 'seed',
          source_label: 'Initieel vanuit brondata',
          verified_at: price.verifiedAt.toISOString(),
          is_active: true,
          note: price.note ?? null,
          created_by: userId,
          updated_by: userId,
        },
        { onConflict: 'team_id,module_id,provider' },
      );

    if (error) {
      console.error(`Error seeding price for ${price.provider}/${price.moduleId}:`, error.message);
    } else {
      priceCount++;
    }
  }

  // 3. Create audit log entries for seeded data
  const auditEntries = DEFAULT_PRICES.map((price) => ({
    team_id: teamId,
    entity_type: 'publication_price' as const,
    entity_id: '00000000-0000-0000-0000-000000000000', // Placeholder — actual IDs assigned by DB
    action: 'seeded' as const,
    new_value: {
      module_id: price.moduleId,
      provider: price.provider,
      amount_per_student: price.amountPerStudent,
    },
    user_id: userId,
  }));

  if (auditEntries.length > 0) {
    const { error: auditError } = await supabase
      .from('price_audit_log')
      .insert(auditEntries);

    if (auditError) {
      console.warn('Warning: could not create seed audit entries:', auditError.message);
    }
  }

  console.log(`\nSeed complete:`);
  console.log(`  Pricing configs: ${configCount} (${Object.keys(PROVIDER_CONFIGS).length} providers)`);
  console.log(`  Publication prices: ${priceCount} (${DEFAULT_PRICES.length} total)`);
}

// --- CLI entry point ---

const teamId = process.argv[2];
const userId = process.argv[3];

if (!teamId || !userId) {
  console.error('Usage: npx tsx supabase/seed-pricing-data.ts <team_id> <user_id>');
  console.error('  team_id: UUID of the team to seed data for');
  console.error('  user_id: UUID of the user performing the seed (for audit trail)');
  process.exit(1);
}

seedPricingData(teamId, userId).catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
