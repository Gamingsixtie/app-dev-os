# Phase 8: Supabase & Deploy - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Migratie van lokale IndexedDB/Dexie-architectuur naar Supabase (Postgres) als primaire database, Vercel als hosting platform, en Supabase Auth voor team-authenticatie. Bestaande lokale data wordt gemigreerd bij eerste login. AI-calls worden beveiligd via Vercel serverless functions. Offline support komt later (Phase 13).

</domain>

<decisions>
## Implementation Decisions

### Supabase schema & data-migratie
- **D-01:** Volledig genormaliseerd Postgres schema — elke entiteit een eigen tabel: schools, contacts, conversations, actions, system_events, school_prices, conversation_tags. Relaties via foreign keys.
- **D-02:** SchoolRecord embedded arrays (contacts[], conversations[], etc.) worden aparte tabellen met school_id als FK. Wizard-data (levels[], student_counts, selected_modules[], module_setups[]) blijft op de schools tabel als array/JSONB.
- **D-03:** One-time sync bij eerste login: app detecteert IndexedDB data → toont migratiescherm ("Wilt u uw lokale data overzetten naar de cloud?") → push naar Supabase → markeer als migrated. Daarna is Supabase de enige bron.
- **D-04:** Nieuw `school_prices` tabel voor het prijsbeheer-model (SchoolPriceEntry): id, school_id, module_id, provider, amount, price_type ('publication' | 'agreed'), discount_percentage, source, verified_at, note, is_active, activation_reason, activated_at. Meerdere entries per module/aanbieder mogelijk, één is_active=true.
- **D-05:** Bestaande appliedOverrides worden gemigreerd naar school_prices met is_active=true en source="Gemigreerd uit v1"

### Authenticatie & multi-user
- **D-06:** Supabase Auth met email/wachtwoord of magic link. Drie rollen: accountmanager, manager, viewer.
- **D-07:** Team-model: users tabel met id, email, name, role, region, team_id. Teams tabel met id, name.
- **D-08:** Eigenaar-model: elke school heeft owner_id (accountmanager). Alle teamleden kunnen alle scholen LEZEN. Alleen de eigenaar (accountmanager) kan BEWERKEN. Managers en viewers zijn read-only.
- **D-09:** Default filters: accountmanager ziet "Mijn scholen", manager ziet "Alle scholen". Filterbaar op: mijn scholen, alle, regio, accountmanager.
- **D-10:** Row Level Security (RLS) op team_id: alle queries gefilterd op het team van de ingelogde gebruiker. Schrijfrechten extra gefilterd op owner_id + role.
- **D-11:** Audit trail: created_by en updated_by (user_id) op alle records. System events loggen welke gebruiker de actie deed.
- **D-12:** User profiel: naam, email, regio-toewijzing (vrij tekstveld), rol (accountmanager/manager/viewer)

### Deploy & API key beveiliging
- **D-13:** Hosting op Vercel — Vite build + serverless functions in /api/
- **D-14:** AI-calls via Vercel serverless functions als proxy. Frontend stuurt tekst naar /api/ai-intake, serverless function roept Claude Haiku aan met server-side ANTHROPIC_API_KEY. Resultaat gestreamed terug via SSE.
- **D-15:** Environment variables: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY server-side. VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY client-side. dangerouslyAllowBrowser wordt verwijderd.
- **D-16:** Supabase anon key in frontend voor directe DB-queries (beschermd door RLS). Service key alleen server-side.

### Offline & sync
- **D-17:** Phase 8 is online-only. Geen internet = geen app. Offline support (service worker, lokale cache, sync) komt in Phase 13 zoals gepland.
- **D-18:** IndexedDB/Dexie wordt na succesvolle migratie niet meer gebruikt als databron. Kan later hergebruikt worden als offline cache in Phase 13.

