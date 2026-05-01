# Vulnerability Triage — concurrentoolVO

**Date:** 2026-05-01
**Branch:** `feature/vuln-triage` → merged into `dev`
**Baseline before triage:** 12 vulnerabilities (3 moderate, 9 high)
**State after triage:** 5 vulnerabilities (5 high) — all explicitly accepted/deferred per rationale below

---

## Resolved (7 of 12)

### Round 1 — non-breaking `npm audit fix` (commit `fe2c592`, basis-fix branch)
Six packages updated transparently:
- `@xmldom/xmldom` (high — DoS + XML injection)
- `brace-expansion` (moderate — process hang)
- `lodash` (high — code injection + prototype pollution)
- `picomatch` (high — ReDoS + glob bypass)
- `postcss` (moderate — XSS in stringify)
- `vite` 8.0.0–8.0.4 → 8.0.10 (high — path traversal + WebSocket file read)

### Round 2 — manual `@anthropic-ai/sdk` upgrade (commit on this branch)
- `@anthropic-ai/sdk` 0.80.0 → 0.92.0 (moderate — Memory Tool sandbox escape)
- Vulns were not exploitable in this app (Memory Tool not used, only `messages.parse` + Zod structured output)
- Verified 880/880 tests pass + full build succeeds after upgrade
- No API changes affected our usage

---

## Deferred (5 of 12) — accepted with rationale

### `xlsx` (high, 2 advisories) — DEFERRED
- GHSA-4r6h-8v6p-xvw6: Prototype Pollution in SheetJS
- GHSA-5pgg-2g8v-p4x9: SheetJS ReDoS

**`fixAvailable: false`** — SheetJS distributes recent versions exclusively via `cdn.sheetjs.com`, not npm. There is no upgrade path on npm.

**Risk in this app:** LOW.
- We only **export** `.xlsx` (via `XLSX.writeFile` / `XLSX.utils.json_to_sheet`), we don't **import** untrusted user-uploaded `.xlsx` files.
- Both vulnerabilities require parsing maliciously-crafted spreadsheet input. Export-only flow is not the attack surface.

**Trigger to revisit:** if any feature ever needs to import / parse user-uploaded spreadsheets, that's the trigger to either:
1. Migrate to `@sheetjs/xlsx` (official, paid, via SheetJS CDN)
2. Replace with `exceljs` (MIT, npm-distributed, supports import + export)
3. Replace with `xlsx-populate` (MIT, npm-distributed)

### `vite-plugin-pwa` chain (high, 1 advisory) — DEFERRED
- GHSA-5c6j-r48x-rmvq: `serialize-javascript` RCE via RegExp.flags
- Chain: `serialize-javascript` ← `@rollup/plugin-terser` ← `workbox-build` ← `vite-plugin-pwa`

**`npm audit fix --force` would downgrade `vite-plugin-pwa` from 1.2.0 to 0.19.8** — that's a **major version regression** (4 major versions back), losing PWA features and breaking the current build setup. Not acceptable.

**Risk in this app:** LOW.
- `serialize-javascript` is used by `workbox-build` only at **build time** (when generating the service worker), not at runtime in the browser.
- Build runs in trusted CI/dev environments, not on user-controlled input.
- The RCE vector requires attacker-controlled `RegExp.flags` content reaching the serializer — no such input path exists in our build pipeline.

**Trigger to revisit:** monitor `vite-plugin-pwa` releases (currently 1.2.0). When upstream releases a version that pulls a patched `@rollup/plugin-terser` (or removes the dependency on `serialize-javascript`), upgrade. Check periodically — once per 3 months, or if a real exploit surfaces in the wild.

---

## Methodology notes (for next triage round)

- **`npm audit fix` first, `--force` only after explicit per-package analysis.** The `--force` flag will cheerfully downgrade major versions to "fix" transitive vulns, which is usually worse than the vuln itself.
- **Risk = severity × exploitability-in-our-codepath.** A "high" CVE in a build-time-only dependency or in a feature we don't use is not the same risk as a "high" CVE in a runtime hot path. Document the exploitability assessment alongside the deferral.
- **Deferral needs an explicit trigger to revisit.** "We'll fix it later" rots. "We'll fix it when X happens" gives future-us a clear signal.
