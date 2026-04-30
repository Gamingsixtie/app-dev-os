# Phase 9: AI Intake & Prijsbeheer - Research

**Researched:** 2026-03-22
**Domain:** AI-powered text extraction (Claude Haiku), document parsing (PDF/Excel/Word/CSV), SSE streaming, price management CRUD, diff-view UX
**Confidence:** HIGH

## Summary

Phase 9 extends the existing AI intake system (v1) and builds a full price management module. The v1 codebase already has SSE streaming from a Vercel serverless function (`api/ai-intake.ts`) with Zod-based extraction via Claude Haiku 4.5. The extension involves: (1) expanding the extraction schema with contacts, action items, pipeline signals; (2) building a diff-view confirmation UI; (3) implementing SchoolPriceEntry CRUD with active selection and history; (4) adding document upload with server-side parsing and AI price extraction.

The Supabase `school_prices` table already exists with the correct schema (from Phase 8). React Query hooks follow an established pattern (`useActions.ts`, `useContacts.ts`, `useConversations.ts`). Document parsing requires three server-side libraries: pdf-parse (PDF), xlsx/SheetJS (Excel), and mammoth (Word). File uploads go to Supabase Storage first, then a serverless function downloads and processes them -- this avoids Vercel's 4.5MB body size limit.

**Primary recommendation:** Extend the existing `api/ai-intake.ts` serverless function with an expanded schema, create a new `api/extract-document.ts` endpoint for document processing, and build the price management UI using the same React Query + Supabase pattern established in Phase 8.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Intake zit in de Gesprekken-tab van het schoolprofiel. "Nieuw gesprek" formulier heeft twee modi: [Handmatig] en [AI-intake]. AI-modus = vrije tekst die gestructureerd wordt.
- **D-02:** Real-time streaming -- resultaten verschijnen progressief terwijl de AI analyseert. Gebruiker ziet velden invullen. Streaming via SSE vanuit Vercel serverless function.
- **D-03:** Diff-view bevestigingsscherm -- per geextraheerd item toont het scherm wat er al bestaat en wat nieuw is. Gebruiker vinkt per item aan wat overgenomen wordt. Bestaande data blijft default bewaard.
- **D-04:** Volledige extractie-scope: niveaus, leerlingaantallen, modules + aanbieders + prijzen, contactpersonen (naam, rol, DMU), actiepunten (wat, wanneer), pipeline-signalen (interesse, twijfel, concurrent-switch), unsureAbout verificatiepunten.
- **D-05:** Intake voegt toe (append) aan bestaand schoolprofiel -- overschrijft nooit.
- **D-06:** Uitgebreid extractie-schema vervangt het v1 IntakeExtractionSchema.
- **D-07:** Prijsbeheer-UI in de Producten-tab met inline editing. Klik op een prijs -> bewerk modal.
- **D-08:** Prijsgeschiedenis per module/aanbieder -- meerdere prijsentries mogelijk. Accountmanager selecteert welke prijs actief is via radiobutton + verplicht redenveld.
- **D-09:** SchoolPriceEntry model (already defined in `src/db/types.ts` and `school_prices` Supabase table).
- **D-10:** Bruto/netto onderscheid via price_type: 'publication' = bruto, 'agreed' = optioneel kortingspercentage.
- **D-11:** "Reset naar publicatie" optie per module/aanbieder.
- **D-12:** Publicatieprijzen (DEFAULT_PRICES) altijd zichtbaar als referentie.
- **D-13:** Ondersteunde formaten: PDF, Excel (.xlsx/.xls), Word (.docx), platte tekst/CSV.
- **D-14:** Verwerking via Vercel serverless function: bestand naar Supabase Storage, serverless function leest en parseert (pdf-parse, SheetJS, mammoth), tekst naar Claude Haiku.
- **D-15:** Upload-knop in Producten-tab naast "+ Prijs toevoegen". Drag & drop zone.
- **D-16:** Geextraheerde prijzen in diff-view -- per prijs aanvinken. Nooit automatisch doorgevoerd.
- **D-17:** Validatie tegen publicatieprijzen: >50% afwijking = waarschuwing. Geen publicatieprijs = "handmatige invoer" zonder waarschuwing.
- **D-18:** Inline waarschuwing, niet blokkerend -- gele waarschuwingsbadge met tooltip.
- **D-19:** Prijsstatus-indicatoren: Geverifieerd, Handmatig, Mogelijk verouderd, Onbekend.

