# Phase 23: AI Concurrentieanalyse Streaming Fix - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix de `/api/ai-analysis` endpoint die 504 timeouts en JSON parse errors geeft op Vercel productie. Root cause: Vercel Hobby plan heeft max 10s function duration — de huidige `maxDuration: 120` config wordt genegeerd. Scope: `api/ai-analysis.ts` (server) + `src/lib/ai-analysis.ts` (client). Modelkeuze upgraden van Haiku naar Sonnet/Opus. Success: AI analyse werkt betrouwbaar op productie zonder 504 of JSON parse errors.

</domain>

<decisions>
## Implementation Decisions

### Streaming strategie
- **D-01:** Server assembleert JSON volledig voordat het naar de client wordt gestuurd. Geen raw fragment-forwarding meer. Keepalive spaces voorkomen gateway timeout tijdens assemblage.
- **D-02:** Client ontvangt pas response als de volledige JSON klaar is — `response.text()` + `JSON.parse()` blijft werken.

### Voortgangsindicator
- **D-03:** Voortgangsindicator met stappen toevoegen aan AnalysisPanel: 'Verbinding maken...' → 'Analyse genereren...' → 'Resultaat verwerken...' zodat de gebruiker ziet dat het werkt. Vervangt de huidige statische skeleton niet — voegt context toe bovenop.

### Foutafhandeling & retry
- **D-04:** Client doet automatisch 1-2 retries met korte backoff bij timeout of parse error. Gebruiker ziet 'Opnieuw proberen...' in de voortgangsindicator.
- **D-05:** Na alle retries: gedetailleerde foutmelding per type (timeout vs. serverfout vs. parse error) zodat de consultant kan inschatten of wachten helpt. Met handmatige retry-knop.

### Vercel constraints
- **D-06:** Het project draait op Vercel Hobby plan. maxDuration 10s is de harde limiet. De oplossing moet werken binnen deze constraint OF een architectuurkeuze maken die de limiet omzeilt (bijv. streaming response die de connection open houdt, edge function, of upgrade-advies).
- **D-07:** Onderzoek nodig: kan een streaming response (ReadableStream met keepalives) de 10s limiet effectief omzeilen doordat Vercel de connectie open houdt zolang er data wordt verstuurd? Zo niet, welke alternatieven zijn er?

### Modelkeuze
- **D-08:** Primair model wordt `claude-sonnet-4-6` (was `claude-haiku-4-5`). Haiku als fallback bij overload.
- **D-09:** Optionele "Diepgaande analyse" knop die `claude-opus-4-6` gebruikt voor key accounts. UI toont twee knoppen: standaard (Sonnet) en premium (Opus).
- **D-10:** max_tokens verhogen naar minimaal 8192 (was 4096). Researcher bepaalt optimale waarde, moet boven 8000 liggen.

### Monitoring
- **D-11:** Health check endpoint `/api/ai-analysis/health` toevoegen dat test of de Anthropic API bereikbaar is en het model beschikbaar.

### Claude's Discretion
- Monitoring-strategie voor productiefouten (Vercel logs, Sentry, of Supabase logging) — Claude kiest passende aanpak
- Exacte backoff-timing en retry-strategie
- Implementatiedetails van de voortgangsindicator (states, transitions)
- Of Vercel Pro upgrade nodig is als de streaming workaround niet werkt — dan duidelijk documenteren als aanbeveling

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Server endpoint
- `api/ai-analysis.ts` — Serverless function met Anthropic SDK, tool_use, model cascade, streaming
- `vercel.json` — Function config met maxDuration en regions

### Client library
- `src/lib/ai-analysis.ts` — Client-side payload builder en fetch wrapper
- `src/features/price-comparison/AnalysisPanel.tsx` — UI component dat generateAnalysis aanroept

### Data & types
- `src/models/migration.ts` — TIME_SAVING_TASKS en MIGRATION_MODULE_BENEFITS gebruikt in payload
- `src/data/differentiators.ts` — MODULE_DIFFERENTIATORS voor analyse context
- `src/engine/dia-packages.ts` — DIA volume discount berekening
- `src/data/jij-license-tiers.ts` — JIJ! tier berekening

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AnalysisPanel.tsx`: Volledig werkende UI met loading skeleton, error state, 6-sectie result display. Retry en voortgangsindicator worden hieraan toegevoegd.
- `buildAnalysisPayload()` in `ai-analysis.ts`: Payload builder is stabiel en correct. Hoeft niet aangepast.
- Anthropic SDK `@anthropic-ai/sdk` met streaming support al geïnstalleerd en werkend.

### Established Patterns
- Server-side: Lazy-init pattern voor Anthropic en Supabase clients
- Client-side: `getAuthHeaders()` + fetch + response.text() + JSON.parse()
- Error handling: try/catch met user-friendly Nederlandse foutmeldingen
- Model cascade: Array van modellen, probeer volgende bij retryable errors (429, 529)

### Integration Points
- `AnalysisPanel` is embedded in comparison views via props (mode, schoolId, results)
- Auth via Supabase JWT token in Authorization header
- `useWizardStore.shouldAutoTriggerAnalysis` kan analyse automatisch triggeren

</code_context>

<specifics>
## Specific Ideas

- Gebruiker wil kwaliteit boven kwantiteit — daarom upgrade van Haiku naar Sonnet/Opus
- Twee analyse-niveaus: standaard (Sonnet) en premium/diepgaand (Opus) als separate knoppen
- Volume: ~2250 analyses verwacht (1500 scholen x 1.5 analyses). Kosten Sonnet: ~$340, Opus optie: +$170-340
- 10+ eerdere fix-pogingen in git history — SSE, buffering, retries, keepalives. Huidige aanpak (raw fragment forwarding) is de meest recente maar nog niet stabiel op productie

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 23-ai-concurrentieanalyse-streaming-fix*
*Context gathered: 2026-03-28*
