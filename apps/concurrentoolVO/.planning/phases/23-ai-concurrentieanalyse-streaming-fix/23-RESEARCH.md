# Phase 23: AI Concurrentieanalyse Streaming Fix - Research

**Researched:** 2026-03-28
**Domain:** Vercel serverless streaming, Anthropic SDK tool_use, error handling
**Confidence:** HIGH

## Summary

The root cause assumption in CONTEXT.md -- that Vercel Hobby plan has a hard 10s function limit that `maxDuration: 120` cannot override -- is **incorrect**. As of April 2025, Vercel enables Fluid Compute by default for new projects. With Fluid Compute, the Hobby plan allows functions to run up to **300 seconds (5 minutes)** by default, which is also the maximum. The `maxDuration: 120` in vercel.json is valid but actually *below* the default 300s. This means the 504 timeouts have a different root cause than originally assumed.

The current implementation (`api/ai-analysis.ts`) streams `input_json_delta` fragments directly to the client as raw text, with spaces as keepalive before JSON starts. The client (`src/lib/ai-analysis.ts`) does `response.text().trim()` then `JSON.parse()`. This approach has a fundamental fragility: if any stream event is missed, arrives out of order, or the connection drops mid-stream, the client receives invalid JSON. Additionally, with Sonnet/Opus models (which take longer to generate), the response can genuinely exceed the function duration if Fluid Compute is NOT enabled on this specific project (projects created before April 2025 may need manual enablement).

**Primary recommendation:** First verify Fluid Compute is enabled for this project (check Vercel dashboard). If enabled, the 300s limit is plenty for even Opus. The streaming approach should be simplified: assemble complete JSON server-side, stream keepalive spaces to prevent gateway timeout, then send the complete JSON. This is what D-01 and D-02 already decided -- the implementation just needs to correctly implement that pattern (the current code forwards fragments instead of assembling).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Server assembleert JSON volledig voordat het naar de client wordt gestuurd. Geen raw fragment-forwarding meer. Keepalive spaces voorkomen gateway timeout tijdens assemblage.
- **D-02:** Client ontvangt pas response als de volledige JSON klaar is -- `response.text()` + `JSON.parse()` blijft werken.
- **D-03:** Voortgangsindicator met stappen toevoegen aan AnalysisPanel: 'Verbinding maken...' -> 'Analyse genereren...' -> 'Resultaat verwerken...' zodat de gebruiker ziet dat het werkt. Vervangt de huidige statische skeleton niet -- voegt context toe bovenop.
- **D-04:** Client doet automatisch 1-2 retries met korte backoff bij timeout of parse error. Gebruiker ziet 'Opnieuw proberen...' in de voortgangsindicator.
- **D-05:** Na alle retries: gedetailleerde foutmelding per type (timeout vs. serverfout vs. parse error) zodat de consultant kan inschatten of wachten helpt. Met handmatige retry-knop.
- **D-06:** Het project draait op Vercel Hobby plan. maxDuration 10s is de harde limiet. De oplossing moet werken binnen deze constraint OF een architectuurkeuze maken die de limiet omzeilt (bijv. streaming response die de connection open houdt, edge function, of upgrade-advies).
- **D-07:** Onderzoek nodig: kan een streaming response (ReadableStream met keepalives) de 10s limiet effectief omzeilen doordat Vercel de connectie open houdt zolang er data wordt verstuurd? Zo niet, welke alternatieven zijn er?
- **D-08:** Primair model wordt `claude-sonnet-4-6` (was `claude-haiku-4-5`). Haiku als fallback bij overload.
- **D-09:** Optionele "Diepgaande analyse" knop die `claude-opus-4-6` gebruikt voor key accounts. UI toont twee knoppen: standaard (Sonnet) en premium (Opus).
- **D-10:** max_tokens verhogen naar minimaal 8192 (was 4096). Researcher bepaalt optimale waarde, moet boven 8000 liggen.
- **D-11:** Health check endpoint `/api/ai-analysis/health` toevoegen dat test of de Anthropic API bereikbaar is en het model beschikbaar.

