/**
 * CRUD operations for pricing intelligence tables.
 *
 * Follows the same pattern as operations.ts:
 * - Uses supabase client from @/lib/supabase/client
 * - Inline getAuthHeaders pattern (per Phase 9 decision)
 * - All functions are async, return typed data
 * - Team-scoped via RLS (get_user_team_id())
 */

import { supabase } from '@/lib/supabase/client';
import type {
  PublicationPrice,
  PricingConfig,
  PriceProposal,
  PriceAuditEntry,
} from './pricing-types';
import type { PriceSource, AuditEntityType, AuditAction } from '@/lib/supabase/types';
import type { Json } from '@/lib/supabase/types';

// --- Auth helpers (inline getAuthHeaders pattern, same as document-parser.ts) ---

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Niet ingelogd');
  return user.id;
}

async function getTeamId(): Promise<string> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', userId)
    .single();
  if (error || !data) throw new Error('Gebruikersprofiel niet gevonden');
  return data.team_id;
}

// --- Publication Prices ---

/**
 * Fetch all active publication prices for the current team.
 */
export async function fetchPublicationPrices(): Promise<PublicationPrice[]> {
  const { data, error } = await supabase
    .from('publication_prices')
    .select('*')
    .eq('is_active', true);

  if (error) throw new Error(`Fout bij ophalen publicatieprijzen: ${error.message}`);
  return (data ?? []) as PublicationPrice[];
}

/**
 * Update a single publication price with audit trail.
 */
