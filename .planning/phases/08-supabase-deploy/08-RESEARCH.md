# Phase 8: Supabase & Deploy - Research

**Researched:** 2026-03-22
**Domain:** Supabase (Postgres + Auth + RLS), Vercel (hosting + serverless functions), data migration (IndexedDB to Postgres)
**Confidence:** HIGH

## Summary

Phase 8 migrates the app from a local-first IndexedDB/Dexie architecture to a cloud-first Supabase (Postgres) backend with Vercel hosting. This involves five major workstreams: (1) normalized Postgres schema design with SQL migrations, (2) Supabase Auth with email/password and magic link supporting three roles, (3) Row Level Security policies for team-based access control, (4) data access layer replacement (Dexie CRUD to Supabase client), and (5) Vercel deployment with serverless AI-proxy functions.

The existing codebase has ~30 files importing from `@/db/` (database, types, operations) and 5 components using `useLiveQuery` from dexie-react-hooks. The SchoolRecord is a single denormalized document with embedded arrays for contacts, conversations, actions, and systemEvents. These must be split into separate Postgres tables with foreign keys per decision D-01/D-02. The AI intake function (`src/lib/ai-intake.ts`) currently uses the Anthropic SDK directly in the browser with `dangerouslyAllowBrowser: true` -- this must move to a Vercel serverless function.

**Primary recommendation:** Build the Supabase data layer and auth as a new `src/lib/supabase/` module, replace `src/db/operations.ts` function-by-function with Supabase equivalents maintaining the same signatures, and add Vercel serverless functions in `/api/` for the AI proxy. Use TanStack React Query for server-state management instead of Zustand persist.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Volledig genormaliseerd Postgres schema -- elke entiteit een eigen tabel: schools, contacts, conversations, actions, system_events, school_prices, conversation_tags. Relaties via foreign keys.
- **D-02:** SchoolRecord embedded arrays (contacts[], conversations[], etc.) worden aparte tabellen met school_id als FK. Wizard-data (levels[], student_counts, selected_modules[], module_setups[]) blijft op de schools tabel als array/JSONB.
- **D-03:** One-time sync bij eerste login: app detecteert IndexedDB data, toont migratiescherm, push naar Supabase, markeer als migrated. Daarna is Supabase de enige bron.
- **D-04:** Nieuw `school_prices` tabel voor het prijsbeheer-model (SchoolPriceEntry): id, school_id, module_id, provider, amount, price_type, discount_percentage, source, verified_at, note, is_active, activation_reason, activated_at.
- **D-05:** Bestaande appliedOverrides worden gemigreerd naar school_prices met is_active=true en source="Gemigreerd uit v1"
- **D-06:** Supabase Auth met email/wachtwoord of magic link. Drie rollen: accountmanager, manager, viewer.
- **D-07:** Team-model: users tabel met id, email, name, role, region, team_id. Teams tabel met id, name.
- **D-08:** Eigenaar-model: elke school heeft owner_id (accountmanager). Alle teamleden kunnen alle scholen LEZEN. Alleen de eigenaar (accountmanager) kan BEWERKEN.
- **D-09:** Default filters: accountmanager ziet "Mijn scholen", manager ziet "Alle scholen".
- **D-10:** Row Level Security (RLS) op team_id: alle queries gefilterd op het team van de ingelogde gebruiker. Schrijfrechten extra gefilterd op owner_id + role.
- **D-11:** Audit trail: created_by en updated_by (user_id) op alle records.
- **D-12:** User profiel: naam, email, regio-toewijzing, rol.
- **D-13:** Hosting op Vercel -- Vite build + serverless functions in /api/
- **D-14:** AI-calls via Vercel serverless functions als proxy met SSE streaming.
- **D-15:** Environment variables: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY server-side. VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY client-side.
- **D-16:** Supabase anon key in frontend voor directe DB-queries (beschermd door RLS).
- **D-17:** Phase 8 is online-only. Geen offline support.
- **D-18:** IndexedDB/Dexie wordt na succesvolle migratie niet meer gebruikt als databron.

