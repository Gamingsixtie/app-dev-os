# Security Audit Report

**Date:** 2026-03-28
**Auditor:** Automated security scan (Phase 22, Plan 06)
**Scope:** Full client-side SPA (`src/`) and production dependency chain

---

## 1. XSS Scan

### 1.1 dangerouslySetInnerHTML
**Result:** PASS (no findings)
No usage of `dangerouslySetInnerHTML` found anywhere in `src/`.

### 1.2 innerHTML / eval / document.write
**Result:** PASS (no findings)
No usage of `innerHTML`, `eval()`, `new Function()`, or `document.write()` found in `src/`.

### 1.3 URL Injection Vectors
**Severity:** INFO
**Findings:**
- `src/features/auth/LoginPage.tsx`: `window.location.href = '/scholen'` -- hardcoded path, no user input. **Safe.**
- `src/features/auth/ProtectedRoute.tsx`: `window.location.href = '/login'` -- hardcoded path, no user input. **Safe.**
- `src/features/export/components/PdfDownloadButton.tsx`: `a.href = url` -- URL generated from `URL.createObjectURL(blob)`, not from user input. **Safe.**

**Risk:** None. All URL assignments use hardcoded paths or API-generated blob URLs.

---

## 2. Sensitive Data Exposure

### 2.1 API Keys in Client Bundle
**Result:** PASS (no findings)
- `VITE_ANTHROPIC_API_KEY` is NOT referenced anywhere in `src/`. API key handling is server-side only (Vercel serverless functions).
- AI intake (`src/lib/ai-intake.ts`) calls `/api/ai-intake` server endpoint via fetch with auth headers -- no client-side API key exposure.

### 2.2 Supabase Anon Key
**Severity:** INFO (acceptable)
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are exposed to the client via `import.meta.env`.
- **Risk acceptance:** This is by design. Supabase anon keys are safe to expose when Row Level Security (RLS) is properly configured. The anon key only grants access to data allowed by RLS policies.

### 2.3 Hardcoded Secrets
**Result:** PASS (no findings)
- No patterns matching `sk-ant-`, `eyJ...` (JWT tokens), or hardcoded passwords found in `src/`.
- All secrets are loaded from environment variables.

### 2.4 Source Maps
**Severity:** INFO (acceptable)
- `vite.config.ts` has `build: { sourcemap: true }`.
- **Risk acceptance:** Source maps are useful for Sentry error tracking. For an internal sales tool, the trade-off is acceptable. If needed, source maps can be restricted to Sentry-only upload via `hidden-source-map` in the future.

---

## 3. Input Validation Audit

### 3.1 Form Validation
**Result:** PASS
All forms use react-hook-form with Zod schema validation (10 form components verified):
- `LoginPage.tsx` -- email/password with zodResolver
- `WizardStep1.tsx` through `WizardStep5.tsx` -- all wizard steps validated
- `ContactForm.tsx` -- contact data validated
- `ConversationForm.tsx` -- conversation data validated
- `PriceEditModal.tsx` -- price edits validated
- `SchoolNameDialog.tsx` -- school name validated

### 3.2 AI Intake Free Text
**Result:** PASS
- `src/lib/ai-intake.ts`: Notes are sent as JSON body (`JSON.stringify({ notes })`) to the server endpoint.
- Response text is parsed as JSON, then validated against `IntakeExtractionSchemaV2` (Zod schema).
- No raw AI response text is injected into HTML -- it goes through structured parsing.
- Malformed responses throw descriptive Dutch error messages (not injected into DOM unsafely).

### 3.3 File Upload Validation
**Severity:** MEDIUM
**Finding:** File type validation is present (both client-side in `DocumentDropzone.tsx` and server-side in `document-parser.ts`), but there is no explicit file size limit on the client side.
- **Mitigation:** Supabase Storage has server-side size limits. The Vercel serverless function also has body size limits.
- **Risk acceptance:** Server-side controls prevent oversized uploads. A client-side size check would improve UX (faster feedback) but is not a security vulnerability.
- **Recommendation:** Add a 10MB client-side file size check for better UX (future improvement, not blocking).

---

## 4. Dependency Vulnerability Triage

### 4.1 npm audit --omit=dev Results

**1 high severity vulnerability:**

| Package | Severity | Advisory | Exploitable? |
|---------|----------|----------|-------------|
| `xlsx` | HIGH | Prototype Pollution (GHSA-4r6h-8v6p-xvw6) + ReDoS (GHSA-5pgg-2g8v-p4x9) | Limited |

