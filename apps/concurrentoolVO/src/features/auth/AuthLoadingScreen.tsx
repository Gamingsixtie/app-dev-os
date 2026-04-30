/**
 * Full-viewport loading screen shown during auth session check.
 * Displays a spinner with "Laden..." text centered on screen.
 */
export function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cito-bg">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-cito-primary border-t-transparent"
        role="status"
        aria-label="Laden"
      />
      <p className="mt-3 text-sm text-neutral-500">Laden...</p>
    </div>
  );
}