### Claude's Discretion
- Supabase project setup en configuratie
- Exacte tabelschema's en indexen
- Vercel project configuratie en build settings
- Migratie-UI design en error handling
- Auth flow UX (login pagina, redirect, session management)
- RLS policies implementatie
- API route structuur voor serverless functions

### Deferred Ideas (OUT OF SCOPE)
- Offline support en service worker -- Phase 13
- Real-time collaborative editing -- buiten scope
- SSO/SAML integratie -- buiten scope
- Automatische backup/export van Supabase data -- buiten scope
- Push notifications bij wijzigingen door collega's -- buiten scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARCH-01 | Gebruiker kan meerdere schoolprofielen aanmaken, openen en verwijderen | Supabase schools table replaces Dexie; CRUD operations rewritten for Supabase client |
| ARCH-02 | Bestaande v1 localStorage-data wordt automatisch gemigreerd | D-03 one-time sync from IndexedDB to Supabase at first login; D-05 appliedOverrides to school_prices |
| ARCH-03 | Applicatie gebruikt IndexedDB/Dexie voor schooldata-persistentie met 50+ scholen | **Reinterpreted for Phase 8:** Supabase Postgres replaces IndexedDB as primary store; 50+ schools easily handled by Postgres |
| ARCH-04 | Navigatie ondersteunt browser-back-button, deep linking, URL-state | TanStack Router unchanged; auth guard added to protect routes |
| AUTH-01 | Gebruiker kan inloggen via email/wachtwoord of magic link met Supabase Auth | Supabase Auth with `signInWithPassword` and `signInWithOtp` (magic link) |
| AUTH-02 | Drie rollen: accountmanager, manager, viewer | Custom `users` table with role column + RLS policies; role stored in app_metadata or custom table |
| AUTH-03 | Elke wijziging toont wie en wanneer -- traceerbaarheid | created_by/updated_by columns on all tables, populated via auth.uid() |
| DEPLOY-01 | App draait op Vercel met Supabase backend, API keys server-side | Vite build to Vercel; /api/ serverless functions for AI proxy; vercel.json SPA rewrites |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.99.3 | Supabase client (auth, database, realtime) | Official JS client; handles auth session, Postgres queries, RLS-aware |
| @tanstack/react-query | 5.94.5 | Server-state management, caching, mutations | Replaces useLiveQuery pattern; handles loading/error/refetch; industry standard |
| @anthropic-ai/sdk | 0.80.0 | Anthropic API calls (server-side only) | Already in use; moves from browser to serverless |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vercel/functions | latest | Vercel function helpers (waitUntil, env) | Optional; for advanced function lifecycle |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tanstack/react-query | Supabase realtime subscriptions | React Query is simpler for CRUD; realtime adds complexity not needed until Phase 13 |
| Custom auth context | @supabase/auth-helpers-react | auth-helpers-react is deprecated; use supabase-js v2 directly with custom AuthProvider |

**Installation:**
```bash
npm install @supabase/supabase-js @tanstack/react-query
```

**Dev dependency (local Vercel development):**
```bash
npm install -D vercel
```

**Version verification:** All versions confirmed via npm registry on 2026-03-22.

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    supabase/
      client.ts           # createClient with env vars
      auth.ts             # signIn, signUp, signOut, onAuthStateChange
      types.ts            # Database type definitions (generated or manual)
  db/
    operations.ts         # REWRITTEN: same function signatures, Supabase implementation
    types.ts              # KEPT: TypeScript interfaces (shared between old and new)
    migrations.ts         # EXTENDED: IndexedDB-to-Supabase migration logic
  features/
    auth/
      AuthProvider.tsx    # React context for auth state
      LoginPage.tsx       # Email/password + magic link form
      ProtectedRoute.tsx  # Route guard component
    migration/
      CloudMigrationWizard.tsx  # IndexedDB -> Supabase migration UI
  hooks/
    useSchools.ts         # React Query hooks for school data
    useContacts.ts        # React Query hooks for contacts
    useConversations.ts   # React Query hooks for conversations