export async function updatePublicationPrice(
  id: string,
  data: {
    amount_per_student: number;
    source: PriceSource;
    source_label: string;
    note?: string;
  },
): Promise<void> {
  const userId = await getCurrentUserId();

  // Fetch current value for audit
  const { data: current, error: fetchError } = await supabase
    .from('publication_prices')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(`Fout bij ophalen prijs: ${fetchError.message}`);

  // Update price
  const { error: updateError } = await supabase
    .from('publication_prices')
    .update({
      amount_per_student: data.amount_per_student,
      source: data.source,
      source_label: data.source_label,
      note: data.note ?? null,
      updated_by: userId,
      updated_at: new Date().toISOString(),
      verified_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) throw new Error(`Fout bij bijwerken prijs: ${updateError.message}`);

  // Audit log
  await supabase.from('price_audit_log').insert({
    team_id: (current as PublicationPrice).team_id,
    entity_type: 'publication_price' as AuditEntityType,
    entity_id: id,
    action: 'updated' as AuditAction,
    old_value: current as unknown as Json,
    new_value: data as unknown as Json,
    user_id: userId,
  });
}

// --- Pricing Configs ---

/**
 * Fetch all active pricing configs for the current team.
 */
export async function fetchPricingConfigs(): Promise<PricingConfig[]> {
  const { data, error } = await supabase
    .from('pricing_configs')
    .select('*')
    .eq('is_active', true);

  if (error) throw new Error(`Fout bij ophalen prijsconfiguraties: ${error.message}`);
  return (data ?? []) as PricingConfig[];
}

/**
 * Update pricing config data with version increment and audit trail.
 */
export async function updatePricingConfig(
  id: string,
  configData: Record<string, unknown>,
): Promise<void> {
  const userId = await getCurrentUserId();

  // Fetch current for audit + version
  const { data: current, error: fetchError } = await supabase
    .from('pricing_configs')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(`Fout bij ophalen config: ${fetchError.message}`);

  const currentConfig = current as PricingConfig;

  // Update with incremented version
  const { error: updateError } = await supabase
    .from('pricing_configs')
    .update({
      config_data: configData as unknown as Json,
      version: currentConfig.version + 1,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) throw new Error(`Fout bij bijwerken config: ${updateError.message}`);

  // Audit log
  await supabase.from('price_audit_log').insert({
    team_id: currentConfig.team_id,
    entity_type: 'pricing_config' as AuditEntityType,
    entity_id: id,
    action: 'updated' as AuditAction,
    old_value: { config_data: currentConfig.config_data, version: currentConfig.version } as unknown as Json,
    new_value: { config_data: configData, version: currentConfig.version + 1 } as unknown as Json,
    user_id: userId,
  });
}

// --- Price Proposals ---

/**
 * Fetch price proposals with optional filters.
 */
export async function fetchPriceProposals(
  filters?: { status?: string; provider?: string; moduleId?: string },
): Promise<PriceProposal[]> {
  let query = supabase.from('price_proposals').select('*');

  if (filters?.status) {
    query = query.eq('status', filters.status as PriceProposal['status']);
  }
  if (filters?.provider) {
    query = query.eq('provider', filters.provider);
  }
  if (filters?.moduleId) {
    query = query.eq('module_id', filters.moduleId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Fout bij ophalen voorstellen: ${error.message}`);
  return (data ?? []) as PriceProposal[];
}

/**
 * Count open proposals for badge display (D-09).
 */
export async function fetchOpenProposalCount(): Promise<number> {
  const { count, error } = await supabase
    .from('price_proposals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open' as const);

  if (error) throw new Error(`Fout bij tellen voorstellen: ${error.message}`);
  return count ?? 0;
}

/**
 * Create a new price proposal. All team members can submit.
 */
export async function createPriceProposal(
  data: Omit<
    PriceProposal,
    'id' | 'team_id' | 'status' | 'rejection_reason' | 'reviewed_by' | 'reviewed_at' | 'created_at' | 'updated_at' | 'evidence_path' | 'submitted_by'
  > & { evidence_path?: string },
): Promise<PriceProposal> {
  const userId = await getCurrentUserId();
  const teamId = await getTeamId();

  const { data: result, error } = await supabase
    .from('price_proposals')
    .insert({
      ...data,
      team_id: teamId,
      submitted_by: userId,
      evidence_path: data.evidence_path ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Fout bij aanmaken voorstel: ${error.message}`);
  return result as PriceProposal;
}

/**
 * Approve a proposal: update status, upsert publication price, create audit entry.
 * Per D-08: direct activation — approved prices immediately become active.
 */
export async function approveProposal(proposalId: string): Promise<void> {
  const userId = await getCurrentUserId();

  // Fetch proposal
  const { data: proposal, error: fetchError } = await supabase
    .from('price_proposals')
    .select('*')
    .eq('id', proposalId)
    .single();

  if (fetchError || !proposal) throw new Error(`Voorstel niet gevonden: ${fetchError?.message}`);
  const p = proposal as PriceProposal;

  // Update proposal status
  const { error: updateError } = await supabase
    .from('price_proposals')
    .update({
      status: 'approved' as const,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposalId);

  if (updateError) throw new Error(`Fout bij goedkeuren voorstel: ${updateError.message}`);

  // Global scope: upsert publication price (affects all schools)
  // School scope: price stored on the proposal itself — no global price change
  if (p.scope !== 'school') {
    const { error: upsertError } = await supabase
      .from('publication_prices')
      .upsert(
        {
          team_id: p.team_id,
          module_id: p.module_id,
          provider: p.provider,
          amount_per_student: p.proposed_price,
          source: 'proposal' as PriceSource,
          source_label: `Voorstel goedgekeurd: ${p.source}`,
          verified_at: new Date().toISOString(),
          is_active: true,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'team_id,module_id,provider' },
      );

    if (upsertError) throw new Error(`Fout bij bijwerken publicatieprijs: ${upsertError.message}`);
  }

  // Audit log
  await supabase.from('price_audit_log').insert({
    team_id: p.team_id,
    entity_type: 'price_proposal' as AuditEntityType,
    entity_id: proposalId,
    action: 'approved' as AuditAction,
    old_value: { price: p.current_price } as unknown as Json,
    new_value: { price: p.proposed_price } as unknown as Json,
    proposal_id: proposalId,
    user_id: userId,
  });
}

/**
 * Reject a proposal with a reason. Creates audit entry.
 */
export async function rejectProposal(
  proposalId: string,
  reason: string,
): Promise<void> {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Reden voor afwijzing is verplicht');
  }

  const userId = await getCurrentUserId();

  // Fetch proposal
  const { data: proposal, error: fetchError } = await supabase
    .from('price_proposals')
    .select('*')
    .eq('id', proposalId)
    .single();

  if (fetchError || !proposal) throw new Error(`Voorstel niet gevonden: ${fetchError?.message}`);
  const p = proposal as PriceProposal;

  // Update proposal status
  const { error: updateError } = await supabase
    .from('price_proposals')
    .update({
      status: 'rejected' as const,
      rejection_reason: reason,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposalId);

  if (updateError) throw new Error(`Fout bij afwijzen voorstel: ${updateError.message}`);

  // Audit log
  await supabase.from('price_audit_log').insert({
    team_id: p.team_id,
    entity_type: 'price_proposal' as AuditEntityType,
    entity_id: proposalId,
    action: 'rejected' as AuditAction,
    old_value: { price: p.current_price, proposed: p.proposed_price } as unknown as Json,
    new_value: null,
    reason,
    proposal_id: proposalId,
    user_id: userId,
  });
}

// --- Audit Log ---

/**
 * Fetch audit log entries for a specific entity.
 */
export async function fetchAuditLog(
  entityType: AuditEntityType,
  entityId: string,
): Promise<PriceAuditEntry[]> {
  const { data, error } = await supabase
    .from('price_audit_log')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Fout bij ophalen auditlog: ${error.message}`);
  return (data ?? []) as PriceAuditEntry[];
}