### Claude's Discretion
- Supabase project setup en configuratie
- Exacte tabelschema's en indexen
- Vercel project configuratie en build settings
- Migratie-UI design en error handling
- Auth flow UX (login pagina, redirect, session management)
- RLS policies implementatie
- API route structuur voor serverless functions

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Bestaande architectuur (te migreren)
- `src/db/database.ts` — Huidige Dexie schema en versie-migraties
- `src/db/types.ts` — SchoolRecord interface met alle embedded arrays (doelstructuur voor normalisatie)
- `src/db/operations.ts` — Alle CRUD operaties (moeten herschreven worden voor Supabase)
- `src/db/migrations.ts` — Dexie schema migraties (referentie voor data-transformatie)

### AI-integratie (te beveiligen)
- `src/lib/ai-intake.ts` — Huidige browser-side Anthropic SDK aanroep (moet naar serverless function)

### Project context
- `.planning/PROJECT.md` — Projectvisie, constraints, tech stack
- `.planning/ROADMAP.md` — Phase 8 scope en requirements
- `.planning/REQUIREMENTS.md` — ARCH-01..04 (data-architectuur requirements)

### Bestaande fase-context
- `.planning/phases/06-multi-school-data-layer/06-CONTEXT.md` — IndexedDB/Dexie beslissingen (als die bestaat)
- `.planning/phases/07-school-intelligence/07-CONTEXT.md` — CRM-lite datastructuren, embedded arrays pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Dexie CRUD operations** (`src/db/operations.ts`): Functie-signaturen als referentie voor Supabase equivalenten
- **SchoolRecord type** (`src/db/types.ts`): Blauwdruk voor genormaliseerd schema
- **Zustand stores** (`src/features/*/store.ts`): Moeten aangepast worden om Supabase te lezen i.p.v. Dexie
- **useLiveQuery** (dexie-react-hooks): Moet vervangen worden door Supabase realtime subscriptions of React Query

### Established Patterns
- **Zustand + persist middleware**: Stores gebruiken localStorage persist — moet herzien worden (Supabase is nu de bron)
- **hydrate() patroon**: SchoolLayout hydreert store bij navigatie vanuit Dexie — wordt Supabase fetch
- **react-hook-form + Zod**: Formulierpatroon blijft ongewijzigd
- **TanStack Router**: Routing blijft ongewijzigd, maar auth guard moet toegevoegd worden

### Integration Points
- **Alle Dexie imports** vervangen door Supabase client
- **useLiveQuery hooks** vervangen door useQuery/Supabase realtime
- **createSchool, updateSchoolData, deleteSchool** herschrijven voor Supabase
- **CRM operaties** (addContact, addConversation, etc.) herschrijven voor genormaliseerde tabellen
- **IntakePanel** en **ai-intake.ts** refactoren naar serverless function call
- **Auth guard** toevoegen aan router — ongeauthenticeerde gebruikers naar login

</code_context>

<specifics>
## Specific Ideas

- Migratiescherm moet duidelijk en vriendelijk zijn — accountmanagers zijn geen technische gebruikers. "Uw data wordt veilig overgezet" met voortgangsbalk.
- Login flow moet minimaal zijn — magic link is ideaal (geen wachtwoord onthouden). Email/wachtwoord als fallback.
- Regio-filter in het schooloverzicht is belangrijk voor managers die het totaalbeeld willen zien per regio
- "Wie heeft dit bijgewerkt" moet zichtbaar zijn bij prijzen en gespreksnotities — traceerbaarheid is key voor het team
- De app moet voelen alsof er niets veranderd is voor de eindgebruiker — zelfde UI, alleen sneller en gedeeld

</specifics>

<deferred>
## Deferred Ideas

- Offline support en service worker — Phase 13
- Real-time collaborative editing (twee gebruikers tegelijk op één school) — buiten scope
- SSO/SAML integratie voor Cito-intern — buiten scope, magic link voldoet
- Automatische backup/export van Supabase data — buiten scope
- Push notifications bij wijzigingen door collega's — buiten scope

</deferred>

---

*Phase: 08-supabase-deploy*
*Context gathered: 2026-03-22*