api/
  ai-intake.ts            # Vercel serverless function (AI proxy)
supabase/
  migrations/
    001_initial_schema.sql    # Tables, indexes, constraints
    002_rls_policies.sql      # Row Level Security policies
    003_seed_teams.sql        # Initial team/user setup
vercel.json                   # SPA rewrites + function config
```

### Pattern 1: Supabase Client Initialization
**What:** Single client instance for the entire app
**When to use:** Always -- one client per app
**Example:**
```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

### Pattern 2: AuthProvider with Session Management
**What:** React context that wraps app with auth state
**When to use:** At app root, wrapping all routes
**Example:**
```typescript
// src/features/auth/AuthProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;  // from custom users table
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Subscribe to auth changes via supabase.auth.onAuthStateChange()
// Fetch user profile (role, team_id) from custom users table after auth
```

### Pattern 3: React Query Hooks Replacing useLiveQuery
**What:** Custom hooks that fetch from Supabase with React Query
**When to use:** Every component that previously used useLiveQuery or direct Dexie access
**Example:**
```typescript
// src/hooks/useSchools.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function useSchools() {
  return useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('schools')
        .insert({ name, slug: generateSlug(name) })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schools'] }),
  });
}
```

### Pattern 4: Vercel Serverless Function (AI Proxy with SSE)
**What:** Server-side function that proxies AI calls
**When to use:** For all AI interactions -- never expose API key to browser
**Example:**
```typescript
// api/ai-intake.ts
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: Request) {
  // Verify Supabase auth token from request header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  const { notes } = await request.json();

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY, // server-side env var
  });

  // For streaming (SSE):
  const stream = await client.messages.stream({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: notes }],
  });

  return new Response(stream.toReadableStream(), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
```

### Pattern 5: RLS Policies for Team-Based Access
**What:** Postgres policies that filter data by team and enforce write permissions
**When to use:** On every table that stores user data
**Example:**
```sql
-- All team members can read all schools in their team
CREATE POLICY "team_read_schools" ON schools
  FOR SELECT USING (
    team_id = (SELECT team_id FROM users WHERE id = auth.uid())
  );

-- Only the owner (accountmanager) can update their own schools
CREATE POLICY "owner_write_schools" ON schools
  FOR UPDATE USING (
    owner_id = auth.uid()
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'accountmanager'
  );

-- Only accountmanagers can insert schools (they become owner)
CREATE POLICY "accountmanager_insert_schools" ON schools
  FOR INSERT WITH CHECK (
    owner_id = auth.uid()
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'accountmanager'
  );
```

