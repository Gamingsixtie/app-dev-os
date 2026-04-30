# Pricing Workflow Reference

Gedetailleerde workflow-documentatie voor alle prijsintelligentie-kanalen. Dit document beschrijft stap-voor-stap hoe data door het systeem stroomt.

---

## Supabase Tables Overview

| Tabel | Doel | Key columns |
|-------|------|-------------|
| `publication_prices` | Publicatieprijzen per provider per module | module_id, provider, amount, school_year, verified_at, source |
| `pricing_configs` | Pricing strategy configuraties (bundels, tiers, pakketten) | provider, config_type, config_data (JSONB), is_active |
| `price_proposals` | Voorstellen voor prijswijzigingen (review queue) | module_id, provider, proposed_amount, current_amount, status, submitted_by, reviewed_by |
| `price_audit_log` | Audit trail van alle wijzigingen | entity_type, entity_id, action, old_value, new_value, performed_by |
| `school_prices` | School-specifieke prijzen (deals, kortingen) | school_id, module_id, provider, amount, price_type, discount_percentage |

---

## Channel 1: Manual Price Update (via "Klopt niet")

### Flow

```
User clicks "Klopt niet" in Products tab
  -> PriceProposalModal opens
  -> User fills: new amount, source, note
  -> normalizePrice() validates and normalizes (api/normalize-price.ts)
  -> createPriceProposal() writes to price_proposals table (src/db/pricing-operations.ts)
  -> Status: "pending"
  -> Badge on /review increments
```

### Supabase Operations

```typescript
// src/db/pricing-operations.ts
createPriceProposal({
  module_id: string,
  provider: string,
  proposed_amount: number,
  current_amount: number,
  source: string,
  evidence_url?: string,
  note?: string,
  submitted_by: string   // auth user ID
})
```

### AI Normalization

```typescript
// src/lib/ai-price-normalization.ts
normalizePrice({
  rawInput: string,       // "DIA rekent 3,50 voor rekenen"
  context: {
    existingPrices: PriceRecord[],
    moduleCatalog: ModuleDefinition[]
  }
}) -> {
  moduleId: string,       // matched module
  provider: string,       // matched provider key
  amount: number,         // normalized EUR amount
  confidence: number,     // 0-1
  warnings: string[]      // e.g. ">50% deviation"
}
```

The API endpoint `api/normalize-price.ts` wraps this function as a Vercel serverless function with auth headers.

---

## Channel 2: Document Upload

### Flow

```
User drops PDF/image in DocumentDropzone
  -> api/extract-document.ts extracts text
  -> AI parses text for price data
  -> DocumentExtractionPreview shows diff-view
  -> User confirms/edits each price point
  -> For each confirmed price: createPriceProposal()
  -> All proposals enter review queue
```

### Key Files

- `api/extract-document.ts` -- Serverless function for document text extraction
- `src/features/school-profile/components/DocumentExtractionPreview.tsx` -- Diff-view UI
- `src/db/pricing-operations.ts` -- `createPriceProposal()` for each confirmed price

---

## Channel 3: AI Text Extraction (Free-form)

### Flow

```
User pastes free-form text with pricing info
  -> normalizePrice() from src/lib/ai-price-normalization.ts
  -> AI matches: module-name -> moduleId, provider name -> provider key, amount -> EUR
  -> Structured result shown in diff-view
  -> User confirms
  -> createPriceProposal() for each data point
```

### Fuzzy Matching

The AI normalization uses MODULE_CATALOG_REFERENCE for fuzzy matching:
- "rekenen" -> "rekenwiskunde"
- "taal" / "begrijpend lezen" -> "nederlands"
- "capaciteiten" / "IQ" -> "cognitieve-capaciteiten"
- "sociaal" / "SEL" -> "sociaal-emotioneel"

Provider matching:
- "DIA" / "Boom" -> "dia"
- "JIJ!" / "Bureau ICE" / "IEP" -> "jij"
- "Cito" -> "cito"

---

## Channel 4: Discount Pattern Detection

### Flow

```
System scans all school_prices for a given provider
  -> detectDiscountPatterns() from src/engine/discount-patterns.ts
  -> Groups school-specific prices by provider + module
  -> If 3+ schools show similar discount: flag as market pattern
  -> Reports: "DIA biedt gemiddeld X% korting (gebaseerd op N scholen)"
  -> MarktKortingToggle in comparison view allows toggling
```

### Engine Function

