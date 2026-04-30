import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import WizardStep2 from '../components/WizardStep2.tsx';
import { useSchoolProfileStore } from '../store.ts';
import { SCHOOL_SIZE_PRESETS } from '../../../data/school-profiles.ts';
import { createRef } from 'react';
import type { WizardStepRef } from '../components/WizardStep1.tsx';

describe('WizardStep2 - Leerlingaantallen matrix', () => {
  beforeEach(() => {
    useSchoolProfileStore.getState().reset();
    // Set levels to havo and vwo for matrix testing
    useSchoolProfileStore.setState({ levels: ['havo', 'vwo'] });
  });

  it('renders matrix rows only for levels selected in store', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep2 ref={ref} />);

    expect(screen.getByText('HAVO')).toBeInTheDocument();
    expect(screen.getByText('VWO')).toBeInTheDocument();
    expect(screen.queryByText('VMBO Basis')).not.toBeInTheDocument();
    expect(screen.queryByText('VMBO Kader')).not.toBeInTheDocument();
  });

  it('renders correct number of columns per level (5 for havo, 6 for vwo)', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep2 ref={ref} />);

    // HAVO has leerjaar 1-5 (5 inputs), VWO has leerjaar 1-6 (6 inputs)
    const allInputs = screen.getAllByRole('spinbutton');
    expect(allInputs).toHaveLength(11); // 5 + 6
  });

  it('renders preset buttons with correct labels', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep2 ref={ref} />);

    expect(screen.getByText('Vul standaard in:')).toBeInTheDocument();
    expect(screen.getByText('Klein VO')).toBeInTheDocument();
    expect(screen.getByText('Middelgroot VO')).toBeInTheDocument();
    expect(screen.getByText('Groot VO')).toBeInTheDocument();
  });

  it('preset button "Klein VO" fills the matrix with SCHOOL_SIZE_PRESETS values', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep2 ref={ref} />);

    await user.click(screen.getByText('Klein VO'));

    const kleinPreset = SCHOOL_SIZE_PRESETS.find((p) => p.id === 'klein')!;
    const havoYear1 = kleinPreset.studentCounts['havo']?.[1];
    if (havoYear1 !== undefined) {
      // Check that the first HAVO input has the preset value
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).toHaveValue(havoYear1);
    }
  });

  it('entering a valid number in a cell does not show error', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep2 ref={ref} />);

    const firstInput = screen.getAllByRole('spinbutton')[0];
    await user.clear(firstInput);
    await user.type(firstInput, '25');

    expect(screen.queryByText(/geldig leerlingaantal/)).not.toBeInTheDocument();
  });

  it('submitting with all valid numbers persists studentCounts to store', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep2 ref={ref} />);

    // Fill all inputs with 10
    const inputs = screen.getAllByRole('spinbutton');
    for (const input of inputs) {
      await user.clear(input);
      await user.type(input, '10');
    }

    const result = await ref.current!.submit();
    expect(result).toBe(true);

    const state = useSchoolProfileStore.getState();
    expect(state.studentCounts['havo']).toBeDefined();
    expect(state.studentCounts['vwo']).toBeDefined();
  });
});