### Claude's Discretion
- Exacte streaming-UI implementatie (progressieve veld-invulling)
- Diff-view component design en UX
- Document upload UX (drag & drop, voortgangsbalk)
- Extractie-schema details en system prompts
- Error handling bij mislukte extractie of onleesbare documenten
- Producten-tab layout uitbreiding voor prijsbeheer

### Deferred Ideas (OUT OF SCOPE)
- Automatische prijsupdates via web-scraping agent -- FUTURE-01
- Incrementele intake (auto-analyse bij pauze) -- te complex
- Cross-school prijsvergelijking -- backlog
- Bulk-import van prijzen voor meerdere scholen tegelijk -- backlog
- Slimme suggesties ("DIA biedt pakketkorting bij 3+ modules") -- Phase 10

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INTAKE-01 | Vrije tekst invoeren die real-time (streaming) wordt gestructureerd | Extend existing `api/ai-intake.ts` SSE endpoint + `streamIntakeFromNotes()` generator; expand Zod schema |
| INTAKE-02 | AI extraheert modulegebruik, aanbieders, prijzen en contactpersonen met fuzzy matching | Extended IntakeExtractionSchema with contactPersonen[], actiePunten[], pipelineSignaal; fuzzy matching in system prompt |
| INTAKE-03 | Bevestigingsscherm waar gebruiker kan corrigeren | New DiffView component comparing extracted data vs existing school profile data |
| INTAKE-04 | Prijzen semantisch gevalideerd tegen bekende ranges | PriceDeviationWarning component using DEFAULT_PRICES as reference; >50% threshold |
| INTAKE-05 | AI intake voegt toe (append) -- overschrijft niet | Append-only logic in save handler; diff-view shows existing as read-only reference |
| PRIJSMGT-01 | Handmatig invoeren of bijwerken met bron, verificatiedatum en vertrouwensniveau | PriceEditModal with react-hook-form + Zod; CRUD via Supabase school_prices table |
| PRIJSMGT-02 | Prijzen ouder dan 6 maanden gemarkeerd als "mogelijk verouderd" | Extend existing getPriceStatus() + isPriceStale() logic to SchoolPriceEntry |
| PRIJSMGT-03 | Prijsdocumenten uploaden voor AI-gestuurde prijsextractie | New `api/extract-document.ts` endpoint; pdf-parse + SheetJS + mammoth server-side |
| PRIJSMGT-04 | Geextraheerde prijzen ter goedkeuring -- nooit automatisch doorgevoerd | DocumentExtractionPreview using DiffView pattern with per-price checkboxes |

</phase_requirements>

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | ^0.80.0 | Claude Haiku 4.5 API calls | Already in use for v1 AI intake |
| `@supabase/supabase-js` | ^2.99.3 | Database + Storage client | Already in use for all data operations |
| `@tanstack/react-query` | ^5.94.5 | Server state management | Already in use for all Supabase hooks |
| `react-hook-form` | ^7.71.2 | Form management | Already in use for all forms |
| `@hookform/resolvers` | ^5.2.2 | Zod resolver for react-hook-form | Already in use |
| `zod` | ^4.3.6 | Schema validation | Already in use for form + extraction schemas |

### New Dependencies (server-side only, for Vercel serverless functions)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `pdf-parse` | 2.4.5 | Extract text from PDF files | In `api/extract-document.ts` serverless function |
| `xlsx` | 0.18.5 | Parse Excel (.xlsx/.xls) files | In `api/extract-document.ts` serverless function |
| `mammoth` | 1.12.0 | Extract text from Word (.docx) files | In `api/extract-document.ts` serverless function |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `pdf-parse` | `unpdf` | unpdf is pure JS with zero native deps, better for edge; pdf-parse is more established but has native dep (pdfjs). Both work in Vercel serverless. |
| `xlsx` (SheetJS) | `exceljs` | exceljs has streaming support for large files but is heavier; xlsx/SheetJS is lighter and sufficient for price lists |
| Direct file upload to API | Supabase Storage + presigned URL | Supabase Storage avoids Vercel's 4.5MB body size limit; required for larger documents |

