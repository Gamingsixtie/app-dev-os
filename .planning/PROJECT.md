# Cron Jobs Hardening Recovery

## What This Is

This project restores cron behaviors that regressed in the current Agentic OS workspace while keeping the newer features that already exist in this folder. The work focuses on scheduled-task execution truth, hidden Windows background execution, and strict client-workspace containment, using `C:\Users\gmsal\Code Projects\AgenticOS - backup 2026-04-13 pre-merge` and `C:\Users\gmsal\Code Projects\AgenticOS - pr-cron-hardening` as trusted reference points.

## Core Value

Cron jobs must run once, invisibly in the background on Windows, and only within the correct workspace boundary without breaking the features that already work in this folder.

## Requirements

### Validated

- ✓ Managed cron scheduling already exists across the root workspace and client workspaces — existing
- ✓ The Command Centre UI already manages cron jobs and can trigger cron runs — existing
- ✓ CLI scripts already exist for starting, stopping, checking status, and viewing daemon logs — existing
- ✓ Client workspaces, client switching, and client-specific cron job concepts already exist in the current codebase — existing
- ✓ The current folder contains newer cron-related features that must be preserved during recovery — existing
- ✓ A scheduled cron run now executes its underlying prompt once per trigger, so duplicate or triple replies no longer start from duplicate queue events — validated in Phase 1
- ✓ Retry and completion behavior now follow one runtime-owned path, and the concrete regression drift is documented from the trusted references — validated in Phase 1
- ✓ Windows cron start now returns immediately and scheduled Windows cron runs use the hidden direct Claude path again for the normal `claude` / `.exe` case — validated in Phase 2
- ✓ Hidden Windows cron outcomes now keep status, logs, and desktop notifications aligned, including execution-blocking failures — validated in Phase 2
- ✓ Client cron runs now launch with a real client-only Claude boundary instead of inheriting root bypass permissions — validated in Phase 3
- ✓ Client cron runs now fail clearly if they touch files outside their own client workspace, while still allowing writes anywhere inside that client folder — validated in Phase 3

### Active

- [ ] Regression fixes are applied in this folder without removing or breaking the newer features already present here

### Out of Scope

- Rebuilding the cron system from scratch — this is recovery and hardening on top of the current architecture
- Treating `C:\Users\gmsal\Code Projects\AgenticOS - merge-lab 2026-04-13` as the source of truth — it is only a secondary check if needed
- Rolling the current folder fully back to an older branch snapshot — the goal is to keep current features, not replace them
- Broad unrelated refactors outside cron/runtime/client-containment behavior — only supporting changes that are necessary for the fixes should be included

## Context

This repository is a brownfield Agentic OS workspace with an existing codebase map under `.planning/codebase/`. The Command Centre app in `projects/briefs/command-centre/` already handles cron scheduling, task execution, client switching, and runtime coordination. The current branch has regressions that were reportedly already fixed in two other local folders: `C:\Users\gmsal\Code Projects\AgenticOS - backup 2026-04-13 pre-merge` and `C:\Users\gmsal\Code Projects\AgenticOS - pr-cron-hardening`. Those two folders are the trusted references if recovery work needs comparison or selective restoration. `C:\Users\gmsal\Code Projects\AgenticOS - merge-lab 2026-04-13` may help explain what happened, but it is not important as a target state. Success means the current workspace regains the three missing behaviors while preserving the current feature baseline.

## Constraints

- **Baseline Preservation**: Keep the current folder as the final source of truth — do not replace it with an older snapshot
- **Reference Sources**: Prefer `pre-merge` and `pr-cron-hardening` when looking for known-good fixes — they are expected to complement each other
- **Workspace Safety**: Client jobs must stay contained to their own client directories — this is a hard boundary, not a UI preference
- **Platform**: Windows background cron behavior must remain hidden during daemon-driven execution
- **Scope Control**: Focus on the three regressions and the minimum supporting changes needed to preserve current features
- **Diagnosis**: Check whether `merge-lab` shows unfinished or deviated work only if that helps explain the regression path

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep this folder as the recovery target | The user wants the final working version here, not in a reference folder | ✓ Good |
| Use `pre-merge` and `pr-cron-hardening` as trusted references | The user confirmed they contain good information for these fixes | ✓ Good |
| Treat `merge-lab` only as a diagnostic checkpoint | The user does not want it treated as the target implementation | ✓ Good |
| Preserve all currently working features as the baseline | Recovery must not remove newer work already present in this folder | — Pending |
| Investigate the regression path enough to avoid repeating it | Understanding whether the break came from an incomplete or wrong merge helps protect future merges | ✓ Good |
| Use one runtime-owned cron completion helper | Split completion ownership caused drift in run history and retry truth | ✓ Good |
| Restore Windows cron launches to a direct hidden Claude path for normal runs | The PowerShell wrapper became the main Windows regression drift from the trusted references | ✓ Good |
| Surface blocking Windows cron failures through the same finalization path as normal completions | Hidden background runs must not fail silently | ✓ Good |
| Client cron runs must carry their own Claude launch boundary | Prompt text alone was too weak to stop cross-workspace access | ✓ Good |
| Outside-workspace client mutations must fail through the normal cron failure path | Boundary breaks need truthful status, logs, and notifications | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-14 after Phase 3 completion*
