---
name: test-write-unit
description: >
  Write unit tests for existing code or alongside new code. Targets
  business logic, edge cases, and reused utilities — skips trivial
  pure-functions and getters. Triggers on: "write a test", "add tests
  for", "unit test this", "test coverage for", "TDD this", "missing
  tests", "what's tested". Reads code_context/conventions.md (tone-only
  for test idioms), architecture.md (summary). Uses project's existing
  test runner (Vitest/Jest/Pytest/Go test). Does NOT trigger for E2E/
  integration/Playwright (use test-e2e-playwright), coverage audits
  (use test-coverage-audit), or test-fixture refactors.
---

# test-write-unit

Write focused unit tests that verify behaviour, not implementation.

## Outcome

Test files in `tests/**` (or project test location) that pass and add
meaningful coverage of the targeted code.

## Context Needs

| File | Load level | How it shapes this skill |
|---|---|---|
| `code_context/conventions.md` | tone-only | Test naming, assertion style, mocking pattern |
| `code_context/architecture.md` | summary | What boundaries the unit-under-test crosses |
| `context/USER.md` | summary | Testing-style preference (TDD, after-the-fact, etc.) |
| `context/learnings.md` | `## test-write-unit` | Past gotchas with test setup in this codebase |

## What to test

| Test it | Skip it |
|---|---|
| Business logic with branches | Trivial getters/setters |
| Reused utility functions | One-call wrappers |
| Code with risky edge cases (auth, money, dates) | Pure rendering of static UI |
| Bug regressions (prove it stays fixed) | Implementation details (mocks of mocks) |

## Process

1. **Identify scope**: which function/module? If unclear, ask once.
2. **Detect runner**: read `package.json` or `pyproject.toml` for the test
   command. Use project's existing runner — no `npm install`s.
3. **Find similar tests**: open neighbouring test files. Match style:
   `describe/it`, `test()`, `assert`, etc.
4. **Identify behaviours to test**: list 3-7 distinct cases:
   - Happy path
   - 1-2 edge cases (empty input, max input, boundary values)
   - 1-2 error paths (invalid input, network failure, etc.)
5. **Write tests**: one assertion per test where possible. Clear names:
   "returns X when Y is Z" beats "test1".
6. **Run**: `npm test` (or project equivalent). All must pass before
   declaring done.
7. **Wrap-up**: report what's covered, what's intentionally skipped, and
   why.

## Anti-patterns

- Testing the framework instead of your code (`expect(react).toBeDefined()`)
- Mocks so deep the test asserts the mock works, not the code
- Snapshot tests for things that change every refactor
- Single test with 12 assertions — split into focused tests
- Tests that pass for the wrong reason — verify by breaking the code first

## Output

- New test file(s) in `tests/**` or alongside source per project convention
- All tests pass on `npm test` / `pytest` / `go test`
- Brief summary: behaviours covered, intentional skips