### Pattern 6: vercel.json for SPA + API
**What:** Vercel config that routes SPA paths to index.html but preserves /api/ routes
**Example:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/((?!api/.*).*)",
      "destination": "/index.html"
    }
  ]
}
```

### Anti-Patterns to Avoid
- **Keeping Zustand persist for server data:** Supabase is the source of truth. Remove persist middleware from stores that held school data. Use React Query cache instead.
- **Calling Supabase service key from frontend:** The service key bypasses RLS. Only use it in serverless functions. Frontend uses anon key.
- **Storing role in JWT claims without a custom users table:** JWT claims are set at login and not updated until re-login. Use a custom users table and query it for role checks.
- **Using Supabase realtime for everything:** Adds complexity. React Query with refetchOnWindowFocus is sufficient for this phase. Realtime is for Phase 13 (collaborative features are deferred).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth session management | Custom JWT handling, token refresh | Supabase Auth (`onAuthStateChange`) | Handles token refresh, session persistence, PKCE flow automatically |
| Row-level access control | Application-level filtering in JS | Postgres RLS policies | Defense-in-depth; cannot be bypassed by client |
| Server-state caching | Manual cache in Zustand | TanStack React Query | Stale-while-revalidate, background refetch, query invalidation built-in |
| Database migrations | Raw SQL in application code | Supabase CLI migrations (`supabase db push`) | Versioned, repeatable, rollback-capable |
| Slug generation for URLs | Custom slug logic | Keep existing `slugify` library | Already works; just ensure uniqueness check queries Supabase instead of Dexie |

**Key insight:** The Supabase ecosystem handles auth, RLS, and migrations as integrated features. Fighting the framework by building custom solutions leads to security gaps and maintenance burden.

## Normalized Schema Design

Based on decisions D-01 through D-05, the database schema should be:

```sql
-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('accountmanager', 'manager', 'viewer')),
  region TEXT DEFAULT '',
  team_id UUID REFERENCES teams(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Schools (wizard data as JSONB per D-02)
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  team_id UUID REFERENCES teams(id) NOT NULL,
  owner_id UUID REFERENCES users(id) NOT NULL,
  is_complete BOOLEAN DEFAULT false,
  completed_steps INTEGER[] DEFAULT '{}',
  -- Wizard data stays as JSONB (D-02)
  levels TEXT[] DEFAULT '{}',
  student_counts JSONB DEFAULT '{}',
  selected_modules TEXT[] DEFAULT '{}',
  module_setups JSONB DEFAULT '[]',
  scenario TEXT,
  -- Migration-related
  migration_hourly_rate NUMERIC DEFAULT 50,
  migration_time_saving_overrides JSONB DEFAULT '{}',
  -- Pipeline
  pipeline_status TEXT DEFAULT 'prospect',
  lost_deal_info JSONB,
  region TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  view_preference TEXT DEFAULT 'compact',
  -- Audit
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contacts (was embedded array in SchoolRecord)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dmu_position TEXT NOT NULL,
  job_title TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  preferred_channel TEXT DEFAULT 'email',
  authority TEXT DEFAULT 'adviserend',
  last_contact_date DATE,
  notes TEXT DEFAULT '',
  is_primary BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conversations (was embedded array)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Actions (was embedded array)
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  conversation_id UUID REFERENCES conversations(id),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- System Events (was embedded array)
CREATE TABLE system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  user_id UUID REFERENCES users(id)
);

-- School Prices (new table per D-04)
CREATE TABLE school_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  module_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  price_type TEXT NOT NULL CHECK (price_type IN ('publication', 'agreed')),
  discount_percentage NUMERIC DEFAULT 0,
  source TEXT DEFAULT '',
  verified_at TIMESTAMPTZ,
  note TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT false,
  activation_reason TEXT,
  activated_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_schools_team_id ON schools(team_id);
