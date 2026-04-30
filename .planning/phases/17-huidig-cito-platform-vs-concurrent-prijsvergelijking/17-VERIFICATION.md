---
phase: 17-huidig-cito-platform-vs-concurrent-prijsvergelijking
verified: 2026-03-28T21:25:00Z
status: passed
score: 5/5 must-haves verified
re_verification: true
  previous_status: gaps_found
  previous_score: 4/5
  gaps_closed:
    - "SC17-03: WizardStep3Advice now calls streamRetentionAdvice for Scenario C, triggering RETENTION_SYSTEM_PROMPT via /api/ai-advice"
  gaps_remaining: []
  regressions:
    - "WizardStep3Advice button label shows 'Genereer advies' instead of 'Genereer retentie-advies' for Scenario C (cosmetic regression, non-blocking)"
human_verification:
  - test: "Verify retention AI advice quality at runtime"
    expected: "When Scenario C is active and advice is generated, the AI response explicitly uses retention language: mentions 'verliest', 'behouden', 'raakt kwijt', frames migration as soft deal. Does NOT read like an acquisition pitch."
    why_human: "The RETENTION_SYSTEM_PROMPT is now correctly wired (not a workaround). Runtime verification confirms the actual AI output quality, which cannot be verified from code alone."
---

# Phase 17: Huidig Cito-platform vs. Concurrent Prijsvergelijking — Verification Report

**Phase Goal:** Scholen op het huidige Cito-platform kunnen vergelijken met DIA/JIJ zonder aanname van migratie naar nieuw platform — extra wizard-scenario voor bestaande Cito-klanten die concurrentie evalueren.

**Verified:** 2026-03-28T21:25:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure by Plan 17-04

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC17-01 | Wizard herkent het scenario "school zit op huidig Cito-platform en wil vergelijken met concurrent" als aparte flow naast de bestaande scenario's | VERIFIED | WizardScenario has 4 values including 'alles-oud-cito-concurrent' (types.ts line 6); ScenarioDetector renders two-card choice UI for alles-oud-cito; ComparisonWizard wires onChooseCompetitor |
| SC17-02 | Vergelijking gebruikt de huidige Cito-prijzen/modules van de school, niet de tarieven van het nieuwe platform | VERIFIED | price-comparison.ts line 135: `if (options.scenarioType === 'C')` post-processes cito results with getOldPlatformPrice; wizard-store.ts line 231: applyToTable writes Scenario C to school store |
| SC17-03 | AI-advies houdt rekening met het feit dat de school al Cito-klant is en genereert passend advies (retentie-perspectief, niet acquisitie) | VERIFIED | WizardStep3Advice line 20 imports streamRetentionAdvice; line 91: isRetentionScenario = scenario === 'alles-oud-cito-concurrent'; lines 162-175: calls streamRetentionAdvice when isRetentionScenario && compResult, which POSTs to /api/ai-advice with scenarioType 'C', selecting RETENTION_SYSTEM_PROMPT (api/ai-advice.ts line 167) |
| SC17-04 | Resultaat in vergelijkingstabel toont huidig Cito vs. concurrent, niet nieuw Cito vs. concurrent | VERIFIED | ComparisonTable.tsx lines 43-44: getProviderLabel returns 'Huidig Cito' when provider === 'cito' && scenario === 'C'; subtitle "(huidig platform)" shown at line 96-97 |
| SC17-05 | ScenarioDetector vangt dit scenario correct op en routeert naar de juiste flow | VERIFIED | ScenarioDetector.tsx props onChooseCompetitor/onChooseMigration (lines 12-13); ComparisonTab line 257: effectiveScenario === 'C' routes to PriceComparisonPage; choice UI condition line 109 shows for scenario !== 'B' && !== 'C' |

**Score: 5/5 truths verified**

---

## Required Artifacts

