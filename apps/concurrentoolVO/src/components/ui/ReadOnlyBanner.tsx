interface ReadOnlyBannerProps {
  role: 'manager' | 'viewer';
}

/**
 * Info banner shown to managers and viewers who cannot edit school profiles.
 * Returns null for roles other than manager/viewer.
 */
export function ReadOnlyBanner({ role }: ReadOnlyBannerProps) {
  if (role !== 'manager' && role !== 'viewer') {
    return null;
  }

  const message =
    role === 'manager'
      ? 'U bekijkt dit profiel als manager. Alleen de eigenaar kan wijzigingen aanbrengen.'
      : 'U bekijkt dit profiel als viewer. Alleen de eigenaar kan wijzigingen aanbrengen.';

  return (
    <div className="bg-blue-50 text-blue-700 border border-blue-200 py-2 px-4 text-sm w-full rounded">
      {message}
    </div>
  );
}
