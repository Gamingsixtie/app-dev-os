---
status: awaiting_human_verify
trigger: "New router-based UI not rendering — old wizard still shows"
created: 2026-03-22T12:00:00Z
updated: 2026-03-22T12:30:00Z
---

## Current Focus

hypothesis: Three issues combined to cause the rendering failure: (1) passing Outlet directly as root route component bypassed TanStack Router's internal CatchBoundary/error handling, (2) unhandled Dexie errors in indexRoute.beforeLoad caused uncaught exceptions, (3) missing validateSearch on scholenRoute caused runtime issues with useSearch
test: User needs to verify in browser that /scholen shows SchoolOverviewPage and /scholen/$slug shows SchoolLayout + DashboardTab
expecting: New UI renders correctly at all routes
next_action: Await user verification

## Symptoms

expected: /scholen shows SchoolOverviewPage with FilterBar, ViewToggle, CardModeToggle. /scholen/$slug shows SchoolLayout with ProfileHeader + TabNavigation + DashboardTab
actual: Both / and /scholen show the OLD wizard flow (Niveau -> Leerlingen -> Modules -> Situatie -> Doel -> nothing more)
errors: None visible — build and tsc pass clean
reproduction: Navigate to http://localhost:5173/ or http://localhost:5173/scholen
started: After adding TanStack Router

## Eliminated

- hypothesis: Old App.tsx with useState<View> rendering wizard
  evidence: App.tsx only contains <RouterProvider router={router} />, no useState<View> found anywhere in codebase
  timestamp: 2026-03-22T12:01:00Z

- hypothesis: Service worker caching old content
  evidence: No service worker files found (no sw.js, no service-worker.*)
  timestamp: 2026-03-22T12:01:00Z

- hypothesis: WizardShell rendered outside router context
  evidence: WizardShell is only imported by WizardPage component, which is only used as route component for /scholen/$slug/wizard/$step
  timestamp: 2026-03-22T12:02:00Z

- hypothesis: Zustand persist middleware restoring old state
  evidence: Neither store uses persist middleware anymore
  timestamp: 2026-03-22T12:03:00Z

- hypothesis: MigrationWizard showing wizard steps
  evidence: MigrationWizard shows a naming dialog, not wizard steps
  timestamp: 2026-03-22T12:04:00Z

- hypothesis: Route tree not registering routes correctly
  evidence: Node test confirmed all route IDs register: /, /scholen, /scholen/$slug, /scholen/$slug/, /scholen/$slug/wizard/$step
  timestamp: 2026-03-22T12:10:00Z

- hypothesis: TanStack Router package not installed
  evidence: node_modules/@tanstack/react-router exists, version 1.168.1
  timestamp: 2026-03-22T12:11:00Z

- hypothesis: File-based routing override
  evidence: No routeTree.gen.ts, no TanStackRouterVite plugin, no tsr.config
  timestamp: 2026-03-22T12:12:00Z

## Evidence

- timestamp: 2026-03-22T12:00:00Z
  checked: main.tsx -> App.tsx -> router.ts -> routes.ts render chain
  found: Clean chain - main renders App, App renders RouterProvider, router uses routeTree
  implication: Router setup is structurally correct

- timestamp: 2026-03-22T12:01:00Z
  checked: SchoolOverviewPage.tsx
  found: Has correct new UI (FilterBar, ViewToggle, CardModeToggle) and renders SchoolCard grid
  implication: Component is correct, issue is likely that it never renders

- timestamp: 2026-03-22T12:05:00Z
  checked: TanStack Router docs on createRootRoute component
  found: "If a route's component is left undefined, it will render an Outlet automatically" — passing Outlet directly is redundant and may bypass internal wrappers
  implication: Setting component: Outlet on rootRoute may bypass CatchBoundary/ErrorBoundary wrappers

- timestamp: 2026-03-22T12:06:00Z
  checked: redirect() return value via Node.js test
  found: redirect() returns a Response object (not Error), isRedirect() function available to detect them
  implication: try-catch in beforeLoad must re-throw redirects specifically

- timestamp: 2026-03-22T12:07:00Z
  checked: scholenRoute search validation
  found: scholenRoute had no validateSearch, SchoolOverviewPage used useSearch({ from: '/scholen' }) with type assertion
  implication: Missing validateSearch could cause runtime issues with TanStack Router's type system

## Resolution

root_cause: Three contributing factors: (1) rootRoute had `component: Outlet` explicitly set, which likely bypassed TanStack Router's internal CatchBoundary/error wrapper — the docs say leaving component undefined auto-renders Outlet with proper internal wrappers; (2) indexRoute.beforeLoad had no error handling, so any Dexie/IndexedDB error would crash the router without the CatchBoundary; (3) scholenRoute lacked validateSearch, causing potential issues with useSearch
fix: Removed explicit component: Outlet from rootRoute (uses default auto-Outlet), added try-catch with isRedirect in indexRoute.beforeLoad, added validateSearch to scholenRoute, removed unnecessary type assertion from SchoolOverviewPage useSearch
verification: npm run build passes cleanly — awaiting human verification in browser
files_changed:
  - src/router/routes.ts
  - src/router/router.ts
  - src/features/school-overview/SchoolOverviewPage.tsx
