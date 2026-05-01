# Voice Profile — concurrentoolVO

> **Per-app override.** Fully replaces the root template `voice-profile.md` for this app (no merging). Loaded by `mkt-brand-voice` and any skill that produces UI-copy.
>
> Last validated: 2026-05-01.

---

## Context

The app is used by **Cito-consultants** during or after meetings with **Dutch secondary schools** (VO) to compare pricing across three test providers (Cito, DIA, JIJ) and build business cases. Two distinct usage modes:

1. **In-meeting** — consultant + school decision-makers reading the screen together. Tool must be readable at a glance, no surprises, no fluff.
2. **Pre/post-meeting** — consultant alone preparing or refining. Tool can show more detail; consultant tolerates dense info.

This shapes the voice: **professional-functional, accuracy-first, calmly authoritative**. Less playful than the App-Dev OS root template default. Less "marketing-y" than a public SaaS app.

---

## Core voice settings

| Dial | Setting | Reason |
|---|---|---|
| **Register** | professional-formal-NL | Cito + scholen = institutional context. Casual would feel off. |
| **Personality** | helpful tool, not a brand | Consultant is the expert; the tool supports their work, doesn't try to be the protagonist. |
| **Energy** | calm + precise | Meetings are high-stakes (pricing decisions). Avoid urgency-language unless something is actually urgent. |
| **Verbosity** | medium-short | Buttons concise. Errors specific. Empty states one sentence. Avoid both telegram-short and chat-verbose. |
| **Authority** | factual | "Modules opgeslagen." NOT "Top, je modules zijn opgeslagen!" |
| **Emoji / icons** | sparingly, only functional (status icons) | No decorative emoji. Status icons (✓ check, ⚠ warning) are fine where they aid scanning. |

### Core rule

> Use the **shortest version that stays unambiguous in the domain**. If cutting a word makes a Cito-consultant or school-administrator second-guess what they're looking at, keep the word. Domain terms (niveaus, leerjaren, leerlingaantal, modules, scenario A/B, schijnvoordeel) are NOT redundant — keep them.

---

## Vocabulary

### Use

- **Domain terms exact**: "niveaus" (not "levels"), "leerjaren" (not "schooljaren"), "leerlingaantallen" (not "studenten"), "modules" (not "onderdelen"), "scenario" (not "case"), "wizard" (acceptable Dutch loan-word for this UI)
- **Direct verbs**: "Opslaan", "Verwijderen", "Toevoegen", "Vergelijken", "Exporteren", "Bekijken", "Aanpassen"
- **You-form**: "u" in user-facing copy (consultants/schools = institutional; "u" matches register)
  - Exception: status messages without subject — "Opgeslagen" instead of "U heeft opgeslagen"
- **Concrete numbers**: "5 stappen", "3 aanbieders", "60 seconden" (not "enkele", "diverse", "een poosje")
- **Active voice**: "De wizard berekent..." (not "wordt berekend")

### Avoid

- Casual openers: "Hé", "Hoi", "Even kijken", "Een momentje"
- Apologetic filler: "Helaas", "Excuses", "Sorry" (use only when the user actually loses work)
- Cute filler: "Oeps", "Hopla", "Yes!", "Hier komt 'ie" — never
- Marketing-y: "geweldig", "fantastisch", "vol van waarde", "inspirerend"
- Vague hedges: "het lijkt erop dat", "mogelijk", "wellicht" (in error messages especially — be definitive about what failed)
- Imperative-shouty: "MOET" in caps, "Direct opslaan!" — use neutral imperative
- English words where Dutch exists: "saven" → "opslaan", "delete" → "verwijderen"
  - Acceptable English in domain: "wizard", "dashboard", "export", "preview" (consultants use these)
- Emoji as message: 🎉, 😊, 👍 — never as standalone reply

### Forbidden in this app (specifically)

- **No price quotes in copy**. Prices come from data files (`src/data/`). Never hard-code a number in a UI string.
- **No casual provider references**. Always "Cito", "DIA", "JIJ" — never lowercase, never abbreviated further.
- **No school name in template strings**. Always `{schoolName}` interpolation — schools are named entities.

---

## Microcopy patterns

### Buttons (primary action verbs)

