import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import WizardStep3 from '../components/WizardStep3.tsx';
import { useSchoolProfileStore } from '../store.ts';
import { MODULE_CATALOG } from '../../../models/modules.ts';
import { createRef } from 'react';
import type { WizardStepRef } from '../components/WizardStep1.tsx';

describe('WizardStep3 - Module selectie', () => {
  beforeEach(() => {
    useSchoolProfileStore.getState().reset();
  });

  it('renders all module cards with correct names', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep3 ref={ref} />);

    for (const mod of MODULE_CATALOG) {
      expect(screen.getByText(mod.name)).toBeInTheDocument();
    }
    expect(MODULE_CATALOG.length).toBeGreaterThanOrEqual(6);
  });

  it('renders category headings "Leerlingvolgsysteem" and "Overige instrumenten"', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep3 ref={ref} />);

    expect(screen.getByText('Leerlingvolgsysteem')).toBeInTheDocument();
    expect(screen.getByText('Overige instrumenten')).toBeInTheDocument();
  });

  it('toggling a module card updates its visual state', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep3 ref={ref} />);

    const rekenButton = screen.getByText('Reken-Wiskunde').closest('button')!;
    expect(rekenButton.className).toContain('border-neutral-200');

    await user.click(rekenButton);

    expect(rekenButton.className).toContain('border-cito-accent');
  });

  it('"Losse licentie" text appears only for Cognitieve capaciteitentoets', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep3 ref={ref} />);

    const losseLicentieElements = screen.getAllByText('Losse licentie');
    expect(losseLicentieElements).toHaveLength(1);

    // Verify it's within the cognitieve-capaciteiten card
    const cogCard = screen.getByText('Cognitieve capaciteitentoets').closest('button')!;
    expect(cogCard).toContainElement(losseLicentieElements[0]);
  });

  it('submitting with 0 modules selected does NOT show error (valid)', async () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep3 ref={ref} />);

    const result = await ref.current!.submit();
    expect(result).toBe(true);
  });

  it('selected modules are persisted to store on submit', async () => {
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

  it('shows helper note when no modules are selected', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep3 ref={ref} />);

    expect(screen.getByText('U kunt altijd later modules toevoegen of verwijderen')).toBeInTheDocument();
  });
});