### Claude's Discretion
- Monitoring-strategie voor productiefouten (Vercel logs, Sentry, of Supabase logging) -- Claude kiest passende aanpak
- Exacte backoff-timing en retry-strategie
- Implementatiedetails van de voortgangsindicator (states, transitions)
- Of Vercel Pro upgrade nodig is als de streaming workaround niet werkt -- dan duidelijk documenteren als aanbeveling

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Critical Finding: D-06/D-07 Assumption is Wrong

**CONTEXT.md states:** "Vercel Hobby plan heeft max 10s function duration -- de huidige maxDuration: 120 config wordt genegeerd."

**Reality (verified with official Vercel docs 2026-03-28):** With Fluid Compute (enabled by default since April 23, 2025), the Hobby plan has:
- **Default duration:** 300 seconds (5 minutes)
- **Maximum duration:** 300 seconds (5 minutes)

The `maxDuration: 120` in `vercel.json` is VALID and actually *limits* the function to 2 minutes instead of the default 5 minutes. If the project was created before April 2025, Fluid Compute may need to be manually enabled via the Vercel dashboard.

**Action required:** The planner must include a task to verify Fluid Compute is enabled for this project. If it is, D-06 and D-07 are resolved -- there is no 10s limit to work around. If not, enabling it (one toggle in dashboard) solves the problem.

**This changes the entire approach:** Instead of complex streaming workarounds, the fix is:
1. Enable Fluid Compute (if not already)
2. Set `maxDuration: 300` in `vercel.json` (use the full Hobby plan allowance)
3. Server assembles complete JSON, sends keepalive spaces during generation (per D-01)
4. No need for edge functions, chunked transfer, or other complexity

Source: https://vercel.com/docs/functions/configuring-functions/duration, https://vercel.com/docs/functions/limitations, https://vercel.com/docs/fluid-compute

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | 0.80.0 | Anthropic API client with streaming | Already installed, latest version |
| `vitest` | 4.1.0 | Test runner | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | - | - | No new dependencies required |

**No new packages needed.** All required functionality exists in the current stack.

## Architecture Patterns

### Server-side: Complete Assembly + Keepalive Pattern (D-01)

The current code (line 456-476 in `api/ai-analysis.ts`) forwards `input_json_delta` fragments directly. This must change to:

1. Start ReadableStream immediately (prevents gateway timeout)
2. Send keepalive spaces while waiting for Anthropic response
3. Collect all `input_json_delta` fragments into a string buffer
4. When stream ends, `JSON.parse()` the assembled string server-side
5. Send the complete valid JSON as one chunk
6. Close the stream

```typescript
// Pattern: server-side assembly with keepalive
const readable = new ReadableStream({
  async start(controller) {
    const encoder = new TextEncoder();
    let jsonParts: string[] = [];

    // Keepalive interval — send space every 5s while waiting
    const keepalive = setInterval(() => {
      controller.enqueue(encoder.encode(' '));
    }, 5000);

    try {
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'input_json_delta'
        ) {
          jsonParts.push(event.delta.partial_json);
        }
      }

      clearInterval(keepalive);

      const assembled = jsonParts.join('');
      // Validate JSON server-side before sending
      const parsed = JSON.parse(assembled);
      controller.enqueue(encoder.encode(JSON.stringify(parsed)));
      controller.close();
    } catch (err) {
      clearInterval(keepalive);
      controller.enqueue(encoder.encode(JSON.stringify({
        error: String(err),
      })));
      controller.close();
    }
  },
});
```

### Client-side: Retry with Backoff Pattern (D-04/D-05)

```typescript
// Pattern: retry with typed error handling
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2,
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      // Don't retry 400/401/403 — only 5xx and 408/429
      if (response.status < 500 && response.status !== 408 && response.status !== 429) {
        return response;
      }
    } catch (err) {
      if (attempt === maxRetries) throw err;
    }

    // Exponential backoff: 1s, 2s
    await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
  }
  throw new Error('Alle pogingen mislukt');
}
```