**Installation (server-side deps):**
```bash
npm install pdf-parse xlsx mammoth
```

**Note:** These libraries run in Vercel serverless functions only (`api/` directory), not in the browser bundle. They should be excluded from the Vite client build.

## Architecture Patterns

### Recommended Project Structure
```
api/
  ai-intake.ts              # Extended: expanded schema, same SSE pattern
  extract-document.ts       # NEW: document upload processing endpoint
  __tests__/
    ai-intake.test.ts       # Existing tests
    extract-document.test.ts # NEW
src/
  features/school-profile/
    components/
      IntakeModeToggle.tsx   # NEW: Handmatig / AI-intake segmented control
      StreamingExtraction.tsx # NEW: Progressive field display during SSE
      DiffView.tsx           # NEW: Checkbox-driven confirmation screen
      DiffViewSection.tsx    # NEW: Collapsible section within DiffView
      DiffViewItem.tsx       # NEW: Single row with checkbox + values
      PriceManager.tsx       # NEW: Price list per module with history
      PriceEditModal.tsx     # NEW: Modal form for SchoolPriceEntry
      PriceHistoryList.tsx   # NEW: Chronological price entries
      DocumentDropzone.tsx   # NEW: Drag-and-drop file upload zone
      DocumentExtractionPreview.tsx # NEW: Extracted prices in DiffView format
    schemas/
      price-entry.schema.ts  # NEW: Zod schema for PriceEditModal
      intake-extraction.schema.ts # NEW: Extended extraction schema (v2)
    tabs/
      ConversationsTab.tsx   # EXTEND: AI-intake mode integration
      ProductsTab.tsx        # EXTEND: Price management + document upload
  hooks/
    useSchoolPrices.ts       # NEW: React Query hooks for school_prices table
  components/ui/
    PriceBadge.tsx           # EXTEND: Add 'unknown' status variant
    PriceDeviationWarning.tsx # NEW: Inline amber warning badge
  lib/
    ai-intake.ts             # EXTEND: New schema, updated streaming
    document-parser.ts       # NEW: Client-side upload orchestration
```

### Pattern 1: React Query CRUD Hook (established pattern)
**What:** Each Supabase table gets a dedicated hook file with useQuery + useMutation
**When to use:** All school_prices operations
**Example:**
```typescript
// Source: Existing pattern from src/hooks/useActions.ts
export function useSchoolPrices(schoolId: string) {
  return useQuery({
    queryKey: ['school-prices', schoolId],
    queryFn: async (): Promise<SchoolPriceEntry[]> => {
      const { data, error } = await supabase
        .from('school_prices')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapPriceRow);
    },
    enabled: !!schoolId,
  });
}
```

### Pattern 2: SSE Streaming from Serverless Function (established pattern)
**What:** Vercel serverless function streams Claude responses as SSE events; client reads via ReadableStream
**When to use:** AI intake extraction, document extraction
**Example:**
```typescript
// Source: Existing pattern from api/ai-intake.ts + src/lib/ai-intake.ts
// Server: anthropic.messages.stream() -> SSE events via ReadableStream
// Client: streamIntakeFromNotes() async generator yields text chunks
// Final: accumulate full text -> JSON.parse -> Zod schema.parse()
```

### Pattern 3: Supabase Storage Upload (new pattern)
**What:** Client uploads file directly to Supabase Storage bucket, then passes file path to serverless function for processing
**When to use:** Document upload for price extraction
**Example:**
```typescript
// Client-side upload to Supabase Storage
const { data, error } = await supabase.storage
  .from('documents')
  .upload(`${schoolId}/${file.name}`, file, {
    cacheControl: '3600',
    upsert: false,
  });

// Then call serverless function with the storage path
const response = await fetch('/api/extract-document', {
  method: 'POST',
  headers: await getAuthHeaders(),
  body: JSON.stringify({ storagePath: data.path, fileName: file.name }),
});
```

