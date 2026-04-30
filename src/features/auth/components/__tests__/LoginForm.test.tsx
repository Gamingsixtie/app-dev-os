import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock useAuth before importing the component
const mockSignIn = vi.fn();
const mockSignInWithMagicLink = vi.fn();

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    userProfile: null,
    loading: false,
    signIn: mockSignIn,
    signInWithMagicLink: mockSignInWithMagicLink,
    signOut: vi.fn(),
  }),
}));

// Dynamic import after mock setup
const { LoginPage } = await import('../../LoginPage');

describe('LoginForm (LoginPage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn.mockResolvedValue({ error: null });
    mockSignInWithMagicLink.mockResolvedValue({ error: null });
  });

  it('renders email and password fields', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText('E-mailadres')).toBeInTheDocument();
    expect(screen.getByLabelText('Wachtwoord')).toBeInTheDocument();
  });

  it('renders page title in Dutch', () => {
    render(<LoginPage />);

    // h2 heading
    expect(screen.getByRole('heading', { name: 'Inloggen' })).toBeInTheDocument();
    expect(screen.getByText('Log in om door te gaan naar de rekentool')).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    // Submit without filling anything
    await user.click(screen.getByRole('button', { name: 'Inloggen' }));

    await waitFor(() => {
      expect(screen.getByText('Voer een geldig e-mailadres in')).toBeInTheDocument();
    });
  });

  it('shows validation error for empty password', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    // Fill email but not password
    await user.type(screen.getByLabelText('E-mailadres'), 'test@school.nl');
    await user.click(screen.getByRole('button', { name: 'Inloggen' }));

    await waitFor(() => {
      expect(screen.getByText('Wachtwoord is verplicht')).toBeInTheDocument();
    });
  });

  it('calls signIn on valid form submit', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('E-mailadres'), 'test@school.nl');
    await user.type(screen.getByLabelText('Wachtwoord'), 'geheim123');
    await user.click(screen.getByRole('button', { name: 'Inloggen' }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@school.nl', 'geheim123');
    });
  });

  it('shows error message on auth failure', async () => {
    mockSignIn.mockResolvedValue({ error: 'Ongeldige inloggegevens' });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('E-mailadres'), 'test@school.nl');
    await user.type(screen.getByLabelText('Wachtwoord'), 'fout');
    await user.click(screen.getByRole('button', { name: 'Inloggen' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Ongeldige inloggegevens');
    });
  });

  it('has tab toggle between password and magic link', () => {
    render(<LoginPage />);

    expect(screen.getByText('E-mail & wachtwoord')).toBeInTheDocument();
    expect(screen.getByText('Magic link')).toBeInTheDocument();
  });

  it('switching to magic link tab shows single email field', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByText('Magic link'));

    // Only email field, no password
    expect(screen.getByLabelText('E-mailadres')).toBeInTheDocument();
    expect(screen.queryByLabelText('Wachtwoord')).not.toBeInTheDocument();
    expect(screen.getByText('Verstuur magic link')).toBeInTheDocument();
  });
});
