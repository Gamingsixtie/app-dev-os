# ADR-0002: Use Biome over ESLint + Prettier

- **Status**: Accepted
- **Date**: 2026-04-28
- **Supersedes**: —

## Context

TypeScript-primary codebase, solo non-senior developer. The project needs both linting (catch bad patterns) and formatting (enforce one style). The default JS/TS combo is ESLint + Prettier, but that means two config files, two CLIs, two editor integrations, plus glue config (`eslint-config-prettier`) to stop the tools fighting each other. Solo-dev velocity values fewer config files and less time spent tuning toolchains over having access to every niche rule.

## Decision

Use Biome as the single tool for both linting and formatting. One config file (`biome.json`), one CLI, one editor integration. No ESLint, no Prettier, no plugin chains.

## Alternatives considered

- **ESLint + Prettier**: industry default, largest rule ecosystem, mature — but two tools, two configs, integration friction (which one runs first, which one wins on a conflict). Cognitive overhead is disproportionate for solo dev, and the project rarely needs ESLint's long-tail rules.
- **ESLint only (with `--fix` for formatting)**: avoids Prettier — but ESLint's formatter is slower and less consistent than Prettier or Biome. Also no formatter-only rule set; mixing concerns.
- **oxc / oxlint**: newer, even faster than Biome, written in Rust — but as of writing not at feature parity for formatting + linting in one binary, and ecosystem (editor support, rule docs) is narrower.
- **Chosen option (Biome)**: one binary, written in Rust (fast), formats + lints in one pass, single config, growing ecosystem, Vercel-friendly.

## Consequences

- Positive: one config file, one CLI command (`biome check --write`), fast (sub-second on typical file), one editor extension, minimal CI overhead.
- Negative: smaller rule ecosystem than ESLint — some niche rules (typescript-eslint plugins, react-hooks edge cases) are unavailable or less mature. Some ESLint plugins (e.g., `eslint-plugin-tailwindcss`) have no Biome equivalent yet.
- Trade-offs we accept: reduced rule coverage in exchange for reduced config burden. If a specific missing rule causes a real bug, we re-evaluate (and either add an inline check or reconsider this ADR).

## Links

- Phase 3 — tooling lock (conventions.md)
- Code references: `code_context/conventions.md` § Formatting, `code_context/conventions.md` § Linting
- External docs: https://biomejs.dev