CREATE INDEX idx_schools_owner_id ON schools(owner_id);
CREATE INDEX idx_schools_slug ON schools(slug);
CREATE INDEX idx_contacts_school_id ON contacts(school_id);
CREATE INDEX idx_conversations_school_id ON conversations(school_id);
CREATE INDEX idx_actions_school_id ON actions(school_id);
CREATE INDEX idx_system_events_school_id ON system_events(school_id);
CREATE INDEX idx_school_prices_school_id ON school_prices(school_id);
CREATE INDEX idx_school_prices_active ON school_prices(school_id, module_id, provider) WHERE is_active = true;
```

## Migration Surface Analysis

Files that must be modified to replace Dexie with Supabase:

### Direct Dexie imports (MUST change)
| File | Current Usage | New Pattern |
|------|--------------|-------------|
| `src/db/database.ts` | Dexie DB class | Replace with Supabase client export |
| `src/db/operations.ts` | All CRUD functions | Rewrite all functions for Supabase |
| `src/db/migrations.ts` | v1 localStorage migration | Extend with IndexedDB-to-Supabase sync |
| `src/lib/slugify.ts` | Slug uniqueness check against Dexie | Query Supabase instead |

### useLiveQuery consumers (MUST change)
| File | Current Pattern | New Pattern |
|------|----------------|-------------|
| `src/components/routing/SchoolLayout.tsx` | `useLiveQuery(() => db.schools.where('slug'))` | `useQuery` with Supabase |
| `src/features/school-profile/tabs/ContactsTab.tsx` | `useLiveQuery(() => db.schools.get(id))` | `useQuery` with Supabase join |
| `src/features/school-profile/tabs/ConversationsTab.tsx` | `useLiveQuery(() => db.schools.get(id))` | `useQuery` with Supabase |
| `src/features/school-overview/SchoolOverviewPage.tsx` | `useLiveQuery(() => db.schools.orderBy())` | `useSchools()` hook |

### Direct db/operations imports (MUST change)
| File | Functions Used |
|------|---------------|
| `src/components/wizard/WizardShell.tsx` | `updateSchoolData` |
| `src/components/ui/DeleteSchoolDialog.tsx` | `deleteSchool` |
| `src/features/school-overview/AddSchoolButton.tsx` | `createSchool` |
| `src/features/school-profile/tabs/DashboardTab.tsx` | `updateSchoolData` |
| `src/features/school-profile/components/ActionKanban.tsx` | `updateAction, addAction, deleteAction` |
| `src/features/school-profile/components/ContactForm.tsx` | `addContact, updateContact` |
| `src/features/school-profile/components/ConversationForm.tsx` | `addConversation, updateConversation` |
| `src/features/school-profile/components/ProfileHeader.tsx` | `setPipelineStatus, validatePipelineTransition` |
| `src/features/school-profile/components/WizardStep1.tsx` | `updateSchoolData` |
| `src/features/school-overview/PipelineKanbanView.tsx` | `setPipelineStatus, validatePipelineTransition` |

### Type imports only (KEEP as-is or adjust)
| File | Types Used |
|------|-----------|
| Multiple components | `SchoolRecord`, `Contact`, `Conversation`, `ActionItem`, etc. |
| `src/features/school-profile/store.ts` | Store state types |
| `src/features/price-comparison/store.ts` | `SchoolRecord` |

### AI intake (MUST move to serverless)
| File | Change |
|------|--------|
| `src/lib/ai-intake.ts` | Move logic to `api/ai-intake.ts`; frontend calls fetch to `/api/ai-intake` |

### Zustand stores (MUST refactor)
| Store | Change |
|-------|--------|
| `useSchoolProfileStore` | Remove persist middleware for school data; keep as in-memory working state; hydrate from React Query |
| `usePriceComparisonStore` | Remove persist middleware; reads from Supabase school_prices table |

## Common Pitfalls

### Pitfall 1: RLS Policy Circular Dependencies
**What goes wrong:** RLS policies on `users` table query the `users` table itself (e.g., checking team_id), creating infinite recursion.
**Why it happens:** Postgres evaluates RLS on every table access, including within policy definitions.
**How to avoid:** Use `auth.uid()` directly (which reads from JWT, not a table query). For role/team lookups, use a security definer function that bypasses RLS.
**Warning signs:** Queries hang or return "infinite recursion detected" errors.

```sql
-- CORRECT: Security definer function for team_id lookup
CREATE OR REPLACE FUNCTION get_user_team_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM users WHERE id = auth.uid();
$$;

-- Then use in policies:
CREATE POLICY "team_read" ON schools
  FOR SELECT USING (team_id = get_user_team_id());