### Plan 17-01 Artifacts (Quick Regression Check)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/features/price-comparison/wizard/types.ts` | WizardScenario with alles-oud-cito-concurrent | VERIFIED | Line 6: four-value union including 'alles-oud-cito-concurrent' |
| `src/models/school.ts` | Scenario = 'A' \| 'B' \| 'C' with SCENARIO_LABELS['C'] | VERIFIED | Line 41: `export type Scenario = 'A' \| 'B' \| 'C'` |
| `src/engine/scenario-detection.ts` | forRetentionComparison option | VERIFIED | Line from previous check confirmed |
| `src/data/cito-migration-prices.ts` | getOldPlatformPrice helper | VERIFIED | Line 70: exported function present |
| `src/engine/price-comparison.ts` | Scenario C old-platform price branching | VERIFIED | Line 135: `if (options.scenarioType === 'C')` |
| `src/lib/__tests__/ai-advice.test.ts` | 5 unskipped passing tests | VERIFIED | 5/5 tests pass (confirmed by vitest run) |

### Plan 17-02 Artifacts (Quick Regression Check)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/features/price-comparison/wizard/ScenarioDetector.tsx` | Two-card choice UI | VERIFIED | onChooseCompetitor/onChooseMigration props; choice UI code confirmed present |
| `src/features/price-comparison/wizard/wizard-store.ts` | Scenario C in applyToTable | VERIFIED | Line 231: alles-oud-cito-concurrent writes 'C' to school store |
| `src/features/school-profile/tabs/ComparisonTab.tsx` | Scenario C routing | VERIFIED | Line 257: effectiveScenario === 'C' → PriceComparisonPage |
| `src/features/price-comparison/wizard/ComparisonWizard.tsx` | Callback wiring | VERIFIED (from previous, no regression) | onChooseCompetitor sets scenario + advances; onChooseMigration sets 'B' |

### Plan 17-03 Artifacts (Quick Regression Check)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `api/ai-advice.ts` | RETENTION_SYSTEM_PROMPT + scenarioType branching | VERIFIED | Line 51: RETENTION_SYSTEM_PROMPT defined; line 167: branches on scenarioType === 'C' |
| `src/lib/ai-advice.ts` | buildRetentionAdvicePayload + streamRetentionAdvice exported | VERIFIED | Lines 87 and 260 confirm exports |
| `src/lib/__tests__/ai-advice.test.ts` | All 5 tests passing | VERIFIED | vitest run: 5 passed |
| `src/features/price-comparison/ComparisonTable.tsx` | 'Huidig Cito' for Scenario C | VERIFIED | Lines 43-44 + tabular-nums + text-right confirmed |

### Plan 17-04 Gap-Closure Artifact (Full Verification)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/features/price-comparison/wizard/WizardStep3Advice.tsx` | streamRetentionAdvice import + isRetentionScenario branch | VERIFIED | Line 20: import present; line 91: isRetentionScenario flag; lines 162-175: calls streamRetentionAdvice when isRetentionScenario && compResult — gap CLOSED |

---

## Key Link Verification

### Gap-Closure Key Link (Previously Broken — Now Verified)

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `WizardStep3Advice.tsx` | `api/ai-advice.ts` | streamRetentionAdvice import from @/lib/ai-advice, POSTs with scenarioType 'C' | WIRED | Line 20: import confirmed; lines 162-175: called when isRetentionScenario && compResult; the bijzonderheden workaround ("SCENARIO: Retentie") is gone — grep returns 0 matches |

### Previously Verified Key Links (Regression Check)

| From | To | Via | Status |
|------|-----|-----|--------|
| `src/engine/price-comparison.ts` | `src/data/cito-migration-prices.ts` | import getOldPlatformPrice | WIRED |
| `ScenarioDetector.tsx` | wizard scenario state | onChooseCompetitor sets alles-oud-cito-concurrent | WIRED |
| `ComparisonTab.tsx` | `PriceComparisonPage.tsx` | effectiveScenario === 'C' routing | WIRED |
| `ComparisonTable.tsx` | school profile store | reads scenario for Huidig Cito label | WIRED |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `WizardStep3Advice.tsx` | AI advice (retention framing) | streamRetentionAdvice → /api/ai-advice with scenarioType 'C' → RETENTION_SYSTEM_PROMPT | Yes — dedicated retention prompt with three-layer framing | FLOWING (gap closed) |
| `ComparisonTable.tsx` | scenario (for 'Huidig Cito' label) | useSchoolProfileStore.scenario | Yes — set by wizard-store applyToTable() | FLOWING |
| `engine/price-comparison.ts` | citoResults (Scenario C prices) | getOldPlatformPrice per moduleId | Yes — 6 modules with real prices, null = new-platform fallback | FLOWING |

