# OTAP-implementatie — review-document voor trainer

**Project:** App-Dev OS / `concurrentoolVO`
**Datum:** 2026-05-08
**Doel:** Trainer kan controleren of het OTAP-principe juist is geïmplementeerd, met concrete verifieerbare bewijzen per stap.

---

## 1. Trigger en uitgangspunt

**Probleem dat we wilden oplossen:**
*"Ik merkte dat ik te snel ging — niet lokaal werkte maar gelijk in de productieomgeving."*

**OTAP-doel:** structureel scheiden van Ontwikkeling (O), Test (T), Acceptatie (A) en Productie (P), zodat productie niet per ongeluk geraakt wordt door lokaal experimenteerwerk.

---

## 2. De vier letters in deze setup

| Letter | Wat het is | Waar het draait | Welke data |
|---|---|---|---|
| **O — Ontwikkeling** | Lokale Vite dev-server op `feature/*` branch | Eigen laptop (`npm run dev` → `localhost:3000`) | Dev-Supabase via `.env.local` |
| **T — Test** | Build + unit tests lokaal én op GitHub Actions | Eigen laptop (`npm run build` + `vitest`) + GitHub CI bij PR | n.v.t. — code-validatie, geen DB |
| **A — Acceptatie** | Vercel preview-deployment per PR (auto, gratis) | Vercel preview-URL (eigen URL per branch) | Dev-Supabase via Vercel "Preview" scope |
| **P — Productie** | `main` branch → Vercel productie | `toolvo.vercel.app` | Prod-Supabase via Vercel "Production" scope |

---

## 3. Concrete keuzes (de "OTAP-aannames" voor deze setup)

Vastgelegd in [`ADR/0005-otap-framework.md`](../../../ADR/0005-otap-framework.md). Trainer kan dit document lezen voor de volledige onderbouwing inclusief afgewezen alternatieven.

| # | Beslissing | Waarom |
|---|---|---|
| 1 | Twee aparte Supabase-projecten per app | Gedeelde DB tussen O/T en P was de directe oorzaak van het probleem |
| 2 | Eén variabelenaam (`VITE_SUPABASE_URL`), waarden via Vercel-environment scoping | Geen `_PROD`/`_DEV` suffixes — anders waarde-versplintering over meerdere variabelen |
| 3 | Required CI-gates op PR: build + typecheck + Vitest | Code moet groen zijn voordat 'ie naar `main` mag |
| 4 | Productie-migraties zijn **handmatig** (`supabase db push --project-ref <prod-ref>`) | Bewuste actie, geen automatische schema-aanpassing op productie |
| 5 | Vier branch-prefixes: `feature/`, `fix/`, `chore/`, `hotfix/` | Genoeg voor 100% van gevallen, geen overhead |
| 6 | Pre-commit hook (snel, lokaal) + GitHub CI (autoritatief) | Twee lagen — CI is de echte gate, pre-commit voorkomt domme typos |
| 7 | Eén shared CI-workflow met path-filters per app | Monorepo-pattern, nieuwe apps voegen alleen entry toe |

---

## 4. Wat is geïmplementeerd — controleerbaar

### 4.1 Documentatie

| Bestand | Wat | Waar te vinden |
|---|---|---|
| ADR-0005 | Architecture Decision Record — immutable beslissing met alternatieven en consequences | `ADR/0005-otap-framework.md` |
| Operational reference | Daily workflow, branch-prefixes, gates, env-pattern | `code_context/otap.md` |
| Runbook secties | Database-migraties (handmatig) + 5-stappen rollback + GitHub branch protection setup | `code_context/runbook.md` |
| Per-app status | Wat is af voor `concurrentoolVO`, wat nog open | `apps/concurrentoolVO/AGENTS.md` § OTAP rollout state |
| Brief | Project-tracking-doc | `projects/briefs/ops-otap-rollout-concurrentoolVO/brief.md` |

### 4.2 Automatisering (GitHub Actions CI)

`.github/workflows/ci.yml` — controleerbaar via:
- Repo: https://github.com/Gamingsixtie/app-dev-os/actions
- Path-filter: `apps/concurrentoolVO/**` triggert build/test, andere paden triggeren alleen template-validate
- `ci-success` summary job is de single required check op `main`

**Bewijs van werking:** PR #1 en PR #2 op https://github.com/Gamingsixtie/app-dev-os/pulls — beide CI-groen, beide via squash-merge naar `main`. Eerste echte concurrentool-build draaide op PR #2 (~1m48s, alle Vitest-tests groen).

### 4.3 Branch protection (GitHub)

Beschermd: `main` branch op `Gamingsixtie/app-dev-os`. Configuratie:
- Require pull request before merging (0 approvals — solo dev)
- Require status checks: `CI` (de summary job)
- Require linear history (geen merge-commits)
- Do not allow bypassing
- Restrict who can push (lege lijst — niemand direct)

**Te verifiëren:** open https://github.com/Gamingsixtie/app-dev-os/settings/branches → rule voor `main`.

### 4.4 Environment-isolatie (Supabase)

Twee aparte Supabase-projecten:

| Project | URL | Rol | Data |
|---|---|---|---|
| Bestaande project | `https://upbucffkzvzzflvyzpld.supabase.co` | **Productie** | Dummy/test data, draait op `toolvo.vercel.app` |
| `concurrentool-dev` | `https://xxpvreojihjtgiwrqbqn.supabase.co` | **Dev / Acceptatie** | Leeg, alleen schema (13 migraties) |

