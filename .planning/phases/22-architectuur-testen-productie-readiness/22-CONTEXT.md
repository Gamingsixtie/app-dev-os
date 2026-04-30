# Phase 22: Architectuur, Testen & Productie-readiness - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete architectuurreview, uitgebreide testsuite (unit, integratie, end-to-end) en productie-hardening zodat het prototype volledig productiegereed is voor dagelijks gebruik door het team. Dit omvat: coverage-gaten dichten, E2E tests opzetten met Playwright, alle falende tests fixen, skipped tests activeren, security audit, performance profiling, error tracking, CI pipeline en structured logging.

</domain>

<decisions>
## Implementation Decisions

### Testcoverage Scope
- **D-01:** Prioriteit is gaten dichten — onderdelen die nog geen of te weinig tests hebben (stores, hooks, utils). Engine tests zijn al sterk, uitbreiden naar integratietests tussen store → engine → UI.
- **D-02:** De 158 todo-tests triagen: kritieke paths (engine-berekeningen, wizard-flow, store-acties) implementeren, de rest verwijderen. Een clean testsuite zonder dode todo's.
- **D-03:** Brede UI coverage met React Testing Library — alle interactieve componenten: formulieren, modals, tabs, navigatie. Geeft vertrouwen bij refactoring.

### E2E Testing
- **D-04:** Playwright als E2E framework. Past goed bij Vite, snel, cross-browser, headless in CI.
- **D-05:** Alle gebruikersflows en tabbladen E2E testen: school aanmaken + wizard, prijsvergelijking bekijken, DMU-export genereren, AI intake flow, en alle overige tabs/views.
- **D-06:** E2E tests draaien zowel lokaal als in CI (GitHub Actions).

### Bug- en Schuld-afhandeling
- **D-07:** Alle 10 falende tests in 7 files repareren. Een productiegereed project mag geen falende tests hebben.
- **D-08:** Alle 42 skipped test suites reviewen en waar mogelijk activeren. Beoordeel waarom ze skippen — activeer wat kan, verwijder wat achterhaald is.
- **D-09:** Geen specifieke bekende bugs — Claude scant de codebase voor technische schuld en issues.

### Productie-hardening
- **D-10:** Volledig productie-niveau: error tracking (Sentry), performance monitoring, structured logging, health checks. Behandelen alsof het een SaaS-product is.
- **D-11:** Brede security audit: XSS, CSRF, input sanitization, dependency vulnerabilities (npm audit), CSP headers. Volledige OWASP-achtige check.
- **D-12:** Performance profiling door Claude — geen bekende trage onderdelen, maar systematisch profilen en optimaliseren waar nodig.
- **D-13:** CI pipeline opzetten met GitHub Actions: lint → typecheck → unit tests → build → E2E tests. Automatisch bij elke push.

### Claude's Discretion
- Architectuurreview: scheiding van concerns, code quality patterns, dependency analysis
- Keuze van Sentry vs. alternatieven voor error tracking
- Performance benchmark thresholds en optimalisatieprioriteiten
- CI pipeline configuratie details (matrix, caching, artifact upload)
- Welke specifieke OWASP checks relevant zijn voor deze client-side app met Supabase backend

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Test Infrastructure
- `vitest.config.ts` — Vitest configuratie met jsdom, globals, setup file
- `src/test/setup.ts` — Test setup file
- `package.json` — Dependencies en scripts

### Engines (zwaarst geteste onderdelen)
- `src/engine/` — Alle pure calculation engines (price-comparison, current-vs-proposed, migration, sensitivity, etc.)
- `src/engine/__tests__/` — 14 engine test files als referentie voor testpatronen

### Architecture
- `src/App.tsx` — View routing via useState<View>
- `src/features/` — Feature-gebaseerde mapstructuur (auth, export, intake, migration, price-comparison, school-overview, school-profile)
- `src/db/` — Dexie/IndexedDB database layer
- `src/lib/supabase/` — Supabase client
- `src/router/` — Routing met guards

### Prior Architecture Review
- `.planning/phases/13-architectuur-review-go-live/13-CONTEXT.md` — Eerdere architectuur review (Phase 13)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 80 bestaande test files met 2233 passing tests als basis
- Vitest + jsdom + React Testing Library setup is al geconfigureerd
- Engine tests als referentiepatroon voor pure function testing
- `src/test/setup.ts` als gedeelde test setup

### Established Patterns
- `__tests__/` directories naast de code (collocated tests)
- Pure function engines met uitgebreide edge case testing
- Zod schemas met bijbehorende schema tests
- Store tests voor Zustand stores

### Integration Points
- Geen E2E framework aanwezig — moet from scratch opgezet worden
- Geen CI/CD pipeline — GitHub Actions workflow moet aangemaakt worden
- Geen error tracking (Sentry) of monitoring — moet geintegreerd worden
- `npm run build` en `npx vitest run` zijn de enige bestaande quality gates

</code_context>

<specifics>
## Specific Ideas

- Gebruiker wil het project behandelen als een volledig SaaS-product qua hardening
- Alle gebruikersflows en tabbladen moeten E2E getest worden — niet alleen happy paths
- Todo-tests triagen, niet blind allemaal implementeren
- CI pipeline moet volledige quality gate zijn: lint → typecheck → unit tests → build → E2E

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 22-architectuur-testen-productie-readiness*
*Context gathered: 2026-03-27*