```

### Pitfall 2: Supabase Auth Rate Limits
**What goes wrong:** Built-in Supabase email service allows max 3 emails/hour for magic links.
**Why it happens:** Supabase rate-limits their default SMTP to prevent abuse.
**How to avoid:** Configure custom SMTP in Supabase dashboard (Resend, Postmark, SendGrid) before go-live. For development, 3/hour is fine.
**Warning signs:** Magic link emails stop arriving; users see "rate limit exceeded" errors.

### Pitfall 3: IndexedDB Migration Data Loss
**What goes wrong:** Migration reads IndexedDB, pushes to Supabase, but the push partially fails (network error mid-batch), leaving data in limbo.
**Why it happens:** IndexedDB read and Supabase write are not atomic across systems.
**How to avoid:** Use a three-phase approach: (1) read all IndexedDB data, (2) write to Supabase in a transaction, (3) only mark as migrated after confirmed success. Show progress per entity type. Allow retry.
**Warning signs:** User reports missing contacts or conversations after migration.

### Pitfall 4: Forgetting to Enable RLS
**What goes wrong:** Tables created without `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` allow unrestricted access via the anon key.
**Why it happens:** Supabase does not enable RLS by default on new tables.
**How to avoid:** Always add `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` in the migration SQL. Verify in Supabase dashboard that RLS is ON for every table.
**Warning signs:** Any authenticated user can read all data regardless of team.

### Pitfall 5: Vercel Serverless Cold Starts with Streaming
**What goes wrong:** First AI request takes 5-10 seconds due to cold start + Anthropic API latency.
**Why it happens:** Serverless functions spin up from zero; initializing the Anthropic SDK adds time.
**How to avoid:** Use SSE streaming so the user sees partial results quickly. Initialize the Anthropic client outside the handler (module-level) so it's reused across warm invocations.
**Warning signs:** Users report long wait times on first AI request of the day.

### Pitfall 6: Vite Dev Server vs Vercel API Routes
**What goes wrong:** During local development, `/api/ai-intake` returns 404 because Vite dev server does not serve Vercel functions.
**Why it happens:** Vite only serves the SPA; Vercel functions need the Vercel CLI.
**How to avoid:** Use `vercel dev` for full-stack development, or configure Vite proxy to forward `/api/*` to a local Express server that mimics the serverless functions. A `vercel-dev.json` with `{}` prevents SPA rewrite conflicts.
**Warning signs:** API calls work in production but fail in development.

### Pitfall 7: UUID vs Auto-Increment ID Mismatch
**What goes wrong:** Existing code uses `id: number` (Dexie auto-increment). Supabase uses `id: UUID`.
**Why it happens:** SchoolRecord.id is typed as `number` throughout the codebase. Supabase generates UUIDs.
**How to avoid:** Update `SchoolRecord.id` type from `number | undefined` to `string`. Update all `schoolId: number` parameters. This is a wide-reaching type change -- do it early and let TypeScript catch all affected files.
**Warning signs:** TypeScript errors everywhere; runtime errors on `.get(id)` calls.

## Code Examples

### Supabase Operations (replacing src/db/operations.ts)
```typescript
// src/db/operations.ts -- Supabase implementation
import { supabase } from '@/lib/supabase/client';
import type { SchoolRecord } from './types';

export async function createSchool(name: string): Promise<SchoolRecord> {
  const slug = await uniqueSlug(name);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Niet ingelogd');

  const { data, error } = await supabase
    .from('schools')
    .insert({
      name,
      slug,
      owner_id: user.id,
      team_id: await getTeamId(),
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Log system event
  await supabase.from('system_events').insert({
    school_id: data.id,
    event_type: 'school_created',
    description: 'School aangemaakt',
    user_id: user.id,
  });

  return mapToSchoolRecord(data);
}
```

### IndexedDB to Supabase Migration
```typescript
// src/db/migrations.ts -- Cloud migration
export async function migrateIndexedDBToSupabase(): Promise<MigrationResult> {
  // 1. Read all schools from IndexedDB
  const localSchools = await db.schools.toArray();
  if (localSchools.length === 0) return { success: true, count: 0 };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Niet ingelogd');

  const results: MigrationResult = { success: true, count: 0, errors: [] };

  for (const school of localSchools) {
    try {
      // 2. Insert school (wizard data as JSONB)
      const { data: newSchool, error } = await supabase
        .from('schools')
        .insert({
          name: school.name,
          slug: school.slug,
          levels: school.levels,
          student_counts: school.studentCounts,
          selected_modules: school.selectedModules,
          module_setups: school.moduleSetups,
          // ... more fields
        })
        .select()
        .single();

      if (error) throw error;

      // 3. Insert related records (contacts, conversations, etc.)
      if (school.contacts.length > 0) {
        await supabase.from('contacts').insert(
          school.contacts.map(c => ({
            school_id: newSchool.id,
            name: c.name,
            dmu_position: c.dmuPosition,
            // ... map all fields, camelCase to snake_case
          }))
        );
      }

      // 4. Migrate appliedOverrides to school_prices (D-05)
      if (school.appliedOverrides.length > 0) {
        await supabase.from('school_prices').insert(
          school.appliedOverrides.map(o => ({
            school_id: newSchool.id,
            module_id: o.moduleId,
            provider: o.provider,
            amount: o.amount,
            price_type: 'agreed',
            is_active: true,
            source: 'Gemigreerd uit v1',
            activation_reason: 'Automatische migratie',
            activated_at: new Date().toISOString(),
          }))
        );
      }

      results.count++;
    } catch (err) {
      results.errors.push({ school: school.name, error: String(err) });
    }
  }

  // 5. Mark migration as complete in localStorage
  localStorage.setItem('supabase-migration-complete', 'true');
  return results;
}
```

### Auth-Protected Route Guard
```typescript
// src/features/auth/ProtectedRoute.tsx
import { Navigate } from '@tanstack/react-router';
import { useAuth } from './AuthProvider';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
}
```

### Serverless AI Proxy Function
```typescript
// api/ai-intake.ts
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

export async function POST(request: Request) {
  // Verify the user's Supabase JWT
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return new Response('Unauthorized', { status: 401 });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return new Response('Unauthorized', { status: 401 });

  const { notes } = await request.json();

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: notes }],
  });

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Supabase auth-helpers-react | Direct supabase-js v2 auth | 2024 | auth-helpers-react is deprecated; use createClient + onAuthStateChange directly |
| Vercel legacy function signature (req, res) | Web standard fetch handler | 2025 | Use `export default { fetch(request) {} }` or named exports `GET/POST` |
| Supabase JS v1 | Supabase JS v2 (2.x) | 2023 | Async auth methods, better TypeScript types, modular imports |
| localStorage for app state | Supabase + React Query | This phase | Local-first replaced by cloud-first for multi-user |

**Deprecated/outdated:**
- `@supabase/auth-helpers-react`: Deprecated. Use supabase-js v2 directly.
- `dangerouslyAllowBrowser: true` on Anthropic SDK: Remove entirely; SDK used only server-side.
- Vercel `(req: VercelRequest, res: VercelResponse)` signature: Use Web Standard `Request/Response`.

## Open Questions

1. **Supabase project region**
   - What we know: Vercel functions default to Washington D.C. (iad1). Supabase supports multiple regions.
   - What's unclear: Whether to use EU region (eu-west-1) for GDPR compliance given this is a Dutch company tool.
   - Recommendation: Use EU region (Frankfurt or Amsterdam) for Supabase. Configure Vercel function region to match: `"functions": { "api/*": { "region": "fra1" } }`.

2. **Custom SMTP for magic links**
   - What we know: Supabase built-in email is limited to 3/hour. Team size is small (~5-15 users).
   - What's unclear: Whether 3/hour is sufficient for the team during initial onboarding (many logins).
   - Recommendation: Configure custom SMTP early (Resend has a free tier of 100 emails/day). Low effort, prevents issues.

3. **User provisioning flow**
   - What we know: D-07 defines users and teams tables. Supabase Auth handles sign-up.
   - What's unclear: Who creates user accounts? Self-registration or admin-only?
   - Recommendation: Admin-only provisioning via Supabase dashboard or a simple admin function. This prevents unauthorized sign-ups. Use Supabase's `auth.admin.createUser()` in a serverless function.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ARCH-01 | CRUD operations via Supabase | unit | `npx vitest run src/db/__tests__/operations.test.ts -x` | Exists (needs rewrite for Supabase) |
| ARCH-02 | IndexedDB to Supabase migration | unit | `npx vitest run src/db/__tests__/migrations.test.ts -x` | Exists (needs extension) |
| ARCH-03 | Supabase as primary data store | integration | `npx vitest run src/db/__tests__/database.test.ts -x` | Exists (needs rewrite) |
| ARCH-04 | Auth guard on routes | unit | `npx vitest run src/router/__tests__/guards.test.ts -x` | Exists (needs auth guard) |
| AUTH-01 | Login via email/password and magic link | unit | `npx vitest run src/features/auth/__tests__/auth.test.ts -x` | Wave 0 |
| AUTH-02 | Role-based access (accountmanager/manager/viewer) | unit | `npx vitest run src/features/auth/__tests__/roles.test.ts -x` | Wave 0 |
| AUTH-03 | Audit trail (created_by/updated_by) | unit | `npx vitest run src/db/__tests__/audit.test.ts -x` | Wave 0 |
| DEPLOY-01 | Serverless AI proxy function | unit | `npx vitest run api/__tests__/ai-intake.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/auth/__tests__/auth.test.ts` -- covers AUTH-01 (mock supabase.auth)
- [ ] `src/features/auth/__tests__/roles.test.ts` -- covers AUTH-02 (role-based RLS behavior)
- [ ] `src/db/__tests__/audit.test.ts` -- covers AUTH-03 (created_by/updated_by population)
- [ ] `api/__tests__/ai-intake.test.ts` -- covers DEPLOY-01 (serverless function handler)
- [ ] Supabase client mock setup in `src/test/` -- shared mock for all Supabase tests
- [ ] Note: Existing Dexie-based tests (`operations.test.ts`, `database.test.ts`, `migrations.test.ts`) must be rewritten to mock Supabase instead of fake-indexeddb

## Sources

### Primary (HIGH confidence)
- [Supabase Auth React Quickstart](https://supabase.com/docs/guides/auth/quickstarts/react) - auth setup pattern
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) - RLS policy syntax
- [Supabase Magic Link Auth](https://supabase.com/docs/guides/auth/auth-magic-link) - magic link implementation
- [Vercel Functions API Reference](https://vercel.com/docs/functions/functions-api-reference) - function signature, streaming
- [Vercel Vite Framework Docs](https://vercel.com/docs/frameworks/frontend/vite) - SPA deployment, vercel.json config
- npm registry - verified versions: @supabase/supabase-js@2.99.3, @tanstack/react-query@5.94.5

### Secondary (MEDIUM confidence)
- [Vercel community: Vite SPA + API routing](https://community.vercel.com/t/trouble-with-vite-react-vercel-spa-routing-and-api-dev-conflicts/16896) - dev server workarounds
- [Multi-tenant RLS patterns](https://dev.to/blackie360/-enforcing-row-level-security-in-supabase-a-deep-dive-into-lockins-multi-tenant-architecture-4hd2) - team-based RLS approach
- [Vercel SPA rewrite discussion](https://github.com/vercel/vercel/discussions/5448) - regex pattern for excluding /api from SPA rewrite

### Tertiary (LOW confidence)
- None -- all critical findings verified with official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries verified via npm registry and official docs
- Architecture: HIGH - patterns from official Supabase and Vercel documentation
- Schema design: HIGH - directly derived from locked decisions D-01 through D-12
- Pitfalls: HIGH - well-documented in Supabase community and official guides
- Migration surface: HIGH - derived from direct codebase analysis (grep of all Dexie imports)

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (30 days -- stable ecosystem, no breaking changes expected)
