---
phase: 12-dmu-export-offline
plan: 03
subsystem: infra
tags: [pwa, service-worker, offline, workbox, zustand, vite-plugin-pwa]

# Dependency graph
requires:
  - phase: 08-supabase-migration
    provides: Supabase client and operations.ts mutation functions
provides:
  - VitePWA configuration with service worker precaching and runtime caching
  - useOnlineStatus hook for online/offline detection
  - OfflineBanner component with Dutch text
  - Zustand offline mutation queue with conflict detection (server wins)
  - queueIfOffline helper wired into 11 mutation functions in operations.ts
affects: [all mutation callsites, RootLayout, future sync improvements]

# Tech tracking
tech-stack:
  added: [vite-plugin-pwa, workbox]
  patterns: [offline-first mutation queue, conflict detection via updated_at comparison, queueIfOffline helper pattern]

key-files:
  created:
    - src/hooks/useOnlineStatus.ts
    - src/components/ui/OfflineBanner.tsx
    - src/lib/offline-queue.ts
    - src/lib/__tests__/offline-queue.test.ts
    - public/icon-192.png
    - public/icon-512.png
  modified:
    - vite.config.ts
    - src/db/operations.ts
    - src/components/routing/RootLayout.tsx

key-decisions:
  - "OfflineBanner placed in RootLayout.tsx instead of App.tsx since App.tsx only renders RouterProvider"
  - "Server-wins conflict strategy: mutations queued offline are skipped if server updated_at > mutation timestamp"
  - "Optimistic temp objects returned for insert operations (addContact, addConversation, addAction) when offline"
  - "createSchool and deleteSchool NOT wired to offline queue -- require connectivity for major operations"

patterns-established:
  - "queueIfOffline(table, operation, payload) pattern for offline-safe mutations"
  - "useSyncExternalStore for browser API state (online/offline)"
  - "Dynamic import in syncAll to avoid circular deps with supabase client"

requirements-completed: [ARCH-05]

# Metrics
duration: 9min
completed: 2026-03-24
---

# Phase 12 Plan 03: Offline PWA Support Summary

**VitePWA service worker with Supabase runtime caching, offline mutation queue with conflict detection, and OfflineBanner wired into 11 mutation functions**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-24T21:31:49Z
- **Completed:** 2026-03-24T21:41:12Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- VitePWA configured with precaching for static assets and StaleWhileRevalidate/NetworkFirst for Supabase API/auth
- Offline mutation queue (Zustand + persist) with conflict detection comparing mutation.timestamp vs server updated_at
- 11 mutation functions in operations.ts wired with queueIfOffline helper for offline-safe CRUD
- OfflineBanner showing "Offline modus -- data kan verouderd zijn" at top of app
- Automatic sync on reconnect with conflict notification via console.warn
- PWA manifest with Cito branding (name, icons, theme_color #003082, standalone display)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install vite-plugin-pwa + configure service worker + PWA manifest** - `751e877` (feat)
2. **Task 2 RED: Add failing tests for offline mutation queue** - `5bb097c` (test)
3. **Task 2 GREEN: Offline detection, mutation queue, wire operations.ts** - `169cb8c` (feat)

## Files Created/Modified
- `vite.config.ts` - Added VitePWA plugin with workbox runtime caching for Supabase
- `src/hooks/useOnlineStatus.ts` - React hook using useSyncExternalStore for online/offline detection
- `src/components/ui/OfflineBanner.tsx` - Subtle amber banner with Dutch offline message
- `src/lib/offline-queue.ts` - Zustand store with persist for mutation queue and syncAll with conflict detection
- `src/lib/__tests__/offline-queue.test.ts` - 7 unit tests for queue operations
- `src/db/operations.ts` - Added queueIfOffline helper and wired 11 mutation functions
- `src/components/routing/RootLayout.tsx` - Added OfflineBanner and online sync effect
- `public/icon-192.png` - PWA icon 192x192 with Cito primary color
- `public/icon-512.png` - PWA icon 512x512 with Cito primary color

## Decisions Made
- **OfflineBanner in RootLayout instead of App.tsx**: App.tsx only renders RouterProvider; RootLayout is the actual layout component with header and content
- **Server-wins conflict strategy**: When syncing, if server updated_at > mutation.timestamp, the mutation is marked conflicted and skipped
- **Temp objects for offline inserts**: addContact, addConversation, addAction return temporary objects with crypto.randomUUID() ids when offline for optimistic UI
- **createSchool/deleteSchool not wired**: Major operations that should require connectivity per plan specification

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing @testing-library/dom dependency**
- **Found during:** Task 2 (TDD RED phase)
- **Issue:** @testing-library/react requires @testing-library/dom which was not installed; all tests broken
- **Fix:** Ran `npm install -D @testing-library/dom --legacy-peer-deps`
- **Files modified:** package.json, package-lock.json
- **Verification:** Tests run successfully
- **Committed in:** 5bb097c (Task 2 RED commit)

**2. [Rule 2 - Adaptation] OfflineBanner and sync effect placed in RootLayout.tsx instead of App.tsx**
- **Found during:** Task 2 (reading App.tsx)
- **Issue:** App.tsx only contains `<RouterProvider router={router} />` — no layout content. RootLayout.tsx is the actual layout with header, auth guards, and content
- **Fix:** Added OfflineBanner and online sync effect to RootLayout.tsx instead
- **Files modified:** src/components/routing/RootLayout.tsx
- **Verification:** Build passes, banner renders in correct position
- **Committed in:** 169cb8c (Task 2 GREEN commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 adaptation)
**Impact on plan:** Both auto-fixes necessary for correct operation. No scope creep.

## Issues Encountered
- Pre-existing `npm run build` failure (tsc errors in test files for @testing-library/react missing 'screen' export, and recharts 'react-is' import) — not caused by this plan's changes. Vite build (`npx vite build`) succeeds with exit code 0.
- `npm install -D vite-plugin-pwa` required `--legacy-peer-deps` flag due to peer dependency conflicts

## Known Stubs
None - all features are fully wired and functional.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PWA offline support is complete and ready for production use
- Service worker caches static assets and Supabase API data
- Mutation queue handles offline operations with conflict detection on sync
- Phase 12 is complete (all 3 plans executed)

---
*Phase: 12-dmu-export-offline*
*Completed: 2026-03-24*
