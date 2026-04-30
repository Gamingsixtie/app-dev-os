import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import WizardStep1 from '../WizardStep1';
import { useSchoolProfileStore } from '../../store';
import { db } from '@/db/database';
import { createRef } from 'react';
import type { WizardStepRef } from '../WizardStep1';

describe('WizardStep1 - Niveaus', () => {
  beforeEach(async () => {
    useSchoolProfileStore.getState().reset();
    await db.schools.clear();
  });

  it('renders all 5 education level checkboxes', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    expect(screen.getByText('VMBO Basis')).toBeInTheDocument();
    expect(screen.getByText('VMBO Kader')).toBeInTheDocument();
    expect(screen.getByText('VMBO GT')).toBeInTheDocument();
    expect(screen.getByText('HAVO')).toBeInTheDocument();
    expect(screen.getByText('VWO')).toBeInTheDocument();
  });

  it('renders school name input with correct placeholder', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    expect(screen.getByLabelText('Schoolnaam')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Bijv. Montessori College Oost')).toBeInTheDocument();
  });

  it('selecting a level updates the form state', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    const havoCheckbox = screen.getByRole('checkbox', { name: /HAVO/i });
    expect(havoCheckbox).not.toBeChecked();

    await user.click(havoCheckbox);
    expect(havoCheckbox).toBeChecked();
  });

  it('at least one level must be selected (validation error)', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    // Fill name but no levels
    await user.type(screen.getByLabelText('Schoolnaam'), 'Test School');

    const result = await ref.current!.submit();
    expect(result).toBe(false);

    await waitFor(() => {
      expect(screen.getByText('Selecteer minimaal een niveau om door te gaan')).toBeInTheDocument();
    });
  });

  it('valid submission updates zustand store', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    await user.type(screen.getByLabelText('Schoolnaam'), 'Mijn School');
    await user.click(screen.getByRole('checkbox', { name: /HAVO/i }));
    await user.click(screen.getByRole('checkbox', { name: /VWO/i }));

    const result = await ref.current!.submit();
    expect(result).toBe(true);

    const state = useSchoolProfileStore.getState();
    expect(state.levels).toContain('havo');
    expect(state.levels).toContain('vwo');
    expect(state.levels).toHaveLength(2);
    expect(state.schoolName).toBe('Mijn School');
  });

  it('school name is required (minimum 2 characters)', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    // Select a level but leave name empty
    await user.click(screen.getByRole('checkbox', { name: /HAVO/i }));

    const result = await ref.current!.submit();
    expect(result).toBe(false);

    await waitFor(() => {
      expect(screen.getByText('Voer een schoolnaam in van minimaal 2 tekens')).toBeInTheDocument();
    });
  });
});
