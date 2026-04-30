# Voorbereidings-document training

Hi,

Ter voorbereiding op de training even een update over waar ik nu sta — zowel qua tooling-setup als qua project waar ik mee werk. De stack-vragen die je eerder stelde beantwoord ik in deel twee; daarvoor wil ik je eerst meenemen in iets dat ik op dit moment aan het opzetten ben, omdat dat de context vormt waarin ik de cursus ga toepassen.

---

## Deel 1 — Wat ik op dit moment aan het opzetten ben

Ik ben bezig met een eigen **App-Dev Agentic framework** — een Claude Code-template specifiek voor app-development. Het is mijn implementatie van wat Anthropic in 2025 officieel **Context Engineering** is gaan noemen (zie hun blog *Effective context engineering for AI agents*). Het idee dat erachter zit, herken je waarschijnlijk wel: in plaats van per prompt opnieuw context geven aan de AI, leg je je werkmanier, je conventies, je architectuur en je geheugen vast in een gestructureerde fundering die elke sessie laadt. Geen losse prompts meer die telkens cold starten, maar een agent die weet wie ik ben, hoe ik werk, en wat we eerder besloten hebben.

De aanleiding om hieraan te beginnen is herkenbaar. Tot voor kort was mijn werkwijze: gewoon beginnen met bouwen, en de stack ontstond gaandeweg. Dat werkt prima voor de eerste twee features. Daarna gaat het mis. De AI vergeet alles tussen sessies, beslissingen worden niet vastgelegd, conventies driften, dezelfde bug wordt opnieuw gemaakt, en wat begon als één duidelijke keuze wordt een verzameling losse keuzes zonder samenhang. Het beginstadium — de fundering — ontbreekt vaak, en je betaalt het later met refactors of door dingen weg te gooien.

Met dit framework probeer ik dat aan de voorkant op te lossen. Concreet betekent dat een eenmalige investering van ongeveer anderhalf tot twee uur waarin ik vastleg wie de agent is (een soort engineering-ethos), wie ik ben (mijn stack, working style, risk posture), wat de regels zijn (naming, lint, idioms, banned patterns), wat het systeem is (architectuur, components, dataflow, invariants), waar het draait (environments, deploy, rollback) en wat de AI wel én niet mag (skills met expliciete triggers, hooks die secrets en push-to-main blokkeren). Alles in plain markdown, dus diff-baar, version-baar, en leesbaar voor zowel mens als AI.

Wat het echt waardevol maakt zijn de drie ingebouwde feedbackloops die ervoor zorgen dat het systeem scherper wordt over tijd zonder dat ik het actief moet onderhouden. Na elke deliverable krijgt de skill een korte feedback-loop ("shipped clean? gotchas?"), die landt in een learnings-bestand per skill. Aan het einde van een fase worden lessons geëxtraheerd. En architectuur-keuzes worden vastgelegd als immutable Architecture Decision Records — zodat ik over een half jaar nog weet waarom ik destijds Vite koos boven Next.js, of Supabase direct boven een ORM. Een gotcha kan zo over tijd promoveren van een losse leerregel naar een conventie, en uiteindelijk naar een volledige ADR als de impact groot genoeg is.

De voordelen zitten dus niet in snelheid op de eerste twee features — daar is "vibe coding" altijd sneller — maar in alles daarna. Feature 5 tot 50 blijven constant snel in plaats van dat het werk steeds trager wordt. Onboarding van een nieuwe ontwikkelaar verschuift van "lees de hele codebase" naar "lees vijf markdown-bestanden". Conventies blijven consistent. Bugs worden proactief voorkomen door pre-commit hooks in plaats van reactief gefixed in productie. AI-tokens gaan omlaag omdat skills alleen de context laden die ze echt nodig hebben (lazy loading per Context Matrix). En misschien wel het belangrijkste: er is daadwerkelijk geheugen — git log, ADRs en learnings-bestanden samen vormen een vorm van persistent memory die niet verdampt tussen sessies.

De template zelf bestaat uit drie lagen, allemaal in markdown. De **Agent Identity-laag** (`AGENTS.md`, `CLAUDE.md`, `DEV_ETHOS.md`, `USER.md`) legt vast wie de agent is en wie ik ben. De **Skills Pack-laag** (`.claude/skills/{categorie}-{naam}/`) bevat de discrete capabilities die de agent kan uitvoeren — stuk voor stuk lazy-loaded zodat ze alleen activeren als de juiste trigger-phrases voorbij komen. En de **Two-layer Context-laag** splitst code-conventies, architectuur en runbook (in `code_context/`) van eventuele in-app microcopy (in `brand_context/`, voor UI-tekst zoals error messages en onboarding). Daarbovenop staat nog een `ADR/`-folder voor architecture decisions, een `cron/jobs/`-folder voor scheduled tasks zoals dependency-audits en stale-branch checks, en een `apps/`-folder waarmee ik meerdere apps kan beheren onder dezelfde shared methodologie.

Tegen de tijd van onze training is dit live. Ik vertel je dit niet omdat ik verwacht dat je cursus-content erop afgestemd moet zijn, maar omdat het mijn vertrekpunt is — en ik vermoed dat het raakt aan onderwerpen die jij ook behandelt.

---

## Deel 2 — De huidige tech-stack die je opvroeg

Het project waar ik aan werk is een rekentool die zonder dit framework is opgebouwd, dus de keuzes hieronder zijn nu impliciet (alleen in de code zichtbaar) en ga ik tegen de training in vastleggen in `code_context/conventions.md`, `architecture.md` en `runbook.md`. Hier de beschrijving zoals je 'm vroeg.