### Model Cascade Pattern (D-08/D-09)

Current cascade is `['claude-haiku-4-5-20251001', 'claude-sonnet-4-6']`. Per D-08, this reverses to Sonnet primary, Haiku fallback. Opus is a separate path triggered by a UI button.

```typescript
// Standard analysis
const MODELS = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'] as const;

// Deep analysis (separate endpoint or parameter)
const DEEP_MODELS = ['claude-opus-4-6', 'claude-sonnet-4-6'] as const;
```

### Health Check Pattern (D-11)

```typescript
// api/ai-analysis/health.ts — simple availability check
export async function GET(): Promise<Response> {
  try {
    // Minimal API call to verify connectivity
    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    });
    return Response.json({ status: 'ok', model: response.model });
  } catch (err) {
    return Response.json({ status: 'error', error: String(err) }, { status: 503 });
  }
}
```

### Anti-Patterns to Avoid
- **Forwarding raw JSON fragments to client:** The current approach. One missed fragment = invalid JSON. Server must assemble.
- **SSE (Server-Sent Events):** Previously attempted (commit 919c4b9), then reverted. More complex, no benefit over keepalive-then-JSON for this use case.
- **`maxDuration: 120` with Fluid Compute:** This actually *limits* the function. Use 300 for Hobby plan.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON validation | Custom parser for partial JSON | `JSON.parse()` on server-assembled string | Server assembles complete JSON; no partial parsing needed |
| Streaming | Custom SSE protocol | ReadableStream with keepalive spaces | Simpler, already proven pattern in other project endpoints |
| Retry logic | Complex circuit breaker | Simple retry with exponential backoff | 1-2 retries is sufficient; no need for circuit breaker |

## Common Pitfalls

### Pitfall 1: Assuming Hobby Plan Has 10s Limit
**What goes wrong:** Building complex workarounds for a limit that doesn't exist with Fluid Compute.
**Why it happens:** Old documentation and blog posts reference pre-Fluid-Compute limits.
**How to avoid:** Check Vercel dashboard for Fluid Compute status. Enable if needed.
**Warning signs:** `maxDuration` in vercel.json being set lower than 300.

### Pitfall 2: Keepalive Spaces Corrupting JSON
**What goes wrong:** Client receives `"   {\"samenvatting\":...}"` and `JSON.parse()` fails because of leading spaces.
**Why it happens:** Keepalive spaces are prepended to the response body.
**How to avoid:** Client already does `raw.trim()` before `JSON.parse()` (line 298 of `ai-analysis.ts`). This handles it correctly. Don't remove the `.trim()`.
**Warning signs:** JSON parse errors in client logs.

### Pitfall 3: Stream Error After Partial JSON Sent
**What goes wrong:** Anthropic stream errors mid-generation. Server has sent keepalive spaces but no JSON yet. How to signal error?
**Why it happens:** Network issues, model overload, token limit reached.
**How to avoid:** In the server-side assembly pattern, errors are caught in the try/catch. Since no JSON has been sent yet (only spaces), the error JSON is sent as the response body. Client trims spaces, parses JSON, checks for `.error` field.
**Warning signs:** Client receiving `{ "error": "..." }` instead of analysis result.

### Pitfall 4: max_tokens Too Low for Structured Output
**What goes wrong:** Model truncates output mid-JSON when token limit is reached.
**Why it happens:** Tool use JSON schema requires many tokens. Complex school profiles with multiple modules generate verbose analyses.
**How to avoid:** Set `max_tokens: 16384`. The tool use schema has ~6 required sections. With 8 modules and full schoolplan data, 8192 may be tight. 16384 provides comfortable headroom.
**Warning signs:** `stop_reason: "max_tokens"` instead of `"end_turn"` or `"tool_use"`.

