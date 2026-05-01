# ADR-0001: Vite SPA, not Next.js

- **Status**: Accepted
- **Date**: 2026-05-01
- **Supersedes**: —
- **Scope**: per-app (concurrentoolVO only). Root template ADR registry assumes Next.js as default.

## Context

The concurrentoolVO app is an internal tool for Cito-consultants who use it during and after meetings with Dutch secondary schools. Two operational realities shape the framework choice:

1. **Offline-first matters**: school WiFi networks are flaky / restricted. Tool must keep working when the network is partially unavailable. State should persist locally so a closing-and-reopening browser doesn't lose the consultant's work mid-meeting.
2. **No public SEO surface**: the app is auth-gated. School decision-makers don't Google for it. Cito-consultants log in directly. Server-side rendering for crawler indexing is irrelevant.

The app shape is therefore a **PWA** (Progressive Web App) with IndexedDB (Dexie) caching + localStorage (Zustand persist) + a service worker handling offline routing — none of which Next.js's server-first defaults are designed to support cleanly.

App-Dev OS root template defaults to Next.js (App Router) for consumer-facing SaaS. concurrentoolVO is internal-tool-feel, deviates explicitly.

## Decision

Use **Vite 8 + React 19 as a Single Page Application**. Add `vite-plugin-pwa` for service worker and manifest. Run all backend logic as **Vercel Serverless Functions** in `api/` (TypeScript), region `fra1` (Frankfurt). Routing via **TanStack Router** — code-defined route tree, type-safe.

Do NOT migrate to Next.js. Do NOT add server-side rendering. Do NOT split into separate `client` and `server` codebases.

## Alternatives considered

- **Next.js (App Router)** — App-Dev OS root default. Mature, Vercel-native, server components reduce client bundle.
  Rejected because: SSR conflicts with PWA offline-first (server components can't be cached client-side), Next.js client-side state patterns assume server is reachable, the App Router model fights with the explicit-route-tree TanStack Router pattern, migration would destroy IndexedDB-based offline architecture.
- **Create React App (CRA)** — historical default for SPAs.
  Rejected because: deprecated by Meta, slow dev server, no first-class PWA support, no first-class TypeScript.
- **Remix** — full-stack React, excellent DX.
  Rejected because: same SSR-conflict-with-offline issue as Next.js, ecosystem smaller, more tutorials assume the `loader/action` pattern that doesn't fit a service-worker-cached app.
- **Vite SPA + own backend (Express, Fastify, Hono)** — maximum flexibility.
  Rejected because: solo dev wants Vercel deploys without managing a separate backend host; Vercel Serverless Functions are sufficient for the 9 endpoints this app uses.
- **Chosen: Vite 8 SPA + Vercel Serverless Functions** — fast dev (HMR), first-class PWA via plugin, clean separation of frontend (Vite-built static bundle) and backend (per-function serverless), both deployed to Vercel from one project.

> TODO Pim: validate the Alternatives section against your actual reasoning when you originally chose Vite. The above is best-guess from industry-knowledge + the code reality. If a specific alternative was rejected for a different reason, replace.

## Consequences

- **Positive**:
  - Fast dev iteration (Vite HMR < 1s)
  - PWA + offline-first works out of the box
  - Smaller bundle than Next.js (no server-component runtime, no Next.js framework code)
  - Simpler mental model: client is a static SPA, backend is functions, no hybrid render flow
  - Vercel deploys both pieces cleanly via existing project config
- **Negative**:
  - No SEO for any future public-facing surface — would require pre-rendering or a separate landing site
  - Initial page load is "boot the SPA" — slower first paint than Next.js for first-time users (but the user is a logged-in consultant, not a public visitor, so this rarely matters)
  - Some React libraries assume Next.js (e.g., `next/image`) and need alternatives
  - Cannot use server components for data-fetching optimizations — all fetches happen client-side
- **Trade-offs accepted**:
  - The "no SEO" cost is zero for the actual user base (Cito-consultants who navigate via login → bookmarks).
  - The "slower first paint" cost is paid once per session per user; consultants leave the tab open across multiple meetings.
  - This decision binds future work: a "marketing landing page" feature would NOT be built in this app — it'd be a separate project (or leverage the App-Dev OS template default Next.js if added as a sibling app).

## Links

- TRAINING-CONTEXT.md (root) — original stack description by Pim
- `code_context/architecture.md` (this app) § Stack — concrete versions
- `code_context/architecture.md` § Frontend architecture — TanStack Router route tree
- Related ADRs:
  - ADR-0002 (this app) — three hard-coded providers
  - ADR-0003 (this app) — pure-function engines
  - Root ADR-0001 — supabase-js SDK without ORM (still applies)
  - Root ADR-0004 — Sentry + Vercel logs (still applies)
- Code: `vite.config.ts`, `vercel.json`, `src/router/routes.ts`, `src/App.tsx`
