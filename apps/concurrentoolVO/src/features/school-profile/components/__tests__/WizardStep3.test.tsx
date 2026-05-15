import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import WizardStep3 from '../WizardStep3';
import { useSchoolProfileStore } from '../../store';
import { MODULE_CATALOG } from '../../../../models/modules';
import { createRef } from 'react';
import type { WizardStepRef } from '../WizardStep1';

describe('WizardStep3 - Modules', () => {
  beforeEach(() => {
    useSchoolProfileStore.getState().reset();
  });

  it('renders module selection grid with all modules', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep3 ref={ref} />);

    for (const mod of MODULE_CATALOG) {
      expect(screen.getByText(mod.name)).toBeInTheDocument();
    }
  });

  it('selecting a module updates form state visually', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep3 ref={ref} />);

    const rekenButton = screen.getByText('Reken-Wiskunde').closest('button')!;
    expect(rekenButton.className).toContain('border-neutral-200');

    await user.click(rekenButton);
    expect(rekenButton.className).toContain('border-cito-accent');
  });

  it('selecting modules persists selectedModules to store', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep3 ref={ref} />);

    await user.click(screen.getByText('Reken-Wiskunde').closest('button')!);
    await user.click(screen.getByText('Engels').closest('button')!);

    await ref.current!.submit();

    const state = useSchoolProfileStore.getState();
    expect(state.selectedModules).toContain('rekenwiskunde');
    expect(state.selectedModules).toContain('engels');
    expect(state.selectedModules).toHaveLength(2);
  });

  it('0 modules selected is valid (schema allows empty)', async () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep3 ref={ref} />);

    const result = await ref.current!.submit();
    expect(result).toBe(true);
  });

  it('shows quick-pick buttons', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep3 ref={ref} />);

    expect(screen.getByText('LVS Basis')).toBeInTheDocument();
    expect(screen.getByText('LVS Compleet')).toBeInTheDocument();
    expect(screen.getByText('Alles')).toBeInTheDocument();
  });
});

/**
 * Phase 27 R7 — section restructure.
 *
 * WizardStep3 splitst de module-keuze in twee expliciete secties:
 *   1. Basisvaardigheden — Rekenen, Nederlands, Engels, Taalverzorging
 *   2. Extra Modules — al het andere incl. Burgerschap + Digitale geletterdheid
 *      (Phase 27 Plan 04) en MVT-subgroep (Frans/Duits/Spaans)
 *
 * Section-level grouping is een WizardStep3-only concept en is GEEN rename
 * van de data-model categorieën (zie WizardStep3.tsx comment voor rationale).
 */
