# Handover: Overzicht

**Date:** 2026-05-15
**Branch:** Overzicht → main
**Commits:** 3

## Wat is er gebeurd

Lokale werkkopie van het App-Dev OS-Overzicht project opgezet naast de bestaande `app-dev-os/` repo. Ontbrekende environment-bestanden (`.mcp.json` root + `apps/concurrentoolVO/.env.local`) zijn gekopieerd (staan in `.gitignore`, dus niet in de commits). De Vite dev-poort van concurrentoolVO is verschoven van 3001 naar 3003 zodat deze kopie naast het origineel kan draaien zonder poortconflict. Daarnaast is de UI-titel "Scholenoverzicht" hernoemd naar "scholenOverzicht" op zowel het startscherm-card als de SchoolOverviewPage h1, inclusief bijbehorend test-label en code-comment.

## Commits

- `d62d716` chore(concurrentoolVO): rename "Scholenoverzicht" to "scholenOverzicht"
- `f193f58` chore(concurrentoolVO): set dev server port to 3003
- `92b04a8` chore(handover): update Overzicht handover

## Bestandswijzigingen

```
 .handovers/Overzicht.md                            | 47 ++++++++++++++++++++++
 .../school-overview/SchoolOverviewPage.tsx         |  2 +-
 .../src/features/startscherm/StartschermPage.tsx   |  4 +-
 .../startscherm/__tests__/StartschermPage.test.tsx |  2 +-
 apps/concurrentoolVO/vite.config.ts                |  2 +-
 5 files changed, 52 insertions(+), 5 deletions(-)
```

Per bestand:

- `apps/concurrentoolVO/vite.config.ts` — dev server port 3001 → 3003 (strictPort blijft true)
- `apps/concurrentoolVO/src/features/school-overview/SchoolOverviewPage.tsx` — h1 hernoemd naar `scholenOverzicht`
- `apps/concurrentoolVO/src/features/startscherm/StartschermPage.tsx` — card-titel + code-comment hernoemd naar `scholenOverzicht`
- `apps/concurrentoolVO/src/features/startscherm/__tests__/StartschermPage.test.tsx` — test-beschrijving bijgewerkt (regex was al case-insensitive, geen functionele wijziging)
- `.handovers/Overzicht.md` — dit handover-bestand zelf

## Extra context

Buiten git (in `.gitignore`, daarom niet in de diff) zijn ook twee env-bestanden gekopieerd vanuit `../app-dev-os/`:

- `.mcp.json` (root)
- `apps/concurrentoolVO/.env.local` (bevat secrets, niet committen)

Verificatie tijdens deze sessie:

- `npm install` in `apps/concurrentoolVO/` — 765 packages
- `npx tsc --noEmit` — clean, geen errors
- `npx vitest run StartschermPage.test.tsx` — 3 passed
- `npm run dev` — Vite 8 ready in 676ms, `http://localhost:3003/` antwoordt met HTTP 200
- Dev-server draaide nog op de achtergrond aan eind van de sessie (task `byyl13m1z`)

Working tree is clean op moment van schrijven; alle wijzigingen staan in commits.
