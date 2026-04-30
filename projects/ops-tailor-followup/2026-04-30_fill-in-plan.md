# Template fill-in plan — 2026-04-30

Status na `/tailor-os` Phase 1-10: het meeste is compleet. Wat resteert is grotendeels **conditioneel** (vul aan wanneer een trigger fires) of **per-app** (vul aan na `add-app.sh`), niet template-level.

This plan follows the "Trigger to expand" pattern from `learnings.md` § General — every open item has an explicit trigger condition, not a vague "should we?".

---

## TL;DR

- **Nu invullen (verplicht)**: niets. Template is functioneel klaar.
- **Nu invullen (optioneel, maar aangeraden om over te beslissen)**: 2 keuzes onder § A.
- **Per-trigger**: API keys, MCP config, Service Registry — pas aanvullen wanneer een specifieke skill 'm vraagt (§ B).
- **Per-app**: runbook URLs, app-specifieke overrides — wanneer `add-app.sh` draait (§ C).
- **Deliberaat leeg**: memory, runtime dirs, projects/ subfolders (§ D).

---

## § A. Onbeslist (template-level — nu OF nooit kiezen)

### A1. `brand_context/icp.md` — laten staan of invullen?

**Status:** lege placeholder template (zie `[brand_context/icp.md](../../brand_context/icp.md)`).

**Twee opties:**

1. **Laten staan als template-stub** (aanbevolen). Reden: een "neutrale middle-ground ICP" bestaat niet zoals voor voice-profile wel. Cito-apps richten zich op docenten/leerlingen, persoonlijke apps op jou + niche-gebruikers. Geen overkoepelende default mogelijk zonder dat 'm voor beide categorieën verkeerd voelt.
2. **Invullen** met meest waarschijnlijke ICP als overlap (bv. "solo developer / educator-tool-builders"). Per-app override blijft mogelijk.

**Trigger om dit te heroverwegen**: zodra >2 apps bestaan en je merkt dat je elke keer dezelfde ICP-tekst kopieert tussen `apps/{slug}/brand_context/icp.md`, dan is er een echte default. Promoot 'm dan naar de template.

**Effort als je optie 2 kiest:** 30 min interview.

### A2. `brand_context/positioning.md` — laten staan of invullen?

**Status:** lege placeholder template (zie `[brand_context/positioning.md](../../brand_context/positioning.md)`).

**Zelfde dynamiek als A1.** Aanbeveling: laten staan. Vul per-app in onder `apps/{slug}/brand_context/positioning.md`.

**Trigger:** zelfde als A1 — herhalend kopiëren tussen apps = signaal voor template-default.

---

## § B. Per-trigger (alleen aanvullen bij specifiek event)

### B1. API keys in `.env` (9 stuks, allemaal optional)

**Trigger:** installatie van een skill of MCP die de key gebruikt.

**Wat is er, en wanneer:**

| Key | Skill / use-case | Status nu |
|---|---|---|
| `FIRECRAWL_API_KEY` | `mkt-brand-voice` Auto-Scrape mode | Nooit gebruikt — skip |
| `OPENAI_API_KEY` | `str-trending-research` (skill niet geïnstalleerd) | Skip tot install |
| `XAI_API_KEY` | `str-trending-research` X/Twitter | Skip tot install |
| `YOUTUBE_API_KEY` | `tool-youtube` (niet geïnstalleerd) | Skip tot install |
| `GEMINI_API_KEY` | `viz-nano-banana` image-gen | Skip tot install |
| `HEYGEN_API_KEY` | `viz-ugc-heygen` + heygen MCP | Skip tot gebruik |
| `GOOGLE_WORKSPACE_CLI_CLIENT_ID` + `_SECRET` | Drive/Gmail/Calendar OAuth | Skip tot install |
| `TELEGRAM_BOT_TOKEN` + `_ALLOWED_USERS` | Telegram channels plugin | Skip tot install |

**Action wanneer trigger fires:** copy `.env.example` → `.env` (eenmalig), vul betreffende key in. `.env` is gitignored — committen niet nodig.

### B2. `.mcp.example.json` → `.mcp.json` (heygen MCP)

**Status:** placeholder syntax `your-heygen-api-key-here` in `.mcp.example.json`.