### Pattern 4: Active Price Selection with Mutual Exclusion
**What:** Only one SchoolPriceEntry per module/provider combination can have is_active=true. Selecting a new active price deactivates the previous one.
**When to use:** Price activation in PriceManager
**Example:**
```typescript
// In operations.ts or useSchoolPrices.ts mutation
async function activatePrice(schoolId: string, priceId: string, reason: string) {
  const price = await getPrice(priceId);
  // Deactivate all prices for same module/provider
  await supabase
    .from('school_prices')
    .update({ is_active: false })
    .eq('school_id', schoolId)
    .eq('module_id', price.module_id)
    .eq('provider', price.provider);
  // Activate the selected one
  await supabase
    .from('school_prices')
    .update({
      is_active: true,
      activation_reason: reason,
      activated_at: new Date().toISOString(),
    })
    .eq('id', priceId);
}
```

### Anti-Patterns to Avoid
- **Sending file bytes through the API endpoint:** Use Supabase Storage for file upload, then pass the storage path to the serverless function. Vercel has a 4.5MB body size limit on serverless functions.
- **Overwriting school data on intake save:** Always append. Diff-view items that conflict with existing data must be opt-in only.
- **Auto-saving extracted data:** Per D-16, extracted data (both intake and document) MUST go through the diff-view confirmation step first.
- **Client-side document parsing:** PDF/Excel/Word parsing must happen server-side in the Vercel serverless function. The libraries are not suitable for browser bundles (size, node dependencies).
- **Using Zustand for price state:** Follow the Phase 8 pattern -- Supabase + React Query for all persisted data. Zustand is only for client-side view state (e.g., which modal is open).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF text extraction | Custom PDF parser | `pdf-parse` (npm) | PDF format is complex; handles encoding, encryption, multi-page |
| Excel parsing | Custom XLSX reader | `xlsx` (SheetJS) | Excel format has multiple specs (.xls vs .xlsx), cell types, merged cells |
| Word text extraction | Custom DOCX reader | `mammoth` (npm) | DOCX is a ZIP of XML files; mammoth handles the complex structure |
| File drag-and-drop | Custom drag handlers | HTML5 native drag-and-drop events | `onDragOver`, `onDrop` with `e.dataTransfer.files` is sufficient; no library needed |
| Price staleness detection | Custom date math | Existing `isPriceStale()` from `src/lib/date-utils.ts` | Already tested and used by PriceBadge |
| SSE stream parsing | Custom SSE parser | Existing `parseSSEChunk()` from `src/lib/ai-intake.ts` | Already handles content_block_delta, error, message_stop events |

**Key insight:** The document parsing problem is deceptively complex -- each format has dozens of edge cases (encrypted PDFs, password-protected Excel files, malformed DOCX). Using established libraries saves weeks of debugging. The AI then handles the semantic extraction from the plain text.

## Common Pitfalls

### Pitfall 1: Vercel Serverless Function Body Size Limit
**What goes wrong:** Uploading large PDFs or Excel files directly to the API endpoint fails with a 413 error.
**Why it happens:** Vercel serverless functions have a hard 4.5MB body size limit.
**How to avoid:** Upload files to Supabase Storage first (client-side), then pass the storage path to the serverless function. The function downloads the file from storage (server-to-server, no size limit).
**Warning signs:** 413 Payload Too Large errors in production.

### Pitfall 2: Streaming JSON Parse Failure
**What goes wrong:** The accumulated SSE text from Claude doesn't parse as valid JSON, or Zod validation fails.
**Why it happens:** Claude may produce partial JSON, add markdown code fences, or deviate from the schema.
**How to avoid:** Use `anthropic.messages.stream()` with explicit JSON instructions in the system prompt. Strip markdown fences before parsing. Wrap `JSON.parse` + `schema.parse` in try-catch with user-friendly error messages.
**Warning signs:** Intermittent "Onverwacht leeg AI-antwoord" or Zod validation errors.