**Te verifiëren:** open https://supabase.com/dashboard → twee projecten zichtbaar in dezelfde organisatie. Schema in dev-project gelijk aan migraties in `apps/concurrentoolVO/supabase/migrations/`.

### 4.5 Environment-isolatie (Vercel)

Vier Supabase-variabelen, elk in twee scopes:

| Variabele | Production scope | Preview scope |
|---|---|---|
| `SUPABASE_URL` | upbucff... (prod) | xxpvreoji... (dev) |
| `SUPABASE_SERVICE_KEY` | prod service_role | dev service_role |
| `VITE_SUPABASE_URL` | upbucff... (prod) | xxpvreoji... (dev) |
| `VITE_SUPABASE_ANON_KEY` | prod anon | dev anon |

**Te verifiëren:** open https://vercel.com/gamingsixties-projects/toolvo/settings/environment-variables → 8 entries voor de Supabase-vars (4 vars × 2 scopes).

### 4.6 Vercel-deploy migratie

**Voor:** Vercel `toolvo` deployde vanuit upstream `Gamingsixtie/concurrentie-rekentool-VO`.
**Na:** Vercel `toolvo` deployt vanuit `Gamingsixtie/app-dev-os`, root directory `apps/concurrentoolVO`.

**Te verifiëren:**
- https://vercel.com/gamingsixties-projects/toolvo/settings/git → Connected: `Gamingsixtie/app-dev-os`
- https://vercel.com/gamingsixties-projects/toolvo/settings/build-and-deployment → Framework: Vite, Root: `apps/concurrentoolVO`
- Deployment-history: laatste deploy `Status: Ready Latest` vanuit branch `main`

### 4.7 Repo-zichtbaarheid

`Gamingsixtie/app-dev-os` is **public** (om branch protection op GitHub free tier af te dwingen). Public is acceptabel omdat App-Dev OS conceptueel een template is en `concurrentoolVO`-source al public was via upstream.

---

## 5. Wat een trainer concreet kan controleren

### Stap 1 — code-controle in repo
```
git clone https://github.com/Gamingsixtie/app-dev-os
cd app-dev-os
ls ADR/0005-otap-framework.md          # bestaat
ls code_context/otap.md                # bestaat
ls .github/workflows/ci.yml            # bestaat met path-filters
grep -A2 "OTAP framework" AGENTS.md    # branching policy verwijst naar OTAP
ls apps/concurrentoolVO/supabase/migrations/  # 13 .sql files
```

### Stap 2 — branch-protection-werking testen (in GitHub UI)
1. Probeer commit te pushen direct naar `main` → wordt geweigerd
2. Open PR met deliberate type-error → CI faalt rood → merge-knop blokkeert
3. Fix de type-error → CI groen → merge-knop activeert

### Stap 3 — environment-isolatie verifiëren
1. Open lokaal `.env.local` (op laptop van Pim) → `VITE_SUPABASE_URL` wijst naar `xxpvreoji...` (dev)
2. Vercel Production scope: `VITE_SUPABASE_URL` = `upbucff...` (prod)
3. Vercel Preview scope: `VITE_SUPABASE_URL` = `xxpvreoji...` (dev)
4. → Lokaal en preview kunnen geen prod-data raken

### Stap 4 — feature-flow-werking testen
1. Maak `feature/test-otap-flow` branch
2. Wijzig iets in `apps/concurrentoolVO/src/` (kleine UI-tekst bijvoorbeeld)
3. Push → CI start automatisch → preview-URL verschijnt op de PR
4. Klik preview-URL → wijziging zichtbaar, productie ongewijzigd
5. Merge → productie deploy start automatisch → wijziging op `toolvo.vercel.app`

---

## 6. Wat nog open staat (eerlijk)

1. **`SKIP_AUTH` + `VITE_SKIP_AUTH` op Production-scope** — moet weggehaald (auth mag nooit overgeslagen op productie). Cosmetische OTAP-correctie, ~30 sec werk.
2. **Smoke-test op `toolvo.vercel.app`** — login + wizard doorlopen om te bevestigen dat de Vercel-flip niets heeft gebroken. ~2 min werk.
3. **Eerste echte feature-flow** — bovenstaande "Stap 4" voor het eerst doorlopen. Dit is de echte praktijktest van OTAP. Komt vanzelf bij eerste verbetering die we bouwen.

Geen van deze drie staat in de weg van het framework zelf — die is geïmplementeerd en werkt.

---

## 7. Hoe deze implementatie afwijkt van een "leerboek-OTAP"

Een formele OTAP-cursus heeft soms vier omgevingen, elk met eigen URL én eigen DB. Onze setup heeft die structuur **niet helemaal** — bewuste vereenvoudiging voor solo-developer-context, vastgelegd in ADR-0005:

- Geen aparte staande **Acceptatie**-omgeving — Vercel preview-per-branch was sufficient
- **Test** en **Ontwikkeling** vallen samen op de laptop (geen aparte test-omgeving)
- Lokaal en Preview delen dezelfde dev-Supabase

Voor een team met QA, formele klant-acceptatie of meerdere parallelle dev-streams zou je een ander OTAP-model kiezen. Voor solo-dev volstaat dit en is het structureel veiliger dan wat er voor was.

---

*Document gegenereerd: 2026-05-08 — App-Dev OS / OTAP-rollout sessie*
