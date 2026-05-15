---
phase: 28-win-loss-tracking-marktpositie-aparte-uitkomst-deal-tab-per-
plan: 05b
type: execute
wave: 5
depends_on: [05, 06]
files_modified:
  - apps/concurrentoolVO/src/features/deal-outcomes/components/DealDetailsForm.tsx
  - apps/concurrentoolVO/src/features/deal-outcomes/components/StickyDirtyBar.tsx
  - apps/concurrentoolVO/src/features/deal-outcomes/components/DealOutcomesTab.tsx
autonomous: true
requirements: [R1]
must_haves:
  truths:
    - "DealDetailsForm renders inline (NOT in dialog) on the Uitkomst-tab below DiscountEditor"
    - "Form fields: reden (textarea), reasonCategory (select), contactId (select), competitorProvider (select + conditional competitorName)"
    - "Form is bound to react-hook-form + zodResolver (per CLAUDE.md hard rule)"
    - "StickyDirtyBar is visible ONLY when formState.isDirty === true"
    - "Sticky bar 'Wijzigingen opslaan' submits the form via updateDealOutcome (pessimistic)"
    - "Sticky bar 'Annuleren' resets form to last-saved state with confirm-modal if isDirty"
    - "Escape key on Uitkomst-tab with dirty form opens the same confirm-modal"
    - "R1 acceptance: 'Bestaande Uitkomst-record is achteraf bewerkbaar' satisfied via inline edit surface"
  artifacts:
    - path: "apps/concurrentoolVO/src/features/deal-outcomes/components/DealDetailsForm.tsx"
      provides: "Inline edit surface for reden / reden-categorie / contactpersoon / concurrent fields"
      min_lines: 80
    - path: "apps/concurrentoolVO/src/features/deal-outcomes/components/StickyDirtyBar.tsx"
      provides: "Bottom-fixed bar with Annuleren + Wijzigingen opslaan buttons"
      contains: "fixed bottom-0"
  key_links:
    - from: "DealDetailsForm formState.isDirty"
      to: "StickyDirtyBar visibility"
      via: "controlled prop or formContext"
      pattern: "isDirty"
    - from: "StickyDirtyBar 'Wijzigingen opslaan' click"
      to: "updateDealOutcome via useUpdateDealOutcome mutation"
      via: "form.handleSubmit"
      pattern: "useUpdateDealOutcome|updateDealOutcome"
---

<objective>
F11 fix (revision iter 2): inline edit surface for Uitkomst-tab. UI-SPEC §3 row 5 specifies a "Deal-details strip" with reden + reason-categorie + contactpersoon + concurrent fields as a PERSISTENT inline form (NOT a dialog), plus a sticky "Wijzigingen opslaan" bottom-bar tied to `formState.isDirty`. Without this, R1 acceptance "Bestaande Uitkomst-record is achteraf bewerkbaar (status, reden, contactpersoon, prijzen kunnen muteren)" is only partially met — currently the fields are only editable via the create-dialogs.

Levert: (1) `DealDetailsForm.tsx` — RHF + Zod form rendering the 4 fields inline on Uitkomst-tab, wired to `useUpdateDealOutcome`. (2) `StickyDirtyBar.tsx` — bottom-fixed bar that appears when `formState.isDirty` and slides up with smooth transition. (3) DealOutcomesTab.tsx integration — inject `<DealDetailsForm>` + `<StickyDirtyBar>` between DiscountEditor and AuditLogAccordion slots (replace Plan 05 PLACEHOLDER comment).

Purpose: Closes R1 acceptance gap (achteraf bewerkbaar). Persistent-form pattern is more efficient than re-opening a dialog for small text edits. Sticky bar prevents user from navigating away with unsaved changes.