---

## Behavioral Spot-Checks

Step 7b: SKIPPED for AI streaming calls (requires running server and Anthropic API). Core wiring verified from code. Runtime AI output quality flagged for human verification.

---

## Requirements Coverage

SC17 requirement IDs are phase-scoped (defined in ROADMAP.md Phase 17). REQUIREMENTS.md contains no SC17-xx entries — by design.

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SC17-01 | 17-01, 17-02 | Wizard recognises cito-oud + competitor scenario as separate flow | SATISFIED | WizardScenario extended, ScenarioDetector choice UI, ComparisonWizard callback wiring |
| SC17-02 | 17-01, 17-02 | Comparison uses current Cito prices, not new-platform prices | SATISFIED | calculateComparison Scenario C post-processing; wizard-store writes Scenario C |
| SC17-03 | 17-03, 17-04 | AI advice uses retention perspective, not acquisition | SATISFIED | RETENTION_SYSTEM_PROMPT correctly wired via streamRetentionAdvice in WizardStep3Advice |
| SC17-04 | 17-02, 17-03 | Table shows "Huidig Cito" vs competitor, not new Cito vs competitor | SATISFIED | ComparisonTable getProviderLabel returns 'Huidig Cito' for scenario === 'C' |
| SC17-05 | 17-01, 17-02 | ScenarioDetector catches scenario and routes correctly | SATISFIED | Two-card choice UI, ComparisonTab routing, callback wiring confirmed |

**Orphaned requirements:** None — all SC17 IDs claimed by plans.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `WizardStep3Advice.tsx` | 264-273 | Button shows 'Genereer advies' instead of 'Genereer retentie-advies' for Scenario C — isRetentionScenario not used for button label | Warning (cosmetic) | User may not see a visual distinction between Scenario A and Scenario C advice generation. Non-blocking — the correct retention endpoint is called regardless of label. |

No TODO/FIXME/placeholder patterns found. No empty return stubs. No hardcoded empty data flowing to render. The bijzonderheden workaround ("SCENARIO: Retentie") has been removed.

---

## Human Verification Required

### 1. Retention AI Advice Quality

**Test:** Open app in browser. Navigate to a school with ALL modules set to "Cito (huidig platform)". Go to Vergelijking tab, select "Vergelijk met concurrent", click Doorgaan. Proceed through wizard step 2 (select a competitor variant). In step 3, click "Genereer advies".

**Expected:** AI response uses retention language — mentions "verliest", "behouden", "raakt kwijt", frames migration to new platform as a soft deal ("volgend schooljaar gratis upgrade"). Does NOT read like an acquisition pitch to a new prospect.

**Why human:** The RETENTION_SYSTEM_PROMPT is now correctly wired via streamRetentionAdvice (not a workaround). The code path is verified. Only observing the actual AI output at runtime can confirm the retention framing quality.

---

## Gaps Summary

No gaps blocking goal achievement. The only gap from the previous verification (SC17-03: streamRetentionAdvice not wired in WizardStep3Advice) has been closed by Plan 17-04.

**Regression noted (non-blocking):** The generate button in WizardStep3Advice no longer shows "Genereer retentie-advies" for Scenario C. The Plan 17-03 SUMMARY claimed this was implemented (lines 252-253: "Genereer retentie-advies" for Scenario C), but Plan 17-04 rewrote the file and dropped this label. The button now shows the generic "Genereer advies" regardless of scenario. This is cosmetic and does not affect functionality — the correct retention endpoint is called when `isRetentionScenario && compResult`.

---

_Verified: 2026-03-28T21:25:00Z_
_Verifier: Claude Sonnet 4.6 (gsd-verifier)_
_Re-verification: Yes — after Plan 17-04 gap closure_
