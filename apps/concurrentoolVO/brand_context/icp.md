# ICP — concurrentoolVO

> **Per-app override.** Fully replaces the root template `icp.md` for this app. Last validated: 2026-05-01.

This file defines who actually uses the app. Skills that produce UI-copy or onboarding flows read this to write for the right audience.

---

## Primary user — Cito-consultant

The person who opens the app, manages school profiles, runs vergelijkingen, exports business cases.

**Role**: Account manager / sales-consultant at Cito (toetsaanbieder voortgezet onderwijs).

**Day-to-day**:
- Visits 2-5 schools per week
- Prepares quotes + price comparisons before or during the visit
- Maintains relationships with school decision-makers across multi-year contracts
- Tracks which competitors (DIA, JIJ) are active per school
- Reports on pipeline + closed deals to Cito sales management

**Tooling baseline**:
- Comfortable with web tools and PDF/Excel exports
- NOT a developer — doesn't expect (or want to see) error stack traces, JSON, technical jargon
- Uses laptop + occasionally tablet (school visits)
- Internet access varies — sometimes works on school WiFi (slow/restricted), sometimes from car/train (mobile)

**What they need from this app**:
- Fast: opening a school + running a comparison = under 30 seconds during a meeting
- Accurate: pricing must match Cito's actual tariff structure exactly. Trust is hard-won.
- Defensible: they read out numbers in front of decision-makers. If a number is wrong, the consultant looks bad — not the tool.
- Exportable: every meeting ends with "stuur me even die vergelijking" — PDF + Excel must look professional
- Offline-tolerant: school WiFi blocks half the internet sometimes. Tool needs to work with cached data + queue writes

**What they don't need**:
- Marketing-fluff or motivational copy
- AI-magic that they can't audit (AI is for intake parsing only — pricing is deterministic)
- Multi-step undo or version history (per-school overrides are enough)
- Mobile-first UX (they use laptops)

**Frustrations to design AGAINST**:
- "Het tool zegt iets anders dan mijn offerte" → trust collapse
- "Ik kan dit ter plekke niet snel terugvinden" → tool gets ditched mid-meeting
- "Mijn collega heeft een andere versie open dan ik" → confusion about which numbers are current
- "De export ziet er amateuristisch uit" → consultant won't share it

---

## Secondary user — Pim (operator / dev)

You. The person maintaining the tool, adding features, fixing bugs, occasionally demoing it.

**What you need that's different from the consultant**:
- Admin-tab access (`AdminConfigEditor`)
- Pricing-config visibility (raw numbers, not just rendered)
- Review queue access (`ReviewQueuePage`) for proposed price changes
- Sentry / Vercel logs / Supabase dashboard
- Migration writing + db reset for dev

The voice/ICP for admin screens can be more technical / English-acceptable. For all consultant-facing screens: strict NL voice profile.

---

## Tertiary audience — School decision-makers (read-over-shoulder, not direct users)

When the consultant and a school administrator look at the screen together, the school side reads it too.

**Roles they fill**:
- Schoolleider / directeur (decision authority)
- Financieel medewerker (cost validation)
- IT-coördinator (occasional, integration questions)
- Leerlingenadministratie (data accuracy)

**What they care about**:
- "Is dit aanbod realistisch voor onze scholen?" (vergelijking met huidige situatie)
- "Wat verandert er als we overstappen?" (migration scenario B)
- "Klopt dit met onze leerlingaantallen?" (data validation)

**What they DON'T need to see**:
- Internal Cito sales-pipeline status
- Other schools' configurations
- Raw API errors

**Design implication**: anything that loads on a school-profile page MUST be safe to read out loud + display in front of the school. No leaking competitor lists, no internal notes, no draft pricing-overrides without clear "concept" labeling.

---

## Non-users

Explicitly NOT the audience:

- **DIA / JIJ employees** (competitors). They don't see the tool — but if a screenshot ever leaks, the data must not include unfair characterizations of their pricing. Stick to factual numbers.
- **Students / parents**. Outside scope; they consume the test products, not pricing decisions.
- **General public**. Tool is internal Cito + visited schools. No public-facing surface (besides login page).

---

## ICP-driven design rules

These fall out of the user profiles above. Treat as constraints when adding features:

| Constraint | From which user need |
|---|---|
| **Sub-30-second school open + comparison flow** | Consultant in-meeting speed |
| **Print-ready PDF + Excel exports** | "Stuur me even die vergelijking" |
| **Offline-tolerant** (IndexedDB cache, write queue) | School WiFi flakiness |
| **Pricing must match Cito tariff exactly** | Trust = #1 |
| **Hide draft / unconfirmed prices behind explicit toggle** | Read-over-shoulder safety |
| **Locked price files** (`default-prices.ts`, `cito-migration-prices.ts`) | One-source-of-truth for tariffs |
| **NL UI throughout** | Audience is Dutch-speaking |
| **No AI in the loop for actual pricing** | Auditability + explainability |
| **Per-school configuration** (no global overrides leaking between schools) | Read-over-shoulder safety |

---

## TODOs for Pim

- Add 1-2 named composite personas if real consultant feedback shapes them (e.g., "Consultant Karin werkt 3 jaar voor Cito, 4 scholen per week, focust op middelbare scholen 200-1500 leerlingen")
- Add real-world frustration quotes if consultants give them
