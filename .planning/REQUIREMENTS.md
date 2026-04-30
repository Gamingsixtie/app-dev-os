# Requirements: Cron Jobs Hardening Recovery

**Defined:** 2026-04-13
**Core Value:** Cron jobs must run once, invisibly in the background on Windows, and only within the correct workspace boundary without breaking the features that already work in this folder.

## v1 Requirements

Requirements for the recovery release in this workspace. Each maps to roadmap phases.

### Execution Integrity

- [x] **EXEC-01**: A single scheduled cron trigger creates exactly one underlying prompt execution
- [x] **EXEC-02**: A single scheduled cron run produces exactly one assistant reply sequence in its chat history
- [x] **EXEC-03**: Recovery or retry paths do not re-run the same scheduled prompt unless the rerun is explicitly requested

### Windows Background Execution

- [x] **WIN-01**: User can start background cron execution on Windows without visible PowerShell windows opening
- [x] **WIN-02**: Scheduled Windows cron runs stay hidden during execution instead of showing PowerShell popups
- [x] **WIN-03**: Hidden Windows cron runs still preserve usable status, logs, and stop behavior

### Client Workspace Containment

- [x] **CLNT-01**: A client cron job resolves its working scope to the selected client workspace instead of the repo root
- [x] **CLNT-02**: A client cron job cannot read or enumerate files outside its allowed client workspace during prompt preparation or execution
- [x] **CLNT-03**: Files created by a client cron job are written only inside allowed directories for that client workspace

### Regression Safety

- [ ] **SAFE-01**: Existing cron-related features that already work in this folder continue working after the recovery changes
- [ ] **SAFE-02**: Root workspace cron behavior still works after the client containment fixes are applied
- [x] **SAFE-03**: The recovery work records the concrete code path or merge difference that caused each regression, using the trusted reference folders when needed

## v2 Requirements

Deferred improvements beyond the immediate recovery scope.

### Cron UX

- **CRONUX-01**: CLI cron commands present richer, easier-to-scan summaries for non-technical users
- **CRONUX-02**: Runtime ownership between UI and daemon is surfaced more clearly across all cron views

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full cron architecture rewrite | Recovery should preserve the current architecture where possible |
| Treating `merge-lab` as the target implementation | It is only a secondary diagnostic reference |
| Rolling this folder back to an older snapshot | The user wants to keep the newer features already present here |
| Broad non-cron refactors across the repo | Only supporting fixes required for the regressions should be included |
| New cloud or OS-native scheduler backends | Not needed to restore the broken local behavior |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| EXEC-01 | Phase 1 | Complete |
| EXEC-02 | Phase 1 | Complete |
| EXEC-03 | Phase 1 | Complete |
| WIN-01 | Phase 2 | Complete |
| WIN-02 | Phase 2 | Complete |
| WIN-03 | Phase 2 | Complete |
| CLNT-01 | Phase 3 | Complete |
| CLNT-02 | Phase 3 | Complete |
| CLNT-03 | Phase 3 | Complete |
| SAFE-01 | Phase 4 | Pending |
| SAFE-02 | Phase 4 | Pending |
| SAFE-03 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-13*
*Last updated: 2026-04-14 after Phase 3 completion*
