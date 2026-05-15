/**
 * Dutch UI labels for the deal-outcome feature (Phase 28).
 *
 * Per AGENTS.md: code identifiers stay English, UI strings are Dutch and
 * formal (u-vorm, CLAUDE.md MODE-01). All maps below are full `Record<Enum, string>`
 * so adding a new enum value triggers a compile error here — single source of
 * truth for human-readable labels.
 */
import type { DealCompetitorProvider, DealStatus, Onderwijsvisie, ReasonCategory } from './types';

/** Lifecycle status labels — used in DealStatusBadge + DashboardPage filters. */
export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  open: 'Lopend',
  in_negotiation: 'In onderhandeling',
  won: 'Gewonnen',
  lost: 'Verloren',
  archived: 'Gearchiveerd',
};

/** Reason-category labels — drive the LostDealForm dropdown + dashboard breakdown. */
export const REASON_CATEGORY_LABELS: Record<ReasonCategory, string> = {
  prijs: 'Prijs',
  functionaliteit: 'Functionaliteit / product-mismatch',
  voorkeur: 'Voorkeur / bestaande relatie',
  anders: 'Anders',
};

/** Onderwijsvisie labels — used in CohortPredictionCard + school profile edit. */
export const ONDERWIJSVISIE_LABELS: Record<Onderwijsvisie, string> = {
  dalton: 'Dalton',
  montessori: 'Montessori',
  regulier: 'Regulier',
  lyceum: 'Lyceum',
};

/** Competitor-provider labels — used in LostDealForm select + dashboard. */
export const DEAL_COMPETITOR_PROVIDER_LABELS: Record<DealCompetitorProvider, string> = {
  dia: 'DIA',
  jij: 'JIJ (IEP)',
  saqi: 'SAQI',
  overig: 'Andere aanbieder',
};
