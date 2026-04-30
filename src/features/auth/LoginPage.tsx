import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from './AuthProvider';

// --- Schemas ---

const passwordSchema = z.object({
  email: z.string().email('Voer een geldig e-mailadres in'),
  password: z.string().min(1, 'Wachtwoord is verplicht'),
});

const magicLinkSchema = z.object({
  email: z.string().email('Voer een geldig e-mailadres in'),
});

type PasswordFormData = z.infer<typeof passwordSchema>;
type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

type ActiveTab = 'password' | 'magic-link';

/**
 * Login page with email/password and magic link tabs.
 * Follows the UI-SPEC Surface 1 contract exactly:
 * - Centered card (max-w-[400px]) on bg-cito-bg
 * - Dutch copy in formal u-vorm
 * - 44px minimum touch targets
 */
export function LoginPage() {
  const { signIn, signInWithMagicLink, user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('password');
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to /scholen when already logged in
  useEffect(() => {
    if (!loading && user) {
      window.location.href = '/scholen';
    }
  }, [user, loading]);

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: '', password: '' },
  });

  // Magic link form
  const magicLinkForm = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: '' },
  });

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await signIn(data.email, data.password);
      if (result.error) {
        setError(result.error);
      }
      // On success, AuthProvider handles redirect via onAuthStateChange
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLinkSubmit = async (data: MagicLinkFormData) => {
    setError(null);
    setMagicLinkSent(false);
    setIsSubmitting(true);
    try {
      const result = await signInWithMagicLink(data.email);
      if (result.error) {
        setError(result.error);
      } else {
        setMagicLinkSent(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setError(null);
    setMagicLinkSent(false);
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-cito-bg px-4 pt-16 md:pt-[64px]">
      <div className="w-full max-w-[400px] rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        {/* Brand heading */}
        <h1 className="mb-1 text-2xl font-bold text-cito-primary">Cito</h1>

        {/* Page title */}
        <h2 className="mb-1 text-xl font-semibold text-neutral-700">
          Inloggen
        </h2>

        {/* Subtitle */}
        <p className="mb-6 text-base text-neutral-500">
          Log in om door te gaan naar de rekentool
        </p>

        {/* Tab toggle */}
        <div className="mb-6 flex rounded-lg border border-neutral-200 bg-neutral-50 p-1">
          <button
            type="button"
            onClick={() => handleTabChange('password')}
            className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'password'
                ? 'bg-cito-primary text-white'
                : 'bg-white text-neutral-700'
            }`}
          >
            E-mail &amp; wachtwoord
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('magic-link')}
            className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'magic-link'
                ? 'bg-cito-primary text-white'
                : 'bg-white text-neutral-700'
            }`}
          >
            Magic link
          </button>
        </div>

        {/* Password tab form */}
        {activeTab === 'password' && (
          <form
            onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
            className="space-y-4"
          >
            {/* Email field */}
            <div>
              <label
                htmlFor="password-email"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                E-mailadres
              </label>
              <input
                id="password-email"
                type="email"
                autoComplete="email"
                disabled={isSubmitting}
                {...passwordForm.register('email')}
                className="min-h-[44px] w-full rounded-md border border-neutral-200 px-3 py-2 text-base text-neutral-700 placeholder:text-neutral-400 focus:border-cito-primary focus:outline-none focus:ring-1 focus:ring-cito-primary disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="naam@school.nl"
              />
              {passwordForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {passwordForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password-password"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Wachtwoord
              </label>
              <input
                id="password-password"
                type="password"
                autoComplete="current-password"
                disabled={isSubmitting}
                {...passwordForm.register('password')}
                className="min-h-[44px] w-full rounded-md border border-neutral-200 px-3 py-2 text-base text-neutral-700 placeholder:text-neutral-400 focus:border-cito-primary focus:outline-none focus:ring-1 focus:ring-cito-primary disabled:cursor-not-allowed disabled:opacity-50"
              />
              {passwordForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {passwordForm.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-[44px] w-full items-center justify-center rounded-md bg-cito-accent px-4 py-2 text-base font-medium text-white transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-cito-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Inloggen'
              )}
            </button>
          </form>
        )}

        {/* Magic link tab form */}
        {activeTab === 'magic-link' && (
          <form
            onSubmit={magicLinkForm.handleSubmit(handleMagicLinkSubmit)}
            className="space-y-4"
          >
            {/* Email field */}
            <div>
              <label
                htmlFor="magic-email"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                E-mailadres
              </label>
              <input
                id="magic-email"
                type="email"
                autoComplete="email"
                disabled={isSubmitting}
                {...magicLinkForm.register('email')}
                className="min-h-[44px] w-full rounded-md border border-neutral-200 px-3 py-2 text-base text-neutral-700 placeholder:text-neutral-400 focus:border-cito-primary focus:outline-none focus:ring-1 focus:ring-cito-primary disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="naam@school.nl"
              />
              {magicLinkForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {magicLinkForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-[44px] w-full items-center justify-center rounded-md bg-cito-accent px-4 py-2 text-base font-medium text-white transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-cito-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Verstuur magic link'
              )}
            </button>
          </form>
        )}

        {/* Error message */}
        {error && (
          <p className="mt-4 text-base text-red-600" role="alert">
            {error}
          </p>
        )}

        {/* Magic link success message */}
        {magicLinkSent && !error && (
          <p className="mt-4 text-base text-status-verified" role="status">
            Controleer uw inbox — klik op de link om in te loggen.
          </p>
        )}

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-neutral-500">
          Neem contact op met uw beheerder voor een account.
        </p>
      </div>
    </div>
  );
}
