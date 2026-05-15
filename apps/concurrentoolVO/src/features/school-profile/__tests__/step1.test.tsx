import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import WizardStep1 from '../components/WizardStep1';
import { useSchoolProfileStore } from '../store';
import { db } from '@/db/database';
import { createRef } from 'react';
import type { WizardStepRef } from '../components/WizardStep1';

describe('WizardStep1 - Schoolniveau selectie', () => {
  beforeEach(async () => {
    useSchoolProfileStore.getState().reset();
    await db.schools.clear();
  });

  it('renders all 5 school level checkboxes with correct Dutch labels', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    expect(screen.getByText('VMBO Basis')).toBeInTheDocument();
    expect(screen.getByText('VMBO Kader')).toBeInTheDocument();
    expect(screen.getByText('VMBO GT')).toBeInTheDocument();
    expect(screen.getByText('HAVO')).toBeInTheDocument();
    expect(screen.getByText('VWO')).toBeInTheDocument();
  });

  it('renders the step heading in Dutch', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    expect(screen.getByText('Schoolgegevens en niveaus')).toBeInTheDocument();
  });

  it('renders the school name input', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    expect(screen.getByLabelText('Schoolnaam')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Bijv. Montessori College Oost')).toBeInTheDocument();
  });

  it('selecting at least one checkbox and entering name allows form submission', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    // Fill school name
    await user.type(screen.getByLabelText('Schoolnaam'), 'Test School');

    const havoCheckbox = screen.getByRole('checkbox', { name: /HAVO/i });
    await user.click(havoCheckbox);
    // Phase 27 Plan 03 (R3 + R4) — these fields are now required by Zod.
    await user.click(screen.getByRole('radio', { name: 'Huidige Cito-klant' }));
    await user.selectOptions(screen.getByLabelText('Schoolsoort:'), 'regulier');
    await user.click(screen.getByRole('radio', { name: 'Groeit' }));

    const result = await ref.current!.submit();
    expect(result).toBe(true);

    expect(screen.queryByText('Selecteer minimaal een niveau om door te gaan')).not.toBeInTheDocument();
  });

  it('submitting without any selection shows error', async () => {
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

  it('selected levels are persisted to zustand store on submit', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    await user.type(screen.getByLabelText('Schoolnaam'), 'Mijn School');
    await user.click(screen.getByRole('checkbox', { name: /HAVO/i }));
    await user.click(screen.getByRole('checkbox', { name: /VWO/i }));
    // Phase 27 Plan 03 (R3 + R4) — fill new required fields too.
    await user.click(screen.getByRole('radio', { name: 'Huidige Cito-klant' }));
    await user.selectOptions(screen.getByLabelText('Schoolsoort:'), 'regulier');
    await user.click(screen.getByRole('radio', { name: 'Groeit' }));

    await ref.current!.submit();

    const state = useSchoolProfileStore.getState();
    expect(state.levels).toContain('havo');
    expect(state.levels).toContain('vwo');
    expect(state.levels).toHaveLength(2);
    expect(state.schoolName).toBe('Mijn School');
  });
});
