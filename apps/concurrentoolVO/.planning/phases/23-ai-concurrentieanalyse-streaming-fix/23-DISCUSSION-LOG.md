# Phase 23: AI Concurrentieanalyse Streaming Fix - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 23-ai-concurrentieanalyse-streaming-fix
**Areas discussed:** Streaming strategie, Foutafhandeling & retry, Vercel constraints, Monitoring & debugging, Modelkeuze

---

## Streaming strategie

| Option | Description | Selected |
|--------|-------------|----------|
| Server assembleert JSON | Server buffert alle fragmenten, stuurt pas volledige JSON. Keepalive spaces voorkomen 504. | ✓ |
| Chunked transfer met validatie | Blijf fragmenten streamen, client-side JSON-validatie en reassembly | |
| Je beslist | Claude kiest meest robuuste aanpak | |

**User's choice:** Server assembleert JSON (Recommended)
**Notes:** Simpelst en meest betrouwbaar — client hoeft niks te veranderen qua parsing.

### Progressieve feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Skeleton is genoeg | Huidige loading skeleton voldoende | |
| Voortgangsindicator | Stappen tonen: Verbinding → Genereren → Verwerken | ✓ |
| Tijdsindicatie | Geschatte of verstreken wachttijd | |

**User's choice:** Voortgangsindicator
**Notes:** Gebruiker wil zien dat het werkt met concrete stappen.

---

## Foutafhandeling & retry

| Option | Description | Selected |
|--------|-------------|----------|
| Automatisch retry | 1-2 retries met backoff, pas daarna foutmelding | ✓ |
| Handmatige retry | Foutmelding met retry-knop, gebruiker beslist | |
| Combinatie | 1x auto retry, daarna handmatig | |

**User's choice:** Automatisch retry (Recommended)

### Foutmelding

| Option | Description | Selected |
|--------|-------------|----------|
| Korte melding + retry knop | Generieke foutmelding met knop | |
| Gedetailleerde melding | Type fout tonen (timeout/server/parse) | ✓ |
| Je beslist | Claude kiest passende UX per fouttype | |

**User's choice:** Gedetailleerde melding
**Notes:** Consultant moet kunnen inschatten of wachten helpt.

---

## Vercel constraints

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel Pro | maxDuration tot 300s | |
| Vercel Free (Hobby) | maxDuration max 10s | ✓ |
| Weet niet zeker | Check nodig | |

**User's choice:** Vercel Free (Hobby)
**Notes:** Dit is vrijwel zeker de root cause van de 504s — maxDuration: 120 wordt genegeerd op Hobby plan.

### Upgrade strategie

| Option | Description | Selected |
|--------|-------------|----------|
| Pro is actief / upgrade ok | Focus op correcte implementatie | |
| Moet binnen Free werken | Max 10s, mogelijk proxy/edge nodig | |
| Je beslist op basis van onderzoek | Claude onderzoekt beste optie | ✓ |

**User's choice:** Je beslist op basis van onderzoek

---

## Monitoring & debugging

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel logs voldoende | Console logs + dashboard | |
| Sentry integratie | Structured error reporting | |
| Client-side logging | Log naar Supabase tabel | |
| Je beslist | Claude kiest passende monitoring | ✓ |

**User's choice:** Je beslist

### Health check

| Option | Description | Selected |
|--------|-------------|----------|
| Handmatig testen volstaat | Na deploy gewoon triggeren | |
| Health endpoint | /api/ai-analysis/health endpoint | ✓ |
| Je beslist | Claude bepaalt | |

**User's choice:** Health endpoint

---

## Modelkeuze

### Primair model

| Option | Description | Selected |
|--------|-------------|----------|
| Sonnet standaard + Opus optie | Sonnet default, Opus als premium knop | ✓ |
| Sonnet primair | Alleen Sonnet | |
| Opus primair | Alleen Opus | |

**User's choice:** Sonnet standaard + Opus optie
**Notes:** Gebruiker vroeg eerst om kostenindicatie. Volume: 1500 scholen x 1.5 analyses = 2250 totaal. Sonnet: ~$340, Opus full: ~$1690. Gekozen: Sonnet als standaard, Opus als optionele "Diepgaande analyse" voor key accounts.

### Max tokens

**User's choice:** Minimaal 8192, Claude bepaalt optimum. Moet boven 8000 zitten.

---

## Claude's Discretion

- Monitoring-strategie (Vercel logs vs Sentry vs Supabase logging)
- Exacte retry backoff-timing
- Implementatiedetails voortgangsindicator
- Vercel plan workaround vs upgrade-advies

## Deferred Ideas

None — discussion stayed within phase scope
