---
phase: 19
slug: gesprekken-tab-acties-upgrade
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 1 | SC-1 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 19-01-02 | 01 | 1 | SC-2 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 19-02-01 | 02 | 1 | SC-3 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 19-03-01 | 03 | 1 | SC-4 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 19-04-01 | 04 | 2 | SC-5 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 19-05-01 | 05 | 2 | SC-6 | manual | N/A | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for speech-to-text hook (Web Speech API mocking)
- [ ] Test stubs for conversation form simplification (AI mode hidden)
- [ ] Test stubs for contact picker with DMU badge rendering
- [ ] Test stubs for inline action input in kanban
- [ ] Test stubs for confirmation dialog component
- [ ] Test stubs for ActionItem model extension (type, dueDate fields)

*Existing vitest infrastructure covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Speech-to-text live transcription | SC-2 | Web Speech API requires browser microphone access | Open ConversationForm, click mic icon, speak Dutch, verify text appears in field |
| Drag-and-drop kanban without confirmation | SC-5 | @dnd-kit interaction requires browser | Drag action card between columns, verify no dialog appears |
| Visual refinement of action tab | SC-6 | Design/spacing assessment | Compare action tab before/after, verify improved spacing, hover states, column headers |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
