# Feature Research

**Domain:** Sales intelligence platform for B2B education (assessment/testing market, Dutch VO)
**Researched:** 2026-03-21
**Confidence:** MEDIUM-HIGH (domain-specific patterns verified against general sales intelligence best practices; Dutch education market specifics based on project context and existing codebase)

## Scope

This document covers NEW features for v2.0 only. The v1 foundation (wizard, comparison engine, current-vs-proposed engine, migration engine, basic AI intake, Zustand stores, Recharts charts) is already built and validated. See the codebase in `src/engine/`, `src/features/`, `src/data/` for what exists.

## Feature Landscape

### Table Stakes (Users Expect These)

Features the accountmanager assumes exist once the tool evolves beyond a static calculator. Missing these makes v2 feel like v1 with extra buttons.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **School profile persistence (registry)** | After the first call with a school, the accountmanager expects to find that data again. Currently one global Zustand store — no concept of "which school." Every v2 feature depends on this. | MEDIUM | School list with IDs, each storing wizard inputs, moduleSetups, conversation notes, pipeline status. localStorage is fine for MVP (already used by Zustand persist). IndexedDB if data grows. No backend per project constraints. |
| **Enhanced conversation intake** | v1's `IntakePanel` handles single-shot extraction from pasted notes. v2 must handle messier reality: partial info, corrections ("actually DIA, not JIJ"), follow-up calls that add to existing profile, prices and deals mentioned in passing. | MEDIUM | Extend `extractIntakeFromNotes` to accept existing profile context so AI can merge rather than overwrite. Append conversation to history log. Claude Haiku 4.5 is fast enough — already validated in v1. |
| **Hybrid scenario calculations** | Schools rarely use one provider for everything. "DIA for Nederlands, Cito for rekenwiskunde, nothing for sociaal-emotioneel" is the norm. The tool must calculate per-module, not per-provider. | MEDIUM | v1's `moduleSetups` with `currentProvider` per module already captures this data. Engine needs refactor: calculate savings per module where provider differs, show "already Cito" where they match, surface the total switching value. |
| **Price staleness on school-specific data** | When an accountmanager enters "they pay EUR 4.80 for DIA rekenwiskunde" from a call, that price needs the same staleness tracking as publication prices. | LOW | Extend existing `PriceRecord` interface to support school-level overrides. `getPriceStatus()` and `PriceBadge` already handle this pattern — just need a new `source: 'school-intel'` type. |
| **Assumption transparency on AI-extracted data** | When AI extracts "350 leerlingen HAVO" from conversation notes, the accountmanager must see and correct this before it drives calculations. v1's `EditableAssumption` pattern works — extend to AI-sourced data. | LOW | Existing pattern. AI extraction results shown as editable cards (already in `ExtractionPreview`). Just needs to be wired into the school profile save flow. |
| **Basic export (PDF)** | After a comparison, the accountmanager needs something shareable. Without this, every calculation dies in the browser tab. School decisions travel via printed documents and email attachments. | MEDIUM | Use `@react-pdf/renderer` — React-native PDF generation, 860K+ weekly npm downloads, JSX-based templating. Start with one "comparison summary" template before DMU variants. |
| **Multi-year cost projection** | Schools budget annually but contracts are multi-year. "What does this cost over 3 years?" is a standard question from finance/MT. Without this, the tool only answers the easy question. | MEDIUM | Pure function: annual cost x years, apply inflation assumption, add one-time migration costs in year 1. Output: year-by-year table with cumulative savings. Critical for MT/finance DMU exports later. |

### Differentiators (Competitive Advantage)

