---
phase: 12-dmu-export-offline
verified: 2026-03-24T22:52:00Z
status: passed
score: 15/15 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "PDF rapportgeneratie — visueel controleren"
    expected: "PDF met SVG staafdiagram, kleurgecodeerde balk per aanbieder, schoolnaam, datum, Cito-huisstijl (#003082 / #FF6600) en disclaimer zichtbaar"
    why_human: "react-pdf rendering kan niet headless getest worden; visuele output vereist browser/PDF-viewer"
  - test: "Offline-banner zichtbaar op tablet"
    expected: "Amber banner 'Offline modus — data kan verouderd zijn' verschijnt bovenaan bij uitschakelen netwerk"
    why_human: "navigator.onLine staat altijd op true in jsdom; vereist echte browser of tablet"
  - test: "Clipboard-knop in ExportTab"
    expected: "Knop 'Kopieer naar clipboard' zichtbaar, verandert naar 'Gekopieerd!' na klik, inhoud bevat schoolnaam en provider-totalen"
    why_human: "ClipboardItem API niet beschikbaar in jsdom; vereist browser met HTTPS"
  - test: "PWA installeerbaar op tablet"
    expected: "Browser toont install-prompt, app opent standalone zonder adresbalk"
    why_human: "PWA install-prompt vereist echte browser op tablet; niet testbaar programmatisch"
---

# Phase 12: DMU Export & Offline Verification Report