### Pitfall 5: Model Name Changes
**What goes wrong:** Hardcoded model names like `claude-haiku-4-5-20251001` become invalid.
**Why it happens:** Anthropic periodically updates model versions.
**How to avoid:** Use latest aliases when available (`claude-sonnet-4-6` is already an alias). For Haiku, `claude-haiku-4-5-20251001` is a specific dated version.
**Warning signs:** 404 or model_not_found errors from Anthropic API.

## Code Examples

### Current Code Issues (what needs changing)

**Issue 1: Fragment forwarding (api/ai-analysis.ts lines 460-476)**
```typescript
// CURRENT (broken) — forwards fragments directly
if (event.delta.type === 'input_json_delta') {
  jsonStarted = true;
  controller.enqueue(encoder.encode(event.delta.partial_json));
}
```
Must change to: collect fragments, assemble, validate, send complete JSON.

**Issue 2: Model order reversed (api/ai-analysis.ts line 438)**
```typescript
// CURRENT — Haiku first, Sonnet fallback
const MODELS = ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6'] as const;
// SHOULD BE (per D-08) — Sonnet first, Haiku fallback
const MODELS = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'] as const;
```

**Issue 3: max_tokens too low (api/ai-analysis.ts line 448)**
```typescript
// CURRENT
max_tokens: 4096,
// SHOULD BE (per D-10, recommended 16384 for headroom)
max_tokens: 16384,
```

**Issue 4: maxDuration in vercel.json (line 27)**
```json
// CURRENT — unnecessarily limits to 2 minutes
"maxDuration": 120
// SHOULD BE — use full Hobby plan allowance
"maxDuration": 300
```

### Files That Need Changes

| File | Change | Complexity |
|------|--------|-----------|
| `api/ai-analysis.ts` | Server-side JSON assembly, model cascade reversal, max_tokens increase, Opus support | High |
| `src/lib/ai-analysis.ts` | Add retry logic with backoff, typed error classification | Medium |
| `src/features/price-comparison/AnalysisPanel.tsx` | Progress indicator, dual buttons (Sonnet/Opus), retry UI | Medium |
| `vercel.json` | Update maxDuration to 300 | Trivial |
| `api/ai-analysis/health.ts` (NEW) | Health check endpoint | Low |

## max_tokens Recommendation (D-10)

**Recommendation: 16384 tokens.**

Reasoning:
- Current value: 4096 (insufficient for complex analyses)
- Tool use JSON schema overhead: ~500-800 tokens for the structure itself
- 6 required sections with nested arrays: `samenvatting`, `prijsanalyse`, `citoSterkePunten`, `concurrentieVergelijking`, `schoolplanKoppeling`, `gespreksargumenten`
- With 8 modules, schoolplan data, and migration context: 6000-10000 tokens typical
- 8192 (D-10 minimum) works for most cases but risks truncation on complex profiles
- 16384 provides 2x headroom with minimal cost impact (only tokens actually generated are charged)
- Cost impact: Sonnet output at 16K tokens max vs 4K = negligible per-request (only ~$0.04 more at worst)

## Monitoring Strategy (Claude's Discretion)

**Recommendation: Vercel Function Logs + Sentry (already integrated).**

Sentry is already configured in Phase 22 (commit history shows CSP headers for sentry.io). Use:
1. Sentry for client-side error tracking (already set up)
2. `console.error` in the serverless function (visible in Vercel Function Logs dashboard)
3. Structured log format: `[ai-analysis] [model] [status] [duration_ms]` for easy filtering

No additional tooling needed. Avoid Supabase logging (unnecessary write overhead for a diagnostic feature).

## Retry Strategy (Claude's Discretion)

**Recommendation:**
- Max retries: 2 (total 3 attempts)
- Backoff: 1s after first failure, 3s after second
- Retryable conditions: HTTP 408, 429, 500, 502, 503, 504, network errors, JSON parse errors
- Non-retryable: HTTP 400, 401, 403

## Progress Indicator Design (Claude's Discretion)

