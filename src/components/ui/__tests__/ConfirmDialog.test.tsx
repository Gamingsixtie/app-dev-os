import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ConfirmDialog from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    title: 'School verwijderen',
    body: 'Weet u zeker dat u deze school wilt verwijderen?',
    confirmLabel: 'Verwijderen',
    cancelLabel: 'Annuleren',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders title and body when open', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('School verwijderen')).toBeInTheDocument();
    expect(screen.getByText('Weet u zeker dat u deze school wilt verwijderen?')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('School verwijderen')).not.toBeInTheDocument();
  });

  it('confirm button calls onConfirm', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    await user.click(screen.getByText('Verwijderen'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cancel button calls onCancel', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

    await user.click(screen.getByText('Annuleren'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('configurable cancel label works', () => {
    render(<ConfirmDialog {...defaultProps} cancelLabel="Nee, bewaar" />);

    expect(screen.getByText('Nee, bewaar')).toBeInTheDocument();
    expect(screen.queryByText('Annuleren')).not.toBeInTheDocument();
  });

  it('Escape key calls onCancel', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('has alertdialog role for accessibility', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});
