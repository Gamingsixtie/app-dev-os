# Roadmap: Cron Jobs Hardening Recovery

## Overview

This roadmap restores the cron regressions in the current Agentic OS workspace without throwing away the newer features that already exist here. The build order starts by tracing and fixing the duplicate-execution path, then splits into Windows background behavior and client workspace containment, and finishes with a validation gate that proves the current baseline still works.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Run Truth & Regression Forensics** - Identify the concrete regression path and restore single execution per scheduled cron trigger.
- [x] **Phase 2: Quiet Windows Background Execution** - Return Windows daemon-driven cron execution to hidden background behavior.
- [x] **Phase 3: Client Workspace Containment** - Re-establish strict client-only visibility and writes for client cron jobs.
- [ ] **Phase 4: Baseline Preservation & Regression Validation** - Prove the recovered branch keeps the current feature baseline and root cron behavior intact.

## Phase Details

### Phase 1: Run Truth & Regression Forensics
**Goal**: Restore trustworthy one-run execution behavior and document what diverged from the trusted references.
**Depends on**: Nothing (first phase)
**Requirements**: [EXEC-01, EXEC-02, EXEC-03, SAFE-03]
**Success Criteria** (what must be TRUE):
  1. One scheduled cron trigger results in exactly one underlying prompt execution in the current workspace.
  2. One scheduled cron run produces exactly one assistant reply sequence in chat history.
  3. Recovery or retry logic no longer replays the same scheduled prompt unless a rerun is explicitly requested.
  4. The regression path is traced to a concrete code path or merge difference, using `pre-merge` and `pr-cron-hardening` as trusted references when needed.
**Plans**: 01-01, 01-02

### Phase 2: Quiet Windows Background Execution
**Goal**: Make Windows cron daemon and scheduled background execution hidden again without losing observability.
**Depends on**: Phase 1
**Requirements**: [WIN-01, WIN-02, WIN-03]
**Success Criteria** (what must be TRUE):
  1. Starting background cron execution on Windows does not open visible PowerShell windows.
  2. Scheduled Windows cron runs stay hidden during execution instead of popping up terminal windows.
  3. Hidden execution still preserves useful logs, status inspection, and clean stop behavior.
**Plans**: 2/2 plans complete

### Phase 3: Client Workspace Containment
**Goal**: Ensure client cron runs are scoped to the selected client workspace rather than the repo root.
**Depends on**: Phase 1
**Requirements**: [CLNT-01, CLNT-02, CLNT-03]
**Success Criteria** (what must be TRUE):
  1. A client cron job resolves its working scope to the selected client folder only.
  2. A client cron job cannot read or enumerate files outside its allowed client workspace during prompt preparation or execution.
  3. Files created by a client cron job land only inside allowed directories for that client workspace.
**Plans**: 2/2 plans complete

### Phase 4: Baseline Preservation & Regression Validation
**Goal**: Verify that the fixes preserve the current feature baseline and do not break root workspace cron behavior.
**Depends on**: Phase 2, Phase 3
**Requirements**: [SAFE-01, SAFE-02]
**Success Criteria** (what must be TRUE):
  1. Existing cron-related features that already work in this folder still work after the recovery changes.
  2. Root workspace cron behavior still works after the client containment fixes are applied.
  3. The final recovered branch matches the intended behavior from the trusted references where expected, and any intentional differences are explicitly noted.
**Plans**: TBD

## Execution Notes

- Phase 1 is the dependency anchor because both Windows execution and client containment depend on understanding the broken execution path first.
- After Phase 1, Phase 2 and Phase 3 can run in parallel where practical.
- Phase 4 is the end-to-end validation gate and should happen before any merge or release decision.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Run Truth & Regression Forensics | 2/2 | Complete | 2026-04-14 |
| 2. Quiet Windows Background Execution | 2/2 | Complete | 2026-04-14 |
| 3. Client Workspace Containment | 2/2 | Complete | 2026-04-14 |
| 4. Baseline Preservation & Regression Validation | 0/TBD | Not started | - |
