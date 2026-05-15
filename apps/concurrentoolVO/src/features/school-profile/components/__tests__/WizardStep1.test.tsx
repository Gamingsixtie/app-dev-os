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
    // Phase 27 R3 + R4 — all three new fields are required by Zod, so a
    // "valid submission" must satisfy them too.
    await user.click(screen.getByRole('radio', { name: 'Huidige Cito-klant' }));
    await user.selectOptions(screen.getByLabelText('Schoolsoort:'), 'regulier');
    await user.click(screen.getByRole('radio', { name: 'Groeit' }));

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

// ---------------------------------------------------------------------------
// Phase 27 Plan 03 — R3 (customerType) + R4 (schoolType + growthTrajectory)
// ---------------------------------------------------------------------------

describe('WizardStep1 - R3 customerType', () => {
  beforeEach(async () => {
    useSchoolProfileStore.getState().reset();
    await db.schools.clear();
  });

  it('renders all 3 customerType radio options with Dutch labels', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    expect(screen.getByRole('radio', { name: 'Huidige Cito-klant' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Nieuwe prospect' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Gedeeltelijk' })).toBeInTheDocument();
    // Group legend
    expect(screen.getByText('Klant-type:')).toBeInTheDocument();
  });

  it('persists customerType to store on valid submission', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    await user.type(screen.getByLabelText('Schoolnaam'), 'Test School');
    await user.click(screen.getByRole('checkbox', { name: /HAVO/i }));
    await user.click(screen.getByRole('radio', { name: 'Nieuwe prospect' }));
    await user.selectOptions(screen.getByLabelText('Schoolsoort:'), 'regulier');
    await user.click(screen.getByRole('radio', { name: 'Groeit' }));

    const result = await ref.current!.submit();
    expect(result).toBe(true);
    expect(useSchoolProfileStore.getState().customerType).toBe('nieuwe-prospect');
  });
});

describe('WizardStep1 - R4 schoolType + customSchoolType', () => {
  beforeEach(async () => {
    useSchoolProfileStore.getState().reset();
    await db.schools.clear();
  });

  it('renders the schoolType select with 6 options', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    const select = screen.getByLabelText('Schoolsoort:') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    // Placeholder + 6 enum options = 7 total
    expect(select.options).toHaveLength(7);
    expect(screen.getByRole('option', { name: 'Regulier' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Dakpanklas' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Daltonschool' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Montessorischool' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Vrije school' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Anders, namelijk:' })).toBeInTheDocument();
  });

  it('shows customSchoolType input only when schoolType=overig', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    // Initially hidden
    expect(screen.queryByLabelText('Naam van het schooltype')).not.toBeInTheDocument();

    // Pick a regular option — still hidden
    await user.selectOptions(screen.getByLabelText('Schoolsoort:'), 'regulier');
    expect(screen.queryByLabelText('Naam van het schooltype')).not.toBeInTheDocument();

    // Pick 'overig' — now visible
    await user.selectOptions(screen.getByLabelText('Schoolsoort:'), 'overig');
    expect(await screen.findByLabelText('Naam van het schooltype')).toBeInTheDocument();
  });

  it('persists schoolType=regulier to store on valid submission', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    await user.type(screen.getByLabelText('Schoolnaam'), 'Test School');
    await user.click(screen.getByRole('checkbox', { name: /HAVO/i }));
    await user.click(screen.getByRole('radio', { name: 'Huidige Cito-klant' }));
    await user.selectOptions(screen.getByLabelText('Schoolsoort:'), 'dalton');
    await user.click(screen.getByRole('radio', { name: 'Groeit' }));

    const result = await ref.current!.submit();
    expect(result).toBe(true);
    expect(useSchoolProfileStore.getState().schoolType).toBe('dalton');
    // When schoolType !== 'overig', customSchoolType is forced to null
    expect(useSchoolProfileStore.getState().customSchoolType).toBeNull();
  });

  it('blocks Next when schoolType=overig and customSchoolType is empty', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    await user.type(screen.getByLabelText('Schoolnaam'), 'Test School');
    await user.click(screen.getByRole('checkbox', { name: /HAVO/i }));
    await user.click(screen.getByRole('radio', { name: 'Huidige Cito-klant' }));
    await user.selectOptions(screen.getByLabelText('Schoolsoort:'), 'overig');
    await user.click(screen.getByRole('radio', { name: 'Groeit' }));

    const result = await ref.current!.submit();
    expect(result).toBe(false);

    await waitFor(() => {
      expect(screen.getByText('Vul de naam van het schooltype in')).toBeInTheDocument();
    });
  });

  it('persists customSchoolType to store when schoolType=overig and filled', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    await user.type(screen.getByLabelText('Schoolnaam'), 'Test School');
    await user.click(screen.getByRole('checkbox', { name: /HAVO/i }));
    await user.click(screen.getByRole('radio', { name: 'Huidige Cito-klant' }));
    await user.selectOptions(screen.getByLabelText('Schoolsoort:'), 'overig');
    await user.type(await screen.findByLabelText('Naam van het schooltype'), 'Technasium');
    await user.click(screen.getByRole('radio', { name: 'Groeit' }));

    const result = await ref.current!.submit();
    expect(result).toBe(true);
    expect(useSchoolProfileStore.getState().schoolType).toBe('overig');
    expect(useSchoolProfileStore.getState().customSchoolType).toBe('Technasium');
  });
});

describe('WizardStep1 - R4 growthTrajectory', () => {
  beforeEach(async () => {
    useSchoolProfileStore.getState().reset();
    await db.schools.clear();
  });

  it('renders all 4 growthTrajectory radio options with Dutch labels', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    expect(screen.getByRole('radio', { name: 'Groeit' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Krimpt' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Stabiel' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Loting (mogelijke daling)' })).toBeInTheDocument();
    // Group legend
    expect(screen.getByText('Hoe ontwikkelt het leerlingaantal zich?')).toBeInTheDocument();
  });

  it('blocks Next when growthTrajectory is missing', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    await user.type(screen.getByLabelText('Schoolnaam'), 'Test School');
    await user.click(screen.getByRole('checkbox', { name: /HAVO/i }));
    await user.click(screen.getByRole('radio', { name: 'Huidige Cito-klant' }));
    await user.selectOptions(screen.getByLabelText('Schoolsoort:'), 'regulier');
    // Do NOT pick a growthTrajectory

    const result = await ref.current!.submit();
    expect(result).toBe(false);
  });

  it('persists growthTrajectory to store on valid submission', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep1 ref={ref} />);

    await user.type(screen.getByLabelText('Schoolnaam'), 'Test School');
    await user.click(screen.getByRole('checkbox', { name: /HAVO/i }));
    await user.click(screen.getByRole('radio', { name: 'Huidige Cito-klant' }));
    await user.selectOptions(screen.getByLabelText('Schoolsoort:'), 'regulier');
    await user.click(screen.getByRole('radio', { name: 'Krimpt' }));

    const result = await ref.current!.submit();
    expect(result).toBe(true);
    expect(useSchoolProfileStore.getState().growthTrajectory).toBe('krimp');
  });
});
