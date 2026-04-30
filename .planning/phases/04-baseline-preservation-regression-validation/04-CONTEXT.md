# Phase 4: Baseline Preservation & Regression Validation - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase is the proof gate for the cron recovery work already completed in this branch. It verifies that the recovered cron behaviors still work together in the current folder and that the Phase 3 client containment changes did not break root workspace cron behavior.

This phase does not broaden into a general UI sweep, a broad Command Centre regression pass, or a manual smoke-test campaign. It is focused on the cron behaviors already recovered and on proving them through the validation method the user chose.

</domain>

<decisions>
## Implementation Decisions

### Baseline Coverage
- **D-01:** Phase 4 should prove only the recovered cron behaviors, not a broader set of non-cron or UI behaviors.
- **D-02:** Validation scope should stay tied to the cron runtime and the cron-related behavior already repaired in Phases 1 to 3.

### Root Workspace Proof
- **D-03:** Root workspace cron behavior should be proven with automated tests only.
- **D-04:** Phase 4 should not require manual root smoke tests unless planning discovers there is no safe automated way to prove the locked requirement.

### Reference Drift Policy
- **D-05:** Differences from `pre-merge` or `pr-cron-hardening` should only be changed if the current behavior is not the desired behavior.
- **D-06:** If the current branch behavior is already correct, harmless drift from the reference folders can stay and should just be noted clearly.

### the agent's Discretion
- The planner may choose the exact validation shape — for example expanding current cron tests, adding regression tests around root-vs-client behavior, or adding comparison-oriented assertions — as long as the proof stays centered on:
  - recovered cron behaviors in this branch
  - root workspace cron still working after containment
  - intentional versus unintentional drift from the trusted references

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and locked decisions
- `.planning/PROJECT.md` — recovery target, trusted references, and baseline-preservation rule
- `.planning/REQUIREMENTS.md` — `SAFE-01`, `SAFE-02`, plus completed execution and containment requirements that Phase 4 must preserve
- `.planning/ROADMAP.md` — Phase 4 goal, scope, and success criteria
- `.planning/STATE.md` — current validation-gate status and remaining concern
- `.planning/phases/01-run-truth-regression-forensics/01-CONTEXT.md` — one-run truth, duplicate handling, retry policy, and manual-run separation
- `.planning/phases/02-quiet-windows-background-execution/02-CONTEXT.md` — hidden Windows behavior, failure surfacing, and Git Bash regression expectations
- `.planning/phases/03-client-workspace-containment/03-CONTEXT.md` — client workspace boundary rules that must not break root cron behavior

### Current validation and runtime code paths
- `projects/briefs/command-centre/src/lib/cron-runtime.js` — shared cron runtime behavior, root/client launch path handling, notifications, retries, and containment checks
- `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs` — current cron regression coverage across runtime ownership, root/client launch behavior, Windows launch handling, notifications, and containment
- `projects/briefs/command-centre/src/lib/process-manager.test.cjs` — duplicate-start protection coverage at the task execution layer
- `projects/briefs/command-centre/src/lib/queue-watcher.test.cjs` — duplicate queue-event protection and recovery-row behavior coverage

### Root and multi-workspace expectations
- `docs/multi-client-guide.md` — intended root-plus-clients cron model and shared leader lock expectations
- `scripts/start-crons.ps1` — Windows daemon start behavior that was restored in Phase 2
- `scripts/start-crons.sh` — shell daemon start behavior for the managed runtime
- `scripts/status-crons.ps1` — Windows runtime status entry point
- `scripts/logs-crons.ps1` — Windows runtime log entry point

### Trusted reference behavior
- `../AgenticOS - backup 2026-04-13 pre-merge/projects/briefs/command-centre/src/lib/cron-runtime.js` — trusted reference for intended cron behavior before the merge regression path
- `../AgenticOS - pr-cron-hardening/projects/briefs/command-centre/src/lib/cron-runtime.js` — trusted reference for cron hardening behavior expected to survive in the recovered branch

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `cron-runtime.test.cjs` already covers the main repaired areas from Phases 1 to 3: duplicate protection, retry caps, root-vs-client launch args, containment, Windows launch planning, Git Bash discovery, notifications, and shared failure finalization.
- `process-manager.test.cjs` and `queue-watcher.test.cjs` already cover the earlier duplicate-start protections that Phase 4 needs to preserve.

### Established Patterns
- The project already treats cron regression proof as automated Node tests under `projects/briefs/command-centre/src/lib/`.
- Root and client behavior are now intentionally different in one key way: root cron runs keep the broad bypass path, while client cron runs use the stricter client-only boundary.
- The runtime already centralizes most cron truth in `cron-runtime.js`, so Phase 4 can validate a large part of the recovered behavior without widening into unrelated app surfaces.

### Integration Points
- Validation will likely center on `cron-runtime.test.cjs`, with support from `process-manager.test.cjs` and `queue-watcher.test.cjs`.
- Any extra proof for root workspace safety should attach to the existing root/client launch and containment assertions rather than creating a separate manual-only validation path.

</code_context>

<specifics>
## Specific Ideas

- The user wants Phase 4 to validate only the covered cron behaviors, not to reopen the wider app baseline.
- The user explicitly prefers automated proof only for root workspace cron behavior.
- The user does not want reference folders treated as automatic source of truth when the current branch behavior is already the desired one.

</specifics>

<deferred>
## Deferred Ideas

- Wider manual smoke testing for cron UI surfaces can happen later if needed, but it is not part of the locked Phase 4 validation scope.
- Broader non-cron regression validation across the Command Centre remains outside this phase.

</deferred>

---

*Phase: 04-baseline-preservation-regression-validation*
*Context gathered: 2026-04-14*
