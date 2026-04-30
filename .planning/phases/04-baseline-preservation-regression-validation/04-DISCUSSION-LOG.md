# Phase 4: Baseline Preservation & Regression Validation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 04-baseline-preservation-regression-validation
**Areas discussed:** Baseline coverage, Root workspace proof, Reference drift policy

---

## Baseline coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Recovered cron behaviors only | Validate only the repaired cron behaviors | ✓ |
| Recovered behaviors plus cron controls and outputs | Include `start`, `stop`, `status`, `logs`, manual run, notifications, and chat history | |
| Everything above plus cron UI surfaces | Add a quick UI-layer check for screens that show cron data | |

**User's choice:** Recovered cron behaviors only.
**Notes:** Phase 4 should stay tight. It is a cron proof gate, not a broad app regression pass.

---

## Root workspace proof

| Option | Description | Selected |
|--------|-------------|----------|
| Automated tests only | Prove root behavior through tests only | ✓ |
| Tests plus one manual root smoke test | Add one manual root validation step | |
| Tests plus manual scheduled and manual root runs | Require a broader manual proof pass | |

**User's choice:** Automated tests only.
**Notes:** The user does not want manual smoke work added to the phase if tests can prove it.

---

## Reference drift policy

| Option | Description | Selected |
|--------|-------------|----------|
| Keep current behavior and document drift | Leave harmless differences in place and note them | |
| Match the old branches where possible | Try to align with the trusted folders broadly | |
| Change only undesired behavior | Only change drift when the current behavior is not the desired behavior | ✓ |

**User's choice:** Change only undesired behavior.
**Notes:** Trusted references are guidance, not an automatic override of a good current behavior.

---

## the agent's Discretion

- The exact validation design is open for planning, as long as it stays test-driven and limited to the repaired cron behavior and root safety proof.

## Deferred Ideas

- Broader manual cron smoke checks and wider UI verification are intentionally outside the locked Phase 4 scope.