**Recommendation:** Three-state progress bar above the loading skeleton:

| State | Label | Trigger |
|-------|-------|---------|
| `connecting` | "Verbinding maken..." | Fetch started |
| `generating` | "Analyse genereren..." | Response headers received (status 200) |
| `processing` | "Resultaat verwerken..." | Response body received, parsing |
| `retrying` | "Opnieuw proberen... (poging 2/3)" | On retry |

Implementation: simple state machine in `AnalysisPanel`, driven by callbacks from the fetch wrapper.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hobby 10s limit | Hobby 300s with Fluid Compute | April 2025 | Eliminates need for streaming workarounds |
| Edge Functions for long AI calls | Node.js Serverless with Fluid Compute | 2025 | Edge had 25s start limit; Node.js is better |
| SSE for streaming | ReadableStream with keepalive | Current best practice | Simpler, fewer moving parts |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run --testPathPattern ai-analysis` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-01 | Server assembles JSON completely | unit | `npx vitest run api/__tests__/ai-analysis.test.ts -x` | No - Wave 0 |
| D-02 | Client receives valid JSON | unit | `npx vitest run src/lib/__tests__/ai-analysis.test.ts -x` | No - Wave 0 |
| D-04 | Client retries on failure | unit | `npx vitest run src/lib/__tests__/ai-analysis.test.ts -x` | No - Wave 0 |
| D-05 | Typed error messages | unit | `npx vitest run src/lib/__tests__/ai-analysis.test.ts -x` | No - Wave 0 |
| D-08 | Sonnet primary, Haiku fallback | unit | `npx vitest run api/__tests__/ai-analysis.test.ts -x` | No - Wave 0 |
| D-11 | Health check returns status | unit | `npx vitest run api/__tests__/health.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --testPathPattern ai-analysis`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + manual production test on toolvo.vercel.app

### Wave 0 Gaps
- [ ] `src/lib/__tests__/ai-analysis.test.ts` -- covers D-02, D-04, D-05 (retry logic, error classification)
- [ ] Test for server-side assembly is harder (serverless function testing) -- recommend testing the JSON assembly logic as an extracted pure function

## Open Questions

1. **Is Fluid Compute enabled on toolvo.vercel.app?**
   - What we know: Projects created after April 23, 2025 have it enabled by default. This project may predate that.
   - What's unclear: When this specific Vercel project was created.
   - Recommendation: Check Vercel dashboard. If not enabled, enable it. This is the single most important action.

2. **Anthropic model availability in fra1 region**
   - What we know: The project is configured for `"regions": ["fra1"]` (Frankfurt). Anthropic API is US-based.
   - What's unclear: Whether fra1 region adds significant latency to Anthropic API calls (cold start + round trip).
   - Recommendation: Monitor response times. If consistently >20s, consider adding `iad1` as a region option.

## Sources

### Primary (HIGH confidence)
- Vercel Function Duration Docs (https://vercel.com/docs/functions/configuring-functions/duration) -- Hobby 300s default/max with Fluid Compute
- Vercel Function Limitations (https://vercel.com/docs/functions/limitations) -- Full duration limits table
- Vercel Fluid Compute Docs (https://vercel.com/docs/fluid-compute) -- Enabled by default since April 2025
- Anthropic Streaming Docs (https://platform.claude.com/docs/en/api/messages-streaming) -- input_json_delta event format

### Secondary (MEDIUM confidence)
- Current codebase analysis: `api/ai-analysis.ts`, `src/lib/ai-analysis.ts`, `AnalysisPanel.tsx`
- Git history: 10+ previous fix attempts (SSE, buffering, fragment forwarding)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, verified versions
- Architecture: HIGH -- Vercel docs are definitive on Fluid Compute limits
- Pitfalls: HIGH -- based on code analysis and 10+ previous failed attempts in git history
- Fluid Compute finding: HIGH -- verified against three separate Vercel doc pages

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable Vercel platform, unlikely to change)
