import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import WizardStep4 from '../components/WizardStep4.tsx';
import { useSchoolProfileStore } from '../store.ts';
import { createRef } from 'react';
import type { WizardStepRef } from '../components/WizardStep1.tsx';

describe('WizardStep4 - Huidige situatie', () => {
  beforeEach(() => {
    useSchoolProfileStore.getState().reset();
  });

  it('renders "Geen modules geselecteerd" when no modules selected', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep4 ref={ref} />);

    expect(screen.getByText('Geen modules geselecteerd. Ga terug naar stap 3.')).toBeInTheDocument();
  });

  it('renders a row for each selected module', () => {
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

  it('shows dropdown for each module with provider options', () => {
    useSchoolProfileStore.setState({
      selectedModules: ['rekenwiskunde'],
      moduleSetups: [
        { moduleId: 'rekenwiskunde', currentProvider: 'geen', pricePerStudent: null },
      ],
    });

    const ref = createRef<WizardStepRef>();
    render(<WizardStep4 ref={ref} />);

    // Should have a select element (provider dropdown)
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('submit succeeds and saves setups to store', async () => {
    useSchoolProfileStore.setState({
      selectedModules: ['rekenwiskunde'],
      moduleSetups: [
        { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: 5.2 },
      ],
    });

    const ref = createRef<WizardStepRef>();
    render(<WizardStep4 ref={ref} />);

    const result = await ref.current!.submit();
    expect(result).toBe(true);

    const state = useSchoolProfileStore.getState();
    expect(state.moduleSetups[0].moduleId).toBe('rekenwiskunde');
  });
});
