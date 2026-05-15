# Stack Research — Klantreis VO (UI-prototype milestone)

**Domain:** Interactief UI-prototype voor klantreis-visualisatie (editorial-stijl), MT-validatie eerst, daarna migratie naar Next.js + Supabase
**Researched:** 2026-05-14
**Overall confidence:** HIGH

---

## Samenvatting (lees-mij eerst)

Deze milestone is een UI-validatie-prototype, geen product. Het MT moet kunnen klikken, structuur kunnen wijzigen, en akkoord geven op vorm en flow — zonder dat content of persistentie meespeelt. Pas in de volgende milestone komt Next.js + Supabase erin.

De aanbeveling is: **Vite 8 + React 19 + Tailwind CSS v4 + shadcn/ui + Zustand + @dnd-kit/core 6.3** met TypeScript, Lucide React voor iconen en self-hosted variable fonts via Fontsource. Deze keuzes zijn migratie-compatibel met Next.js (App Router) + Supabase: alle componenten zijn gewone React, shadcn/ui draait identiek op beide platforms, Zustand werkt op beide platforms, en Tailwind v4 + shadcn/ui zijn in 2026 de dominante UI-stack voor nieuwe Next.js-projecten.

**Wat we expliciet NIET doen in deze fase:** geen Next.js (overkill voor SPA-prototype zonder backend, vertraagt iteratie, dwingt RSC-mentaliteit op terwijl er geen server is), geen state-bibliotheek met server-componenten in gedachten (TanStack Query), geen authenticatie-stubs, geen PDF-export-werk.