Features that make this a genuine sales intelligence platform. These align with the core value: "during every school conversation, an immediately substantiated, honest, DMU-tailored overview."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **DMU-targeted export variants** | Same data, different story. Coordinator gets feature comparison + daily workflow impact. MT gets strategic overview with total cost + time savings in euros. Finance gets multi-year projection with line items. No generic sales tool does this for VO assessment. This is THE killer feature. | HIGH | Three PDF templates with different data emphasis, language register, and visualizations. Requires: template component system in `@react-pdf/renderer`, DMU role selector, content generation per role. AI (Haiku) can generate narrative intro paragraphs per DMU role. Depends on: basic export infra + value engine + multi-year projection all being built first. |
| **Value-beyond-price quantification** | Convert time savings into euros. "Automatic rights management saves coordinator 2 hrs/week x 40 weeks x EUR 45/hr = EUR 3,600/year." Makes Cito competitive even when nominally more expensive per student. This reframes the entire conversation from cost to value. | MEDIUM | Pure calculation engine using the five documented platform improvements: rechten docenten (auto vs manual), toetsen resetten (self vs klantenservice), inloggen (Entree-federatie vs startcodes), planning (auto vs manual), koppeling (Somtoday/Magister-sync vs EDEXML). Needs: task list with time estimates per platform, adjustable hourly rate, school-size multiplier. |
| **Conversation history per school** | Every call adds context. "Last time they mentioned budget concerns" or "coordinator was enthusiastic but MT needs convincing." Builds institutional memory. This is what makes the tool a CRM-lite without being a CRM. | MEDIUM | Append-only log per school profile. Each entry: date, free-text notes, AI-extracted structured data (prices, contacts mentioned, sentiment indicators). No AI summarization needed initially — raw notes with extracted highlights. |
| **Pipeline status tracking** | Simple stage tracking: Lead / Contact gemaakt / Offerte / Besluit / Klant. Gives the accountmanager a portfolio view across all schools. Low effort, high visibility. | LOW | Five-stage enum on school profile. Filter/sort school list by stage. Badge count per stage. No workflow automation — just visibility. Depends only on school registry. |
| **Auto-price-update pipeline** | Three input channels converging on one `PriceRecord` interface: (1) Document upload — parse PDF price lists with AI, (2) Manual entry with source attribution and verification date, (3) AI-assisted web lookup. Keeps pricing data fresh without manual research every time. | HIGH | Document parsing is the complex part. Use Claude's vision capabilities for PDF table extraction (send PDF pages as images). Manual entry is a form (low complexity). Web lookup is a prompted AI search (medium complexity, low reliability). All three produce `PriceRecord` objects with proper `source` and `verifiedAt`. |
| **Upsell opportunity detection** | For hybrid schools: "This school uses DIA for Nederlands but Cito for everything else. Switching Nederlands to Cito saves EUR X/year and simplifies administration." Automatically identifies and ranks modules where switching to Cito is advantageous. | MEDIUM | Compare per-module costs where `currentProvider !== 'cito'`. Rank by: savings amount, differentiator strength (from `differentiators.ts`), administrative simplification. Output: prioritized upsell list per school. Depends on hybrid scenario data being populated. |
| **Negotiation preparation card** | One-page pre-call cheat sheet: school profile summary, current products, last conversation highlights, price comparison snapshot, talking points per anticipated DMU role, known objections from history. The "open this before you dial" screen. | MEDIUM | Composite view pulling from school profile, conversation history, and calculation engines. No new data — just smart aggregation of existing data into one actionable screen. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **CRM integration (Salesforce/HubSpot)** | "Sync school data to our CRM" | External dependency, auth complexity, sync conflicts, GDPR surface area. Explicitly out of scope (PROJECT.md). Would triple the infrastructure needs. | School profiles local with export-friendly formats (CSV, PDF). Accountmanager updates CRM manually when needed. |
| **Real-time voice transcription** | "Record the phone call and auto-transcribe" | AVG/GDPR requires explicit consent for call recording in NL. Technical complexity of real-time ASR. Accountmanager often on mobile during school visits. Privacy risk is a deal-breaker for an internal tool. | Free-text note-taking during/after the call with AI extraction. Lower friction, no privacy issues, works on any device. |
| **Automated email sending** | "Auto-send the comparison after the call" | Removes accountmanager control over the relationship. Wrong tone, wrong timing, or wrong recipient damages trust. Education sales is relationship-driven — automation feels impersonal. | Generate the export, let the accountmanager review and send manually. One-click copy-to-email-body is the maximum. |
| **Exhaustive competitor feature matrix** | "Show everything DIA and JIJ offer vs Cito" | Maintenance nightmare as features change quarterly. Risks inaccuracy. Shifts conversation from "what does your school need" to "who has more checkboxes." | Module-level differentiators (already in `differentiators.ts`) focused on what matters for the school's selected modules. Curated, not comprehensive. |
| **Login / user accounts** | "Multiple accountmanagers with their own data" | Requires auth, backend, deployment infrastructure. Completely out of scope per PROJECT.md. Adds months of work for marginal value with a small sales team. | Single-user tool per device. School data export/import for colleague handoff when needed. |
| **Dynamic pricing / discount suggestion** | "Suggest what discount to offer" | Pricing authority sits with sales management. Discount suggestions without mandate create internal conflict and set wrong expectations with schools. | Show publication prices as upper bound. Note "werkelijke prijs kan lager zijn." Accountmanager enters deal-specific prices as manual overrides. |
| **Scenario C engine (competitor to new Cito)** | "DIA school wants new Cito platform" | Combines both existing scenario complexities. Explicitly deferred in PROJECT.md. Building a third engine is unnecessary. | Handle via hybrid scenario configuration: set per-module `currentProvider`, compare with new Cito platform pricing. Not a separate engine — a configuration of existing ones combined. |

