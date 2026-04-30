# Phase 12: DMU-Export & Offline - Research

**Researched:** 2026-03-24
**Domain:** PDF generation (@react-pdf/renderer), SVG charts in PDF, Clipboard API, Service Worker/PWA (vite-plugin-pwa)
**Confidence:** HIGH

## Summary

Phase 12 extends the existing export infrastructure (already substantial: ExportTab, ReportDocument, DMU-filters, PDF components, styles) with SVG chart embedding in PDFs, clipboard copy functionality, and offline PWA support via service worker. The existing codebase is well-structured with working PDF generation, DMU-targeted section reordering, and Cito-huisstijl styling already in place.

The primary challenge is SVG chart rendering in @react-pdf/renderer. The react-pdf-charts library does NOT support Recharts v3+ (project uses ^3.8.0). The recommended approach is to build custom SVG chart components using @react-pdf/renderer's native SVG primitives (Svg, Rect, Line, Text, G, Path) rather than trying to bridge Recharts. This is feasible because the charts needed are simple bar charts comparing provider costs -- not complex interactive visualizations.

For offline/PWA, vite-plugin-pwa (v1.2.0) with Workbox's generateSW strategy provides zero-config service worker generation with precaching of static assets and runtime caching for Supabase API calls. The project already uses Supabase for data persistence and React Query for fetching, making stale-while-revalidate a natural fit.

**Primary recommendation:** Build custom PDF SVG bar charts using @react-pdf/renderer native primitives; use vite-plugin-pwa with generateSW for service worker; use navigator.clipboard.write() with text/html + text/plain fallback for clipboard.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Dezelfde secties in andere volgorde per DMU-rol + aangepaste samenvatting -- bestaand `dmu-filters.ts` patroon uitbouwen (geen aparte templates)
- 3-5 bullet points samenvatting afgestemd op DMU-focus: practical (coordinator), strategic (MT), financial (finance)
- Grafieken als statische SVG-afbeeldingen in PDF opnemen -- visuele impact voor MT/finance
- Schoolplan-kansen (Phase 14 data) als optionele sectie meenemen wanneer beschikbaar
- Clipboard-format: geformatteerde tekst (markdown-achtig) met schoolnaam, totalen en conclusie -- plakbaar in email/Teams
- Clipboard-inhoud: schoolnaam, geselecteerde modules, totaalverschil per aanbieder, tijdwinst in euro's, conclusie
- Geen "deel via email" optie -- clipboard volstaat, accountmanager plakt zelf
- Cache-first strategie voor assets + stale-while-revalidate voor API data -- snelste tablet-ervaring
- Subtiele offline-banner bovenaan: "Offline modus -- data kan verouderd zijn"
- Alle schoolprofielen + prijsdata + vergelijkingen offline beschikbaar -- volledige functionaliteit
- Queue mutaties lokaal bij offline, sync bij reconnect -- custom queue met conflict detection

