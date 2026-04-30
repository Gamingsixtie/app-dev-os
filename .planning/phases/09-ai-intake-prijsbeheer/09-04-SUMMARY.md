---
phase: 09-ai-intake-prijsbeheer
plan: 04
subsystem: api, ui, storage
tags: [pdf-parse, xlsx, mammoth, supabase-storage, document-upload, ai-extraction, drag-drop]

requires:
  - phase: 09-ai-intake-prijsbeheer
    plan: 01
    provides: "useSchoolPrices hooks, PriceDeviationWarning, checkPriceDeviation, SchoolPriceEntry type"
  - phase: 09-ai-intake-prijsbeheer
    plan: 03
    provides: "PriceManager component, ProductsTab with price management"

provides:
  - "Vercel serverless function for document parsing and AI price extraction (api/extract-document.ts)"
  - "Client-side upload orchestration to Supabase Storage + API call (src/lib/document-parser.ts)"
  - "Drag-and-drop file upload zone with format validation (DocumentDropzone)"
  - "Extracted prices displayed in DiffView format with checkboxes (DocumentExtractionPreview)"
  - "Supabase Storage documents bucket with RLS policies"

affects: [price-comparison, school-profile, productstab]

tech-stack:
  added: [pdf-parse, xlsx, mammoth]
  patterns:
    - "Supabase Storage upload-then-serverless pattern to avoid 4.5MB body limit"
    - "Document text extraction dispatched by file extension in serverless function"
    - "Claude Haiku price extraction from unstructured document text"

key-files:
  created:
    - supabase/migrations/003_create_documents_bucket.sql
    - api/extract-document.ts
    - src/lib/document-parser.ts
    - src/features/school-profile/components/DocumentDropzone.tsx
    - src/features/school-profile/components/DocumentExtractionPreview.tsx
  modified:
    - src/features/school-profile/tabs/ProductsTab.tsx
    - package.json

key-decisions:
  - "Inline getAuthHeaders in document-parser.ts to avoid circular import with ai-intake.ts"
  - "Return empty array (not error) when Claude cannot extract prices from document text"
  - "File extension-based text extraction dispatch in serverless function"

patterns-established:
  - "Supabase Storage upload path: {schoolId}/{timestamp}-{filename} for unique storage paths"
  - "DocumentExtractionPreview reuses DiffViewItem and DiffViewSection from Plan 02"
  - "Extracted prices create SchoolPriceEntry with source = document filename for audit trail"

requirements-completed: [PRIJSMGT-03, PRIJSMGT-04]

duration: 3min
completed: 2026-03-22
---

# Phase 09 Plan 04: Document Upload & AI Price Extraction Summary

**Document upload to Supabase Storage with serverless PDF/Excel/Word/CSV parsing via pdf-parse/SheetJS/mammoth, Claude Haiku price extraction, and diff-view preview with per-price import checkboxes**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T21:10:48Z
- **Completed:** 2026-03-22T21:14:30Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Serverless function downloads documents from Supabase Storage, extracts text using pdf-parse (PDF), SheetJS (Excel), mammoth (Word), or direct buffer read (CSV/text), and sends to Claude Haiku for price extraction
- DocumentDropzone with HTML5 drag-and-drop and click-to-select, file type validation, processing spinner, and error display
- DocumentExtractionPreview shows extracted prices in DiffView format with per-price checkboxes, deviation warnings, and conflict detection against existing school prices
- ProductsTab extended with "Document uploaden" button that toggles dropzone, extraction preview, and confirmation flow that creates SchoolPriceEntry records

## Task Commits

Each task was committed atomically:

1. **Task 1: Documents bucket, serverless extraction endpoint, and upload orchestration** - `7bec784` (feat)
2. **Task 2: DocumentDropzone, DocumentExtractionPreview, and ProductsTab integration** - `fb28891` (feat)

## Files Created/Modified
- `supabase/migrations/003_create_documents_bucket.sql` - Supabase Storage bucket creation with RLS policies for authenticated upload and service role download
- `api/extract-document.ts` - Vercel serverless function: auth verification, Storage download, text extraction by format, Claude Haiku price extraction
- `src/lib/document-parser.ts` - Client-side uploadAndExtract function: file validation, Storage upload, API call orchestration
- `src/features/school-profile/components/DocumentDropzone.tsx` - Drag-and-drop zone with format validation, processing state, error display
- `src/features/school-profile/components/DocumentExtractionPreview.tsx` - Extracted prices in DiffView with checkboxes, deviation warnings, confirm/cancel CTAs
- `src/features/school-profile/tabs/ProductsTab.tsx` - Extended with document upload button, dropzone toggle, extraction flow, price import
- `package.json` - Added pdf-parse, xlsx, mammoth as dependencies

## Decisions Made
- Inlined getAuthHeaders in document-parser.ts instead of importing from ai-intake.ts to avoid potential circular import issues
- Serverless function returns empty array (200 OK) when no prices can be extracted, rather than an error -- this allows the UI to show a clean "no prices found" message
- File extension-based dispatch for text extraction rather than MIME type detection, matching the plan specification

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## Known Stubs
None - all components are fully wired to Supabase Storage, serverless API, and school_prices table via React Query hooks.

## User Setup Required
- Supabase Storage `documents` bucket must be created. Either apply `supabase/migrations/003_create_documents_bucket.sql` via Supabase CLI (`npx supabase db push`) or run the SQL directly in the Supabase dashboard SQL editor.

## Next Phase Readiness
- Document upload and AI extraction flow complete, ready for end-to-end testing
- All price management features (manual, AI intake, document upload) now integrated in ProductsTab
- Plan 05 (if any) can build on the extraction preview pattern for additional document types

## Self-Check: PASSED

- All 6 key files verified present on disk
- Commit 7bec784 verified in git log
- Commit fb28891 verified in git log
- Vite production build succeeds

---
*Phase: 09-ai-intake-prijsbeheer*
*Completed: 2026-03-22*
