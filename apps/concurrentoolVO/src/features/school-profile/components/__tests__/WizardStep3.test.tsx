import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import WizardStep3 from '../WizardStep3';
import { useSchoolProfileStore } from '../../store';
import { MODULE_CATALOG } from '../../../../models/modules';
import { createRef } from 'react';
import type { WizardStepRef } from '../WizardStep1';

describe('WizardStep3 - Modules', () => {
  beforeEach(() => {
    useSchoolProfileStore.getState().reset();
  });

  it('renders module selection grid with all modules', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep3 ref={ref} />);

    for (const mod of MODULE_CATALOG) {
      expect(screen.getByText(mod.name)).toBeInTheDocument();
    }
  });

  it('selecting a module updates form state visually', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep3 ref={ref} />);

    const rekenButton = screen.getByText('Reken-Wiskunde').closest('button')!;
    expect(rekenButton.className).toContain('border-neutral-200');

    await user.click(rekenButton);
    expect(rekenButton.className).toContain('border-cito-accent');
  });

  it('selecting modules persists selectedModules to store', async () => {
    const user = userEvent.setup();
    const ref = createRef<WizardStepRef>();
    render(<WizardStep3 ref={ref} />);

    await user.click(screen.getByText('Reken-Wiskunde').closest('button')!);
    await user.click(screen.getByText('Engels').closest('button')!);

    await ref.current!.submit();

    const state = useSchoolProfileStore.getState();
    expect(state.selectedModules).toContain('rekenwiskunde');
    expect(state.selectedModules).toContain('engels');
    expect(state.selectedModules).toHaveLength(2);
  });

  it('0 modules selected is valid (schema allows empty)', async () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep3 ref={ref} />);

    const result = await ref.current!.submit();
    expect(result).toBe(true);
  });

  it('shows quick-pick buttons', () => {
    const ref = createRef<WizardStepRef>();
    render(<WizardStep3 ref={ref} />);

    expect(screen.getByText('LVS Basis')).toBeInTheDocument();
    expect(screen.getByText('LVS Compleet')).toBeInTheDocument();
    expect(screen.getByText('Alles')).toBeInTheDocument();
  });
});