### Claude's Discretion
- Exacte SVG rendering approach voor Recharts charts in @react-pdf/renderer
- Service worker implementatie details (Workbox vs custom)
- Offline queue storage mechanisme en conflict resolution strategie
- Clipboard API fallback voor oudere browsers
- PDF pagina-indeling en whitespace
- Offline data sync UI (progress indicator bij reconnect)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXPORT-01 | PDF-rapport afgestemd op coordinator (tijdwinst, dagelijks gebruik) | Existing dmu-filters.ts reorder pattern with summaryFocus='practical'; extend SummarySection bullet generation |
| EXPORT-02 | PDF-rapport afgestemd op MT/directie (overzicht, onderbouwing, strategische waarde) | dmu-filters.ts summaryFocus='strategic'; add SVG bar charts for visual impact; multiYear projection prominent |
| EXPORT-03 | PDF-rapport afgestemd op finance (euro's, meerjarenprojectie, terugverdientijd) | dmu-filters.ts summaryFocus='financial'; break-even visualization; cost comparison tables prominent |
| EXPORT-04 | PDF-rapporten bevatten schoolspecifieke data, Cito-huisstijl, bronvermelding en disclaimer | Already implemented: styles.ts has CITO_COLORS, ReportDocument.tsx has disclaimer, PdfHeader has school name |
| EXPORT-05 | Vergelijking kopieren naar clipboard als geformatteerde samenvatting | navigator.clipboard.write() with text/html + text/plain ClipboardItem; writeText() fallback |
| ARCH-05 | Applicatie werkt offline op tablet na eerste laden (service worker cacht assets en data) | vite-plugin-pwa with generateSW, precache assets, runtimeCaching for Supabase API with StaleWhileRevalidate |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- All UI text in Dutch (Nederlands), code comments and variable names in English
- Never modify price data in `src/data/default-prices.ts` without approval
- Forms use react-hook-form + Zod schema
- State via Zustand + persist middleware -- no new React Context or prop drilling
- Tests required for engine changes (`src/engine/__tests__/`)
- Path alias `@` = `/src`
- After approved changes: auto commit AND push to remote
- Run `npm run build` before finishing -- must pass without errors
- Engine functions are pure functions -- no side effects

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-pdf/renderer | ^4.3.2 | PDF generation with React components | Already in project, proven working |
| recharts | ^3.8.0 | UI charts (NOT for PDF -- incompatible) | Already in project for UI visualizations |

### New Dependencies
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite-plugin-pwa | ^1.2.0 | Service worker generation + PWA manifest | De facto standard for Vite PWA, wraps Workbox |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vite-plugin-pwa (generateSW) | Custom service worker | Far more code, must maintain Workbox config manually, no precache manifest generation |
| react-pdf-charts + recharts v2 | Custom SVG in @react-pdf/renderer | react-pdf-charts does NOT support recharts v3+; downgrading recharts would break existing UI charts |
| Custom SVG bar charts | Canvas-to-image approach | SVG is vector, crisp at all sizes, matches decision for "statische SVG-afbeeldingen" |

**Installation:**
```bash
npm install -D vite-plugin-pwa
```

No other new dependencies needed. The project already has @react-pdf/renderer and all UI libraries.

## Architecture Patterns

### Recommended Project Structure
```
src/features/export/
  ExportTab.tsx                    # Main tab (exists, extend with clipboard button)
  types.ts                         # Types (exists, extend with chart data)
  components/
    ExportConfigPanel.tsx          # Config UI (exists)
    ExportPreview.tsx              # HTML preview (exists)
    PdfDownloadButton.tsx          # Download trigger (exists)
    ClipboardButton.tsx            # NEW: copy to clipboard
  pdf/
    ReportDocument.tsx             # PDF document (exists, extend)
    dmu-filters.ts                 # DMU section reordering (exists)
    styles.ts                      # Cito styling (exists, extend with chart styles)
    components/
      PdfHeader.tsx                # (exists)
      PdfFooter.tsx                # (exists)
      SummarySection.tsx           # (exists, enhance bullet generation)
      PriceComparisonSection.tsx   # (exists)
      ValueReportSection.tsx       # (exists)
      PdfBarChart.tsx              # NEW: custom SVG bar chart for PDF
      SchoolplanSection.tsx        # NEW: optional schoolplan-kansen section

src/lib/
  clipboard.ts                     # NEW: clipboard formatting + write logic
  offline-queue.ts                 # NEW: mutation queue for offline sync

public/
  manifest.json                    # Auto-generated by vite-plugin-pwa (or inline config)
```

### Pattern 1: Custom SVG Bar Charts for @react-pdf/renderer

**What:** Build bar charts using @react-pdf/renderer's native SVG primitives (Svg, Rect, Text, G, Line) instead of trying to use Recharts in PDF context.

**When to use:** Any chart that needs to appear in the PDF document.

**Why:** react-pdf-charts does NOT support Recharts v3+. The project uses Recharts ^3.8.0. Downgrading is not an option because it would break existing UI charts. Building simple bar charts with SVG primitives is straightforward for the limited chart types needed (cost comparison bars, multi-year projection).

**Example:**
```typescript
// Source: @react-pdf/renderer SVG docs (https://react-pdf.org/svg)
import { Svg, Rect, Text, G, Line } from '@react-pdf/renderer';
import { CITO_COLORS } from '../styles';

interface BarChartProps {
  data: { label: string; value: number; color: string }[];
  width: number;
  height: number;
}

export function PdfBarChart({ data, width, height }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const barWidth = (width - 60) / data.length - 8; // 60px for Y-axis labels
  const chartHeight = height - 30; // 30px for X-axis labels

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Y-axis line */}
      <Line x1={55} y1={0} x2={55} y2={chartHeight} stroke={CITO_COLORS.border} strokeWidth={0.5} />

      {/* Bars */}
      {data.map((item, i) => {
        const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0;
        const x = 60 + i * (barWidth + 8);
        const y = chartHeight - barHeight;
        return (
          <G key={i}>
            <Rect x={x} y={y} width={barWidth} height={barHeight} fill={item.color} />
            <Text x={x + barWidth / 2} y={chartHeight + 12}
                  style={{ fontSize: 7, textAnchor: 'middle' }}>
              {item.label}
            </Text>
            <Text x={x + barWidth / 2} y={y - 4}
                  style={{ fontSize: 7, textAnchor: 'middle' }}>
              {formatEuro(item.value)}
            </Text>
          </G>
        );
      })}
    </Svg>
  );
}
```

### Pattern 2: Clipboard Copy with HTML + Plain Text Fallback

**What:** Use navigator.clipboard.write() with both text/html and text/plain MIME types in a single ClipboardItem.

**When to use:** For the "Kopieer naar clipboard" button.

**Example:**
```typescript
// Source: MDN Clipboard API (https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write)
export async function copyToClipboard(html: string, plainText: string): Promise<boolean> {
  try {
    // Modern Clipboard API with HTML support
    const htmlBlob = new Blob([html], { type: 'text/html' });
    const textBlob = new Blob([plainText], { type: 'text/plain' });
    const item = new ClipboardItem({
      'text/html': htmlBlob,
      'text/plain': textBlob,
    });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    // Fallback: plain text only
    try {
      await navigator.clipboard.writeText(plainText);
      return true;
    } catch {
      return false;
    }
  }
}
```

### Pattern 3: vite-plugin-pwa Configuration

**What:** Configure service worker with precaching for assets and runtime caching for Supabase API.

**Example:**
```typescript
// Source: vite-plugin-pwa docs (https://vite-pwa-org.netlify.app/guide/)
import { VitePWA } from 'vite-plugin-pwa';

// In vite.config.ts plugins array:
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
  manifest: {
    name: 'Cito Rekentool',
    short_name: 'Rekentool',
    theme_color: '#003082',
    background_color: '#FFFFFF',
    display: 'standalone',
    start_url: '/',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  workbox: {
    // Precache all built assets (JS, CSS, HTML)
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    // Runtime caching for Supabase API
    runtimeCaching: [
      {
        // Match Supabase REST API calls
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'supabase-api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        // Match Supabase auth
        urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-auth-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60, // 1 hour
          },
        },
      },
    ],
  },
})
```

### Pattern 4: Offline Mutation Queue

**What:** Queue mutations (school profile updates, price overrides) when offline, replay when online.

**Example:**
```typescript
// Store pending mutations in localStorage (Zustand persist pattern)
interface OfflineQueue {
  mutations: PendingMutation[];
  addMutation: (mutation: PendingMutation) => void;
  removeMutation: (id: string) => void;
  syncAll: () => Promise<void>;
}

interface PendingMutation {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  payload: Record<string, unknown>;
  timestamp: number;
}

// Conflict detection: compare timestamps
// If server record updated_at > mutation.timestamp, flag conflict
```

### Anti-Patterns to Avoid
- **Using react-pdf-charts with Recharts v3:** Will fail silently or throw errors. This library only supports Recharts v2.x.
- **Rendering Recharts components inside @react-pdf/renderer:** Recharts outputs browser DOM SVG, not react-pdf SVG primitives. They are incompatible.
- **Using React Context for offline state:** CLAUDE.md mandates Zustand + persist middleware for state. Offline queue MUST use Zustand.
- **navigator.clipboard.writeText() only:** Loses formatting. Always attempt clipboard.write() with HTML first for rich paste in email/Teams.
- **injectManifest for service worker:** Unnecessary complexity for this use case. generateSW handles precaching + runtime caching without custom SW code.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker generation | Custom service worker from scratch | vite-plugin-pwa + Workbox generateSW | Precache manifest generation, cache versioning, update flow are complex |
| PWA manifest | Manual manifest.json | vite-plugin-pwa manifest config | Auto-generates with correct paths and hashes |
| Offline detection | Custom navigator.onLine polling | `window.addEventListener('online'/'offline')` + Zustand store | Browser events are reliable; polling wastes resources |
| PDF styling system | Custom style abstraction | Existing styles.ts + StyleSheet.create | Already established with Cito brand colors |

**Key insight:** The bulk of the PDF infrastructure is ALREADY built. This phase enhances it (charts, better summaries) rather than building from scratch. Focus effort on the two genuinely new capabilities: SVG charts in PDF and offline/PWA.

## Common Pitfalls

### Pitfall 1: react-pdf-charts + Recharts v3 Incompatibility
**What goes wrong:** Developer tries to use react-pdf-charts to render Recharts v3 charts in PDF. Fails with cryptic errors or renders nothing.
**Why it happens:** react-pdf-charts only supports Recharts v2.x. The project uses v3.8.0.
**How to avoid:** Build custom SVG charts using @react-pdf/renderer's native SVG primitives (Svg, Rect, Text, etc.).
**Warning signs:** Blank chart areas in PDF, "cannot read property" errors during PDF generation.

### Pitfall 2: SVG Text Positioning in @react-pdf/renderer
**What goes wrong:** Text in PDF SVG charts renders at wrong positions or is cut off.
**Why it happens:** @react-pdf/renderer SVG Text component handles positioning differently than browser SVG. textAnchor, baseline alignment behave slightly differently.
**How to avoid:** Test chart rendering with actual data early. Use explicit x/y coordinates. Keep font sizes small (7-9pt) for chart labels.
**Warning signs:** Overlapping labels, text outside chart bounds.

### Pitfall 3: Service Worker Caching Auth Tokens
**What goes wrong:** Service worker caches Supabase responses that include auth-specific data, serves stale auth to different sessions.
**Why it happens:** Runtime caching doesn't distinguish auth context by default.
**How to avoid:** Use NetworkFirst for auth endpoints. Use StaleWhileRevalidate for data endpoints. Never cache POST/mutation requests.
**Warning signs:** Stale user data, auth errors after token refresh.

### Pitfall 4: Clipboard API Permissions
**What goes wrong:** clipboard.write() fails silently on some browsers/contexts.
**Why it happens:** Clipboard API requires secure context (HTTPS) and user gesture. Some browsers require focus.
**How to avoid:** Always call from a click handler (user gesture). Include try/catch with writeText() fallback. Show user feedback (toast) on success/failure.
**Warning signs:** No error but nothing copied, works on desktop but not mobile.

### Pitfall 5: PDF Page Overflow
**What goes wrong:** PDF content overflows single page, content is cut off at bottom.
**Why it happens:** Current ReportDocument.tsx uses a single `<Page>`. Combined report with charts can exceed A4 height.
**How to avoid:** Use @react-pdf/renderer's `wrap` prop on View components. Consider fixed-position footer and dynamic content area. Test with maximum data scenario (all modules, all sections, charts).
**Warning signs:** Truncated content in downloaded PDF, footer overlaps content.

### Pitfall 6: Offline Queue Conflicts
**What goes wrong:** User edits data offline, another user edits same record online. Sync produces data loss.
**Why it happens:** Last-write-wins without conflict detection overwrites changes.
**How to avoid:** Store mutation timestamps. On sync, compare with server updated_at. If conflict detected, show user a resolution UI rather than silently overwriting.
**Warning signs:** Data reverts after sync, user reports "changes disappeared".

## Code Examples

### Clipboard Formatting for Email/Teams
```typescript
// Build formatted clipboard content from ReportData
export function buildClipboardContent(data: ReportData, dmuTarget: DmuTarget): { html: string; plain: string } {
  const lines: string[] = [
    `**${data.schoolName}** - Vergelijking`,
    `Datum: ${data.date}`,
    '',
    `Geselecteerde modules: ${data.selectedModules.join(', ')}`,
  ];

  if (data.comparison) {
    lines.push('');
    lines.push('Totaalkosten per jaar:');
    lines.push(`  Cito: ${formatEuro(data.comparison.totals.cito)}`);
    if (data.comparison.totals.dia > 0) lines.push(`  DIA: ${formatEuro(data.comparison.totals.dia)}`);
    if (data.comparison.totals.jij > 0) lines.push(`  JIJ: ${formatEuro(data.comparison.totals.jij)}`);
  }

  if (data.migration) {
    lines.push('');
    lines.push(`Tijdwinst: ${data.migration.totalTimeSavingsHours} uur/jaar`);
    if (data.migration.totalTimeSavingsValue > 0) {
      lines.push(`Waarde tijdwinst: ${formatEuro(data.migration.totalTimeSavingsValue)}/jaar`);
    }
  }

  lines.push('');
  lines.push('Conclusie: [hier conclusie op basis van DMU-focus]');

  const plain = lines.join('\n');
  const html = lines
    .map((l) => l.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'))
    .join('<br>');

  return { html: `<div style="font-family:sans-serif;font-size:14px">${html}</div>`, plain };
}
```

### Offline Detection Hook
```typescript
// src/hooks/useOnlineStatus.ts
import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-pdf-charts + recharts v2 | Custom SVG with @react-pdf/renderer primitives | Recharts v3 (2024) | Must build chart components manually |
| document.execCommand('copy') | navigator.clipboard.write() | Baseline 2025 | Supports HTML clipboard content natively |
| Custom service workers | vite-plugin-pwa + Workbox | Stable since 2023 | Zero-config precaching, auto-updates |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Deprecated, still works but use Clipboard API instead
- react-pdf-charts with Recharts v3: Incompatible, do not use

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| @react-pdf/renderer | PDF generation | Yes (installed) | ^4.3.2 | -- |
| vite-plugin-pwa | Service worker/PWA | No (not installed) | 1.2.0 (npm latest) | `npm install -D vite-plugin-pwa` |
| Clipboard API | Copy to clipboard | Yes (browser) | Baseline 2025 | navigator.clipboard.writeText() |

**Missing dependencies with no fallback:**
- None

**Missing dependencies with fallback:**
- vite-plugin-pwa: Not installed, trivial to add via `npm install -D vite-plugin-pwa`

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 + jsdom ^29.0.1 + @testing-library/react ^16.3.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXPORT-01 | DMU-filter returns practical focus for coordinator | unit | `npx vitest run src/features/export/pdf/__tests__/dmu-filters.test.ts -x` | Wave 0 |
| EXPORT-02 | DMU-filter returns strategic focus for MT | unit | `npx vitest run src/features/export/pdf/__tests__/dmu-filters.test.ts -x` | Wave 0 |
| EXPORT-03 | DMU-filter returns financial focus for finance | unit | `npx vitest run src/features/export/pdf/__tests__/dmu-filters.test.ts -x` | Wave 0 |
| EXPORT-04 | ReportDocument includes disclaimer, school data, date | unit | `npx vitest run src/features/export/pdf/__tests__/ReportDocument.test.ts -x` | Wave 0 |
| EXPORT-05 | Clipboard builds formatted text with school data | unit | `npx vitest run src/lib/__tests__/clipboard.test.ts -x` | Wave 0 |
| ARCH-05 | Service worker config has precache + runtime caching | unit | `npx vitest run src/__tests__/pwa-config.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/export/pdf/__tests__/dmu-filters.test.ts` -- covers EXPORT-01, EXPORT-02, EXPORT-03 (DMU section ordering + summaryFocus)
- [ ] `src/features/export/pdf/__tests__/PdfBarChart.test.ts` -- covers SVG chart data mapping
- [ ] `src/lib/__tests__/clipboard.test.ts` -- covers EXPORT-05 (clipboard content formatting)
- [ ] `src/features/export/pdf/__tests__/SummarySection.test.ts` -- covers bullet point generation per DMU focus

## Open Questions

1. **PWA Icons**
   - What we know: vite-plugin-pwa manifest requires icon files (192x192, 512x512 PNG)
   - What's unclear: Whether Cito brand icons exist in the project or need creation
   - Recommendation: Create simple icons with Cito primary color (#003082) background + "R" letter; can be refined later

2. **Offline Queue Conflict UI**
   - What we know: Custom queue with conflict detection is a locked decision
   - What's unclear: Exact conflict resolution UX (auto-merge? user picks? show diff?)
   - Recommendation: Start with "server wins + notify user" strategy; most conflicts are unlikely in single-user-per-school context

3. **Multi-page PDF**
   - What we know: Current ReportDocument uses single Page. Combined reports with charts may overflow.
   - What's unclear: Whether @react-pdf/renderer auto-breaks or needs explicit multi-page handling
   - Recommendation: Test with maximum content scenario. Use `wrap` prop on View components; @react-pdf/renderer does support automatic page breaks with the `wrap` prop (enabled by default).

## Sources

### Primary (HIGH confidence)
- @react-pdf/renderer SVG docs: https://react-pdf.org/svg -- SVG primitive components and attributes
- vite-plugin-pwa official docs: https://vite-pwa-org.netlify.app/guide/ -- installation, configuration, generateSW
- vite-plugin-pwa Workbox generateSW: https://vite-pwa-org.netlify.app/workbox/generate-sw -- runtime caching config
- MDN Clipboard API: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write -- write() with ClipboardItem

### Secondary (MEDIUM confidence)
- react-pdf-charts GitHub: https://github.com/EvHaus/react-pdf-charts -- confirmed Recharts v3 incompatibility
- Simon Willison clipboard TIL: https://til.simonwillison.net/javascript/copy-rich-text-to-clipboard -- HTML clipboard pattern

### Tertiary (LOW confidence)
- None -- all findings verified against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- @react-pdf/renderer already in use, vite-plugin-pwa is well-documented standard
- Architecture: HIGH -- existing export infrastructure is substantial, patterns are clear extensions
- Pitfalls: HIGH -- Recharts v3 incompatibility verified, Clipboard API well-documented, PWA patterns proven
- SVG charts: MEDIUM -- custom SVG approach is sound but exact text positioning needs runtime testing

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable libraries, no breaking changes expected)
