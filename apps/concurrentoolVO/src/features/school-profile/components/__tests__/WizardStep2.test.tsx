import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import WizardStep2 from '../WizardStep2';
import { useSchoolProfileStore } from '../../store';
import { SCHOOL_SIZE_PRESETS } from '../../../../data/school-profiles';
import { createRef } from 'react';
import type { WizardStepRef } from '../WizardStep1';

describe('WizardStep2 - Leerlingen', () => {
  beforeEach(() => {
    useSchoolProfileStore.getState().reset();
    // Set levels so the matrix renders
    useSchoolProfileStore.setState({ levels: ['havo', 'vwo'] });
  });

  it('renders input fields for each selected level', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep2 ref={ref} />);

    expect(screen.getByText('HAVO')).toBeInTheDocument();
    expect(screen.getByText('VWO')).toBeInTheDocument();
    // HAVO has 5 years, VWO has 6 years = 11 inputs
    expect(screen.getAllByRole('spinbutton')).toHaveLength(11);
  });

  it('does not render levels not selected in store', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep2 ref={ref} />);

    expect(screen.queryByText('VMBO Basis')).not.toBeInTheDocument();
  });

  it('preset button fills matrix with predefined values', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep2 ref={ref} />);

    await user.click(screen.getByText('Klein VO'));

    const kleinPreset = SCHOOL_SIZE_PRESETS.find((p) => p.id === 'klein')!;
    const havoYear1 = kleinPreset.studentCounts['havo']?.[1];
    if (havoYear1 !== undefined) {
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).toHaveValue(havoYear1);
    }
  });

  it('valid submission persists studentCounts to store', async () => {
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
