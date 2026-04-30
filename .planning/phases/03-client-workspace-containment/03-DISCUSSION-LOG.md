# Phase 3: Client Workspace Containment - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 03-client-workspace-containment
**Areas discussed:** Violation handling, Allowed write scope, Shared root access

---

## Violation handling

| Option | Description | Selected |
|--------|-------------|----------|
| Stop immediately and fail | End the run the moment it crosses the boundary | ✓ |
| Finish then fail | Let the run complete, then mark it failed after | |
| Warning only | Keep running and just record the boundary issue | |

**User's choice:** Stop immediately and fail.
**Notes:** The client boundary is a hard rule. The user does not want soft containment.

---

## Allowed write scope

| Option | Description | Selected |
|--------|-------------|----------|
| Anywhere in the client folder | Any path is allowed as long as it stays inside the selected client workspace | ✓ |
| Safe content folders only | Restrict writes to folders like `projects/`, `brand_context/`, `context/`, and `cron/` | |
| Projects only | Restrict writes to `projects/` and block other client-local folders | |

**User's choice:** Anywhere in the client folder.
**Notes:** The hard boundary is the client workspace root, not a smaller allowlist inside it.

---

## Shared root access

| Option | Description | Selected |
|--------|-------------|----------|
| Block it | If the file exists only in the root workspace, the client cron run still cannot read it | ✓ |
| Allow shared root docs/skills | Permit some reads from root for shared materials | |
| Sync/copy first, then block | Copy shared material into the client workspace first, then keep the run blocked from root | |

**User's choice:** Block it.
**Notes:** No runtime fallback to root reads. If something is needed, it must already be inside the client workspace.

---

## the agent's Discretion

- The exact technical enforcement method is open for planning, as long as the visible behavior matches the locked decisions.

## Deferred Ideas

- A future sync/copy mechanism for shared root material may be useful, but it is not part of the locked Phase 3 decision set.