**Phase Goal:** Accountmanager kan na elk gesprek direct een op de DMU afgestemd PDF-rapport genereren en de applicatie werkt offline op tablet
**Verified:** 2026-03-24T22:52:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | PDF rapport voor coordinator benadrukt tijdwinst en dagelijks gebruik als eerste secties | VERIFIED | `dmu-filters.ts` line 39: coordinator reorder places `timeSavings` before `priceComparison`; `summaryFocus: 'practical'` confirmed by 3 passing tests |
| 2 | PDF rapport voor MT bevat visuele staafdiagram en meerjarenprojectie prominent | VERIFIED | `dmu-filters.ts` line 44: mt reorder puts `multiYear` first after summary; `PdfBarChart` rendered in `priceComparison` case in `ReportDocument.tsx` lines 37-51 |
| 3 | PDF rapport voor finance toont euro's, break-even en kosten-tabellen als eerste secties | VERIFIED | `dmu-filters.ts` line 49: finance reorder puts `priceComparison` first after summary; `summaryFocus: 'financial'` confirmed by test |
| 4 | PDF bevat schoolspecifieke data, Cito-huisstijl (#003082, #FF6600), bronvermelding en disclaimer | VERIFIED | `styles.ts`: `CITO_COLORS.primary = '#003082'`, `accent = '#FF6600'`; `ReportDocument.tsx` lines 110-119: disclaimer with source attribution and school name |
| 5 | SVG staafdiagram toont totaalkosten per aanbieder als visueel element in het PDF | VERIFIED | `PdfBarChart.tsx`: uses `@react-pdf/renderer` SVG primitives (`Svg`, `Rect`, `G`, `Line`); wired in `ReportDocument.tsx` with `PROVIDER_CHART_COLORS` mapping |
| 6 | Schoolplan-kansen sectie verschijnt als optionele sectie wanneer data beschikbaar is | VERIFIED | `SchoolplanSection.tsx` returns null when no data; `ReportDocument.tsx` line 89: `case 'schoolplan': return <SchoolplanSection ... opportunities={data.schoolplanOpportunities} />` |
| 7 | Gebruiker kan de vergelijking kopiëren naar clipboard via een knop in de ExportTab | VERIFIED | `ClipboardButton.tsx` exported; `ExportTab.tsx` line 121: `<ClipboardButton config={config} data={reportData} disabled={!hasData} />` |
| 8 | Clipboard bevat schoolnaam, modules, totaalverschil per aanbieder, tijdwinst en conclusie | VERIFIED | `clipboard.ts`: all fields present; 10 passing tests confirm each data section |
| 9 | Bij kopieer-succes verschijnt een visuele bevestiging | VERIFIED | `ClipboardButton.tsx` lines 18-20: `setCopied(true)` + `setTimeout(() => setCopied(false), 2000)`; button text changes to "Gekopieerd!" |
| 10 | Applicatie werkt offline op tablet na eerste laden | VERIFIED | `vite.config.ts`: VitePWA generates `dist/sw.js` + `dist/workbox-015121ed.js`; precaches 15 entries; build exit 0 |
| 11 | Service worker cacht assets en Supabase API data | VERIFIED | `vite.config.ts`: `globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']`; `StaleWhileRevalidate` for `supabase-api-cache`; `NetworkFirst` for auth |
| 12 | Subtiele offline-banner verschijnt bovenaan | VERIFIED | `OfflineBanner.tsx`: renders amber banner with "Offline modus — data kan verouderd zijn"; wired in `RootLayout.tsx` line 71 |
| 13 | Mutaties worden lokaal opgeslagen bij offline en gesynchroniseerd bij reconnect | VERIFIED | `offline-queue.ts`: Zustand + persist (key: `offline-queue`); `RootLayout.tsx` lines 30-33: `addEventListener('online', handleOnline)` triggers `syncAll()` |
| 14 | Actual mutation callsites route through offline queue when navigator is offline | VERIFIED | `operations.ts`: 11 mutation functions (updateSchoolData, addContact, updateContact, deleteContact, addConversation, updateConversation, addAction, updateAction, deleteAction, setPipelineStatus, setEngagementStatus) each have `if (queueIfOffline(...)) return;` |
| 15 | Conflict detection compares mutation timestamp vs server updated_at before applying | VERIFIED | `offline-queue.ts` lines 56-77: `serverUpdatedAt > mutation.timestamp` check skips mutation and marks `conflicted: true` with Dutch reason string |

**Score:** 15/15 truths verified

---

## Required Artifacts

### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/features/export/pdf/components/PdfBarChart.tsx` | Custom SVG bar chart using @react-pdf/renderer primitives | VERIFIED | Exports `PdfBarChart`, `calculateBarLayout`, `PROVIDER_CHART_COLORS`; uses `Svg`, `Rect`, `G`, `Line`, `Text` from @react-pdf/renderer |
| `src/features/export/pdf/components/SchoolplanSection.tsx` | Optional schoolplan opportunities section | VERIFIED | Exports `SchoolplanSection`; returns null when no data; renders status badges with Dutch labels |
| `src/features/export/pdf/ReportDocument.tsx` | Multi-page PDF document with all sections | VERIFIED | Contains `<View wrap>`; imports and renders both `PdfBarChart` and `SchoolplanSection`; uses `getReportSections` |

### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/clipboard.ts` | Clipboard formatting and write logic | VERIFIED | Exports `buildClipboardContent` and `copyToClipboard`; contains `ClipboardItem`, `navigator.clipboard.write`, `writeText` fallback |
| `src/features/export/components/ClipboardButton.tsx` | Copy to clipboard button component | VERIFIED | Exports `ClipboardButton`; contains "Kopieer naar clipboard" and "Gekopieerd!" text |

### Plan 03 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `vite.config.ts` | VitePWA plugin configuration | VERIFIED | Contains `VitePWA({`, `registerType: 'autoUpdate'`, `supabase-api-cache`, `StaleWhileRevalidate`, `NetworkFirst`, `globPatterns` |
| `src/hooks/useOnlineStatus.ts` | React hook for online/offline detection | VERIFIED | Exports `useOnlineStatus`; uses `useSyncExternalStore`; reads `navigator.onLine` |
| `src/components/ui/OfflineBanner.tsx` | Subtle offline notification banner | VERIFIED | Exports `OfflineBanner`; contains "Offline modus — data kan verouderd zijn"; uses `useOnlineStatus` |
| `src/lib/offline-queue.ts` | Zustand store for offline mutation queue with conflict detection | VERIFIED | Exports `useOfflineQueue`; contains `persist(`, `name: 'offline-queue'`, `addMutation`, `syncAll`, `conflicted`, `updated_at`, `serverUpdatedAt > mutation.timestamp` |
| `src/db/operations.ts` | Supabase mutation wrappers that queue when offline | VERIFIED | Contains `queueIfOffline`, `useOfflineQueue`, `navigator.onLine`; 11 mutation functions wired |

---

## Key Link Verification

### Plan 01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `ReportDocument.tsx` | `PdfBarChart.tsx` | import + render in priceComparison section | WIRED | Line 11: `import { PdfBarChart, PROVIDER_CHART_COLORS } from './components/PdfBarChart'`; line 47: `<PdfBarChart data={chartData} title="Totaalkosten per aanbieder" />` |
| `ReportDocument.tsx` | `SchoolplanSection.tsx` | conditional render when schoolplanData exists | WIRED | Line 12: `import { SchoolplanSection } from './components/SchoolplanSection'`; line 89: `case 'schoolplan': return <SchoolplanSection ... />` |
| `dmu-filters.ts` | `ReportDocument.tsx` | getReportSections determines section order per DMU | WIRED | `ReportDocument.tsx` line 3: `import { getReportSections } from './dmu-filters'`; line 28: `const reportSections = getReportSections(config.reportType, config.dmuTarget)` |

### Plan 02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `ClipboardButton.tsx` | `clipboard.ts` | import and call buildClipboardContent + copyToClipboard | WIRED | Lines 2: `import { buildClipboardContent, copyToClipboard } from '@/lib/clipboard'`; lines 15-16: both called in handler |
| `ExportTab.tsx` | `ClipboardButton.tsx` | render ClipboardButton with reportData and config | WIRED | Line 15: `import { ClipboardButton }`; line 121: `<ClipboardButton config={config} data={reportData} disabled={!hasData} />` |

### Plan 03 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `vite.config.ts` | workbox generated service worker | VitePWA plugin generates SW at build time | WIRED | Build output: `dist/sw.js` + `dist/workbox-015121ed.js`; 15 entries precached |
| `RootLayout.tsx` | `OfflineBanner.tsx` | renders OfflineBanner at top of app | WIRED | `RootLayout.tsx` line 8: import; lines 71 and 84: two placements (mobile + desktop layout) |
| `OfflineBanner.tsx` | `useOnlineStatus.ts` | useOnlineStatus hook determines visibility | WIRED | Line 1: `import { useOnlineStatus }`; line 4: `const isOnline = useOnlineStatus()` |
| `operations.ts` | `offline-queue.ts` | queueIfOffline calls addMutation when offline | WIRED | Line 14: import; line 28: `useOfflineQueue.getState().addMutation(...)`; 11 mutation callsites |
| `offline-queue.ts` | `operations.ts` (Supabase) | syncAll() replays via Supabase with conflict detection | WIRED | Lines 47-103: dynamic `import('@/lib/supabase/client')` then applies each mutation; `updated_at` conflict check present |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `ExportTab.tsx` → `ReportDocument.tsx` | `reportData` | `useSchoolProfileStore`, `usePriceComparisonStore`, `calculateComparison()`, `calculateMigration()` | Yes — engine functions from real Zustand store state | FLOWING |
| `ExportTab.tsx` | `schoolplanOpportunities` | `useSchoolplanAnalysis(school?.id)` hook → Supabase query | Yes — mapped from live Supabase `schoolplan_analyses` table; guards against empty/null | FLOWING |
| `ClipboardButton.tsx` | `data: ReportData` | Passed from `ExportTab` as prop with real computed values | Yes — same `reportData` used for PDF | FLOWING |
| `OfflineBanner.tsx` | `isOnline` | `useSyncExternalStore(subscribe, getSnapshot)` → `navigator.onLine` | Yes — live browser API state | FLOWING |
| `offline-queue.ts` | `mutations[]` | Zustand + localStorage persist; populated by `queueIfOffline()` in operations.ts | Yes — persists across reloads; real mutation payloads | FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 40 unit tests pass (bar layout, DMU filters, summary bullets, clipboard, offline queue) | `npx vitest run ...` | 40/40 passed, 0 failed | PASS |
| Vite build generates service worker | `npx vite build` | `dist/sw.js` + `dist/workbox-015121ed.js` generated; 15 entries precached; exit 0 | PASS |
| `vite-plugin-pwa` installed | `grep vite-plugin-pwa package.json` | `"vite-plugin-pwa": "^1.2.0"` in devDependencies | PASS |
| PWA icons exist | `ls public/icon-192.png public/icon-512.png` | Both files present | PASS |
| `calculateBarLayout` pure function: empty data | Unit test | Returns `{ bars: [], ... }` without crash | PASS |
| Clipboard `buildClipboardContent` produces Dutch text with all DMU targets | Unit tests | 10/10 clipboard tests pass | PASS |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| EXPORT-01 | Plan 01 | PDF-rapport afgestemd op coordinator (focus: tijdwinst, dagelijks gebruik) | SATISFIED | `dmu-filters.ts`: coordinator summaryFocus='practical', timeSavings ordered before priceComparison; tested in dmu-filters.test.ts |
| EXPORT-02 | Plan 01 | PDF-rapport afgestemd op MT/directie (focus: overzicht, onderbouwing, strategische waarde) | SATISFIED | `dmu-filters.ts`: mt summaryFocus='strategic', multiYear first; `PdfBarChart` provides visual overview; tested |
| EXPORT-03 | Plan 01 | PDF-rapport afgestemd op finance (focus: euro's, meerjarenprojectie, terugverdientijd) | SATISFIED | `dmu-filters.ts`: finance summaryFocus='financial', priceComparison first; `getSummaryBullets` includes break-even; tested |
| EXPORT-04 | Plan 01 | PDF bevat schoolspecifieke data, Cito-huisstijl, bronvermelding en disclaimer | SATISFIED | `styles.ts`: #003082/#FF6600 colors; `ReportDocument.tsx`: school name in header + disclaimer with source attribution and confidentiality notice |
| EXPORT-05 | Plan 02 | Vergelijking kopiëren naar clipboard als geformatteerde samenvatting | SATISFIED | `clipboard.ts`: buildClipboardContent produces HTML+plain; ClipboardButton wired in ExportTab; 10 unit tests pass |
| ARCH-05 | Plan 03 | Applicatie werkt offline op tablet na eerste laden (service worker cacht assets en data) | SATISFIED | VitePWA generates sw.js; precaches 15 entries; Supabase API cached StaleWhileRevalidate; mutation queue persists offline |

**All 6 requirements satisfied. No orphaned requirements.**

---

## Anti-Patterns Found

No blocking anti-patterns detected. Scan of all phase 12 files:

| File | Pattern Checked | Finding |
|------|----------------|---------|
| `PdfBarChart.tsx` | Empty returns, placeholder text | None — renders real SVG from data |
| `SchoolplanSection.tsx` | `return null` | Intentional guard for empty data — not a stub |
| `ReportDocument.tsx` | Hardcoded empty data | None — `chartData` computed from real `data.comparison.totals` |
| `clipboard.ts` | `return {}` / hardcoded strings | None — all content built from `ReportData` fields |
| `ClipboardButton.tsx` | `onClick={() => {}}` | None — handler calls `buildClipboardContent` + `copyToClipboard` |
| `offline-queue.ts` | `return []` / empty syncAll | None — syncAll queries Supabase and processes mutations |
| `operations.ts` | Missing offline wiring | None — 11 mutation functions confirmed wired |
| `OfflineBanner.tsx` | Hardcoded visibility | None — controlled by `useOnlineStatus` hook |

One informational note: `offline-queue.ts` `syncAll()` uses `console.error` for failed syncs (keeps them in queue for retry) — this is intentional behavior per plan spec.

---

## Human Verification Required

### 1. PDF visuele kwaliteitscheck

**Test:** Selecteer een school, stel 3 modules in, kies DMU-target 'finance', download PDF
**Expected:** PDF toont Cito-huisstijl (donkerblauw/oranje), staafdiagram met provider-kolommen, break-even tabel, disclaimer onderaan
**Why human:** react-pdf rendering kan niet headless getest worden

### 2. Offline-banner op tablet

**Test:** Open app op tablet of Chrome met Network throttling op 'Offline'
**Expected:** Amber banner verschijnt direct bovenaan de pagina met tekst "Offline modus — data kan verouderd zijn"; banner verdwijnt bij herstel verbinding
**Why human:** jsdom stuurt navigator.onLine altijd als true; vereist echte browser

### 3. Clipboard-functionaliteit

**Test:** Klik 'Kopieer naar clipboard' in ExportTab, plak in Teams of email
**Expected:** Knop toont "Gekopieerd!" gedurende 2 seconden; geplakte tekst bevat schoolnaam, EUR-bedragen per aanbieder, tijdwinst en DMU-conclusie
**Why human:** ClipboardItem API niet beschikbaar in jsdom testomgeving

### 4. Offline mutatie + sync

**Test:** Ga offline (network throttle), sla een gespreknotitie op, ga weer online
**Expected:** Opslag slaagt lokaal (geen foutmelding); bij reconnect wordt automatisch gesynchroniseerd; console.warn bij conflict
**Why human:** Vereist echte Supabase verbinding en browser network toggle

---

## Gaps Summary

No gaps found. All 15 must-have truths are verified, all artifacts exist and are substantive and wired, all data flows produce real data, all 40 unit tests pass, and the Vite build succeeds with service worker generation.

The phase achieves its goal: PDF-rapportgeneratie is DMU-afgestemd (coordinator/MT/finance) met visuele staafdiagrammen en optionele schoolplan-sectie; clipboard-export is volledig functioneel; de applicatie is een installeerbare PWA met offline caching, offline mutatie-queue en conflictdetectie bij reconnect.

---

_Verified: 2026-03-24T22:52:00Z_
_Verifier: Claude (gsd-verifier)_
