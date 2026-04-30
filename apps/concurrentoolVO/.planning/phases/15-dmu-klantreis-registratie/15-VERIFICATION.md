---
phase: 15-dmu-klantreis-registratie
verified: 2026-03-23T21:35:29Z
status: gaps_found
score: 4/5
re_verification: false
gaps:
  - truth: "Gebruiker kan filteren op engagement-status in het schooloverzicht (bijv. toon alle scholen met DMU in positief-fase)"
    status: failed
    reason: "getAllSchools() does not join contacts - returns empty contacts array from mapSchoolRow. DmuProgressIndicator returns null and DmuStatusFilter shows 0 counts for all statuses on the overview page."
    artifacts:
      - path: "src/db/operations.ts"
        issue: "getAllSchools (line 224-229) uses select('*, owner:users!owner_id(name)') without contacts(*) join. mapSchoolRow sets contacts: [] (line 51). Plan 03 required adding contacts(*) to the select but this was never done."
      - path: "src/features/school-overview/SchoolOverviewPage.tsx"
        issue: "References school.contacts for DMU filter logic (lines 146, 163) but receives empty arrays since getAllSchools does not load contacts."
      - path: "src/features/school-overview/DmuProgressIndicator.tsx"
        issue: "Receives empty contacts array on overview page, always returns null (no indicator shown)."
    missing:
      - "Add contacts(*) join to getAllSchools() select query in src/db/operations.ts"
      - "Map joined contact rows with mapContactRow in getAllSchools return"
  - truth: "KR-01 through KR-05 requirement IDs are not defined in REQUIREMENTS.md"
    status: partial
    reason: "ROADMAP references KR-01, KR-02, KR-03, KR-04, KR-05 as Phase 15 requirements, but REQUIREMENTS.md has no entries with KR- prefix. Requirements exist implicitly as Success Criteria in ROADMAP but are not formally tracked."
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "No KR-01 through KR-05 definitions exist. Traceability table does not include Phase 15 entries."
    missing:
      - "Add KR-01 through KR-05 formal definitions to REQUIREMENTS.md"
      - "Add Phase 15 entries to the Traceability table"
---

# Phase 15: DMU Klantreis Registratie Verification Report

**Phase Goal:** Accountmanager kan per school de DMU-contactpersonen volgen door de engagement-klantreis met 6 statussen (Nog niet benaderd, In gesprek, Positief, Wacht op intern, Akkoord, Afgehaakt), met DMU-beslissingsoverzicht, stagnatie-detectie en filtering
**Verified:** 2026-03-23T21:35:29Z
**Status:** gaps_found
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Gebruiker kan per DMU-contactpersoon een engagement-status instellen met 6 statussen | VERIFIED | EngagementStatusSelect renders all 6 statuses from ENGAGEMENT_STATUSES. DmuMatrix uses useSetEngagementStatus mutation. setEngagementStatus in operations.ts updates DB and logs system event. |
| 2 | Elke statuswijziging wordt vastgelegd als systeemevent met datum en optionele notitie | VERIFIED | setEngagementStatus (operations.ts:538-551) inserts into system_events with event_type 'engagement_changed', old/new status, contactName, and optional dropOffReason in metadata. |
| 3 | School-dashboard toont DMU-beslissingsoverzicht (matrix) met alle DMU-leden en huidige status | VERIFIED | DashboardTab.tsx (line 371-381) renders DmuMatrix with liveContacts from useContacts hook. Matrix shows 5-column table (Naam, DMU-rol, Bevoegdheid, Status, Wacht op) with responsive mobile card view. |
| 4 | Gebruiker kan filteren op engagement-status in het schooloverzicht | FAILED | DmuStatusFilter component exists and is wired into SchoolOverviewPage. However, getAllSchools() (operations.ts:224-229) does NOT join contacts -- it returns empty contacts arrays. All filter counts show 0. DmuProgressIndicator returns null on all cards. |
| 5 | Systeem toont stagnatie-detectie bij >30 dagen in dezelfde fase | VERIFIED | DmuMatrix renders stagnation badge (orange, showing "{N}d") when daysSince >= STAGNATION_THRESHOLD_DAYS (30). DmuProgressIndicator shows orange dot. STAGNATION_THRESHOLD_DAYS exported from models/school.ts. |