| Use | Don't use |
|---|---|
| "Opslaan" | "Wijzigingen opslaan", "Save changes" |
| "Verwijderen" | "Permanent verwijderen", "Weg ermee" |
| "Toevoegen" | "Een nieuwe toevoegen", "Voeg toe" |
| "Annuleren" | "Stop", "Terug" (annuleren = duidelijker dat het wijziging tegenhoudt) |
| "Volgende" | "Next", "Verder" |
| "Vorige" | "Back", "Terug" (volgende ↔ vorige is duidelijker dan "verder ↔ terug") |
| "Vergelijken" | "Vergelijking starten" |
| "Exporteren naar PDF" | "Download PDF", "PDF maken" |
| "Sluiten" | "Close", "Dicht" |
| "Bevestigen" | "OK" (geen contextloze OK; altijd bevestigen-wat) |

### Loading states

| Use | Don't use |
|---|---|
| "Laden…" | "Even geduld…", "Een ogenblik geduld a.u.b." |
| "Berekenen…" | "Aan het rekenen…", "Bezig…" |
| "Opslaan…" | "Wijzigingen worden opgeslagen…" |
| "Document analyseren…" | "AI is bezig met analyseren…" |

### Empty states

| Use | Don't use |
|---|---|
| "Nog geen scholen toegevoegd. Voeg er een toe om te beginnen." | "Het lijkt erop dat je nog geen scholen hebt." |
| "Nog geen vergelijkingen voor deze school." | "Hmm, niets te zien hier." |
| "Geen documenten geüpload." | "Upload je eerste document!" |

### Error messages

Pattern: **wat ging er mis** + **wat kan de gebruiker doen** (in die volgorde, kort).

| Use | Don't use |
|---|---|
| "Document kon niet worden gelezen. Probeer een ander bestand of plak de tekst direct." | "Oeps, er ging iets mis met je document." |
| "AI-intake niet beschikbaar. Vul de wizard handmatig in." | "We hebben momenteel last van een storing." |
| "Verbinding verloren. Wijzigingen worden opgeslagen zodra je weer online bent." | "Geen internet :(" |
| "Schoolnaam is verplicht." | "Vul ajb een schoolnaam in." |
| "Bestand te groot — maximaal 10 MB." | "Bestand te groot." (zonder limiet = onbruikbaar) |

### Success / confirmation

Be brief. Don't over-celebrate.

| Use | Don't use |
|---|---|
| "Opgeslagen." | "Wijzigingen succesvol opgeslagen!" |
| "Vergelijking aangemaakt." | "Yes! Je vergelijking staat klaar 🎉" |
| "Export gereed: vergelijking-{schoolName}-{datum}.pdf" | "Download is begonnen!" |

### Onboarding hints

Short, instructive. Acknowledge what the user is about to do.

- "Vul eerst het schoolprofiel in. Daarna toont de tool een vergelijking met Cito, DIA en JIJ."
- "Wijzig prijzen alleen wanneer je een afwijkende offerte hebt. Standaard worden de actuele tarieven gebruikt."

### AI-related copy

This app is transparent about AI. When AI runs, say so. When AI is uncertain, say that too.

- "AI heeft de wizard alvast ingevuld op basis van de notities. Controleer de velden en pas aan waar nodig."
- "AI kon dit veld niet invullen. Vul handmatig aan."
- NOOIT: "AI heeft de prijzen berekend." (AI berekent geen prijzen — engines doen dat)

---

## Sentence patterns

- Short sentences. Subject + verb + object. Period.
- One idea per sentence. Avoid commas chaining clauses unless the second clause genuinely depends on the first.
- Active voice in instructions ("De tool berekent..." — not "Wordt berekend door de tool").
- Passive voice acceptable in confirmations where actor doesn't matter ("Opgeslagen", "Bestand verwijderd").
- Numbers as digits, not words: "5 stappen", not "vijf stappen".

---

## Things this voice profile does NOT cover

- **Visual design / UI patterns** — see `apps/concurrentoolVO/skills/ui-design-system/` (existing rekentool skill)
- **Iconography** — same
- **Marketing copy outside the app** (website, sales decks, email) — out of scope for this file. If those get added, write a separate `marketing-voice.md`.

---

## When to use the override mechanism

If a specific feature has a different audience inside the app (e.g., admin-only screens for Pim/operators), an `<feature>/voice-overrides.md` could define localized exceptions. None exist yet — flag if needed.

---

## TODOs for Pim

- Add 5-10 real microcopy strings from current production app to validate this profile (paste them under "Real-world examples" subsection — to be added)
- If you have specific consultant-feedback on tone ("te zakelijk", "te technisch", "perfect zo"), capture it as a "Voice rules from user feedback" subsection

These are nice-to-have, not blockers. Profile works as-is for code-skill output.
