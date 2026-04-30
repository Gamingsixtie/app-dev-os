import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import WizardStep5 from '../WizardStep5';
import { useSchoolProfileStore } from '../../store';
import { createRef } from 'react';
import type { WizardStepRef } from '../WizardStep1';

describe('WizardStep5 - Doel', () => {
  beforeEach(() => {
    useSchoolProfileStore.getState().reset();
  });

  it('renders scenario selection cards (A and B)', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep5 ref={ref} />);

    expect(screen.getByText('Cito vs. concurrentie')).toBeInTheDocument();
    expect(screen.getByText('Huidig naar nieuw Cito-platform')).toBeInTheDocument();
  });

  it('clicking a scenario card selects it visually', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep5 ref={ref} />);

    const scenarioACard = screen.getByText('Cito vs. concurrentie').closest('button')!;
    await user.click(scenarioACard);

    expect(scenarioACard.className).toContain('border-cito-primary');
  });

  it('selection persists to store on submit', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep5 ref={ref} />);

    await user.click(screen.getByText('Cito vs. concurrentie').closest('button')!);

    const result = await ref.current!.submit();
    expect(result).toBe(true);

    const state = useSchoolProfileStore.getState();
    expect(state.scenario).toBe('A');
  });

  it('submitting without selection shows validation error', async () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep5 ref={ref} />);

    const result = await ref.current!.submit();
    expect(result).toBe(false);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('scenario B can be selected', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep5 ref={ref} />);

    await user.click(screen.getByText('Huidig naar nieuw Cito-platform').closest('button')!);

    const result = await ref.current!.submit();
    expect(result).toBe(true);

    const state = useSchoolProfileStore.getState();
    expect(state.scenario).toBe('B');
  });

  it('shows scenario C when all modules use cito-oud', () => {
    useSchoolProfileStore.setState({
      moduleSetups: [
        { moduleId: 'rekenwiskunde', currentProvider: 'cito-oud', pricePerStudent: null },
        { moduleId: 'nederlands', currentProvider: 'cito-oud', pricePerStudent: null },
      ],
    });

    const ref = createRef<WizardStepRef>();
    render(<WizardStep5 ref={ref} />);

    // When all modules are cito-oud, scenario C should appear
    expect(screen.getAllByRole('radio').length).toBeGreaterThanOrEqual(3);
  });
});
