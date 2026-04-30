import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { EditableField } from '../../../features/school-profile/components/EditableField';

describe('EditableField', () => {
  const defaultProps = {
    label: 'Uurtarief',
    value: 50,
    unit: 'EUR',
    onChange: vi.fn(),
  };

  it('renders value in display mode', () => {
    render(<EditableField {...defaultProps} />);

    expect(screen.getByText('50 EUR')).toBeInTheDocument();
    expect(screen.getByText('Uurtarief')).toBeInTheDocument();
  });

  it('click enters edit mode with input', async () => {
    const user = userEvent.setup();
    render(<EditableField {...defaultProps} />);

    await user.click(screen.getByText('50 EUR'));

    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue(50);
  });

  it('Enter saves new value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<EditableField {...defaultProps} onChange={onChange} />);

    // Enter edit mode
    await user.click(screen.getByText('50 EUR'));

    // Change value
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '75');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith(75);
  });

  it('blur saves new value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<EditableField {...defaultProps} onChange={onChange} />);

    await user.click(screen.getByText('50 EUR'));

    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '60');
    await user.tab(); // blur

    expect(onChange).toHaveBeenCalledWith(60);
  });

  it('Escape cancels edit and reverts', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<EditableField {...defaultProps} onChange={onChange} />);

    await user.click(screen.getByText('50 EUR'));

    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '999');
    await user.keyboard('{Escape}');

    // Should not have called onChange
    expect(onChange).not.toHaveBeenCalled();
    // Should show original value again
    expect(screen.getByText('50 EUR')).toBeInTheDocument();
  });

  it('keyboard Enter/Space on display button enters edit mode', async () => {
    const user = userEvent.setup();
    render(<EditableField {...defaultProps} />);

    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('invalid (negative) input reverts to original value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<EditableField {...defaultProps} onChange={onChange} />);

    await user.click(screen.getByText('50 EUR'));

    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '-5');
    await user.keyboard('{Enter}');

    // parseFloat(-5) >= 0 is false, so it should revert
    expect(onChange).not.toHaveBeenCalled();
  });
});