```typescript
// src/engine/discount-patterns.ts
detectDiscountPatterns({
  schoolPrices: SchoolPrice[],       // all school-specific prices
  publicationPrices: PriceRecord[]   // reference publication prices
}) -> DiscountPattern[] {
  provider: string,
  moduleId: string,
  avgDiscountPct: number,
  schoolCount: number,
  confidence: 'high' | 'medium' | 'low',
  samples: { schoolId: string, amount: number, discountPct: number }[]
}
```

### Trigger Conditions

- After a price proposal is approved
- On demand via ops-competitor-intel skill
- Minimum 3 schools required for pattern detection
- Only flags discounts > 5% (noise filter)

---

## Channel 5: Admin Config Editor

### Flow

```
Manager navigates to /admin
  -> AdminConfigEditor loads pricing_configs from Supabase
  -> Forms render per config_type:
     - PlatformModulePricing (Cito): platform cost, module prices, bundles
     - PackageBundlePricing (DIA): packages with included modules
     - TieredLicensePricing (JIJ): tiers with license + per-test pricing
     - FlatPricing (SAQI): simple per-student price
  -> Manager edits config
  -> Validation ensures structure matches calculator expectations
  -> Save writes to pricing_configs table
  -> Audit log entry created
```

### Key Files

- `src/features/admin/AdminConfigEditor.tsx` -- Config editor UI
- `src/db/pricing-operations.ts` -- `updatePricingConfig()`, `getPricingConfigs()`

---

## Review Queue Lifecycle

### Status Transitions

```
pending  ──> approved  (manager action)
         ──> rejected  (manager action)
```

### Approval Flow

1. Manager opens `/review` (ReviewQueuePage)
2. Filters by: provider, module, status, date range
3. Each proposal shows:
   - Current price -> Proposed price (with diff)
   - Source and evidence
   - Submitter name
   - AI normalization confidence
4. Manager clicks Approve or Reject with optional note
5. On Approve:
   - `updateProposalStatus('approved')` in pricing-operations.ts
   - `updatePublicationPrice()` writes new price to publication_prices
   - Audit log entry created in price_audit_log
   - Badge count decrements
   - Engines auto-recalculate on next comparison view load

### Access Control

- All authenticated users can submit proposals (D-05)
- Only users with role 'manager' can approve/reject (D-06)
- Managers can self-approve their own proposals
- RLS policies enforce this at database level

---

## Staleness Detection

### Rules

- Publication prices older than 6 months trigger staleness warning
- `getPriceStatus()` from `src/models/pricing.ts` checks verifiedAt date
- Stale prices show warning badge in Products tab and comparison view
- Skill should proactively suggest refresh: "Prijzen DIA zijn 8 maanden oud"

### Resolution

1. Identify stale prices via pricing-operations query
2. Research current prices (see references/competitor-sources.md)
3. Submit updated prices via review queue
4. After approval, staleness warning resolves automatically

---

## Offline Behavior

### Zustand Store + localStorage Cache

The `pricing-data-store.ts` implements:
1. On app start: fetch publication_prices and pricing_configs from Supabase
2. Cache in Zustand store with persist middleware -> localStorage
3. If offline: use cached data + show OfflinePriceBanner
4. If online: auto-refresh on mount

### Proposal Submission When Offline

- Price proposals queue in the offline mutation queue (src/lib/offline-queue.ts)
- Sync when connection restores
- Server-wins conflict strategy (compare timestamps)

---

## Integration with Comparison Engine

### Data Flow

```
pricing-data-store (Supabase data)
  -> usePriceComparisonStore.initialize()
  -> reads pricing configs as parameter
  -> calculateComparison() uses configs instead of TS imports
  -> Results rendered in comparison view
```

### MarktKorting Toggle

When discount patterns exist:
1. MarktKortingToggle appears in comparison view
2. Toggle OFF: compare on publication prices (default)
3. Toggle ON: compare including detected market discounts
4. Engine receives adjusted prices via discount pattern data

---

## Audit Trail

Every mutation creates an entry in `price_audit_log`:

| Field | Content |
|-------|---------|
| entity_type | 'publication_price' / 'pricing_config' / 'price_proposal' |
| entity_id | UUID of the affected record |
| action | 'create' / 'update' / 'approve' / 'reject' |
| old_value | JSONB snapshot before change |
| new_value | JSONB snapshot after change |
| performed_by | auth user ID |
| created_at | timestamp |

This provides full traceability for all pricing changes.