## Feature Dependencies

```
[School Registry (list/create/select/delete)]
    ├──enhances──> [Pipeline Status Tracking]
    ├──enhances──> [Conversation History per School]
    └──required-by──> [Enhanced Conversation Intake]
                          └──feeds──> [School Profile Persistence]

[School Profile Persistence]
    └──required-by──> [Upsell Opportunity Detection]
    └──required-by──> [Negotiation Preparation Card]

[Basic PDF Export Infrastructure]
    └──required-by──> [DMU-Targeted Export Variants]

[Value-Beyond-Price Engine]
    └──required-by──> [DMU-Targeted Exports (MT needs euro figures)]
    └──enhances──> [Negotiation Preparation Card]

[Multi-Year Cost Projection]
    └──required-by──> [DMU-Targeted Exports (finance needs projections)]

[Hybrid Scenario Calculations]
    └──required-by──> [Upsell Opportunity Detection]

[Auto-Price-Update Pipeline]
    └──independent──> (can be built in parallel, only touches PriceRecord interface)
    └──enhances──> [Price Staleness Awareness]
```

### Dependency Notes

- **School Registry is the foundation.** Nearly every v2 feature requires knowing "which school." This must be Phase 1.
- **Basic PDF export before DMU variants.** Get the `@react-pdf/renderer` infrastructure right with one template, then specialize for three DMU roles.
- **Value-beyond-price feeds into exports.** The time-savings-in-euros calculation must exist before MT/finance exports can reference it.
- **Hybrid scenarios are partially built.** The `moduleSetups` data structure exists in v1. The comparison engine needs to use this more intelligently — refactor, not rewrite.
- **Auto-price-update is independent.** Can be built in parallel with other features since it only modifies the `PriceRecord` pipeline.
- **DMU exports have the most dependencies.** They need: PDF infrastructure + value engine + multi-year projection + school profiles. Build them last in the milestone.

## MVP Definition

### Launch With (v2.0 Core)

Minimum to transform the tool from "calculator" to "sales intelligence platform."

- [ ] **School registry with persistence** — Create, list, select, delete school profiles. Each stores wizard inputs, module setups, conversation notes. Foundation for everything.
- [ ] **Enhanced conversation intake** — Extend existing AI intake for incremental extraction (add to existing profile), capture deal-specific prices, append to conversation history.
- [ ] **Hybrid scenario calculations** — Engine handles mixed providers per module, calculates per-module savings, identifies "already Cito" modules vs switching opportunities.
- [ ] **Value-beyond-price engine** — Pure function quantifying the five documented time savings in euros (rechten, resetten, inloggen, planning, koppeling).
- [ ] **Basic PDF export** — Single comparison summary as downloadable PDF. Not yet DMU-specific.
- [ ] **School-level price overrides** — Enter deal-specific prices per school with source attribution. Stored alongside publication prices.

### Add After Validation (v2.x)

Once core school intelligence is working and accountmanagers are using it daily.

- [ ] **DMU-targeted export variants** — Three templates (coordinator, MT, finance) after basic export is validated.
- [ ] **Pipeline status tracking** — Simple stage per school, portfolio view. After enough school profiles exist.
- [ ] **Multi-year cost projection** — 3-5 year projection. Add for finance DMU export readiness.
- [ ] **Negotiation preparation card** — Composite pre-call view. After conversation history has data to aggregate.
- [ ] **Upsell opportunity detection** — Auto-identify module switching opportunities. After hybrid scenario data proves useful.

### Future Consideration (v2.5+)