### Tech-stack

De **frontend** is een Single Page Application gebouwd met **Vite 8** als build tool en dev server, en draait op **React 19 met TypeScript 5.9** in strict mode. Voor styling gebruik ik **Tailwind CSS v4** (via `@tailwindcss/vite`). Routing gaat via **TanStack Router**, server-state via **TanStack Query**, en client-state via **Zustand 5** met persist-middleware naar localStorage. Forms en validatie doe ik met **react-hook-form + Zod**. Voor specifieke onderdelen gebruik ik **Recharts** (grafieken), **@react-pdf/renderer** (PDF-export), **@dnd-kit** (drag-and-drop), **Dexie** als IndexedDB-wrapper voor lokale offline opslag, en **vite-plugin-pwa** waarmee de app draait als Progressive Web App.

De **backend** is serverless: **Vercel Serverless Functions** in een `api/`-map, allemaal TypeScript-bestanden (`ai-advice.ts`, `ai-intake.ts`, `analyze-schoolplan.ts`, `extract-document.ts`, etc.). Ze draaien in regio fra1 (Frankfurt) met een limiet van 60 seconden per call. Voor document-parsing gebruik ik `pdf-parse`, `mammoth` (Word) en `xlsx` (Excel).

**Testing** is `Vitest 4` in combinatie met `@testing-library/react`, `jsdom` en `fake-indexeddb`. **Hosting** gaat via Vercel met auto-deploy vanuit git.

### Externe applicaties en integraties

De stack hangt aan drie externe applicaties. **Anthropic Claude API** gebruik ik voor AI-intake en wizard-extract — concreet `claude-haiku-4-5` via `@anthropic-ai/sdk`, met structured output via Zod-schema's en `messages.parse()`. De key zit in `VITE_ANTHROPIC_API_KEY`. **Supabase** levert de database, authenticatie en storage. **Vercel** doet hosting plus de serverless functions. Geen koppelingen met Slack, Teams of Salesforce op dit moment.

### Programmeertaal en libraries

Eén taal door de hele stack heen: **TypeScript**. Zowel de frontend als de Vercel API-functions zijn TypeScript. De belangrijkste libraries op een rij: React 19 voor UI, Zustand en TanStack Query voor state, react-hook-form met Zod voor forms, TanStack Router voor routing, Tailwind v4 voor styling, `@anthropic-ai/sdk` voor AI, `@supabase/supabase-js` plus Dexie voor data, `@react-pdf/renderer` met `pdf-parse`, `mammoth` en `xlsx` voor documenten, Recharts voor charts, en `@dnd-kit` voor drag-and-drop.

### Database

Ja — en eigenlijk drie lagen tegelijk. De **primaire externe database is Supabase** (PostgreSQL) met migraties in `supabase/migrations/`: `001_initial_schema.sql`, `002_rls_policies.sql` (Row Level Security), `003_create_documents_bucket.sql` (Supabase Storage voor documenten), `004_schoolplan_analyses.sql`, `005_engagement_status.sql`, en `006-008` met RLS-fixes en `planned_touchpoints`. Lokaal in de browser gebruik ik **IndexedDB via Dexie** voor offline en snelle client-side opslag (in `src/db/`). En `localStorage` wordt gebruikt door de Zustand persist-middleware voor wizard-state en prijsoverschrijvingen.

### Bijzonderheden die handig zijn om te weten

Een paar dingen die niet uit de stack-keuzes zelf spreken maar wel relevant zijn. De app draait als **PWA**, dus installeerbaar en deels offline-werkend dankzij IndexedDB. De rekenlogica zit in **pure-function "engines"** in `src/engine/` — drie stuks (`price-comparison`, `current-vs-proposed`, `migration`), allemaal side-effect-vrij en volledig getest. Belangrijk om te weten: **AI is geen black box** in dit project. Claude wordt alleen gebruikt voor intake (ongestructureerde tekst omzetten naar wizard-velden), en altijd via structured output met Zod-schema's. De rekenlogica zelf is volledig deterministisch, niet AI. Dat houdt het uitlegbaar en betrouwbaar.

Verder draaien er twee Zustand stores met persist (de app onthoudt waar je was als je de browser sluit), gebruik ik een **taal-conventie** waarbij alle UI-tekst Nederlands is en alle code/comments Engels, en zitten er drie hard-coded providers in de comparison engine: Cito, DIA en JIJ. Een path alias `@` verwijst naar `/src`. De deploy-flow is simpel: push naar git en Vercel deployt automatisch — geen aparte CI nodig. Twee bestanden zijn "locked" en mogen niet zonder goedkeuring gewijzigd worden: `src/data/default-prices.ts` en `cito-migration-prices.ts`. En tot slot: Vercel functions hebben een limiet van 60 seconden, wat relevant kan zijn voor langere AI- of document-analyses.

---

## Tot slot

Mocht het helpen voor de cursus-voorbereiding: zodra het App-Dev Agentic framework stabiel is publiceer ik het op GitHub, dan heb je alles in één keer in te zien. Voor nu vooral: dit is waar ik sta, dit is wat ik bouw, en dit is de stack waarmee ik werk. Ik ben benieuwd in hoeverre dit raakt aan jouw cursus-content en of er aandachtspunten zijn die jij vaak ziet bij iemand op dit punt in de leercurve.

Tot de training,
Pim

---

*Document live in mijn App-Dev Agentic template-root. Laatst bijgewerkt: 2026-04-28.*
