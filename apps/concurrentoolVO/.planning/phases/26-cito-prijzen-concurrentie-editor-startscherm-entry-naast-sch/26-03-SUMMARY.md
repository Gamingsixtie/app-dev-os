---
phase: 26-cito-prijzen-concurrentie-editor
plan: 03
subsystem: price-list multi-format export
tags: [wave-1, export, pdf, html, word, txt, lazy-loading, cito-branding]
requires:
  - PROVIDER_CONFIGS (read-only via @/data/providers/index)
  - @react-pdf/renderer (already in package.json from existing export feature)
  - PrijzenPage shell (from 26-01) + tab composition (from 26-02)
provides:
  - PriceListSnapshot view-model (single source of truth across all 4 formats)
  - renderPriceListTxt: pure fn → tab-separated string
  - renderPriceListHtml: pure fn → styled HTML string with Cito branding
  - renderPriceListWordBlob: async fn → Word .docx Blob via lazy docx
  - PriceListPdf: React-PDF Document component
  - PriceListExportButton: dropdown with 4 formats (PDF/HTML/Word/TXT)
affects:
  - apps/concurrentoolVO/src/features/pricing/PrijzenPage.tsx (added export-button row above tabs)
  - apps/concurrentoolVO/package.json (replaced html-docx-js with docx — Vite 8 compat)
tech-stack:
  added: [docx ^9.6.1]
  removed: [html-docx-js ^0.3.1]
  patterns:
    - Lazy dynamic imports for heavy libs (@react-pdf/renderer, docx) — only fetched on click
    - Pure functions for TXT/HTML/snapshot-builder (no DOM, no React, runtime-agnostic)
    - Blob URL download (createObjectURL + anchor.click() + revokeObjectURL)
    - React-PDF Document component for PDF (mirrors src/features/export/pdf/ pattern)
key-files:
  created:
    - apps/concurrentoolVO/src/features/pricing/export/price-list-snapshot.ts
    - apps/concurrentoolVO/src/features/pricing/export/price-list-txt.ts
    - apps/concurrentoolVO/src/features/pricing/export/price-list-html.ts
    - apps/concurrentoolVO/src/features/pricing/export/price-list-word.ts
    - apps/concurrentoolVO/src/features/pricing/pdf/PriceListPdf.tsx
    - apps/concurrentoolVO/src/features/pricing/components/PriceListExportButton.tsx
  deleted:
    - apps/concurrentoolVO/src/types/html-docx-js.d.ts (no longer needed; docx has built-in types)
  modified:
    - apps/concurrentoolVO/src/features/pricing/PrijzenPage.tsx (import + export button row)
    - apps/concurrentoolVO/package.json
    - apps/concurrentoolVO/package-lock.json
decisions:
  - D-12: PDF via @react-pdf/renderer lazy (honored)
  - D-13: HTML = client-side string-builder + Blob (honored)
  - D-14: Word library — planner chose html-docx-js (~50KB) but it has legacy 'with' statements
    incompatible with Vite 8/rolldown. Fell back to docx@9.6.1 (~150KB) per documented fallback.
    Word output built directly from PriceListSnapshot using docx primitives instead of HTML→OOXML.
  - D-15: TXT = pure function (honored)
  - D-16: One dropdown button with 4 options (honored)
  - D-17: Header + NL date + disclaimer in every format (honored)
  - D-18: Logo fallback = "CITO" text in cito-primary (honored — no logo asset; text only)
deviations:
  - Word library swap: html-docx-js → docx. Reason: Vite 8 build refuses to parse 'with' statement
    in html-docx-js dist bundle. Bundle-size impact: +100KB lazy (only loaded on Word-export click).
    Documented in commit 84d5319.
metrics:
  duration: ~30 minutes (incl. html-docx-js → docx fallback)
  completed: 2026-05-14
  commits: 5 (Task 1 snapshot/TXT/HTML, Task 2 Word w/ html-docx-js, Task 3 PDF, fix swap to docx, Task 4 button)
  tasks: 4/4
---

# Phase 26 Plan 03: Multi-Format Price-List Export — Summary

Wave 1 deliverable: a single "Exporteer prijslijst" button on `/prijzen` that lets managers download the current `PROVIDER_CONFIGS` snapshot in 4 formats — PDF, HTML, Word, or TXT. Cito-branding, NL date, and disclaimer in every format.

## What was built

**Pure snapshot builder** (`price-list-snapshot.ts`): reads `PROVIDER_CONFIGS` → produces a flat `PriceListSnapshot` view-model with title, NL-formatted date (`14 mei 2026`), per-provider rows (label + pricing-type + humanized description), and the disclaimer. No DOM, no React, runtime-agnostic.

**Format renderers** (all in `src/features/pricing/export/`):
- `renderPriceListTxt(snapshot)` — pure fn → tab-separated string with section headers
- `renderPriceListHtml(snapshot)` — pure fn → styled HTML5 document string with Cito branding (`#003082`)
- `renderPriceListWordBlob(snapshot)` — async fn lazy-imports `docx`, builds OOXML directly from snapshot using `Document` + `Paragraph` + `TextRun` + `HeadingLevel` primitives

**PDF template** (`src/features/pricing/pdf/PriceListPdf.tsx`): React-PDF `Document` component with Cito header (text-only "CITO" in `cito-primary`), per-provider sections, and italic disclaimer footer. Lazy-loaded via the export button.

**Dropdown button** (`src/features/pricing/components/PriceListExportButton.tsx`): single "Exporteer prijslijst ▾" button with 4 menu items. Outside-click closes the menu. Busy state disables the button during generation. Error state shows below the button if generation fails. PDF + Word use dynamic `import()` so heavy libraries (~150KB each) only land in the bundle when the user actually clicks that format.

**Wired into `PrijzenPage`**: the button sits right-aligned in a flex row above the tabs, visible only to managers (gate from 26-01).

## Decision deviation: D-14 fallback

CONTEXT D-14 picked `html-docx-js` (~50KB) as the Word library. During execution we discovered the published `dist/html-docx.js` bundle contains legacy `with(obj){...}` statements, which rolldown (Vite 8's bundler) refuses to parse:

```
[PARSE_ERROR] 'with' statements are not allowed
  at node_modules/html-docx-js/dist/html-docx.js:13147:1
```

Per D-14's documented fallback, we swapped to `docx@9.6.1`. Bundle cost: +100KB lazy (only on Word-export click). The Word renderer no longer reuses the HTML output as input; instead it builds OOXML directly from the snapshot using `docx` primitives, which is actually cleaner and avoids HTML→OOXML conversion fidelity issues.

Locked files (`src/data/default-prices.ts`, `cito-migration-prices.ts`) untouched.

## Verification

- `npm run build` exits 0
- `npx tsc --noEmit` exits 0
- `npx vitest run` — 921/921 tests pass
- Locked-files guard: `git diff main..HEAD -- src/data/default-prices.ts src/data/cito-migration-prices.ts` is empty

## Commits

1. `566f977` — snapshot builder + TXT + HTML renderers
2. `27e74cc` — Word renderer (initially with html-docx-js)
3. `3b77e05` — @react-pdf/renderer PriceListPdf document template
4. `84d5319` — **fix**: swap html-docx-js → docx (Vite 8 incompatibility)
5. `867aa81` — PriceListExportButton dropdown + PrijzenPage wiring

## Next step

`/gsd-execute-phase 26 --wave 1` continues with plan 26-04 (AI Excel-import).
