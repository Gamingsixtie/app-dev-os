import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import WizardStep4 from '../WizardStep4';
import { useSchoolProfileStore } from '../../store';
import { createRef } from 'react';
import type { WizardStepRef } from '../WizardStep1';

describe('WizardStep4 - Situatie', () => {
  beforeEach(() => {
    useSchoolProfileStore.getState().reset();
  });

  it('renders current provider selection per module', () => {
    useSchoolProfileStore.setState({
      selectedModules: ['rekenwiskunde', 'nederlands'],
      moduleSetups: [
        { moduleId: 'rekenwiskunde', currentProvider: 'geen', pricePerStudent: null },
        { moduleId: 'nederlands', currentProvider: 'geen', pricePerStudent: null },
      ],
    });

    const ref = createRef<WizardStepRef>();
    render(<WizardStep4 ref={ref} />);

    expect(screen.getByText('Reken-Wiskunde')).toBeInTheDocument();
    expect(screen.getByText('Nederlands')).toBeInTheDocument();
  });

  it('provider dropdown contains expected options', () => {
    useSchoolProfileStore.setState({
      selectedModules: ['rekenwiskunde'],
      moduleSetups: [
        { moduleId: 'rekenwiskunde', currentProvider: 'geen', pricePerStudent: null },
      ],
    });

    const ref = createRef<WizardStepRef>();
    render(<WizardStep4 ref={ref} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    // Check key options exist
    const options = Array.from(select.querySelectorAll('option'));
    const optionValues = options.map((o) => o.value);
    expect(optionValues).toContain('cito-oud');
    expect(optionValues).toContain('dia');
    expect(optionValues).toContain('jij');
    expect(optionValues).toContain('geen');
  });

  it('changing provider updates moduleSetups via form', async () => {
    const user = userEvent.setup();
    useSchoolProfileStore.setState({
      selectedModules: ['rekenwiskunde'],
      moduleSetups: [
        { moduleId: 'rekenwiskunde', currentProvider: 'geen', pricePerStudent: null },
      ],
    });

    const ref = createRef<WizardStepRef>();
    render(<WizardStep4 ref={ref} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'dia');

    // Submit to persist
    const result = await ref.current!.submit();
    expect(result).toBe(true);

    const state = useSchoolProfileStore.getState();
    expect(state.moduleSetups[0].currentProvider).toBe('dia');
  });

  it('renders empty state when no modules selected', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep4 ref={ref} />);

    expect(screen.getByText('Geen modules geselecteerd. Ga terug naar stap 3.')).toBeInTheDocument();
  });
});