Output: 2 new files + 1 mutation (DealOutcomesTab integration).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@apps/concurrentoolVO/.planning/phases/28-win-loss-tracking-marktpositie-aparte-uitkomst-deal-tab-per-/28-SPEC.md
@apps/concurrentoolVO/.planning/phases/28-win-loss-tracking-marktpositie-aparte-uitkomst-deal-tab-per-/28-UI-SPEC.md
@apps/concurrentoolVO/.planning/phases/28-win-loss-tracking-marktpositie-aparte-uitkomst-deal-tab-per-/28-05-SUMMARY.md
@apps/concurrentoolVO/CLAUDE.md

<interfaces>
<!-- Plan 01 (Wave 1) deliverables already available -->
From src/features/deal-outcomes/types.ts:
```typescript
export interface DealOutcome {
  id: string;
  schoolId: string;
  teamId: string;
  status: DealStatus;
  competitorProvider: 'dia' | 'jij' | 'overig';
  competitorName?: string;
  reason?: string;
  reasonCategory?: ReasonCategory;
  contactId?: string;
  // ...
}
```

From src/features/deal-outcomes/schemas/deal-outcome.schema.ts (Plan 01):
```typescript
// Reuse lostDealFormSchema for the inline form when status === 'lost'
// For status open/in_negotiation/won, build a permissive "deal-details edit" schema:
export const dealDetailsEditSchema = z.object({
  reason: z.string().max(500).optional(),
  reasonCategory: reasonCategoryEnum.optional(),
  contactId: z.string().uuid().optional(),
  competitorProvider: z.enum(['dia', 'jij', 'overig']),
  competitorName: z.string().max(120).optional(),
}).refine(
  (d) => d.competitorProvider !== 'overig' || (d.competitorName && d.competitorName.length > 0),
  { message: 'Vul de naam van de concurrent in', path: ['competitorName'] },
);
```
(If Plan 01 did not ship this exact schema, create it inline as `dealDetailsEditSchema` in
Task 1 of this plan — it's a small Zod object so co-locating is fine.)

<!-- Plan 05 deliverables -->
From src/db/deal-outcomes-operations.ts:
```typescript
export async function updateDealOutcome(id: string, patch: Partial<DealOutcome>): Promise<DealOutcome>;
```

From src/features/deal-outcomes/hooks/useDealOutcomeMutation.ts:
```typescript
export function useUpdateDealOutcome(): UseMutationResult<DealOutcome, Error, { id: string; patch: Partial<DealOutcome> }>;
```

From src/features/deal-outcomes/components/DealOutcomesTab.tsx (Plan 05 ships a PLACEHOLDER):
```tsx
{/* PLACEHOLDER (Plan 05): Plan 05b will inject:
    <DealDetailsForm outcome={outcome} school={school} />
    <StickyDirtyBar /> // controlled by DealDetailsForm formContext
*/}
```

<!-- UI-SPEC anchors -->
From 28-UI-SPEC.md §Interaction Patterns line 386:
- Dirty-tracking: `formState.isDirty` enables sticky "Wijzigingen opslaan" bar at bottom of Uitkomst-tab
- Sticky bar: `fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-8 py-4 z-30 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]`
- Animate in with `transition-transform translate-y-0` from `translate-y-full`
- Bar height: 60px (h-15)
- Z-index: 30 (below dialogs at z-50, above content)
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: DealDetailsForm + StickyDirtyBar (RHF + Zod, formState.isDirty)</name>
  <files>
    apps/concurrentoolVO/src/features/deal-outcomes/components/DealDetailsForm.tsx,
    apps/concurrentoolVO/src/features/deal-outcomes/components/StickyDirtyBar.tsx
  </files>
  <behavior>
    - DealDetailsForm: renders 4 fields (reden textarea, reasonCategory select, contactId select, competitorProvider select with conditional competitorName input)
    - DealDetailsForm: defaults populated from `outcome` prop (existing DB values)
    - DealDetailsForm: on mount, formState.isDirty === false
    - DealDetailsForm: after user edit, formState.isDirty === true and StickyDirtyBar appears
    - StickyDirtyBar: "Wijzigingen opslaan" → submits form (await updateDealOutcome) → success → form resets to new saved state → bar hides
    - StickyDirtyBar: "Annuleren" → if isDirty: shows confirm-modal "Onopgeslagen wijzigingen verwerpen?" → on confirm: form.reset() to last-saved values → bar hides
    - Escape key on Uitkomst-tab: same Annuleren confirm-modal flow when isDirty
    - Validation errors: surface inline below each field with role="alert", red text per UI-SPEC
    - 'overig' provider: conditional competitorName text-input shows below select with required-validation
  </behavior>
  <action>
    **`src/features/deal-outcomes/components/DealDetailsForm.tsx`** — Inline edit surface:

    ```tsx
    import { useForm, FormProvider, useFormContext } from 'react-hook-form';
    import { zodResolver } from '@hookform/resolvers/zod';
    import { z } from 'zod';
    import { useEffect } from 'react';
    import type { DealOutcome, ReasonCategory } from '../types';
    import type { SchoolRecord } from '@/db/types';
    import { REASON_CATEGORY_LABELS } from '../labels';
    import { useUpdateDealOutcome } from '../hooks/useDealOutcomeMutation';
    import { StickyDirtyBar } from './StickyDirtyBar';

    // Co-located schema (move to schemas/ folder if Plan 01 hasn't shipped it there):
    const dealDetailsEditSchema = z.object({
      reason: z.string().max(500, 'Reden mag maximaal 500 tekens bevatten').optional(),
      reasonCategory: z.enum(['prijs', 'functionaliteit', 'voorkeur', 'anders']).optional(),
      contactId: z.string().uuid().optional().or(z.literal('')),
      competitorProvider: z.enum(['dia', 'jij', 'overig']),
      competitorName: z.string().max(120).optional().or(z.literal('')),
    }).refine(
      (d) => d.competitorProvider !== 'overig' || (d.competitorName && d.competitorName.length > 0),
      { message: 'Vul de naam van de concurrent in', path: ['competitorName'] },
    );

    type DealDetailsEditValues = z.input<typeof dealDetailsEditSchema>;

    interface DealDetailsFormProps {
      outcome: DealOutcome;
      school: SchoolRecord;
    }

    export function DealDetailsForm({ outcome, school }: DealDetailsFormProps) {
      const { mutate: update, isPending } = useUpdateDealOutcome();

      const methods = useForm<DealDetailsEditValues>({
        resolver: zodResolver(dealDetailsEditSchema),
        mode: 'onBlur',
        defaultValues: {
          reason: outcome.reason ?? '',
          reasonCategory: outcome.reasonCategory,
          contactId: outcome.contactId ?? '',
          competitorProvider: outcome.competitorProvider,
          competitorName: outcome.competitorName ?? '',
        },
      });

      const { register, handleSubmit, watch, reset, formState: { errors, isDirty } } = methods;
      const provider = watch('competitorProvider');

      // Reset form whenever the underlying outcome row changes (e.g. after server save)
      useEffect(() => {
        reset({
          reason: outcome.reason ?? '',
          reasonCategory: outcome.reasonCategory,
          contactId: outcome.contactId ?? '',
          competitorProvider: outcome.competitorProvider,
          competitorName: outcome.competitorName ?? '',
        });
      }, [outcome.id, outcome.updatedAt, outcome.reason, outcome.reasonCategory, outcome.contactId, outcome.competitorProvider, outcome.competitorName, reset]);

      const onSubmit = handleSubmit((data) => {
        update(
          {
            id: outcome.id,
            patch: {
              reason: data.reason || undefined,
              reasonCategory: data.reasonCategory,
              contactId: data.contactId || undefined,
              competitorProvider: data.competitorProvider,
              competitorName: data.competitorProvider === 'overig' ? data.competitorName : undefined,
            },
          },
          {
            onSuccess: (updated) => {
              // Reset form's "pristine" baseline to the new saved state — clears isDirty
              reset({
                reason: updated.reason ?? '',
                reasonCategory: updated.reasonCategory,
                contactId: updated.contactId ?? '',
                competitorProvider: updated.competitorProvider,
                competitorName: updated.competitorName ?? '',
              });
            },
          },
        );
      });

      return (
        <FormProvider {...methods}>
          <section
            aria-labelledby="deal-details-title"
            className="bg-white rounded-lg border border-neutral-200 p-6"
          >
            <h2 id="deal-details-title" className="text-[20px] font-semibold text-cito-primary mb-4">
              Deal-details
            </h2>
            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 max-w-[640px]">
              {/* Reden textarea */}
              <label className="block">
                <span className="text-[14px] font-semibold text-neutral-700">Reden</span>
                <textarea
                  {...register('reason')}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded-lg focus:border-cito-primary focus:ring-2 focus:ring-cito-primary/20"
                  placeholder="Korte toelichting op de uitkomst (optioneel)"
                  aria-invalid={!!errors.reason}
                />
                {errors.reason && <span role="alert" className="text-red-600 text-[12px]">{errors.reason.message}</span>}
              </label>

              {/* Reden-categorie */}
              <label className="block">
                <span className="text-[14px] font-semibold text-neutral-700">Reden-categorie</span>
                <select
                  {...register('reasonCategory')}
                  className="mt-1 w-full h-11 px-3 border border-neutral-300 rounded-lg focus:border-cito-primary"
                >
                  <option value="">— Niet opgegeven —</option>
                  {Object.entries(REASON_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </label>

              {/* Contactpersoon */}
              <label className="block">
                <span className="text-[14px] font-semibold text-neutral-700">Contactpersoon</span>
                <select
                  {...register('contactId')}
                  className="mt-1 w-full h-11 px-3 border border-neutral-300 rounded-lg focus:border-cito-primary"
                >
                  <option value="">— Geen —</option>
                  {school.contacts?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              {/* Concurrent */}
              <label className="block">
                <span className="text-[14px] font-semibold text-neutral-700">Concurrent</span>
                <select
                  {...register('competitorProvider')}
                  className="mt-1 w-full h-11 px-3 border border-neutral-300 rounded-lg focus:border-cito-primary"
                >
                  <option value="dia">DIA</option>
                  <option value="jij">JIJ</option>
                  <option value="overig">Overig</option>
                </select>
              </label>

              {provider === 'overig' && (
                <label className="block">
                  <span className="text-[14px] font-semibold text-neutral-700">Naam concurrent *</span>
                  <input
                    type="text"
                    {...register('competitorName')}
                    className="mt-1 w-full h-11 px-3 border border-neutral-300 rounded-lg focus:border-cito-primary"
                    aria-invalid={!!errors.competitorName}
                  />
                  {errors.competitorName && (
                    <span role="alert" className="text-red-600 text-[12px]">{errors.competitorName.message}</span>
                  )}
                </label>
              )}
            </form>
          </section>

          {/* Sticky bar — rendered as sibling so it's always at viewport bottom, not nested in section */}
          <StickyDirtyBar isPending={isPending} onSubmit={onSubmit} onCancel={() => reset()} isDirty={isDirty} />
        </FormProvider>
      );
    }
    ```

    **`src/features/deal-outcomes/components/StickyDirtyBar.tsx`** — Bottom-fixed bar with confirm-modal:

    ```tsx
    import { useEffect, useState } from 'react';

    interface StickyDirtyBarProps {
      isDirty: boolean;
      isPending: boolean;
      onSubmit: () => void;       // form.handleSubmit wrapped
      onCancel: () => void;       // form.reset() — caller passes
    }

    export function StickyDirtyBar({ isDirty, isPending, onSubmit, onCancel }: StickyDirtyBarProps) {
      const [confirmOpen, setConfirmOpen] = useState(false);

      // Escape key on the document → if dirty, show confirm; if not, no-op
      useEffect(() => {
        if (!isDirty) return;
        const onKey = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            setConfirmOpen(true);
          }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
      }, [isDirty]);

      if (!isDirty && !confirmOpen) return null;

      return (
        <>
          {isDirty && (
            <div
              role="region"
              aria-label="Onopgeslagen wijzigingen"
              className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-neutral-200 px-8 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.05)] transition-transform translate-y-0"
              style={{ minHeight: '60px' }}
            >
              <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3">
                <span className="text-[14px] text-neutral-700">U heeft niet-opgeslagen wijzigingen.</span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    disabled={isPending}
                    className="h-11 px-4 text-cito-primary text-[14px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cito-primary"
                  >
                    Annuleren
                  </button>
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={isPending}
                    className="h-11 px-6 bg-cito-primary text-white text-[14px] font-semibold rounded-lg disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cito-primary"
                  >
                    {isPending ? 'Bezig met opslaan…' : 'Wijzigingen opslaan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {confirmOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="dirty-confirm-title"
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
              onClick={(e) => { if (e.target === e.currentTarget) setConfirmOpen(false); }}
            >
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <h2 id="dirty-confirm-title" className="text-[20px] font-semibold text-cito-primary mb-2">
                  Onopgeslagen wijzigingen verwerpen?
                </h2>
                <p className="text-[14px] text-neutral-700 mb-6">
                  Uw wijzigingen aan de deal-details gaan verloren.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className="h-11 px-4 text-cito-primary text-[14px] font-semibold"
                  >
                    Terug naar bewerken
                  </button>
                  <button
                    type="button"
                    onClick={() => { onCancel(); setConfirmOpen(false); }}
                    className="h-11 px-6 bg-red-600 text-white text-[14px] font-semibold rounded-lg"
                  >
                    Verwerpen
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      );
    }
    ```

    **Why FormProvider:** Keeps the StickyDirtyBar's button-disabled logic in sync with the
    parent form's `isPending` without prop-drilling deep into the layout. The bar lives as
    a sibling of the section (NOT nested) so it can use `fixed bottom-0` without escaping
    the form's onSubmit handler — the explicit `onSubmit` prop wires that up.
  </action>
  <verify>
    <automated>cd apps/concurrentoolVO && npx vitest run src/features/deal-outcomes/components/__tests__/DealDetailsForm.test.tsx src/features/deal-outcomes/components/__tests__/StickyDirtyBar.test.tsx --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|passed)" | head -10</automated>
  </verify>
  <done>
    - `DealDetailsForm.tsx` exists with all 4 fields (reden / reden-categorie / contactpersoon / competitorProvider [+conditional competitorName])
    - Uses react-hook-form + zodResolver (verified via grep)
    - `StickyDirtyBar.tsx` is fixed-bottom, z-30, shows ONLY when isDirty
    - Annuleren triggers confirm-modal when isDirty (verified via test)
    - Escape key triggers same confirm-modal
    - Submit calls `useUpdateDealOutcome`, resets form to new baseline on success (isDirty returns to false)
    - 'overig' shows conditional competitorName input with required-validation
    - Atomic commit: `feat(28-ui): DealDetailsForm inline edit + StickyDirtyBar (F11)`
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire DealDetailsForm + StickyDirtyBar into DealOutcomesTab</name>
  <files>apps/concurrentoolVO/src/features/deal-outcomes/components/DealOutcomesTab.tsx</files>
  <action>
    Vervang de Plan 05 PLACEHOLDER-comment voor F11 in `DealOutcomesTab.tsx` record-view
    (geplaatst tussen DiscountEditor en AuditLogAccordion):

    ```tsx
    // BEFORE (Plan 05):
    {/* PLACEHOLDER (Plan 05): Plan 05b will inject:
        <DealDetailsForm outcome={outcome} school={school} />
        <StickyDirtyBar />
    */}

    // AFTER (Plan 05b):
    <DealDetailsForm outcome={outcome} school={school} />
    {/* StickyDirtyBar is rendered INSIDE DealDetailsForm's FormProvider — no separate slot here */}
    ```

    Voeg de import toe bovenaan:
    ```tsx
    import { DealDetailsForm } from './DealDetailsForm';
    ```

    **Layout-check:** Het record-view container heeft `pb-24` (~96px bottom-padding, plan 05).
    De sticky bar is 60px hoog. Verifieer dat content niet onder de bar verdwijnt:
    - Plan 05 set: `<div className="px-8 max-sm:px-4 pt-6 pb-24 max-w-[1200px] mx-auto space-y-6">`
    - 96px - 60px bar = 36px clearance — voldoende.

    **Geen verdere wijzigingen** aan andere componenten. Geen Plan 06 / Plan 08 interferentie
    (zij ondertekenen hun eigen comment-placeholders).
  </action>
  <verify>
    <automated>cd apps/concurrentoolVO && grep -c "DealDetailsForm" src/features/deal-outcomes/components/DealOutcomesTab.tsx</automated>
  </verify>
  <done>
    - DealOutcomesTab imports DealDetailsForm
    - Plan 05 PLACEHOLDER comment for F11 is removed and replaced with `<DealDetailsForm outcome={outcome} school={school} />`
    - Plan 01 scaffold test (if any for DealDetailsForm integration) GREEN
    - `npm run build` succeeds
    - Atomic commit: `feat(28-ui): wire DealDetailsForm into DealOutcomesTab record-view`
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| user-input → form (DealDetailsForm) | Form fields validated by Zod before submit |
| form → operations | updateDealOutcome accepts validated patch |
| keyboard → confirm-modal | Escape key triggers user-confirm before reset (prevents accidental data loss) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-28-39 | Tampering | Form bypass via DevTools | mitigate | Zod schema client-side + RLS server-side (Plan 02) |
| T-28-40 | Information Disclosure | XSS via reden textarea (long-lived inline) | mitigate | React DOM escapes; no dangerouslySetInnerHTML |
| T-28-41 | Repudiation | User claims accidental save | mitigate | deal_audit_log records before/after (Plan 05 audit-write on updateDealOutcome) |
| T-28-42 | Tampering | Concurrent edit collision (two tabs open) | accept | Pessimistic mutation per D-14; last-write-wins acceptable for solo accountmanager workflow |
</threat_model>