**Analysis of `xlsx` vulnerability:**
- **Usage:** `xlsx` is used in `src/features/school-overview/school-list-store.ts` for importing school lists from Excel files, and accepted in `DocumentDropzone.tsx` / `document-parser.ts` for document uploads.
- **Prototype Pollution (GHSA-4r6h-8v6p-xvw6):** Requires attacker-crafted Excel file to be uploaded. Since this is an internal tool used only by Cito consultants, the attack vector requires a malicious insider or social engineering to upload a crafted file.
- **ReDoS (GHSA-5pgg-2g8v-p4x9):** Could cause performance degradation with crafted input. Same limited attack surface as above.
- **No fix available:** SheetJS has not released a patched version.
- **Risk acceptance:** LOW risk in context. Internal tool, authenticated users only, files are uploaded by trusted consultants. The `xlsx` import is dynamically loaded (`await import('xlsx')`) so it does not affect users who never use the import feature.
- **Future mitigation:** Monitor for patched `xlsx` release. Consider switching to `exceljs` if a fix is not forthcoming.

### 4.2 Critical Vulnerabilities
**Result:** PASS -- 0 critical vulnerabilities in production dependencies.

---

## 5. CSP Header Review

### 5.1 Current CSP (vercel.json)
```
default-src 'self';
script-src 'self' https://*.sentry.io;
connect-src 'self' https://*.supabase.co https://*.sentry.io https://api.anthropic.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self';
frame-ancestors 'none'
```

### 5.2 Analysis

| Directive | Status | Notes |
|-----------|--------|-------|
| `default-src 'self'` | PASS | Restrictive default |
| `script-src` | PASS | Only self + Sentry SDK |
| `connect-src` | PASS | Supabase, Sentry, and Anthropic API covered |
| `style-src 'unsafe-inline'` | INFO | Required by Tailwind CSS runtime styles. Acceptable trade-off |
| `img-src 'self' data: blob:` | PASS | Needed for PDF blob URLs and inline SVG icons |
| `font-src 'self'` | PASS | Restrictive |
| `frame-ancestors 'none'` | PASS | Prevents clickjacking (mirrors X-Frame-Options: DENY) |
| No `unsafe-eval` | PASS | Not present anywhere |

### 5.3 Additional Security Headers (vercel.json)
- `X-Content-Type-Options: nosniff` -- PASS
- `X-Frame-Options: DENY` -- PASS
- `X-XSS-Protection: 1; mode=block` -- PASS
- `Referrer-Policy: strict-origin-when-cross-origin` -- PASS
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` -- PASS

**All security headers are properly configured.**

---

## 6. Summary

| Category | Severity | Status |
|----------|----------|--------|
| XSS (dangerouslySetInnerHTML) | -- | PASS (none found) |
| XSS (innerHTML/eval) | -- | PASS (none found) |
| XSS (URL injection) | INFO | PASS (hardcoded paths only) |
| API key exposure | -- | PASS (server-side only) |
| Supabase anon key | INFO | Accepted (RLS protects data) |
| Source maps | INFO | Accepted (internal tool + Sentry) |
| Form validation | -- | PASS (all forms use Zod) |
| AI text injection | -- | PASS (structured parsing only) |
| File upload size | MEDIUM | Server-side limits exist; client-side UX improvement recommended |
| Dependencies (xlsx) | HIGH | Accepted -- internal tool, no fix available, low exploitability |
| Dependencies (critical) | -- | PASS (0 critical) |
| CSP headers | -- | PASS (properly configured) |
| Security headers | -- | PASS (all present) |

### Remaining Known Risks

1. **xlsx prototype pollution** (HIGH, accepted): No patched version available. Limited attack surface in internal tool context. Monitor for updates.
2. **No client-side file size limit** (MEDIUM, accepted): Server-side controls mitigate. UX improvement only.
3. **Source maps in production** (INFO, accepted): Useful for Sentry debugging. Can switch to hidden-source-map if needed.
4. **`unsafe-inline` in style-src** (INFO, accepted): Required by Tailwind CSS. No practical XSS vector.

### Conclusion

**No critical or high-severity vulnerabilities require immediate remediation.** The one HIGH dependency vulnerability (xlsx) is accepted due to limited attack surface in an internal, authenticated tool. All security headers and CSP policies are properly configured.
