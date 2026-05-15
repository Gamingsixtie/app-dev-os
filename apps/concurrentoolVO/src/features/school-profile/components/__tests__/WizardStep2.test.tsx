import { render, screen, within } from '@testing-library/react';
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

    // Phase 27 R5 — the matrix row-label AND the CurrentToolPerLevel <legend>
    // both render the level name, so scope to the matrix table.
    const matrix = screen.getByRole('table');
    expect(within(matrix).getByText('HAVO')).toBeInTheDocument();
    expect(within(matrix).getByText('VWO')).toBeInTheDocument();
    // HAVO has 5 years, VWO has 6 years = 11 inputs in the matrix
    expect(within(matrix).getAllByRole('spinbutton')).toHaveLength(11);
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
      const matrix = screen.getByRole('table');
      const inputs = within(matrix).getAllByRole('spinbutton');
      expect(inputs[0]).toHaveValue(havoYear1);
    }
  });

  it('valid submission persists studentCounts to store', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep2 ref={ref} />);

    // Fill all matrix inputs with 10
    const matrix = screen.getByRole('table');
    const inputs = within(matrix).getAllByRole('spinbutton');
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

  // --- Phase 27 R5 — CurrentToolPerLevel integratie ---

  describe('CurrentToolPerLevel (R5)', () => {
    it('renders one CurrentToolPerLevel row per selected level', () => {
      const ref = createRef<WizardStepRef>();
      render(<WizardStep2 ref={ref} />);

      // Section heading present
      expect(
        screen.getByRole('heading', {
          name: /welk pakket gebruikt elk niveau nu/i,
        }),
      ).toBeInTheDocument();

      // 2 selected levels → 2 fieldsets (HAVO + VWO)
      const havoLegend = screen.getByText('HAVO', { selector: 'legend' });
      const vwoLegend = screen.getByText('VWO', { selector: 'legend' });
      expect(havoLegend).toBeInTheDocument();
      expect(vwoLegend).toBeInTheDocument();

      // 5 radios per niveau × 2 niveaus = 10 radio inputs in the section
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(10);
    });

    it('persists currentToolUsage to store when a radio is clicked', async () => {
      const user = userEvent.setup();
      const ref = createRef<WizardStepRef>();
      render(<WizardStep2 ref={ref} />);

      // Click "DIA" on HAVO row (the radio's label text is unique per row name)
      const havoDia = screen.getByLabelText('DIA', { selector: '#currentToolUsage-havo-dia' });
      await user.click(havoDia);

      const state = useSchoolProfileStore.getState();
      expect(state.currentToolUsage.havo).toBe('dia');
      // VWO untouched
      expect(state.currentToolUsage.vwo).toBeUndefined();
    });

    it('does not show the section when no levels are selected', () => {
      useSchoolProfileStore.setState({ levels: [] });
      const ref = createRef<WizardStepRef>();
      render(<WizardStep2 ref={ref} />);

      expect(
        screen.queryByRole('heading', {
          name: /welk pakket gebruikt elk niveau nu/i,
        }),
      ).not.toBeInTheDocument();
      expect(screen.queryAllByRole('radio')).toHaveLength(0);
    });

    it('Next-knop blokkeert niet when currentToolUsage is leeg (optioneel veld)', async () => {
      const user = userEvent.setup();
      const ref = createRef<WizardStepRef>();
      render(<WizardStep2 ref={ref} />);

      // Fill student-count inputs (those are required) but skip every radio
      const matrix = screen.getByRole('table');
      const inputs = within(matrix).getAllByRole('spinbutton');
      for (const input of inputs) {
        await user.clear(input);
        await user.type(input, '50');
      }

      const result = await ref.current!.submit();
      expect(result).toBe(true); // Submit succeeds without any radio selected
    });
  });
});
