import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { EditableAssumption } from '../EditableAssumption';
import type { Assumption } from '../../../models/assumptions';

function makeAssumption(overrides: Partial<Assumption> = {}): Assumption {
  return {
    id: 'uurtarief',
    label: 'Uurtarief',
    description: 'Bruto uurtarief',
    defaultValue: 50,
    currentValue: 50,
    unit: 'euro/uur',
    category: 'financieel',
    ...overrides,
  };
}

describe('EditableAssumption', () => {
  it('displays current value and unit', () => {
    render(<EditableAssumption assumption={makeAssumption()} onChange={vi.fn()} />);
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('euro/uur')).toBeInTheDocument();
  });

  it('shows dashed underline when not modified', () => {
    render(<EditableAssumption assumption={makeAssumption()} onChange={vi.fn()} />);
    const valueEl = screen.getByText('50');
    expect(valueEl.className).toContain('border-dashed');
  });

  it('transforms to input field on click', async () => {
    const user = userEvent.setup();
    render(<EditableAssumption assumption={makeAssumption()} onChange={vi.fn()} />);
    await user.click(screen.getByText('50'));
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('shows modified state when value differs from default', () => {
    const assumption = makeAssumption({ currentValue: 65 });
    const { container } = render(<EditableAssumption assumption={assumption} onChange={vi.fn()} />);
    expect(container.firstElementChild!.className).toContain('bg-modified-bg');
  });

  it('shows reset icon when modified', () => {
    const assumption = makeAssumption({ currentValue: 65 });
    render(<EditableAssumption assumption={assumption} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Terugzetten naar standaard/i })).toBeInTheDocument();
  });

  it('reset button has correct aria-label', () => {
    const assumption = makeAssumption({ currentValue: 65 });
    render(<EditableAssumption assumption={assumption} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Terugzetten naar standaard (50)')).toBeInTheDocument();
  });

  it('calls onChange with new value when edited', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditableAssumption assumption={makeAssumption()} onChange={onChange} />);
    await user.click(screen.getByText('50'));
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '75');
    await user.tab(); // blur
    expect(onChange).toHaveBeenCalledWith(75);
  });

  it('calls onChange with default value when reset clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const assumption = makeAssumption({ currentValue: 65 });
    render(<EditableAssumption assumption={assumption} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /Terugzetten naar standaard/i }));
    expect(onChange).toHaveBeenCalledWith(50);
  });
});
