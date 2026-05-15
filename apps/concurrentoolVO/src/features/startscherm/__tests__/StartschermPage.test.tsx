import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StartschermPage from '../StartschermPage';

// Mock TanStack Router's <Link> so the test does not require a full Router harness.
// The mock renders a plain <a href={to}> which is sufficient to assert navigation targets.
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

describe('StartschermPage', () => {
  it('rendert exact twee cards', () => {
    render(<StartschermPage />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
  });

  it("card 1 linkt naar /scholen en bevat 'Scholenoverzicht'", () => {
    render(<StartschermPage />);
    const scholenLink = screen.getByRole('link', { name: /Scholenoverzicht/i });
    expect(scholenLink).toBeInTheDocument();
    expect(scholenLink).toHaveAttribute('href', '/scholen');
  });

  it("card 2 linkt naar /prijzen en bevat 'Cito Prijzen + Concurrentie'", () => {
    render(<StartschermPage />);
    const prijzenLink = screen.getByRole('link', {
      name: /Cito Prijzen \+ Concurrentie/i,
    });
    expect(prijzenLink).toBeInTheDocument();
    expect(prijzenLink).toHaveAttribute('href', '/prijzen');
  });
});