### Pitfall 3: Race Condition in Active Price Selection
**What goes wrong:** Two rapid clicks on different radio buttons could both deactivate and leave no active price.
**Why it happens:** The deactivate-then-activate is not atomic.
**How to avoid:** Use a Supabase RPC function or wrap in a transaction. Alternatively, use optimistic UI with React Query's `useMutation` and `onMutate` to prevent double-clicks.
**Warning signs:** Module/provider with zero active prices.

### Pitfall 4: pdf-parse Native Dependencies in Vercel
**What goes wrong:** pdf-parse fails to load in the Vercel serverless function with native module errors.
**Why it happens:** pdf-parse v2 has `pdfjs-dist` which may require canvas polyfills.
**How to avoid:** Import `pdf-parse/worker` before `pdf-parse`. Alternatively, use `unpdf` which is pure JavaScript with zero native dependencies. Test the serverless function deployment before building the full UI.
**Warning signs:** Build errors or runtime crashes mentioning `canvas` or `DOMMatrix`.

### Pitfall 5: Diff-View Data Mismatch
**What goes wrong:** Extracted modules or contacts don't match existing records, so the diff can't determine "new" vs "existing."
**Why it happens:** AI extraction uses free-text module names; existing data uses module IDs like `rekenwiskunde`.
**How to avoid:** The system prompt already maps names to IDs (existing pattern). For contacts, use fuzzy name matching. For modules, normalize via the MODULE_IDS constant.
**Warning signs:** All items showing as "new" even when they exist in the profile.

