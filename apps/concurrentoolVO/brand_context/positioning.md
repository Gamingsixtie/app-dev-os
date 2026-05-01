# Positioning — concurrentoolVO

> **Per-app override.** Fully replaces the root template `positioning.md` for this app. Last validated: 2026-05-01.

---

## What this is

**Concurrentie-rekentool VO** — een interne tool waarmee Cito-consultants tijdens of na een schoolgesprek de kosten van toetsaanbieders Cito, DIA en JIJ vergelijken voor een specifieke Nederlandse middelbare school, en daar een onderbouwde business case van maken.

---

## Core promise

> *"Vul het schoolprofiel in, krijg een accurate prijsvergelijking en een exporteerbare business case. Klaar om te presenteren."*

Drie woorden die de tool dragen: **accuraat**, **snel**, **exporteerbaar**.

---

## Wat de tool wel doet

- Vergelijking van publicatieprijzen tussen Cito, DIA en JIJ op basis van schoolprofiel (niveaus, leerjaren, leerlingaantallen, modules)
- Twee scenario's:
  - **Scenario A — markt** — consultant zet alleen het schoolprofiel neer, tool toont marktoverzicht met de drie aanbieders
  - **Scenario B — migratie** — school heeft een huidige aanbieder; tool laat zien wat het kost om over te stappen + business-case voor migratie naar nieuw Cito-platform
- Hybride scenario detectie (deels A, deels B per module)
- Discount patterns automatisch herkennen + corrigeren
- Schijnvoordeel detectie (advantage that isn't really there)
- Sensitivity analyse (wat als leerlingaantal stijgt/daalt)
- Sales-signals surfacen (kortingsmoment, contract-vervalmoment)
- AI-intake — vrije tekst van schoolprofiel parsen naar wizard-velden
- AI-advice — gegeven het profiel, suggesties voor next-actions
- AI-analysis van geüploade schoolplannen
- Export naar PDF + Excel — bedrijfsklaar, presenteerbaar
- Per-school configuratie + per-module override van prijzen
- Multi-school overzicht + review queue voor voorgestelde prijswijzigingen

---

## Wat de tool expliciet NIET doet

- **Geen AI-prijsbepaling.** Prijzen komen uit deterministische engines + geverifieerde data. AI kijkt niet naar prijslogica.
- **Geen contract-management.** Dit is een rekentool, geen CRM. Contractverlengingen / opzeggingen worden elders bijgehouden.
- **Geen offerte-generator voor consument.** Output is voor intern Cito-gebruik + school-decision-maker — niet eindgebruiker / leerling / ouder.
- **Geen real-time prijs-feeds van DIA / JIJ.** DIA + JIJ tarieven worden handmatig bijgehouden in `src/data/` en periodiek gecontroleerd. Markt-prijswijzigingen vereisen een data-update.
- **Geen integraties met externe school-administratie systemen.** Schoolprofiel wordt handmatig of via document-upload (schoolplan PDF/Word/Excel) ingevoerd.
- **Geen anonimisering / publieke marktrapportage.** Data per school blijft vertrouwelijk — geen aggregaties die concurrenten zouden kunnen verraden.

---

## Differentiators

Voor zover die er zijn — dit is een interne tool, geen markt-product. Maar als referentie voor toekomstige features:

| Differentiator | Waarom het ertoe doet |
|---|---|
| **Drie hard-coded providers** (Cito/DIA/JIJ) | Nederlandse VO-toetsmarkt heeft precies deze drie spelers. Andere providers zijn niet relevant. Domain-realiteit. |
| **Pure-function engines** | Tests dekken volledige scenario-ruimte. Bug = altijd reproduceerbaar. Auditable voor de consultant ("waarom geeft de tool deze uitkomst?"). |
| **AI alleen voor intake** | AI versnelt invoer (vrije tekst → wizard). AI raakt nooit prijslogica. Alles wat met geld te maken heeft is deterministisch. |
| **Offline-tolerant** | Schoolwifi is onbetrouwbaar. Service worker + IndexedDB cache zorgen dat tool werkt zonder verbinding. |
| **PDF + Excel export** | Output is end-of-meeting deliverable. Niet een PNG-screenshot of een onleesbare json-dump. |
| **Per-school override layer** | Consultants hebben afwijkende afspraken per school. Override → recalculate → behoudt audit trail (`price_audit_log` tabel). |
| **Schijnvoordeel detection** | Specifiek domeinprobleem: aanbiedingen die op papier goedkoper lijken maar in werkelijkheid duurder uitpakken (bijv. door verborgen bundle-prijzen). Tool flagt dit expliciet. |

---

## Use moments — when does the tool fire?

1. **Voorbereiding bezoek** (consultant alleen, 15-30 min vóór gesprek)
   - Open school OF maak nieuwe aan (slug-based URL)
   - Wizard invullen of intake-document uploaden + AI-extraction reviewen
   - Comparison bekijken, evt. prijs-overrides voor afwijkende afspraken
   - Print-preview of Excel-export checken

2. **In gesprek** (consultant + schoolleider/decision-makers, 30-60 min, mogelijk delen scherm)
   - Snel de school open
   - Comparison-tab tonen
   - Op basis van vragen: scenario A → B switchen, modules wijzigen, leerlingaantal aanpassen, recalculate live
   - Migration scenario doorrekenen als overstap relevant is
   - Export voor follow-up

3. **Na gesprek** (consultant alleen, 5-15 min)
   - Notities verwerken in `ConversationsTab`
   - Update planned-touchpoints (volgend contactmoment)
   - Voorstel sturen via Export tab

4. **Periodiek (Pim)** — prijs-data validatie + review queue afhandelen voor voorgestelde wijzigingen

---

## Anti-positioning — what we deliberately don't aim for

- **Geen open SaaS-product.** Geen self-service signup, geen pricing tiers, geen marketing site. De tool dient één klant: Cito + diens consultant-team.
- **Geen vergelijkings-portaal voor schoolleiders.** Alleen consultants gebruiken de tool actief. Schoolleiders kijken mee tijdens het gesprek, niet zelfstandig.
- **Geen content-marketing.** De tool genereert geen blogposts of leads. Output is privé per gesprek.
- **Geen mobile-first.** Tablet acceptabel, telefoon niet. Consultant werkt op laptop.

---

## Where positioning lives in the app

- **Login page** — minimaal, professional, geen marketing copy
- **School-overview** — toont scholen die de consultant beheert, geen "alle scholen in NL" lijst
- **Per-school dashboard** — context-rijk, alle informatie over deze school in één blik
- **Wizard / Comparison / Migration views** — de kern; nooit met marketing-text vermengen
- **Admin** — operator-only, technisch acceptabel
- **Review queue** — interne workflow

---

## TODOs for Pim

- Bij eerste echte productie-feedback van consultants: capture which differentiators they actually mention. Als geen consultant "schijnvoordeel detection" noemt over 6 maanden, is dat misschien een feature die voor jou belangrijk lijkt maar voor hen niet zichtbaar is — overweeg UI-prominentie.
- Als de tool ooit naar een andere onderwijssector wordt uitgebreid (basisonderwijs, MBO, HBO): de "drie providers"-lock breekt. Dan ADR voor provider-abstractie.
