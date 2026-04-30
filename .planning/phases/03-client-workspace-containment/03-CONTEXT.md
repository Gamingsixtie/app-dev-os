# Phase 3: Client Workspace Containment - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase restores strict client-only containment for client cron jobs in the current workspace. It covers how the runtime resolves a client workspace, what a client cron job is allowed to read or list, where it is allowed to write, and what should happen when it tries to cross the boundary.

This phase does not broaden into a full permissions redesign for every task type. It also does not add a shared-root fallback system. The goal is simple: when a cron job belongs to a client, it must stay inside that client workspace and fail immediately if it tries to step outside.

</domain>

<decisions>
## Implementation Decisions

### Boundary Enforcement
- **D-01:** If a client cron job tries to read, list, or write outside its own client workspace, the run must stop immediately and fail.
- **D-02:** Boundary violations are execution failures, not warnings and not "finish first, fail later" cases.

### Allowed Write Scope
- **D-03:** A client cron job may write anywhere inside its own client folder.
- **D-04:** The allowed write boundary is the full selected client workspace, not only a smaller safe-folder allowlist like `projects/`, `brand_context/`, or `context/`.

### Shared Root Access
- **D-05:** If something exists only in the root workspace and not inside the selected client folder, the client cron job must still be blocked from reading it.
- **D-06:** There should be no runtime fallback that quietly reads shared root files during the client cron run.
- **D-07:** If shared material is needed for a client cron job, it must be present inside that client workspace before the run starts.

### the agent's Discretion
- The planner may choose the exact enforcement layers — for example working-directory control, runtime path guards, stricter Claude permission mode, output checks, or more than one guard together — as long as the user-visible outcome stays the same:
  - the client cron run stays inside its own client folder
  - boundary violations stop immediately
  - root fallback stays blocked

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and locked decisions
- `.planning/PROJECT.md` — overall recovery target, trusted reference folders, and baseline-preservation rule
- `.planning/REQUIREMENTS.md` — `CLNT-01`, `CLNT-02`, `CLNT-03`
- `.planning/ROADMAP.md` — Phase 3 goal, scope, and success criteria
- `.planning/STATE.md` — current phase state and known containment concern
- `.planning/phases/01-run-truth-regression-forensics/01-CONTEXT.md` — scheduled/manual separation and retry rules that must remain intact
- `.planning/phases/02-quiet-windows-background-execution/02-CONTEXT.md` — Windows runtime decisions that must remain intact

### Current client-scope code paths
- `projects/briefs/command-centre/src/lib/config.ts` — root and client workspace resolution
- `projects/briefs/command-centre/src/lib/clients.ts` — client directory discovery and client path resolution
- `projects/briefs/command-centre/src/lib/file-service.ts` — current path validation and base-directory enforcement
- `projects/briefs/command-centre/src/app/api/files/route.ts` — client-scoped directory listing guard
- `projects/briefs/command-centre/src/app/api/files/[...path]/route.ts` — client-scoped file read/write/move/delete guard
- `projects/briefs/command-centre/src/lib/gather-context.ts` — client-scoped brand-context loading
- `projects/briefs/command-centre/src/lib/process-manager.ts` — task execution working directory and current permission mode selection
- `projects/briefs/command-centre/src/lib/cron-runtime.js` — client cron workspace resolution, prompt shaping, output capture, and current containment checks

### Client workspace structure and expectations
- `.planning/codebase/STRUCTURE.md` — root vs client workspace layout
- `.planning/codebase/ARCHITECTURE.md` — client scope as a path switch across the app
- `docs/multi-client-guide.md` — intended client workspace model
- `scripts/add-client.sh` — generated client folder structure

### Trusted reference behavior
- `../AgenticOS - backup 2026-04-13 pre-merge/projects/briefs/command-centre/src/lib/cron-runtime.js` — pre-merge reference for known-good client cron containment behavior
- `../AgenticOS - backup 2026-04-13 pre-merge/projects/briefs/command-centre/src/lib/process-manager.ts` — pre-merge reference for client task execution behavior
- `../AgenticOS - pr-cron-hardening/projects/briefs/command-centre/src/lib/cron-runtime.js` — cron-hardening reference for client cron containment behavior
- `../AgenticOS - pr-cron-hardening/projects/briefs/command-centre/src/lib/process-manager.ts` — cron-hardening reference for client task execution behavior

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `file-service.ts` already has a strong "stay inside baseDir" path check. The UI file routes use it with a client-specific base directory.
- `gather-context.ts` already loads brand files from the selected client folder when `clientId` is present.
- `cron-runtime.js` already knows how to resolve client workspaces, store client-specific cron jobs, and detect output leaks back into the root workspace after a run.

### Established Patterns
- Client scoping already exists in the UI-facing file APIs, but the actual cron execution path still runs Claude with full auto permissions.
- `process-manager.ts` and `cron-runtime.js` both set the working directory to the selected client folder when `clientId` exists, so part of the isolation model is already there.
- Current cron containment is stronger for writes after the run than for reads during the run. That means the runtime can detect some bad output today, but it does not yet fully prevent the wrong access before it happens.

### Integration Points
- Client folder resolution starts in `config.ts` and `clients.ts`.
- UI-side file containment lives in `file-service.ts` plus the `/api/files` routes.
- Client task execution lives in `process-manager.ts`.
- Client cron execution lives in `cron-runtime.js`.
- The likely Phase 3 enforcement point is where client cron jobs are launched, because that is where the hard runtime boundary still needs to become real.

</code_context>

<specifics>
## Specific Ideas

- The user wants client containment to be a hard sandbox, not a soft preference.
- "Blocked from reading it" applies even when the file exists in the root workspace and would be convenient to reuse.
- The user explicitly prefers a full-client-folder boundary over a smaller safe-folder allowlist inside the client workspace.

</specifics>

<deferred>
## Deferred Ideas

- A separate sync or copy system for shared root material can be planned later if needed, but it is not part of this phase unless it is the minimum support needed to keep client cron jobs working without root reads.
- Broader non-cron permission cleanup across the whole Command Centre remains outside this phase.

</deferred>

---

*Phase: 03-client-workspace-containment*
*Context gathered: 2026-04-14*