### Pitfall 6: Supabase Storage Bucket Not Created
**What goes wrong:** File uploads fail because the `documents` bucket doesn't exist.
**Why it happens:** Supabase Storage buckets must be created explicitly (via dashboard or migration).
**How to avoid:** Create the `documents` bucket in Supabase dashboard or via SQL migration before implementing upload. Set appropriate RLS policies (authenticated users can upload to their school's folder).
**Warning signs:** "Bucket not found" errors on first upload attempt.

## Code Examples

### Extended Extraction Schema (v2)
```typescript
// Source: Extending existing src/lib/ai-intake.ts IntakeExtractionSchema
export const IntakeExtractionSchemaV2 = z.object({
  // Existing fields (from v1)
  levels: z.array(z.enum(SCHOOL_LEVELS)),
  studentCountsPerLevel: z.record(z.string(), z.number()).nullable(),
  selectedModules: z.array(z.enum(MODULE_IDS)),
  moduleSetups: z.array(z.object({
    moduleId: z.enum(MODULE_IDS),
    currentProvider: z.enum(PROVIDERS),
    pricePerStudent: z.number().nullable(),
    customProviderName: z.string().optional(),
  })),
  unsureAbout: z.array(z.string()),

  // NEW fields for v2
  contactPersonen: z.array(z.object({
    naam: z.string(),
    rol: z.string().optional(),
    dmuPositie: z.enum(['coordinator', 'mt', 'finance', 'it', 'onbekend']).optional(),
    email: z.string().optional(),
    telefoon: z.string().optional(),
  })),
  actiePunten: z.array(z.object({
    wat: z.string(),
    wanneer: z.string().optional(),
    verantwoordelijke: z.string().optional(),
  })),
  pipelineSignaal: z.enum([
    'interesse', 'twijfel', 'afwijzing', 'concurrent-switch',
    'verlenging', 'neutraal',
  ]).optional(),
});
```

### Price Deviation Check
```typescript
// Source: Based on existing getPriceStatus() pattern in src/models/pricing.ts
import { DEFAULT_PRICES } from '@/data/default-prices';

export function checkPriceDeviation(
  moduleId: string,
  provider: string,
  amount: number,
): { hasDeviation: boolean; publicationPrice: number | null; percentDiff: number } {
  const pubPrice = DEFAULT_PRICES.find(
    (p) => p.moduleId === moduleId && p.provider === provider,
  );
  if (!pubPrice) {
    return { hasDeviation: false, publicationPrice: null, percentDiff: 0 };
  }
  const percentDiff = Math.abs(amount - pubPrice.amountPerStudent) / pubPrice.amountPerStudent;
  return {
    hasDeviation: percentDiff > 0.5,
    publicationPrice: pubPrice.amountPerStudent,
    percentDiff,
  };
}
```

### Document Upload + Extraction Flow
```typescript
// Source: Architecture pattern combining Supabase Storage + Vercel serverless
async function uploadAndExtract(
  schoolId: string,
  file: File,
): Promise<ExtractedPrice[]> {
  // 1. Upload to Supabase Storage
  const path = `${schoolId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(path, file);
  if (uploadError) throw new Error('Upload mislukt');

  // 2. Call serverless function to parse + extract
  const headers = await getAuthHeaders();
  const response = await fetch('/api/extract-document', {
    method: 'POST',
    headers,
    body: JSON.stringify({ storagePath: path, fileName: file.name }),
  });
  if (!response.ok) throw new Error('Extractie mislukt');

  return response.json();
}
```

### Serverless Document Parser (api/extract-document.ts)
```typescript
// Server-side: download from storage, parse based on mime type, extract via Claude
import pdfParse from 'pdf-parse';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

async function extractTextFromFile(buffer: Buffer, fileName: string): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'pdf': {
      const result = await pdfParse(buffer);
      return result.text;
    }
    case 'xlsx':
    case 'xls': {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      return workbook.SheetNames
        .map(name => XLSX.utils.sheet_to_csv(workbook.Sheets[name]))
        .join('\n\n');
    }
    case 'docx': {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case 'csv':
    case 'txt':
      return buffer.toString('utf-8');
    default:
      throw new Error(`Niet-ondersteund bestandsformaat: .${ext}`);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Browser-side Anthropic SDK calls | Vercel serverless proxy (Phase 8) | Phase 8 (2026-03) | API key no longer exposed; SSE streaming maintained |
| Single IntakeExtractionSchema | Extended v2 schema with contacts, actions, pipeline | Phase 9 (this phase) | Richer extraction from same conversation text |
| appliedOverrides[] on SchoolRecord | school_prices table with history + active selection | Phase 8 schema (2026-03) | Multiple prices per module, audit trail, activation reasons |
| Dexie/IndexedDB | Supabase Postgres | Phase 8 (2026-03) | Multi-user, RLS, relational data |

**Deprecated/outdated:**
- `VITE_ANTHROPIC_API_KEY` env var: replaced by server-side `ANTHROPIC_API_KEY`
- `appliedOverrides` on SchoolRecord: still in type definition but mapped to empty array, replaced by school_prices table
- Browser-side `@anthropic-ai/sdk` usage: all calls now go through `/api/` proxy

## Open Questions

1. **pdf-parse vs unpdf for Vercel serverless**
   - What we know: pdf-parse v2 claims Vercel support but has canvas dependency concerns; unpdf is pure JS
   - What's unclear: Whether pdf-parse actually works out-of-the-box on Vercel without extra config
   - Recommendation: Start with pdf-parse (more established); if native dependency issues arise, swap to unpdf

2. **Supabase Storage bucket and RLS configuration**
   - What we know: A `documents` bucket needs to exist with appropriate policies
   - What's unclear: Whether Phase 8 already created this bucket or if it needs to be created in Phase 9
   - Recommendation: Create bucket + RLS policies as a Wave 0 / setup task

3. **Transaction safety for active price switching**
   - What we know: The deactivate-old + activate-new pattern needs atomicity
   - What's unclear: Whether Supabase JS client supports transactions or if an RPC function is needed
   - Recommendation: Use a Supabase RPC function (`activate_school_price`) for atomic switching

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTAKE-01 | Streaming extraction parses SSE and returns structured data | unit | `npx vitest run src/lib/__tests__/ai-intake-v2.test.ts -x` | No - Wave 0 |
| INTAKE-02 | Extended schema validates contacts, actions, pipeline fields | unit | `npx vitest run src/features/school-profile/schemas/__tests__/intake-extraction.test.ts -x` | No - Wave 0 |
| INTAKE-03 | Diff-view computes new/existing/conflict items correctly | unit | `npx vitest run src/features/school-profile/__tests__/diff-view-logic.test.ts -x` | No - Wave 0 |
| INTAKE-04 | Price deviation detection against publication prices | unit | `npx vitest run src/models/__tests__/price-deviation.test.ts -x` | No - Wave 0 |
| INTAKE-05 | Append logic merges without overwriting existing data | unit | `npx vitest run src/features/school-profile/__tests__/intake-merge.test.ts -x` | No - Wave 0 |
| PRIJSMGT-01 | SchoolPriceEntry CRUD operations (create, update, activate) | unit | `npx vitest run src/hooks/__tests__/useSchoolPrices.test.ts -x` | No - Wave 0 |
| PRIJSMGT-02 | Staleness detection flags prices older than 6 months | unit | `npx vitest run src/models/__tests__/pricing.test.ts -x` | Yes (existing, extend) |
| PRIJSMGT-03 | Document text extraction from PDF/Excel/Word/CSV | unit | `npx vitest run api/__tests__/extract-document.test.ts -x` | No - Wave 0 |
| PRIJSMGT-04 | Extracted prices shown in diff-view with checkbox selection | unit | `npx vitest run src/features/school-profile/__tests__/document-extraction.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/ai-intake-v2.test.ts` -- covers INTAKE-01 (extended SSE streaming + schema)
- [ ] `src/features/school-profile/schemas/__tests__/intake-extraction.test.ts` -- covers INTAKE-02 (v2 schema validation)
- [ ] `src/features/school-profile/__tests__/diff-view-logic.test.ts` -- covers INTAKE-03 (diff computation logic)
- [ ] `src/models/__tests__/price-deviation.test.ts` -- covers INTAKE-04 (deviation detection)
- [ ] `src/features/school-profile/__tests__/intake-merge.test.ts` -- covers INTAKE-05 (append-only merge)
- [ ] `src/hooks/__tests__/useSchoolPrices.test.ts` -- covers PRIJSMGT-01 (price CRUD)
- [ ] `api/__tests__/extract-document.test.ts` -- covers PRIJSMGT-03 (document parsing)
- [ ] `src/features/school-profile/__tests__/document-extraction.test.ts` -- covers PRIJSMGT-04 (extraction preview)
- [ ] Framework install: none needed -- Vitest already configured and working

## Sources

### Primary (HIGH confidence)
- Existing codebase: `api/ai-intake.ts`, `src/lib/ai-intake.ts`, `src/db/types.ts`, `src/models/pricing.ts` -- direct code review
- Existing codebase: `src/hooks/useActions.ts` -- React Query + Supabase hook pattern
- Existing codebase: `src/lib/supabase/types.ts` -- school_prices table schema verified
- Phase 8 CONTEXT.md: Supabase schema decisions, serverless function architecture
- Phase 9 CONTEXT.md: All locked decisions and implementation constraints
- Phase 9 UI-SPEC.md: Component inventory, layout rules, interaction patterns, copywriting

### Secondary (MEDIUM confidence)
- [Vercel serverless body size limit bypass via Supabase Storage](https://medium.com/@jpnreddy25/how-to-bypass-vercels-4-5mb-body-size-limit-for-serverless-functions-using-supabase-09610d8ca387)
- [pdf-parse npm package](https://www.npmjs.com/package/pdf-parse) -- v2.4.5
- [mammoth npm package](https://www.npmjs.com/package/mammoth) -- v1.12.0
- [SheetJS xlsx npm package](https://www.npmjs.com/package/xlsx) -- v0.18.5
- [Process PDFs on Vercel serverless guide](https://www.buildwithmatija.com/blog/process-pdfs-on-vercel-serverless-guide)

### Tertiary (LOW confidence)
- [unpdf as alternative to pdf-parse for Vercel](https://dev.to/chudi_nnorukam/serverless-pdf-processing-why-unpdf-beats-pdf-parse-2jji) -- single source recommendation, needs validation if pdf-parse fails

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all core libraries already installed and in use; new server-side libs are well-established npm packages with verified versions
- Architecture: HIGH - all patterns extend established codebase patterns (React Query hooks, SSE streaming, Supabase CRUD)
- Pitfalls: HIGH - body size limit is well-documented; streaming JSON parse issues observed in existing codebase; pdf-parse native deps documented by multiple sources

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable domain, established libraries)