- [ ] **Auto-price-update: document parsing** — PDF price list upload with AI extraction. Defer because manual entry with verification is sufficient for annual price lists.
- [ ] **Auto-price-update: web lookup** — Agent-based price research. Defer because competitor prices change annually in education; manual updates are fine.
- [ ] **School data export/import** — For colleague handoff. Defer until multi-user need is validated.
- [ ] **Conversation search** — Full-text search across all notes. Defer until volume justifies it.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Depends On |
|---------|------------|---------------------|----------|------------|
| School registry + persistence | HIGH | MEDIUM | P1 | Nothing (foundation) |
| Enhanced conversation intake | HIGH | MEDIUM | P1 | School registry |
| Hybrid scenario calculations | HIGH | MEDIUM | P1 | Existing engine refactor |
| Value-beyond-price engine | HIGH | LOW | P1 | Time savings data model |
| Basic PDF export | HIGH | MEDIUM | P1 | @react-pdf/renderer setup |
| School-level price overrides | HIGH | LOW | P1 | School registry |
| DMU-targeted exports | HIGH | HIGH | P2 | PDF infra + value engine + multi-year |
| Multi-year cost projection | MEDIUM | MEDIUM | P2 | Value engine |
| Pipeline status tracking | MEDIUM | LOW | P2 | School registry |
| Negotiation prep card | MEDIUM | MEDIUM | P2 | School registry + conv history |
| Upsell detection | MEDIUM | LOW | P2 | Hybrid scenarios |
| Auto-price-update (document) | MEDIUM | HIGH | P3 | Price record extension |
| Auto-price-update (web) | LOW | HIGH | P3 | AI agent infrastructure |
| Conversation search | LOW | LOW | P3 | Conversation history volume |

**Priority key:**
- P1: Must have for v2.0 launch — the tool is not a "sales intelligence platform" without these
- P2: Should have, add in v2.x — these make it genuinely powerful
- P3: Nice to have, defer — complexity outweighs value at this stage

## Competitor Feature Analysis

Not software competitors — this is about how Cito accountmanagers work today vs. what this tool enables.

| Capability | Current Workflow (No Tool) | Generic Sales Tools (HubSpot etc.) | Our Approach |
|------------|---------------------------|-------------------------------------|--------------|
| Price comparison | Manual spreadsheet per school, often outdated | No pricing engine — CRM tracks deals, not product costs | Real-time calculation with source transparency and staleness tracking |
| School intelligence | Notes in personal notebook, memory, scattered emails | Contact record + activity log (generic, no education structure) | Structured profile: levels, students, modules, providers, deals, history |
| DMU-specific materials | Manual PowerPoint adapted per stakeholder (hours of work) | Template library (generic, not data-driven) | Auto-generated from live data, tailored per DMU role — minutes, not hours |
| Conversation capture | Post-call CRM update (if remembered) | Call logging, sometimes transcription | During-call free-text with AI extraction into structured school data |
| Price maintenance | Annual manual check of price lists, often forgotten | Not applicable | Source-tracked records with staleness alerts, manual + doc upload paths |
| Value quantification | Ad-hoc "we save you time" claims without numbers | Generic ROI calculators | Concrete school-specific time-to-euros: 5 documented tasks, adjustable rates |
| Upsell identification | Intuition based on what accountmanager remembers | Opportunity scoring (no product-level detail) | Data-driven per-module analysis: cost savings + differentiator strength |

## Sources

- Project context: `.planning/PROJECT.md` — domain, DMU roles, pricing landscape, constraints, decisions
- Existing codebase: `src/engine/`, `src/models/`, `src/features/intake/`, `src/data/`
- [Claap: Sales Intelligence Guide 2026](https://www.claap.io/blog/sales-intelligence-guide) — general sales intelligence platform features (MEDIUM confidence)
- [Outreach: Customer Intelligence Platforms](https://www.outreach.io/resources/blog/customer-intelligence-platform) — B2B platform patterns (MEDIUM confidence)
- [The Insight Collective: B2B DMU Guide](https://www.theinsightcollective.com/insights/the-b2b-decision-making-unit-dmu-the-real-faces-of-persuasion) — DMU role-specific content targeting (MEDIUM confidence)
- [ZoomInfo: AI Note-Taking for Sales](https://pipeline.zoominfo.com/sales/ai-note-taking-call-analysis-sales) — conversation intelligence patterns (MEDIUM confidence)
- [DEV.to: React PDF Libraries 2025](https://dev.to/ansonch/6-open-source-pdf-generation-and-modification-libraries-every-react-dev-should-know-in-2025-13g0) — PDF generation library comparison (MEDIUM confidence)
- [Insight7: AI Upsell Opportunity Detection](https://insight7.io/best-ai-tools-for-identifying-upsell-opportunities-in-sales-conversations-2/) — upsell signal detection patterns (MEDIUM confidence)
- [NN/g: Calculator Tool Recommendations](https://www.nngroup.com/articles/recommendations-calculator/) — UX patterns for interactive calculation tools (HIGH confidence, from v1 research)

---
*Feature research for: Sales intelligence platform for Cito VO accountmanagers (v2.0 milestone)*
*Researched: 2026-03-21*