**Score:** 4/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/ui/EngagementBadge.tsx` | Badge with 6 status colors | VERIFIED | 29 lines, 6 color variants, sm/md sizes, follows PipelineBadge pattern |
| `src/features/school-profile/components/DmuMatrix.tsx` | 5-column table with status controls | VERIFIED | 252 lines, full table + mobile card view, stagnation badges, empty state, DropOffReasonDialog integration |
| `src/features/school-profile/components/DropOffReasonDialog.tsx` | Modal dialog with required reason | VERIFIED | 72 lines, role="dialog", mandatory reason textarea, Annuleren/Bevestigen buttons |
| `src/features/school-profile/components/EngagementStatusSelect.tsx` | Native select for inline changes | VERIFIED | 31 lines, all 6 statuses, aria-label, disabled support |
| `src/features/school-profile/components/WaitingForSelect.tsx` | Contact dropdown for wacht-op-intern | VERIFIED | 36 lines, filters out current contact, DMU position labels |
| `src/features/school-profile/components/DmuMismatchBanner.tsx` | Amber warning banner | VERIFIED | 92 lines, detects dmuAhead and pipelineAhead mismatches, actionable link |
| `src/features/school-overview/DmuProgressIndicator.tsx` | Compact DMU X/Y indicator | VERIFIED | 47 lines, positive/total count, orange stagnation dot, returns null when no contacts |
| `src/features/school-overview/DmuStatusFilter.tsx` | Filter chip row | VERIFIED | 52 lines, follows FilterBar pattern, "DMU:" label, counts per status |
| `supabase/migrations/005_engagement_status.sql` | DB migration | VERIFIED | 15 lines, 4 columns added, 2 indexes created |
| `src/features/school-profile/tabs/DashboardTab.tsx` | Extended with DMU matrix section | VERIFIED | DmuMatrix imported and rendered at line 371-381 with liveContacts |
| `src/features/school-overview/SchoolCard.tsx` | DmuProgressIndicator added | VERIFIED | Import at line 10, rendered at line 131 |
| `src/features/school-overview/PipelineKanbanView.tsx` | DmuProgressIndicator added | VERIFIED | Import at line 24, rendered at line 82 |
| `src/features/school-overview/SchoolOverviewPage.tsx` | DmuStatusFilter integrated | VERIFIED (wired but HOLLOW) | DmuStatusFilter rendered at line 211, filter state and counts at lines 58/143/161 -- but data is always empty arrays |
| `src/db/operations.ts` | getAllSchools with contacts join | FAILED | getAllSchools (line 224-229) still uses original query without contacts(*). mapContactRow exists but is not called in getAllSchools. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| DmuMatrix.tsx | useContacts.ts | useSetEngagementStatus mutation | WIRED | Import at line 11, mutation called at lines 42-46, 51-56, 63-66 |
| DashboardTab.tsx | DmuMatrix.tsx | JSX composition | WIRED | Import at line 19, rendered at line 372 with contacts and schoolId |
| DashboardTab.tsx | useContacts hook | useContacts(activeSchoolId) | WIRED | Import at line 20, data fetched at line 90, passed to DmuMatrix at line 374 |
| SchoolOverviewPage.tsx | DmuStatusFilter.tsx | JSX + filter state | WIRED | Import at line 23, state at line 58, rendered at line 211 |
| SchoolCard.tsx | DmuProgressIndicator.tsx | JSX composition | WIRED | Import at line 10, rendered at line 131 |
| PipelineKanbanView.tsx | DmuProgressIndicator.tsx | JSX composition | WIRED | Import at line 24, rendered at line 82 |
| operations.ts | contacts table | getAllSchools query | NOT_WIRED | getAllSchools does NOT include contacts(*) in select. Contacts data missing for overview. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| DmuMatrix (DashboardTab) | liveContacts | useContacts(activeSchoolId) -> getSchoolContacts | Yes - queries contacts table by schoolId | FLOWING |
| DmuProgressIndicator (SchoolCard) | school.contacts | useSchools -> getAllSchools | No - mapSchoolRow returns contacts: [] | DISCONNECTED |
| DmuProgressIndicator (KanbanView) | school.contacts | useSchools -> getAllSchools | No - mapSchoolRow returns contacts: [] | DISCONNECTED |
| DmuStatusFilter (SchoolOverviewPage) | school.contacts | useSchools -> getAllSchools | No - filter counts always 0 | DISCONNECTED |

### Behavioral Spot-Checks

Step 7b: SKIPPED (requires running dev server with Supabase connection)

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-----------|-------------|--------|----------|
| KR-01 | 15-02 | Not formally defined in REQUIREMENTS.md | ORPHANED | Referenced in ROADMAP but no definition exists. Mapped to Success Criterion 1 (engagement status per contact) -- implementation verified. |
| KR-02 | 15-02 | Not formally defined in REQUIREMENTS.md | ORPHANED | Referenced in ROADMAP but no definition exists. Mapped to Success Criterion 2 (system event logging) -- implementation verified. |
| KR-03 | 15-02, 15-03 | Not formally defined in REQUIREMENTS.md | ORPHANED | Referenced in ROADMAP but no definition exists. Mapped to Success Criterion 3 (DMU matrix) -- implementation verified. |
| KR-04 | 15-03 | Not formally defined in REQUIREMENTS.md | ORPHANED | Referenced in ROADMAP but no definition exists. Mapped to Success Criterion 4 (overview filtering) -- implementation FAILED due to missing contacts join. |
| KR-05 | 15-02, 15-03 | Not formally defined in REQUIREMENTS.md | ORPHANED | Referenced in ROADMAP but no definition exists. Mapped to Success Criterion 5 (stagnation detection) -- implementation verified. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/db/operations.ts | 51 | `contacts: []` hardcoded in mapSchoolRow | Blocker | getAllSchools returns empty contacts, breaking overview DMU features |

No TODO/FIXME/placeholder patterns found in any phase 15 files.

### Human Verification Required

### 1. DMU Matrix Visual Layout
**Test:** Open a school with 3+ contacts, navigate to Overzicht tab, verify DMU-beslissingsoverzicht table renders correctly
**Expected:** 5-column table with Naam, DMU-rol, Bevoegdheid, Status (dropdown), Wacht op. Stagnation badges in orange for old entries.
**Why human:** Visual layout, column alignment, and responsive mobile card view cannot be verified programmatically

### 2. DropOffReasonDialog Interaction
**Test:** Change a contact's status to "Afgehaakt" via the matrix dropdown
**Expected:** Modal appears with mandatory reason textarea, Bevestigen button disabled until text entered, cancel returns to previous status
**Why human:** Dialog interaction flow and visual appearance need human verification

### 3. Mismatch Banner Detection
**Test:** Set most DMU contacts to "Akkoord" while pipeline is still "prospect"
**Expected:** Amber banner appears with message about DMU being ahead of pipeline, with actionable "Pipeline bijwerken?" link
**Why human:** Complex state interaction and visual rendering need human eyes

### 4. Mobile Responsive Layout
**Test:** View DMU matrix on mobile viewport (<768px)
**Expected:** Table switches to card stack layout with label-value pairs per contact
**Why human:** Responsive breakpoint behavior needs visual verification

## Gaps Summary

**1 blocking gap found:**

The primary gap is that `getAllSchools()` in `src/db/operations.ts` does not join the contacts table. Plan 15-03 explicitly specified changing the select from `'*, owner:users!owner_id(name)'` to `'*, owner:users!owner_id(name), contacts(*)'` and mapping results with `mapContactRow`. This change was never made.

**Impact:** The DMU features on the school overview page (DmuProgressIndicator on school cards and kanban cards, DmuStatusFilter with per-status counts, DMU filter logic) are fully wired in the UI layer but receive empty data. The school profile dashboard (DashboardTab) is NOT affected -- it fetches contacts separately via `useContacts()` hook and the DMU matrix works correctly there.

**Secondary gap:** KR-01 through KR-05 are referenced as requirement IDs in ROADMAP.md but are not defined in REQUIREMENTS.md. The Phase 15 traceability entries are also missing from the requirements traceability table. This is a documentation gap, not a functional one.

---

_Verified: 2026-03-23T21:35:29Z_
_Verifier: Claude (gsd-verifier)_