<verification>
- Task 1: `npx vitest run src/features/deal-outcomes/components/__tests__/DealDetailsForm.test.tsx` GREEN; `npx vitest run src/features/deal-outcomes/components/__tests__/StickyDirtyBar.test.tsx` GREEN
- Task 2: `grep -c "DealDetailsForm" src/features/deal-outcomes/components/DealOutcomesTab.tsx` ≥ 2 (import + usage)
- Grep gates:
  - `grep -c "FormProvider\|useFormContext\|react-hook-form" src/features/deal-outcomes/components/DealDetailsForm.tsx` ≥ 2
  - `grep -c "fixed bottom-0\|z-30" src/features/deal-outcomes/components/StickyDirtyBar.tsx` ≥ 1
  - `grep -c "isDirty" src/features/deal-outcomes/components/StickyDirtyBar.tsx` ≥ 2 (prop + render guard)
  - `grep -c "Wijzigingen opslaan\|Annuleren" src/features/deal-outcomes/components/StickyDirtyBar.tsx` ≥ 2 (UI-SPEC copy)
- `npx tsc --noEmit` passes
- `npm run build` succeeds
</verification>

<success_criteria>
1. F11 fix complete: inline edit surface persists across the Uitkomst-tab (not hidden in dialog)
2. R1 acceptance "Bestaande Uitkomst-record is achteraf bewerkbaar" demonstrated via DealDetailsForm field edits → save → reload → values persist
3. StickyDirtyBar appears/disappears with formState.isDirty
4. Annuleren + Escape both trigger the dirty-confirm modal
5. 2 atomic commits (DealDetailsForm + StickyDirtyBar, then DealOutcomesTab wiring)
</success_criteria>

<output>
After completion, create `.planning/phases/28-win-loss-tracking-marktpositie-aparte-uitkomst-deal-tab-per-/28-05b-SUMMARY.md`
</output>
