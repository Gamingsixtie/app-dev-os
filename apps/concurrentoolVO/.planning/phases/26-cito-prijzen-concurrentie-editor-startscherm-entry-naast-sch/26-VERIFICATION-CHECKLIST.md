# Phase 26 — Verification Checklist

Run `cd apps/concurrentoolVO && npm run dev` then `npx vercel dev` (separate terminal) for full API support. Visit `http://localhost:5173`.

> Map: elke checkbox sluit 1-op-1 aan op een item uit `26-SPEC.md` § Acceptance Criteria (14 items, regels 111-124), aangevuld met een paar smoke-checks om Phase 26 als geheel af te tekenen.

## SPEC.md acceptance criteria (14)

### Startscherm

- [ ] **AC-1** — `/` rendert `StartschermPage` met exact twee cards (Schooloverzicht + "Cito Prijzen + Concurrentie") — geen redirect-flits zichtbaar naar `/scholen`
- [ ] **AC-2** — Klik op card "Schooloverzicht" navigeert naar `/scholen` (bestaande SchoolOverviewPage)
- [ ] **AC-3** — Klik op card "Cito Prijzen + Concurrentie" navigeert naar de prijs-editor (manager-only gate werkt — manager ziet editor, accountmanager ziet "Geen toegang")

### Prijs-editor tabs

- [ ] **AC-4** — Prijs-editor (`/prijzen`) toont exact 3 hoofdtabs: "Cito Basisvaardigheden" | "Cito Modules" | "Concurrentie"
- [ ] **AC-5** — "Concurrentie" tab toont sub-tabs voor DIA, JIJ!, SAQI
- [ ] **AC-6** — Prijswijziging in een tab (bv. "Cito Basisvaardigheden") → klik save → prijswijziging is zichtbaar in een school-vergelijking zonder page-refresh (open een school in een tweede tab en check de prijzen)

### Export

- [ ] **AC-7** — Export-knop met formaat-dropdown ("Exporteer prijslijst ▾") is aanwezig op de prijs-editor; PDF / HTML / Word / TXT downloads werken alle vier (klik elke optie → file landt in `Downloads/`)
- [ ] **AC-8** — Geopende export-file (alle 4 formaten) toont Cito-branding (tekst "CITO" in #003082 of fallback), datum van vandaag in NL-formaat (bv. "14 mei 2026"), en disclaimer-regel onderaan: "Prijzen zijn indicatief en kunnen aangepast worden. Voor actuele bevestiging: contact Cito."

### AI Excel-import

- [ ] **AC-9** — Upload `.xlsx` via "Importeer prijzen uit Excel" knop → kies een provider in de dropdown → diff-view toont voorgestelde wijzigingen → klik "Bevestig N wijzigingen" → save schrijft naar Supabase + `loadFromSupabase` refresht de runtime store
- [ ] **AC-10** — Upload met parse-fout (corrupt `.xlsx` of niet-`.xlsx`, bv. `something.pdf` hernoemd naar `.xlsx`) of AI-fout toont begrijpelijke Nederlandse foutmelding (géén stacktrace in UI)

### Invarianten

- [ ] **AC-11** — Locked-files invariant: `git diff main..HEAD -- apps/concurrentoolVO/src/data/default-prices.ts apps/concurrentoolVO/src/data/cito-migration-prices.ts` toont **geen wijzigingen** (output is empty)
- [ ] **AC-12** — Non-manager (rol `accountmanager`) ziet beide cards op startscherm, maar krijgt "Geen toegang" scherm bij klik op de Cito Prijzen card (`/prijzen`)
- [ ] **AC-13** — `cd apps/concurrentoolVO && npm run build` slaagt zonder TypeScript errors (exit 0)
- [ ] **AC-14** — `cd apps/concurrentoolVO && npx vitest run` slaagt — alle bestaande tests blijven groen, nieuwe tests voor `StartschermPage` + tab-restructure + Excel-parser + diff-view zijn toegevoegd (100+ tests in `src/features/pricing/`)

## Aanvullende smoke-checks

- [ ] **S-1** — Refresh op `/prijzen?tab=concurrentie&provider=jij` → Concurrentie hoofdtab + JIJ! sub-tab zijn pre-geselecteerd (search-param-deeplink werkt — D-02 honored)
- [ ] **S-2** — `/admin` (oude URL) → automatisch redirect naar `/prijzen` (D-01 backward-compat)
- [ ] **S-3** — Server-only AI key invariant: `grep -rE "VITE_ANTHROPIC" apps/concurrentoolVO/api apps/concurrentoolVO/src apps/concurrentoolVO/dist 2>/dev/null` → **empty**. `ANTHROPIC_API_KEY` mag nooit in de client-bundle verschijnen. Belangrijk: zonder `VITE_` prefix is de key per definitie server-only in Vite, maar deze check vangt regressies.
- [ ] **S-4** — PDF-bundle is lazy: open `/prijzen` zonder op de export-knop te klikken → in dev-tools Network tab is de `@react-pdf/renderer` chunk (vendor-pdf) niet geladen. Pas na klik op "Exporteer als PDF" verschijnt de chunk in Network. Idem voor Word (`docx` chunk pas na "Exporteer als Word").

## Sign-off

Datum: __________
Tester: __________
Notes / issues:

---

## Hoe deze checklist te gebruiken

1. Start lokaal:
   - Terminal A: `cd apps/concurrentoolVO && npm run dev`
   - Terminal B: `cd apps/concurrentoolVO && npx vercel dev` (voor `/api/ai-price-import` endpoint)
2. Open `http://localhost:5173` als manager (of via `VITE_SKIP_AUTH=true` in `.env.local` voor lokale dev-bypass).
3. Werk de checkboxes hierboven van boven naar beneden af. Vink elke check af als hij PASS is.
4. Voor AC-12: log in als accountmanager (niet manager) — verifieer dat de gate werkt.
5. Voor AC-11 + S-3: voer de `git diff` / `grep` commando's letterlijk uit in terminal en bevestig de empty output.
6. Voor AC-13 + AC-14: run de build + tests vanaf `apps/concurrentoolVO/`.
7. Als alle 18 checks zijn afgevinkt, vul Datum + Tester in onder "Sign-off".
8. Type **"approved"** in de Claude Code chat om Phase 26 te sluiten.

Als één of meer checks falen: beschrijf per checklist-item wat er misgaat, dan stelt Claude een gap-closure plan voor (`/gsd-execute-phase 26-gap` of soortgelijk).
