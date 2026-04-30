import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import WizardStep5 from '../components/WizardStep5.tsx';
import { useSchoolProfileStore } from '../store.ts';
import { createRef } from 'react';
import type { WizardStepRef } from '../components/WizardStep1.tsx';

describe('WizardStep5 - Scenario selectie', () => {
  beforeEach(() => {
    useSchoolProfileStore.getState().reset();
  });

  it('renders both scenario cards with correct titles', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep5 ref={ref} />);

    expect(screen.getByText('Cito vs. concurrentie')).toBeInTheDocument();
    expect(screen.getByText('Huidig naar nieuw Cito-platform')).toBeInTheDocument();
  });

  it('renders scenario descriptions', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep5 ref={ref} />);

    expect(screen.getByText(/Vergelijk de kosten van Cito met DIA en JIJ/)).toBeInTheDocument();
    expect(screen.getByText(/Bereken de business case voor de overstap/)).toBeInTheDocument();
  });

  it('clicking a scenario card selects it (visual indicator changes)', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep5 ref={ref} />);

    const scenarioACard = screen.getByText('Cito vs. concurrentie').closest('button')!;
    expect(scenarioACard.className).toContain('border-neutral-200');

    await user.click(scenarioACard);

    expect(scenarioACard.className).toContain('border-cito-primary');
  });

  it('submitting without selection shows error', async () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep5 ref={ref} />);

    const result = await ref.current!.submit();
    expect(result).toBe(false);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('selected scenario is persisted to store on submit', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep5 ref={ref} />);

    await user.click(screen.getByText('Cito vs. concurrentie').closest('button')!);

    const result = await ref.current!.submit();
    expect(result).toBe(true);

    const state = useSchoolProfileStore.getState();
    expect(state.scenario).toBe('A');
  });
});