**Confidence per kerncomponent:** Vite 8 stable HIGH, React 19 stable HIGH, Tailwind v4 stable HIGH, shadcn/ui Tailwind v4 + React 19 support HIGH, Zustand HIGH, dnd-kit core 6.3 production-ready HIGH (let op: react-package nog 0.x), Lucide React 1.x HIGH.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Node.js** | 22 LTS (≥20.19) | Runtime voor build- en dev-tooling | Vite 8 vereist Node ≥20.19; LTS-track minimaliseert versie-pijn bij Next.js-overstap. |
| **TypeScript** | 5.7+ | Statisch typesysteem | Standaard in moderne React-stacks; verplicht voor shadcn/ui en latere Supabase-types-generatie. Voorkomt rewrite-pijn bij Next.js-stap. |
| **React** | 19.x (stable) | UI-framework | React 19 is stable sinds 5 dec 2024, productie-rijp. Next.js 15.1+ ondersteunt React 19 officieel in App + Pages Router — geen kans op stack-mismatch bij migratie. |
| **Vite** | 8.x (stable, Rolldown-powered) | Dev-server + build | Vite 8 is stable sinds maart 2026, Rolldown-bundler is 10-30x sneller dan Vite 7. Voor een prototype waar iteratie-snelheid telt is dit de juiste keuze. Next.js komt pas in volgende milestone. |
| **@vitejs/plugin-react** | v6.x | React-fast-refresh transformer | Vite-team adviseert plugin-react (Oxc-based) als nieuwe default; SWC-variant blijft ondersteund maar Oxc is de toekomstige standaard. Geen Babel-dependency meer. |
| **Tailwind CSS** | 4.x (≥4.1) | Styling | v4 is stable, 5x snellere builds, single-line CSS-import, eerste-klas Vite-plugin (`@tailwindcss/vite`). shadcn/ui ondersteunt v4 als nieuwe default. CSS-variables-based theming maakt Cito-blauw-token triviaal te beheren. |
| **@tailwindcss/vite** | 4.x | Tailwind v4 Vite-plugin | Officiële first-party plugin; sneller dan de PostCSS-variant en zero-config content-detectie. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **shadcn/ui** | latest CLI (Tailwind v4 + React 19 mode) | Component-collectie (Dialog, Popover, Tabs, Tooltip, Command, Sheet) | Niet als npm-dep maar als copy-in componenten op basis van Radix-primitives. Geeft toegankelijkheid + keyboard-navigation gratis, blijft volledig editable in eigen code. **Voor deze milestone:** alleen de primitieven die we nodig hebben (Dialog/Sheet voor detail-paneel, Tabs voor klantreis-switcher, Popover/Command voor inline edit, Tooltip voor klantcitaten). |
| **Radix UI primitives** | (komt mee met shadcn/ui) | Toegankelijke headless primitives | Voor componenten waar shadcn/ui niet voldoende is (custom popovers, low-level a11y). |
| **Zustand** | 5.x | Globale state (klantreizen, lanes, fases, activiteiten, geselecteerde activiteit) | Lokale state-only UI met veel cross-component reads (lane-edit raakt timeline-view én aggregaat-view). Selector-based subscriptions voorkomen re-render-storms bij elke edit. `persist` middleware naar `localStorage` geeft "stand-houden tussen reloads" voor MT-sessies zonder backend. ~1.2 KB, geen providers nodig. |
| **immer** | 10.x (optioneel via Zustand `immer` middleware) | Immutable nested updates | Lanes/fases/activiteiten zijn diep-geneste structuren — directe mutaties via Immer leesbaarder dan handmatige spreads. |
| **@dnd-kit/core** | 6.3.1 | Drag-and-drop voor structuur-aanpassingen (lane-volgorde, fase-volgorde, activiteit-verplaatsing) | De stabiele production-keuze in 2026. **Niet** `@dnd-kit/react` (0.4.x, pre-1.0, nog niet stable). Volledig toegankelijk (keyboard + screen reader), framework-agnostisch React-implementatie, werkt identiek in Next.js straks. |
| **@dnd-kit/sortable** | 8.x | Sortable-preset bovenop @dnd-kit/core | Bijna alle structuur-edits zijn herordening — sortable-preset bespaart veel handmatig werk. |
| **lucide-react** | 1.14.x | Icon-set | v10-prototype gebruikt Lucide al. Ondersteunt React 19 expliciet (`peerDependencies: ^16.5.1 || ^17.0.0 || ^18.0.0 || ^19.0.0`). Tree-shakeable. Editorial-passend (lijn-gebaseerd, geen kleurvlakken). |
| **clsx** | 2.x | Conditionele class-namen | Standaard in shadcn/ui-componenten. |
| **tailwind-merge** | 2.x | Mergen van conflicterende Tailwind-classes | Standaard in shadcn/ui-componenten (`cn()`-utility). |
| **@fontsource-variable/inter** | 5.x | Inter Variable (UI-lettertype) | Self-hosted variable font, één bestand voor alle weights. Vermijdt Google-CDN call (privacy + performance + identiek gedrag tussen Vite-prototype en latere Next.js-deploy). |
| **@fontsource/source-serif-4** | 5.x | Source Serif 4 italic (klantcitaten) | Self-hosted Italic-variant via Fontsource. Identieke laad-strategie als Inter; werkt zonder aanpassing in Next.js (`next/font/local`) bij migratie. |
| **react-to-print** *(later)* | 3.x | Browser-print → PDF via systeem-dialog | NIET in deze milestone implementeren (out of scope). Vermeld als route voor latere milestone — geeft hi-fi PDF zonder pixel-rasterisatie zoals html2canvas. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Biome** | Lint + format (vervangt ESLint + Prettier) | Repo gebruikt Biome al (zie root `pnpm biome` in AGENTS.md). Snel, één tool, single config. |
| **pnpm** | Package manager | Repo-default (zie `pnpm tsc --noEmit` als pre-commit guard). Workspace-vriendelijk. |
| **TypeScript** | Compile-time type-checks | Pre-commit hook draait al `pnpm tsc --noEmit` — sluit aan op huidige workflow. |
| **Vitest** | Unit/component-testing | Native Vite-test-runner, identieke configuratie als de bundler. Test-coverage is geen scope deze milestone, maar setup is triviaal. |

---

## Installation