**Trigger:** je gaat heygen daadwerkelijk gebruiken voor video-content.

**Action:** copy naar `.mcp.json` (gitignored), vervang placeholder door echte key.

### B3. `AGENTS.md` § Service Registry

**Status:** placeholder rij ("Add as skills with external dependencies are installed") — geen services nu.

**Trigger:** elke keer een skill met externe service wordt toegevoegd.

**Action:** voeg rij toe aan de tabel met service-naam + key + welke skill 'm gebruikt + wat 'ie levert + fallback.

---

## § C. Per-app (vul aan wanneer `add-app.sh` draait)

### C1. `apps/{slug}/code_context/runbook.md` — URL placeholders

**Trigger:** na `bash scripts/add-app.sh "App Name"`.

**Wat invullen:**
- `{app-slug}-{branch}.vercel.app` → echte Vercel preview-URL pattern
- `{your-domain}.com` → custom production domain

**Effort:** ~5 min per app.

### C2. `apps/{slug}/code_context/architecture.md` — optional override

**Trigger:** als de app afwijkt van de Next.js + Supabase template default. **Concreet voorbeeld**: rekentool gebruikt Vite + TanStack Router, niet Next.js — dus zal een volledige override nodig hebben.

**Effort:** 1-2 uur — herschrijf stack-table + components + invariants voor die app.

**Reminder uit Phase 4 log:** "Don't try to retro-fit Next.js patterns onto Vite SPA invariants."

### C3. `apps/{slug}/brand_context/*` — optional override

**Trigger:** alleen als de app een wezenlijk andere voice/ICP/positioning heeft dan template default.

**Effort:**
- `voice-profile.md` override: ~15 min (volledige replace, geen merge — zie Phase 6 log)
- `icp.md` + `positioning.md`: ~30 min elk

**Reminder uit Phase 6 log:** als override >30% van apps nodig is, is de template-default verkeerd → re-tailor Phase 6.

### C4. `apps/{slug}/cron/jobs/*` — optional

**Trigger:** als de app een eigen cron-job nodig heeft (los van de 4 root-level jobs die al voor alle apps scannen).

**Effort:** copy template uit `cron/templates/`, edit prompt body, set frontmatter.

**Note:** root-level jobs (`weekly-dep-audit`, `weekly-dep-update-check`, `skill-update-check`, `monthly-learnings-health`) scannen al automatisch alle `apps/*/`. Voeg per-app crons alleen toe voor app-specifieke logic.

---

## § D. Deliberaat leeg laten (niets doen)

| Pad | Reden |
|---|---|
| `context/memory/` | Auto-populates per session |
| `cron/logs/`, `cron/status/` | Runtime artefacten, gitignored |
| `projects/` subfolders | Populeren wanneer skills output schrijven |
| `.planning/phases/02-04/` | Bestaand GSD-skeleton voor rekentool, niet template-werk |
| `apps/.gitkeep` | Placeholder, normaal voor lege dir |

---

## § E. Aanbevolen volgorde

1. **Nu**: beslis A1 + A2 (laten staan vs invullen). Aanbeveling: laten staan.
2. **Eerstvolgende trigger**: `bash scripts/add-app.sh "rekentool"` → C1 (runbook URLs) + C2 (architecture override naar Vite + TanStack).
3. **Daarna per skill-install**: check of er een API-key (B1) en/of Service Registry-entry (B3) bij hoort.
4. **Optioneel later**: zodra >2 apps bestaan, heroverweeg A1+A2 of een template-default ICP+positioning waarde toevoegt.

---

## Open vragen (voor jou, niet nu te beantwoorden)

- Wil je rekentool als **eerste app importeren** via `add-app.sh`, of laat je 'm in zijn eigen repo en gebruik je App-Dev OS alleen als losse methodology-laag? Dat bepaalt of C1/C2/C3/C4 ooit gaan firen.
- Wil je een **default Service Registry** alvast invullen voor de skills die je waarschijnlijk gaat gebruiken (Sentry, Vercel API, Supabase service-role), zelfs als ze nog geen aparte skill hebben? Dat zou B3 pre-emptief vullen — vs. self-learning principle dat zegt "vul aan na trigger". Mijn voorstel: trouw blijven aan self-learning, niets pre-emptief.
