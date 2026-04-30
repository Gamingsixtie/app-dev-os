# Phase 14: Schoolplan Upload & Kansen-analyse - Research

**Researched:** 2026-03-23
**Domain:** Document upload + AI analysis pipeline + Supabase persistence + React UI
**Confidence:** HIGH

## Summary

Phase 14 adds a "Schoolplan" tab to the school profile where an accountmanager can upload a school plan document (PDF/Word/TXT). The document is analyzed by AI in two steps: (1) summarize key themes/goals, (2) match themes against the Cito module catalog and competitor differentiators to produce concrete sales opportunities ("kansen"). Results are stored in Supabase and displayed as interactive cards with annotations.

The project already has well-established patterns for every building block: `DocumentDropzone` for file upload, `document-parser.ts` for Supabase Storage upload + serverless extraction, `StreamingExtraction` for progress feedback, `UpsellCard` for opportunity display, `EditableField` for inline editing, and `@anthropic-ai/sdk` + Zod for structured AI output. The new work is (a) a new Supabase table for schoolplan analyses, (b) a new serverless function for two-step AI analysis, (c) a model-abstraction layer, and (d) a new tab with kans-kaart UI.

**Primary recommendation:** Reuse existing document upload and AI extraction patterns almost verbatim. The main new complexity is the two-step AI pipeline (summarize then match) and the model-abstraction layer. Keep the serverless function as a single endpoint that runs both steps sequentially.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Nieuwe 7e tab "Schoolplan" in het schoolprofiel (naast Overzicht, Vergelijking, Producten, Contacten, Gesprekken, Waarde)
- **D-02:** Kansen worden getoond als individuele kaarten (vergelijkbaar met UpsellCard-patroon)
- **D-03:** Elke kans-kaart bevat: schoolplan-thema, gekoppeld Cito-product, toelichting waarom relevant, gesprekstip, relevantie-score (hoog/midden/laag), citaat uit schoolplan, en concurrentie-kwetsbaarheid (indien van toepassing)
- **D-04:** Bovenaan de tab een korte AI-samenvatting (2-3 zinnen): waar het schoolplan op focust, hoeveel kansen er zijn, en de belangrijkste thema's
- **D-05:** Accountmanager kan kansen markeren als 'besproken'/'niet relevant' en een korte notitie toevoegen per kans
- **D-06:** Een schoolplan per school -- nieuw uploaden vervangt het vorige (geen versiehistorie)
- **D-07:** Upload via DocumentDropzone-patroon bovenaan de tab. Na upload verdwijnt de dropzone en verschijnt een 'Vervang schoolplan' knop met document-metadata (bestandsnaam, uploaddatum, aantal pagina's)
- **D-08:** AI-analyse start direct na upload met streaming feedback (hergebruik StreamingExtraction-patroon). Geen extra bevestigingsstap
- **D-09:** Vrije AI-analyse -- Claude leest het schoolplan en matcht vrij op basis van inhoudelijk begrip met de Cito-modulecatalogus. Geen vaste taxonomie
- **D-10:** Per kans: specifiek Cito-product (bijv. 'Cito Volgsysteem VO') + waarom het aansluit bij het schoolplan + gesprekstip voor de accountmanager
- **D-11:** 3-niveau relevantie-score (hoog/midden/laag) per kans. Kaarten worden gesorteerd op score (hoog eerst)
- **D-12:** Aparte sectie 'Mogelijk ook relevant' onder de schoolplan-kansen, voor kansen die NIET in het schoolplan staan maar wel relevant kunnen zijn op basis van schooltype en huidig productgebruik
- **D-13:** AI combineert schoolplan-wensen met bekende productbeperkingen van DIA/JIJ (uit bestaande differentiators-data) om kwetsbaarheden te signaleren
- **D-14:** Concurrentie-signalen zijn geintegreerd op de kans-kaart (niet apart). Elke kaart bevat een concurrentie-sectie als die er is
- **D-15:** Twee-stappen AI-verwerking: Stap 1: samenvatting van hele document naar kernthema's en doelen. Stap 2: matching van thema's met Cito-producten en concurrentie-analyse
- **D-16:** Ondersteunde formaten: PDF, Word (.docx), platte tekst (.txt)
- **D-17:** AI-model: Claude Sonnet als standaard, maar met model-abstractie (configureerbaar) zodat later makkelijk gewisseld kan worden
- **D-18:** Na upload wordt alleen metadata getoond (bestandsnaam, uploaddatum, pagina's). Origineel document in Supabase Storage als backup

### Claude's Discretion
- Exacte Zod-schema voor de gestructureerde AI-output (thema's, kansen, scores)
- Technische implementatie van de twee-stappen analyse pipeline
- Model-abstractie architectuur (hoe configureerbaar te maken)
- Hoe om te gaan met documenten die geen schoolplan blijken te zijn (foutafhandeling)
- Paginering/layout van kansen bij veel resultaten

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | ^0.80.0 | AI analysis via Claude API | Already used for AI intake; Zod structured output support |
| `@supabase/supabase-js` | ^2.99.3 | Database + Storage | Already used for all data persistence |
| `@tanstack/react-query` | ^5.94.5 | Server state management | Already used for all Supabase data fetching |
| `@tanstack/react-router` | ^1.168.1 | Tab routing | Already used for all school profile tabs |
| `zod` | ^4.3.6 | Schema validation for AI output | Already used for all structured data |
| `mammoth` | ^1.12.0 | Word (.docx) text extraction | Already used in extract-document serverless function |
| `pdf-parse` | ^2.4.5 | PDF text extraction | Already used in extract-document serverless function |
| `react-hook-form` | ^7.71.2 | Form handling (annotation forms) | Project standard for all forms |

### No New Dependencies Required

All required libraries are already installed. The existing `extract-document.ts` serverless function already handles PDF, Word, and TXT parsing. The new serverless function for schoolplan analysis reuses the same document parsing stack.

## Architecture Patterns

### Recommended Project Structure
```
src/
  features/school-profile/
    tabs/
      SchoolplanTab.tsx              # New 7th tab component
    components/
      SchoolplanUpload.tsx           # Upload + replace UI (wraps DocumentDropzone)
      SchoolplanSummary.tsx          # AI summary display (2-3 sentences)
      KansCard.tsx                   # Individual opportunity card
      KansCardList.tsx               # List of cards with sorting + sections
      SchoolplanStreamingProgress.tsx # Two-step streaming progress display
    schemas/
      schoolplan-analysis.schema.ts  # Zod schema for AI structured output
  lib/
    schoolplan-analyzer.ts           # Client-side: upload + call serverless + parse response
    ai-model-config.ts               # Model abstraction layer (configurable model selection)
  hooks/
    useSchoolplanAnalysis.ts         # React Query hook for Supabase schoolplan data
api/
  analyze-schoolplan.ts              # Serverless: two-step AI analysis pipeline
supabase/migrations/
  004_schoolplan_analyses.sql        # New table for schoolplan analysis results
```

### Pattern 1: Serverless Two-Step AI Pipeline
**What:** Single serverless endpoint that runs two sequential AI calls: (1) document summarization, (2) opportunity matching with Cito catalog + competitor differentiators
**When to use:** For the schoolplan analysis -- document text is too large to send to the client, and two AI steps must run server-side
**Example:**
```typescript
// api/analyze-schoolplan.ts (serverless function)
// Step 1: Summarize document into themes
const summaryResponse = await ai.messages.create({
  model: getModel(), // model abstraction
  max_tokens: 2048,
  system: SUMMARIZE_PROMPT,
  messages: [{ role: 'user', content: documentText.slice(0, 30000) }],
});

// Step 2: Match themes with Cito catalog + competitor analysis
const analysisResponse = await ai.messages.create({
  model: getModel(),
  max_tokens: 4096,
  system: MATCHING_PROMPT,
  messages: [{
    role: 'user',
    content: JSON.stringify({
      summary: summaryResult,
      moduleCatalog: MODULE_CATALOG,
      differentiators: MODULE_DIFFERENTIATORS,
      schoolContext: { levels, selectedModules, moduleSetups },
    }),
  }],
});
```

### Pattern 2: Model Abstraction Layer
**What:** Configurable AI model selection via environment variable, with typed model config
**When to use:** D-17 requires model abstraction for future provider switching
**Example:**
```typescript
// src/lib/ai-model-config.ts
export interface ModelConfig {
  provider: 'anthropic';
  model: string;
  maxTokens: number;
}

export function getModelConfig(): ModelConfig {
  return {
    provider: 'anthropic',
    model: process.env.SCHOOLPLAN_AI_MODEL || 'claude-sonnet-4-20250514',
    maxTokens: 4096,
  };
}
```

### Pattern 3: SSE Streaming for Two-Step Progress
**What:** Stream progress updates for both analysis steps using existing SSE pattern from ai-intake
**When to use:** D-08 requires streaming feedback during analysis
**Example:**
```typescript
// Serverless function streams events:
// { type: 'step', step: 1, label: 'Document wordt samengevat...' }
// { type: 'step', step: 2, label: 'Kansen worden geidentificeerd...' }
// { type: 'result', data: { summary: ..., opportunities: [...] } }
```

### Pattern 4: Supabase Table for Schoolplan Data
**What:** New `schoolplan_analyses` table storing analysis results per school (one-to-one)
**When to use:** D-06 says one schoolplan per school, replace on re-upload
**Example:**
```sql
CREATE TABLE schoolplan_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,        -- Supabase Storage path
  page_count INTEGER,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary TEXT NOT NULL DEFAULT '',
  themes JSONB NOT NULL DEFAULT '[]',
  opportunities JSONB NOT NULL DEFAULT '[]',  -- Array of KansResult
  also_relevant JSONB NOT NULL DEFAULT '[]',  -- "Mogelijk ook relevant" items
  analysis_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (analysis_status IN ('pending', 'analyzing', 'complete', 'failed')),
  error_message TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Pattern 5: Opportunity Annotations (Kans Status)
**What:** Separate table or JSONB field for per-kans annotations (besproken/niet-relevant/notitie)
**When to use:** D-05 requires accountmanager annotations per opportunity
**Recommendation:** Use a JSONB column `opportunity_annotations` on the `schoolplan_analyses` table, keyed by opportunity index. This avoids a separate table for what is essentially metadata on the analysis result.
```typescript
// Type for annotations stored in JSONB
interface OpportunityAnnotation {
  status: 'open' | 'besproken' | 'niet-relevant';
  note: string;
  updatedAt: string;
  updatedBy: string;
}
// Stored as: { "0": { status: "besproken", note: "..." }, "3": { ... } }
```

### Anti-Patterns to Avoid
- **Running AI analysis client-side:** API keys must stay server-side. Always use serverless functions as proxy (existing pattern)
- **Sending full document text back to client:** Only send the structured analysis result. Document stays in Supabase Storage
- **Creating a separate database for annotations:** JSONB on the analysis row is sufficient for per-kans status/notes
- **Using a fixed taxonomy for matching:** D-09 explicitly requires free AI matching, not keyword-based

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF text extraction | Custom PDF parser | `pdf-parse` (already in use) | Edge cases with encoding, images, tables |
| Word text extraction | Custom DOCX parser | `mammoth` (already in use) | XML parsing complexity |
| File upload UI | Custom drag-and-drop | `DocumentDropzone` component (exists) | Accessibility, validation, states already handled |
| Streaming progress UI | Custom progress indicators | `StreamingExtraction` pattern (exists) | Step-by-step display with icons already built |
| Card UI for opportunities | Custom card layout | Follow `UpsellCard` pattern (exists) | Consistent visual language, proven layout |
| Structured AI output parsing | Manual JSON parsing | `@anthropic-ai/sdk` + Zod `messages.parse()` pattern | Error handling, validation, markdown fence stripping |

**Key insight:** This phase is almost entirely composed of existing patterns recombined. The only genuinely new work is the AI prompts, the Zod schema for analysis output, the model abstraction layer, and the new Supabase table.

## Common Pitfalls

### Pitfall 1: Document Size Exceeding Model Context Window
**What goes wrong:** Schoolplan documents can be 30-60+ pages. Sending raw text may exceed the model's context window or produce low-quality analysis.
**Why it happens:** Large PDFs produce massive text output. Claude Sonnet 4 supports 200K tokens, but performance degrades with very long inputs.
**How to avoid:** Step 1 (summarization) truncates to first ~30,000 characters. The summary (much shorter) is then used for Step 2. This is already the approach mandated by D-15.
**Warning signs:** Analysis results are generic or miss details from later sections of the document.

### Pitfall 2: Vercel Serverless Function Timeout
**What goes wrong:** Two sequential AI calls may exceed Vercel's serverless function timeout (10s for Hobby, 60s for Pro).
**Why it happens:** Each AI call takes 5-15 seconds. Two calls = 10-30 seconds.
**How to avoid:** Use Vercel's streaming response to keep the connection alive. The SSE pattern (already used in `api/ai-intake.ts`) prevents timeout. Ensure the Vercel plan supports sufficient timeout for two sequential calls.
**Warning signs:** 504 Gateway Timeout errors in production.

### Pitfall 3: Non-Schoolplan Documents Uploaded
**What goes wrong:** User uploads a random PDF (invoice, brochure, etc.) and AI produces nonsensical "opportunities."
**Why it happens:** AI will find patterns in anything -- it will happily match invoice line items to Cito products.
**How to avoid:** Step 1 (summarization) should include a classification check: "Is this a school plan? If not, return a specific flag." The UI should show a clear warning: "Dit document lijkt geen schoolplan te zijn."
**Warning signs:** Very low relevance scores across all opportunities.

### Pitfall 4: Stale Module Catalog in AI Prompt
**What goes wrong:** The AI prompt has hardcoded module names that don't match MODULE_CATALOG.
**Why it happens:** Copy-paste of module list into prompt, then catalog changes.
**How to avoid:** Import `MODULE_CATALOG` and `MODULE_DIFFERENTIATORS` from source data files and serialize into the prompt dynamically. Never hardcode module lists in prompts.
**Warning signs:** AI returns moduleIds that don't exist in the catalog.

### Pitfall 5: UNIQUE Constraint on Re-upload
**What goes wrong:** Re-uploading a schoolplan fails because the old row still exists.
**Why it happens:** D-06 says "replace on re-upload" but the code tries to INSERT instead of UPSERT.
**How to avoid:** Use Supabase `upsert` with `onConflict: 'school_id'` on the `schoolplan_analyses` table. Also delete the old file from Supabase Storage before uploading the new one.
**Warning signs:** Database constraint violation errors on second upload.

### Pitfall 6: Opportunity Annotation Loss on Re-analysis
**What goes wrong:** Annotations (besproken/niet-relevant/notes) are lost when a new schoolplan is uploaded.
**Why it happens:** Re-upload replaces the entire analysis row including annotations.
**How to avoid:** This is actually acceptable behavior per D-06 (no version history). But warn the user before replacing: "Alle huidige kansen en notities worden vervangen."
**Warning signs:** User complaints about lost notes.

## Code Examples

### Zod Schema for AI Structured Output (Claude's Discretion)

```typescript
// src/features/school-profile/schemas/schoolplan-analysis.schema.ts
import { z } from 'zod';

export const RelevanceScore = z.enum(['hoog', 'midden', 'laag']);

export const CompetitorVulnerability = z.object({
  provider: z.enum(['dia', 'jij']),
  description: z.string(),
});

export const SchoolplanOpportunity = z.object({
  theme: z.string().describe('Schoolplan-thema dat deze kans triggert'),
  citoProduct: z.string().describe('Specifiek Cito-product (bijv. "Cito Volgsysteem VO - Rekenwiskunde")'),
  moduleId: z.string().describe('Matching moduleId uit de catalogus'),
  explanation: z.string().describe('Waarom dit product aansluit bij het schoolplan'),
  conversationTip: z.string().describe('Concrete gesprekstip voor de accountmanager'),
  relevance: RelevanceScore,
  quote: z.string().describe('Relevant citaat uit het schoolplan'),
  competitorVulnerabilities: z.array(CompetitorVulnerability).default([]),
});

export const AlsoRelevantItem = z.object({
  citoProduct: z.string(),
  moduleId: z.string(),
  reason: z.string().describe('Waarom dit relevant kan zijn ondanks dat het niet in het schoolplan staat'),
  relevance: RelevanceScore,
});

export const SchoolplanAnalysisResult = z.object({
  isSchoolplan: z.boolean().describe('Of het document daadwerkelijk een schoolplan is'),
  summary: z.string().describe('2-3 zinnen samenvatting van het schoolplan'),
  themes: z.array(z.string()).describe('Kernthema\'s en doelen uit het schoolplan'),
  opportunities: z.array(SchoolplanOpportunity),
  alsoRelevant: z.array(AlsoRelevantItem).default([]),
});

export type SchoolplanAnalysisResult = z.infer<typeof SchoolplanAnalysisResult>;
export type SchoolplanOpportunity = z.infer<typeof SchoolplanOpportunity>;
```

### Model Abstraction Layer (Claude's Discretion)

```typescript
// src/lib/ai-model-config.ts
// Server-side only -- used by serverless functions

export type AIProvider = 'anthropic';

export interface ModelConfig {
  provider: AIProvider;
  model: string;
  maxTokensSummary: number;
  maxTokensAnalysis: number;
}

const DEFAULT_CONFIG: ModelConfig = {
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  maxTokensSummary: 2048,
  maxTokensAnalysis: 4096,
};

export function getModelConfig(): ModelConfig {
  return {
    ...DEFAULT_CONFIG,
    model: process.env.SCHOOLPLAN_AI_MODEL || DEFAULT_CONFIG.model,
  };
}
```

### Tab Route Registration

```typescript
// Add to src/router/routes.ts
import SchoolplanTab from '@/features/school-profile/tabs/SchoolplanTab';

export const schoolplanRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/schoolplan',
  component: SchoolplanTab,
});

// Add to routeTree children:
// schoolRoute.addChildren([...existing, schoolplanRoute])
```

### Tab Navigation Update

```typescript
// Add to getTabs() in TabNavigation.tsx:
{ label: 'Schoolplan', path: `${base}/schoolplan` },
```

### React Query Hook Pattern

```typescript
// src/hooks/useSchoolplanAnalysis.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function useSchoolplanAnalysis(schoolId: string) {
  return useQuery({
    queryKey: ['schoolplan-analysis', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schoolplan_analyses')
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapAnalysisRow(data) : null;
    },
  });
}
```

### Supabase Migration

```sql
-- 004_schoolplan_analyses.sql
CREATE TABLE schoolplan_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  page_count INTEGER,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary TEXT NOT NULL DEFAULT '',
  themes JSONB NOT NULL DEFAULT '[]',
  opportunities JSONB NOT NULL DEFAULT '[]',
  also_relevant JSONB NOT NULL DEFAULT '[]',
  opportunity_annotations JSONB NOT NULL DEFAULT '{}',
  analysis_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (analysis_status IN ('pending', 'analyzing', 'complete', 'failed')),
  error_message TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_schoolplan_analyses_school_id ON schoolplan_analyses(school_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON schoolplan_analyses
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `claude-haiku-4-5` for all AI | `claude-sonnet-4` for complex analysis | D-17 decision | Better quality for document understanding; Haiku stays for intake |
| Hardcoded model in each serverless function | Model abstraction via env var + config | This phase | Future-proofs for model switching |
| Single AI call per document | Two-step pipeline (summarize then match) | D-15 decision | Better quality: summary focuses AI on matching |

**Current model availability (verified):**
- `claude-sonnet-4-20250514` -- production-ready, 200K context window
- `claude-haiku-4-5` -- used for existing intake (fast, cheap)
- Model IDs should be verified at implementation time for latest versions

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
| SC-01 | Upload schoolplan document per school | integration | `npx vitest run src/features/school-profile/tabs/__tests__/SchoolplanTab.test.tsx -x` | Wave 0 |
| SC-02 | AI extracts themes and goals from schoolplan | unit | `npx vitest run src/features/school-profile/schemas/__tests__/schoolplan-analysis.schema.test.ts -x` | Wave 0 |
| SC-03 | System matches themes with Cito products | unit | `npx vitest run api/__tests__/analyze-schoolplan.test.ts -x` | Wave 0 |
| SC-04 | System signals competitor vulnerabilities | unit | `npx vitest run api/__tests__/analyze-schoolplan.test.ts -x` | Wave 0 |
| SC-05 | Results stored and visible in school dashboard | integration | `npx vitest run src/hooks/__tests__/useSchoolplanAnalysis.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/school-profile/schemas/__tests__/schoolplan-analysis.schema.test.ts` -- Zod schema validation tests
- [ ] `src/hooks/__tests__/useSchoolplanAnalysis.test.ts` -- React Query hook tests
- [ ] `src/features/school-profile/tabs/__tests__/SchoolplanTab.test.tsx` -- Tab integration tests
- [ ] `api/__tests__/analyze-schoolplan.test.ts` -- Serverless function tests (mock AI, test pipeline logic)

## Open Questions

1. **Vercel Plan Timeout Limits**
   - What we know: Hobby plan has 10s timeout, Pro has 60s. Two AI calls may take 10-30s.
   - What's unclear: Which Vercel plan is in use for this project.
   - Recommendation: Design for streaming SSE response to keep connection alive. If on Hobby plan, consider upgrading or using a single AI call with a longer combined prompt as fallback.

2. **Claude Sonnet Model ID**
   - What we know: `claude-sonnet-4-20250514` is the current Sonnet 4 model.
   - What's unclear: Whether a newer version exists at implementation time.
   - Recommendation: Use env var `SCHOOLPLAN_AI_MODEL` with fallback to a sensible default. Verify model ID at implementation time.

3. **Page Count Extraction from PDF**
   - What we know: `pdf-parse` returns `numpages` for PDF files. Word/TXT have no native page concept.
   - What's unclear: Whether to estimate page count for Word/TXT or leave null.
   - Recommendation: Use `pdf-parse` result for PDF, estimate for DOCX (chars / 3000), null for TXT.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/lib/document-parser.ts`, `api/extract-document.ts` -- existing upload + extraction pattern
- Codebase analysis: `src/lib/ai-intake.ts` -- SSE streaming pattern with Zod structured output
- Codebase analysis: `src/router/routes.ts` -- TanStack Router tab routing pattern
- Codebase analysis: `src/data/differentiators.ts` -- competitor differentiators data (6 modules, 3 providers)
- Codebase analysis: `src/models/modules.ts` -- MODULE_CATALOG with 6 modules in 2 categories
- Codebase analysis: `src/features/school-profile/components/` -- UpsellCard, DocumentDropzone, StreamingExtraction, EditableField patterns

### Secondary (MEDIUM confidence)
- Anthropic SDK `@anthropic-ai/sdk` ^0.80.0 -- structured output via Zod schemas (verified in codebase usage)
- Supabase Storage bucket `documents` already exists (migration 003)

### Tertiary (LOW confidence)
- Claude Sonnet 4 model ID `claude-sonnet-4-20250514` -- verify at implementation time for latest version

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and in use
- Architecture: HIGH -- follows established project patterns exactly
- Pitfalls: HIGH -- identified from codebase analysis and existing serverless function patterns

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable -- no fast-moving dependencies)
