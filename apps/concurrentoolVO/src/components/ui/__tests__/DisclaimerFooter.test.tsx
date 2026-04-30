import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DisclaimerFooter } from '../DisclaimerFooter';

describe('DisclaimerFooter', () => {
  it('renders disclaimer text', () => {
    render(<DisclaimerFooter />);
    expect(screen.getByText(/publicatieprijzen zijn bovengrenzen/)).toBeInTheDocument();
  });

  it('shows full disclaimer message', () => {
    render(<DisclaimerFooter />);
    expect(
      screen.getByText('Alle getoonde publicatieprijzen zijn bovengrenzen. De werkelijke prijs kan lager zijn.')
    ).toBeInTheDocument();
  });

  it('is hidden when showDisclaimer is false', () => {
    const { container } = render(<DisclaimerFooter showDisclaimer={false} />);
    expect(container.firstElementChild).toBeNull();
  });

  it('renders as italic text', () => {
    render(<DisclaimerFooter />);
    const el = screen.getByText(/publicatieprijzen zijn bovengrenzen/);
    expect(el.className).toContain('italic');
  });
});
