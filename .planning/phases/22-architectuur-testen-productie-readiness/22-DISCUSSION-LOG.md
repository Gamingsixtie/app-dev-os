# Phase 22: Architectuur, Testen & Productie-readiness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 22-architectuur-testen-productie-readiness
**Areas discussed:** Testcoverage scope, E2E testing aanpak, Bug- en schuld-afhandeling, Productie-hardening

---

## Testcoverage Scope

### Coverage prioriteit

| Option | Description | Selected |
|--------|-------------|----------|
| Gaten dichten | Focus op onderdelen die nog geen of te weinig tests hebben: stores, hooks, utils. Engine tests zijn al sterk — breid uit naar integratietests. | ✓ |
| Coverage target >80% | Systematisch naar >80% line coverage over het hele project. Inclusief UI-componenten. | |
| Alleen kritieke paden | Test alleen happy paths die het team dagelijks gebruikt. | |

**User's choice:** Gaten dichten
**Notes:** None

### Todo tests (158 stuks)

| Option | Description | Selected |
|--------|-------------|----------|
| Implementeren | Alle todo-tests omzetten naar werkende tests. | |
| Triagen | Todo-tests reviewen: kritieke paths implementeren, de rest verwijderen. | ✓ |
| Laten staan | Focus op nieuwe tests voor ontbrekende gebieden. | |

**User's choice:** Triagen (op advies van Claude — pragmatische aanpak)
**Notes:** User vroeg "wat adviseer je?" — Claude adviseerde triagen omdat 158 todo-tests te veel zijn om blind te implementeren.

### UI tests

| Option | Description | Selected |
|--------|-------------|----------|
| Alleen kritieke UI | Test wizard-stappen, vergelijkingstabel en export-flows. | |
| Brede UI coverage | Test alle interactieve componenten: formulieren, modals, tabs, navigatie. | ✓ |
| Skip UI tests | UI wordt afgedekt door E2E tests. | |

**User's choice:** Brede UI coverage

---

## E2E Testing Aanpak

### Framework keuze

| Option | Description | Selected |
|--------|-------------|----------|
| Playwright | Moderne keuze, snel, goede DX, cross-browser. Past goed bij Vite. | ✓ |
| Cypress | Populair, visuele test runner, maar trager. | |
| You decide | Claude kiest. | |

**User's choice:** Playwright

### Gebruikersflows

| Option | Description | Selected |
|--------|-------------|----------|
| School aanmaken + wizard | Nieuwe school → 5-staps wizard → resultaten | ✓ |
| Prijsvergelijking bekijken | Vergelijking bekijken, modules uitklappen, prijzen overschrijven | ✓ |
| DMU-export genereren | PDF-rapport genereren per DMU-rol | ✓ |
| AI intake flow | Vrije tekst → gestructureerde data → bevestigen → opslaan | ✓ |

**User's choice:** Alle flows + "in principe alle gebruiksflows en tabbladen dus"
**Notes:** User wil niet alleen de genoemde flows maar alle gebruikersflows en tabbladen E2E testen.

### CI integratie

| Option | Description | Selected |
|--------|-------------|----------|
| Lokaal + CI | E2E tests draaien ook automatisch bij elke push/PR via GitHub Actions. | ✓ |
| Alleen lokaal | E2E tests alleen handmatig draaien. | |
| You decide | Claude bepaalt. | |

**User's choice:** Lokaal + CI

---

## Bug- en Schuld-afhandeling

### Falende tests (10 in 7 files)

| Option | Description | Selected |
|--------|-------------|----------|
| Allemaal fixen | Alle 10 falende tests repareren. Productiegereed = geen failures. | ✓ |
| Alleen kritieke fixen | Beoordeel per test of het een bug of verouderde test is. | |
| You decide | Claude beoordeelt per test. | |

**User's choice:** Allemaal fixen

### Skipped test suites (42 stuks)

| Option | Description | Selected |
|--------|-------------|----------|
| Reviewen en activeren | Beoordeel waarom ze skippen, activeer wat kan. | ✓ |
| Verwijderen | Skipped tests die lang uitstaan zijn dode code. | |
| You decide | Claude beoordeelt per suite. | |

**User's choice:** Reviewen en activeren

### Bekende bugs

| Option | Description | Selected |
|--------|-------------|----------|
| Niet specifiek | Geen bekende bugs — laat Claude scannen. | ✓ |
| Ja, ik noem ze | Specifieke bugs benoemen. | |

**User's choice:** Niet specifiek

---

## Productie-hardening

### Productie-definitie

| Option | Description | Selected |
|--------|-------------|----------|
| Stabiel en betrouwbaar | Error boundaries, graceful degradation, geen crashes. | |
| Volledig productie | Error tracking (Sentry), monitoring, structured logging, health checks. SaaS-niveau. | ✓ |
| Minimaal | Als het werkt is het goed. | |

**User's choice:** Volledig productie

### Security review

| Option | Description | Selected |
|--------|-------------|----------|
| API key bescherming | Focus op Anthropic API key en secrets. | |
| Brede security audit | XSS, CSRF, input sanitization, npm audit, CSP headers. OWASP-check. | ✓ |
| You decide | Claude beoordeelt risico's. | |

**User's choice:** Brede security audit

### Performance

| Option | Description | Selected |
|--------|-------------|----------|
| Niet bewust van | Geen bekende issues — Claude profilt en optimaliseert. | ✓ |
| Ja, ik noem ze | Specifieke trage onderdelen benoemen. | |
| Skip performance | Focus op tests en stabiliteit. | |

**User's choice:** Niet bewust van

### Build & deploy pipeline

| Option | Description | Selected |
|--------|-------------|----------|
| CI pipeline opzetten | GitHub Actions: lint → typecheck → unit tests → build → E2E. | ✓ |
| Bestaande flow is goed | npm run build + vitest run is voldoende. | |
| You decide | Claude beoordeelt. | |

**User's choice:** CI pipeline opzetten

---

## Claude's Discretion

- Architectuurreview details (scheiding van concerns, code quality)
- Sentry vs. alternatieven voor error tracking
- Performance benchmark thresholds
- CI pipeline configuratie (matrix, caching, artifacts)
- Welke OWASP checks relevant zijn voor client-side app + Supabase

## Deferred Ideas

None — discussion stayed within phase scope