describe('WizardStep3 - Basisvaardigheden vs Extra Modules (R7)', () => {
  beforeEach(() => {
    useSchoolProfileStore.getState().reset();
  });

  const renderStep = () => {
    const ref = createRef<WizardStepRef>();
    return { ...render(<WizardStep3 ref={ref} />), ref };
  };

  /** Resolve the closest <section> ancestor for a given heading text. */
  const sectionFor = (headingText: string): HTMLElement => {
    const heading = screen.getByRole('heading', {
      level: 2,
      name: headingText,
    });
    const section = heading.closest('section');
    if (!section)
      throw new Error(`Heading "${headingText}" is niet in een <section>`);
    return section as HTMLElement;
  };

  it('rendert twee secties met expliciete h2 headings', () => {
    renderStep();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Basisvaardigheden' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Extra Modules' }),
    ).toBeInTheDocument();
  });

  it('toont 4 modules onder Basisvaardigheden (rekenen, NL, EN, taalverzorging)', () => {
    renderStep();
    const basicsSection = sectionFor('Basisvaardigheden');

    expect(
      within(basicsSection).getByText('Reken-Wiskunde'),
    ).toBeInTheDocument();
    expect(within(basicsSection).getByText('Nederlands')).toBeInTheDocument();
    expect(within(basicsSection).getByText('Engels')).toBeInTheDocument();
    expect(
      within(basicsSection).getByText('Taalverzorging Nederlands'),
    ).toBeInTheDocument();
  });

  it('houdt Burgerschap + Digitale geletterdheid binnen Extra Modules (Plan 04 modules)', () => {
    renderStep();
    const extraSection = sectionFor('Extra Modules');

    expect(within(extraSection).getByText('Burgerschap')).toBeInTheDocument();
    expect(
      within(extraSection).getByText('Digitale geletterdheid'),
    ).toBeInTheDocument();
  });

  it('plaatst Sociaal-emotioneel + Cognitieve capaciteiten + Leer-werkhouding onder Extra Modules', () => {
    renderStep();
    const extraSection = sectionFor('Extra Modules');

    expect(
      within(extraSection).getByText('Sociaal-emotioneel functioneren'),
    ).toBeInTheDocument();
    expect(
      within(extraSection).getByText('Cognitieve capaciteitentoets'),
    ).toBeInTheDocument();
    expect(
      within(extraSection).getByText('Leer-werkhouding'),
    ).toBeInTheDocument();
  });

  it('toont MVT-subgroep (Frans/Duits/Spaans) BINNEN Extra Modules', () => {
    renderStep();
    const extraSection = sectionFor('Extra Modules');

    // MVT sub-heading is een h3 binnen de Extra Modules section.
    expect(
      within(extraSection).getByRole('heading', {
        level: 3,
        name: 'Moderne Vreemde Talen',
      }),
    ).toBeInTheDocument();
    expect(within(extraSection).getByText('Frans')).toBeInTheDocument();
    expect(within(extraSection).getByText('Duits')).toBeInTheDocument();
    expect(within(extraSection).getByText('Spaans')).toBeInTheDocument();
  });

  it('houdt Basisvaardigheden- en Extra-module-toggling onafhankelijk per sectie', async () => {
    const user = userEvent.setup();
    const { ref } = renderStep();

    // Toggle 1 module in Basisvaardigheden + 1 in Extra Modules.
    const basicsSection = sectionFor('Basisvaardigheden');
    const extraSection = sectionFor('Extra Modules');

    await user.click(
      within(basicsSection).getByText('Reken-Wiskunde').closest('button')!,
    );
    await user.click(
      within(extraSection).getByText('Burgerschap').closest('button')!,
    );

    await ref.current!.submit();

    const state = useSchoolProfileStore.getState();
    expect(state.selectedModules).toEqual(
      expect.arrayContaining(['rekenwiskunde', 'burgerschap']),
    );
    expect(state.selectedModules).toHaveLength(2);
  });

  it('LVS Compleet preset selecteert de Basisvaardigheden-set (4 modules)', async () => {
    const user = userEvent.setup();
    const { ref } = renderStep();

    await user.click(screen.getByText('LVS Compleet'));
    await ref.current!.submit();

    const state = useSchoolProfileStore.getState();
    expect(state.selectedModules.sort()).toEqual(
      ['engels', 'nederlands', 'rekenwiskunde', 'taalverzorging'].sort(),
    );
  });

  it('LVS Basis preset selecteert alleen de drie kern-LVS-vakken (geen taalverzorging)', async () => {
    const user = userEvent.setup();
    const { ref } = renderStep();

    await user.click(screen.getByText('LVS Basis'));
    await ref.current!.submit();

    const state = useSchoolProfileStore.getState();
    expect(state.selectedModules.sort()).toEqual(
      ['engels', 'nederlands', 'rekenwiskunde'].sort(),
    );
  });

  it('beide secties hebben ARIA labelling via aria-labelledby', () => {
    const { container } = renderStep();

    const basicsSection = container.querySelector(
      'section[aria-labelledby="basisvaardigheden-heading"]',
    );
    const extraSection = container.querySelector(
      'section[aria-labelledby="extra-modules-heading"]',
    );

    expect(basicsSection).not.toBeNull();
    expect(extraSection).not.toBeNull();
  });
});
