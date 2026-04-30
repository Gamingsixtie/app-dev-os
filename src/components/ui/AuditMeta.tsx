interface AuditMetaProps {
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

const DUTCH_MONTHS = [
  'jan', 'feb', 'mrt', 'apr', 'mei', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
];

/**
 * Formats an ISO date string into Dutch relative time.
 * - < 1 min: "zojuist"
 * - < 60 min: "{n} min geleden"
 * - < 24 hours: "{n} uur geleden"
 * - < 48 hours: "gisteren"
 * - else: "3 mrt 2026"
 */
function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 1) {
    return 'zojuist';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min geleden`;
  }
  if (diffHours < 24) {
    return `${diffHours} uur geleden`;
  }
  if (diffHours < 48) {
    return 'gisteren';
  }

  const day = date.getDate();
  const month = DUTCH_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Displays audit trail metadata: "Bijgewerkt door" or "Aangemaakt door"
 * with Dutch relative time formatting.
 */
export function AuditMeta({ createdBy, updatedBy, createdAt, updatedAt }: AuditMetaProps) {
  // Show "Bijgewerkt door" if there's a different updater
  if (updatedBy && updatedAt && updatedBy !== createdBy) {
    return (
      <span className="text-sm text-neutral-500">
        Bijgewerkt door {updatedBy} — {formatRelativeTime(updatedAt)}
      </span>
    );
  }

  // Otherwise show "Aangemaakt door"
  if (createdBy && createdAt) {
    return (
      <span className="text-sm text-neutral-500">
        Aangemaakt door {createdBy} — {formatRelativeTime(createdAt)}
      </span>
    );
  }

  return null;
}
