interface OwnerBadgeProps {
  ownerName: string;
  isCurrentUser: boolean;
}

/**
 * Small avatar circle showing the first letter of the school owner's name.
 * Hidden when the current user is the owner (implicit ownership).
 * Rendered inline in school card metadata area.
 */
export function OwnerBadge({ ownerName, isCurrentUser }: OwnerBadgeProps) {
  if (isCurrentUser) {
    return null;
  }

  const initial = ownerName.charAt(0).toUpperCase();

  return (
    <span
      className="w-6 h-6 bg-neutral-200 text-neutral-700 text-sm font-medium rounded-full flex items-center justify-center shrink-0"
      title={`${ownerName} (eigenaar)`}
    >
      {initial}
    </span>
  );
}