```bash
# Project-init (vanuit apps/Klantreis/)
pnpm create vite@latest klantreis-prototype --template react-ts
cd klantreis-prototype

# Core deps
pnpm add react@^19 react-dom@^19

# Styling
pnpm add -D tailwindcss@^4 @tailwindcss/vite@^4

# UI primitives + utilities (shadcn/ui zet deze automatisch neer bij eerste add)
pnpm add clsx tailwind-merge class-variance-authority lucide-react

# State + immutable updates
pnpm add zustand immer

# Drag & drop
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Fonts (self-hosted)
pnpm add @fontsource-variable/inter @fontsource/source-serif-4

# Dev / tooling (Biome staat in root)
pnpm add -D typescript@^5.7 @types/react@^19 @types/react-dom@^19 vitest

# shadcn/ui initialiseren (geen npm-dep — kopieert componenten in src/)
pnpm dlx shadcn@latest init
# Daarna per component:
pnpm dlx shadcn@latest add dialog sheet tabs popover tooltip command button input
```

**Vite-config kern (`vite.config.ts`):**
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

**CSS-entry (`src/index.css`):**
```css
@import "tailwindcss";
@import "@fontsource-variable/inter";
@import "@fontsource/source-serif-4/400-italic.css";

@theme {
  --color-cito-blue: #2E75B6;
  --color-mismatch: #E07A1F;       /* oranje, alleen voor mismatch */
  --color-blocking: #C0392B;        /* rood, alleen voor blokkerend */
  --font-sans: "Inter Variable", system-ui, sans-serif;
  --font-serif: "Source Serif 4", Georgia, serif;
}
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Vite 8 (SPA)** | Next.js 15 App Router | Alleen als deze milestone ook al backend-routes of RSC nodig had. Doet hij niet. Next.js voegt RSC-mental-model, file-based routing en server/client-split toe — overkill en vertragend voor MT-iteratie. **Wel** in volgende milestone. |
| **React 19** | React 18.3 | Als een hard-dependency (oude lib in eco) niet meekan met React 19. Niet aan de orde hier — alle aanbevolen libs ondersteunen 19. |
| **Tailwind CSS v4** | Tailwind v3.4 | Alleen als shadcn/ui-componenten uit oude registry komen die nog v3-CSS verwachten. Recente shadcn-CLI initialiseert direct in v4 — geen reden voor v3. |
| **Zustand** | React Context + useReducer | Voor 1–2 globale waardes die zelden wijzigen. Hier hebben we diep-geneste data (klantreizen → fases → activiteiten) met frequente edits en veel consumenten — Context zou re-render-storms geven. |
| **Zustand** | Jotai / Valtio | Jotai is atomair (atom-per-veld) en uitstekend voor formulier-zware UI. Hier is de state één samenhangend domeinmodel — store-based (Zustand) past beter en migreert later schoner naar Supabase (één query → één store-slice). |
| **Zustand** | TanStack Query | Pas zinvol als er een server is om tegen te queryen. Volgende milestone, niet nu. |
| **shadcn/ui (copy-in)** | Pure Radix UI primitives + eigen styling | Als een team al een eigen design-system heeft. Wij niet — shadcn levert de basis-componenten met goede defaults die we daarna naar editorial-stijl bijstellen. |
| **shadcn/ui** | Mantine / Chakra / MUI | Te opinionated qua look (dashboard-druk), botst met de editorial-eis ("geen onnodige labels, badges of visuele drukte"). |
| **@dnd-kit/core 6.3** | @dnd-kit/react 0.4 | Als deze prototype-fase ook bedoeld was als testbed voor de nieuwe API. Niet aan de orde — kies stable. |
| **@dnd-kit/core** | Atlassian Pragmatic drag-and-drop | Sterke kanshebber voor 2026, maar API minder bekend in eco en geen Cito-precedent. Bij twijfel: dnd-kit met breedste documentatie wint. |
| **@dnd-kit/core** | react-beautiful-dnd | Niet meer onderhouden, geen React 19-support. Niet kiezen. |
| **Lucide React** | Heroicons / Phosphor | Beide goed, maar v10-prototype gebruikt Lucide al — geen reden om te wisselen, geen migratie-cost. |
| **Self-hosted Fontsource** | Google Fonts CDN | CDN-call is privacy-laagje minder (AVG-relevant in onderwijs-context) en geeft inconsistente caching tussen Vite-dev en latere Next.js-deploy. Fontsource werkt overal identiek. |
| **Self-hosted Fontsource** | `next/font/google` later | Bij migratie naar Next.js kan dit overgenomen worden — `next/font` self-host eveneens automatisch. Beide routes leveren hetzelfde eindresultaat. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Next.js voor deze milestone** | Overkill voor SPA-prototype zonder backend. RSC, file-based routing en server/client split vertragen iteratie. Migratie-pad naar Next.js is trivieel (zie sectie onderaan). | Vite 8 + React 19 nu, Next.js 15 in volgende milestone. |
| **CDN-React + Tailwind via `<script>` (v10-aanpak)** | Werkt voor één-bestand-demo's, maar geen TypeScript, geen tree-shaking, geen Vite-HMR, geen shadcn-CLI, geen drag-and-drop-libs. Iteratie-snelheid die we juist nodig hebben loopt vast. | Vite 8 + TypeScript + ES-modules. |
| **Tailwind CSS v3 + PostCSS-config** | Tragere builds, geen native CSS-vars-theming, vereist `tailwind.config.js` waar v4 alles via CSS doet. Botst met latest shadcn-CLI. | Tailwind v4 + `@tailwindcss/vite`. |
| **CRA (Create React App)** | Officieel afgekondigd. Geen onderhoud, geen ESM-support voor moderne libs. | Vite. |
| **Redux Toolkit** | Boilerplate-zwaar voor een prototype waar de state-vorm nog evolueert. | Zustand. |
| **react-beautiful-dnd** | Niet meer actief onderhouden, geen React 19-support. | @dnd-kit/core. |
| **html2canvas + jsPDF voor PDF-export** | PDF wordt een gerasterde afbeelding (tekst niet selecteerbaar, lage kwaliteit). Voor editorial-document onacceptabel. | NIET deze milestone. Later: browser-print via `react-to-print` of server-side Puppeteer in Next.js-fase. |
| **MUI / Chakra / Mantine** | Eigen design-system + opinionated styling, conflicteert met editorial-eis. Lock-in. | shadcn/ui (copy-in, eigenaarschap). |
| **Google Fonts via `<link>`** | Privacy-issue (IP-logging), externe afhankelijkheid, gedragsverschil tussen dev en prod. | Self-hosted Fontsource of `next/font` (na migratie). |
| **localStorage als single source of truth zonder schema-versie** | Wijzigingen in state-shape breken oude sessies stilletjes. | Zustand `persist` middleware mét `version` + `migrate` callback vanaf dag 1. |
| **Wegwerp-componenten zonder TypeScript** | Domeinmodel (klantreis/fase/activiteit/DMU/randvoorwaarde) is rijk — getypeerde modellen zijn meteen herbruikbaar als basis voor latere Supabase-schemas. | TypeScript-types `as const` definiëren in `src/types/` vanaf eerste commit. |

---

## Stack Patterns by Variant

**Als de MT-iteratie sneller gaat dan verwacht en we kunnen al richting persistentie:**
- Gebruik Zustand `persist` middleware met `localStorage` als tussenstap (geen schema-migratie nodig).
- Vermijd voortijdige Supabase-koppeling — eerst MT-akkoord op data-vorm.

**Als de MT toch al een gedeeld document wil zien tijdens de validatie:**
- Vercel-preview-deploy van het Vite-prototype (Vercel ondersteunt Vite native).
- Zustand `persist` naar `localStorage` per browser — geen multi-user nog.

**Als blijkt dat drag-and-drop nauwelijks gebruikt wordt door MT:**
- Reduceer @dnd-kit naar alleen lane-volgorde; fase- en activiteit-edits via Popover/Command-menu's (al uit shadcn/ui aanwezig).

**Als content-vulling sneller op gang komt dan verwacht:**
- Splits content (placeholder-data) in `src/data/` aparte JSON-files per klantreis — minimaliseert merge-conflicten bij parallel werken aan content vs structuur.

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Vite 8.x | Node 20.19+ / 22 LTS | Vite 8 vereist `node >=20.19`. |
| Vite 8.x | @vitejs/plugin-react 6.x | Plugin-react v6 is de variant die met Vite 8 meegeleverd wordt; vermijd plugin-react-swc tenzij specifieke reden. |
| React 19.x | @types/react 19.x | TypeScript-types-package moet meeschalen — `npm install @types/react@^19`. |
| React 19.x | lucide-react 1.x | Officieel ondersteund (`^16 \|\| ^17 \|\| ^18 \|\| ^19`). |
| React 19.x | @dnd-kit/core 6.3.x | Werkt. **Niet** @dnd-kit/react 0.4 — pre-1.0. |
| React 19.x | shadcn/ui (recente CLI) | Volledige ondersteuning, `forwardRef` weggehaald, `data-slot` attributen voor styling. |
| Tailwind v4 | shadcn/ui (CLI init) | `pnpm dlx shadcn@latest init` zet automatisch v4 op. |
| Tailwind v4 | @tailwindcss/vite 4.x | Eerste-klas plugin; vermijd `@tailwindcss/postcss`-route tenzij Vite niet beschikbaar. |
| Zustand 5.x | React 19 | Volledig compatibel. |
| @dnd-kit/core 6.3.x | TypeScript 5.x | Geen type-issues bekend. |

---

## Migratie-pad → Next.js 15 + Supabase (volgende milestone)

**Doel:** structurele keuzes nu zo maken dat de volgende milestone géén rewrite wordt.

| Aspect | Wat we NU doen | Resultaat bij Next.js-overstap |
|--------|----------------|-------------------------------|
| **Routing** | Geen routing (single-page) of lichte `react-router-dom`-routes met simpele patronen | Next.js App Router neemt het over — `app/page.tsx` voor de hoofdview, `app/[reis]/page.tsx` voor klantreis-deep-links. Geen code-overschrijven, alleen verplaatsen. |
| **Componenten** | Alles als gewone client-components, geen window/document-direct-access in render | Voeg `"use client"` toe aan componenten die state-hooks of dnd-kit gebruiken (≈ alles). Containers worden RSC. Geen logica-verandering. |
| **State (Zustand)** | Store in `src/stores/klantreis.ts` met `persist` middleware naar `localStorage`, expliciete `version` + `migrate` callback | Zustand werkt identiek in Next.js. Bij Supabase-koppeling: vervang `persist`-middleware door TanStack Query-laag die Supabase-rows ophaalt → store hydrateert. Component-API verandert niet. |
| **Types** | Domeinmodel als TypeScript types in `src/types/klantreis.ts` (Klantreis, Fase, Activiteit, DMU, Randvoorwaarde) | Deze types worden de basis voor Supabase-schemamigratie. `supabase gen types typescript` levert later genereerde types die we kunnen vergelijken — geen domein-rewrite. |
| **Data-fetching** | Geen — alles in-memory + `persist` | Voeg TanStack Query toe (server-state) náást Zustand (UI-state). Migratie is additief, niet vervangend. |
| **Styling (Tailwind v4)** | `@theme` directive in `src/index.css` met Cito-tokens | Identiek in Next.js — `app/globals.css` krijgt dezelfde directive. |
| **Componenten (shadcn/ui)** | Copy-in via CLI in `src/components/ui/` | Verplaats `src/components/` naar `app/components/` (of houd `src/`) — werkt identiek. shadcn/ui-onderhoud is een copy-in patroon, geen npm-update-werk. |
| **Fonts (Fontsource)** | `@import` in CSS | Vervang door `next/font/local` of behoud Fontsource — beide werken. Inter Variable + Source Serif 4 Italic blijven gelijk. |
| **Drag & drop (@dnd-kit/core)** | Client-side, geen SSR-issue | Componenten met dnd worden client-components (`"use client"`). Geen API-verandering. |
| **Auth (geen)** | Niets — bewust uitgesloten | Bij Supabase-stap: `@supabase/ssr` met cookie-based auth in middleware. Niets in deze milestone om weg te gooien. |
| **Build-tool** | Vite 8 | Wordt vervangen door Next.js' eigen build (Turbopack of webpack). De `src/`-code blijft, alleen de wrapper verandert. |
| **Test (Vitest)** | Vitest-config in `vite.config.ts` | Vitest werkt ook in Next.js-projecten (`vitest.config.ts` los van Next-build). Tests blijven herbruikbaar. |

**Concrete migratie-stappen (latere milestone):**
1. `npx create-next-app@latest klantreis-next --typescript --tailwind --app` in een nieuwe map naast het prototype.
2. Kopieer `src/types/`, `src/stores/`, `src/components/`, `src/lib/` 1-op-1 naar de Next-app.
3. Pas `"use client"` toe op componenten die hooks/dnd-kit gebruiken (≈ alle interactieve UI).
4. Verplaats `src/App.tsx`-render-tree naar `app/page.tsx`.
5. Vervang `@import` font-rules door `next/font/local` (of behoud Fontsource).
6. Voeg `@supabase/ssr`-client toe, vervang `persist`-localStorage door Supabase-fetch-laag via TanStack Query.
7. Genereer Supabase-types: `supabase gen types typescript --project-id <id> > src/types/database.ts`, vergelijk met domain-types.

**De vuistregel:** als een keuze nu kost X dagen, maar bij Next.js-overstap óók X dagen kost in een andere vorm — kies de optie die nu sneller itereert. Vite-keuze voldoet daaraan.

---

## Confidence Assessment per aanbeveling

| Aanbeveling | Confidence | Grond |
|-------------|------------|-------|
| Vite 8 + React 19 + TS 5.7 | HIGH | Vite 8 stable maart 2026, React 19 stable dec 2024, beide goed gedocumenteerd, geen breaking issues bekend. |
| Tailwind CSS v4 + @tailwindcss/vite | HIGH | Stable, officiële Vite-plugin, shadcn-CLI ondersteunt v4 als default. |
| shadcn/ui (copy-in) | HIGH | Industry-standaard 2026 voor React-componenten, expliciete Tailwind v4 + React 19-support, geen lock-in. |
| Zustand 5.x | HIGH | Marktleider in 2026 (≈20M weekly downloads), geschikt voor zowel prototype als productie. |
| @dnd-kit/core 6.3 | HIGH (voor 6.3) / LOW (voor @dnd-kit/react 0.4) | 6.3 is stable production-keuze; de nieuwe `@dnd-kit/react` is 0.x en niet productie-rijp. Onderhoud-tempo van het project is een aandachtspunt — als drag-and-drop een kernfeature blijkt, vermeld in PITFALLS. |
| Lucide React 1.14 | HIGH | Officiële React 19-ondersteuning, v10 gebruikt al Lucide. |
| Fontsource self-hosted | HIGH | Standaardpatroon, identiek in Vite en Next.js. |
| Immer (optioneel) | MEDIUM | Niet strikt nodig — vraag is of geneste updates te lelijk worden zonder. Beslis bij eerste echte edit-flow. |
| Migratie-pad naar Next.js + Supabase | HIGH | Officiële Next.js-migratiegids van Vite bestaat, Supabase-SSR-stack is goed gedocumenteerd, alle componenten zijn gewone React. |
| react-to-print voor PDF later | MEDIUM | Standaard route, maar pas relevant in latere milestone; niet kritiek nu. |

---

## Open Questions / Risk Flags

1. **dnd-kit onderhoud-tempo** — Issue #1830 vraagt naar production-readiness; @dnd-kit/core 6.3.1 is een jaar geleden gepubliceerd. Voor deze milestone geen blocker (werkt + React 19-compatible), maar voor de productiefase moet bekeken worden of Atlassian Pragmatic DnD een betere optie wordt.
2. **shadcn/ui's `data-slot`-pattern in nieuwste release** vereist dat je niet vergeet de CLI te updaten vóór `add`-commando's — anders krijg je oude varianten zonder `data-slot`. Beleg een korte runbook-stap.
3. **localStorage-quota** (≈5-10 MB browser-afhankelijk) — voldoende voor placeholder-prototype maar kan krap worden als het MT veel content invult. Niet relevant voor pure structuur-validatie.
4. **Tom Koolen's DIN- + consolidatie-app** — als hij Next.js 15 + Supabase gebruikt, prima — dezelfde stack richting volgende milestone. Als hij iets afwijkends bouwt (bv. Remix), verifieer voor consolidatie-fase.

---

## Sources

- [React v19 stable release](https://react.dev/blog/2024/12/05/react-19) — release-datum 5 dec 2024, productie-status — HIGH
- [Next.js 15.1: React 19 stable support](https://nextjs.org/blog/next-15-1) — Next.js 15.1 ondersteunt React 19 in App + Pages Router — HIGH
- [Tailwind CSS v4.0 release notes](https://tailwindcss.com/blog/tailwindcss-v4) — v4 features, performance-cijfers, Vite-plugin — HIGH
- [@tailwindcss/vite on npm](https://www.npmjs.com/package/@tailwindcss/vite) — v4.x latest, plugin-API — HIGH
- [Vite 8.0 release announcement](https://vite.dev/blog/announcing-vite8) — release 12 maart 2026, Rolldown-bundler — HIGH
- [Vite migration to v8](https://vite.dev/guide/migration) — breaking changes, Node-versie-eisen — HIGH
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — officiële v4-support — HIGH
- [shadcn/ui React 19 docs](https://ui.shadcn.com/docs/react-19) — officiële React 19-support — HIGH
- [Zustand vs Context (TkDodo)](https://tkdodo.eu/blog/zustand-and-react-context) — wanneer welke — MEDIUM (auteur is reactjs-maintainer, veel autoriteit)
- [State management 2026 (Syncfusion)](https://www.syncfusion.com/blogs/post/react-state-management-libraries) — Zustand ≈20M weekly downloads — MEDIUM
- [lucide-react on npm](https://www.npmjs.com/package/lucide-react) — v1.14, React 19 peer-dep — HIGH
- [@dnd-kit/core on npm](https://www.npmjs.com/package/@dnd-kit/core) — 6.3.1 latest stable — HIGH
- [@dnd-kit/react on npm](https://www.npmjs.com/package/@dnd-kit/react) — 0.4.x, pre-1.0 status — HIGH
- [dnd-kit production-use issue #1830](https://github.com/clauderic/dnd-kit/issues/1830) — onderhoud-discussie — MEDIUM
- [Next.js migrating from Vite guide](https://nextjs.org/docs/app/guides/migrating/from-vite) — officieel migratie-pad — HIGH
- [Supabase + Next.js App Router quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) — officiële stack-koppeling — HIGH
- [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts) — self-host-strategie — HIGH
- [Fontsource Source Serif 4 npm](https://www.npmjs.com/package/@fontsource/source-serif-4) — self-host-pakket — HIGH
- [Radix UI vs shadcn/ui comparison](https://shadcnstudio.com/blog/radix-ui-vs-shadcn-ui) — relatie en use-cases — MEDIUM
- [React PDF approaches 2026](https://copyprogramming.com/howto/react-transferring-html-elements-to-web-worker-to-generate-pdf-using-jspdf-and-html2canvas) — html2canvas vs react-pdf — MEDIUM

---

*Stack research voor: Klantreis VO UI-prototype milestone*
*Researched: 2026-05-14*
*Confidence: HIGH (kernkeuzes), met expliciete LOW-flag op @dnd-kit/react 0.x*
