/**
 * TypeScript interfaces for pricing intelligence database tables.
 *
 * Maps to Supabase tables:
 * - publication_prices (009)
 * - pricing_configs (010)
 * - price_proposals (011)
 * - price_audit_log (012)
 */

export interface PublicationPrice {
  id: string;
  team_id: string;
  module_id: string;
  provider: string;
  amount_per_student: number;
  source: 'seed' | 'manual' | 'proposal' | 'ai-lookup';
  source_label: string;
  verified_at: string;
  is_active: boolean;
  note: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingConfig {
  id: string;
  team_id: string;
  provider: string;
  config_type: 'platform+module' | 'package-bundle' | 'tiered-license' | 'flat';
  config_data: Record<string, unknown>;
  version: number;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceProposal {
  id: string;
  team_id: string;
  module_id: string;
  provider: string;
  current_price: number;
  proposed_price: number;
  source: string;
  explanation: string;
  evidence_path: string | null;
  scope: 'global' | 'school';
  school_id: string | null;
  school_name: string | null;
  status: 'open' | 'approved' | 'rejected';
  rejection_reason: string | null;
  submitted_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceAuditEntry {
  id: string;
  team_id: string;
  entity_type: 'publication_price' | 'pricing_config' | 'price_proposal';
  entity_id: string;
  action: 'created' | 'updated' | 'approved' | 'rejected' | 'seeded';
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  reason: string | null;
  proposal_id: string | null;
  user_id: string;
  created_at: string;
}
