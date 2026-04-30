interface SchoolOwnerFilterProps {
  value: 'mine' | 'all';
  onChange: (value: 'mine' | 'all') => void;
  userRole: 'accountmanager' | 'manager' | 'viewer';
}

/**
 * Toggle button group for filtering between "Mijn scholen" and "Alle scholen".
 * Default: accountmanager sees "Mijn scholen" active, manager/viewer sees "Alle scholen" active.
 * Default selection is handled by the parent component via the userRole prop.
 */
export function SchoolOwnerFilter({ value, onChange }: SchoolOwnerFilterProps) {
  const activeClasses = 'bg-cito-primary text-white rounded';
  const inactiveClasses = 'bg-white text-neutral-700 border border-neutral-200 rounded';

  return (
    <div className="inline-flex gap-1">
      <button
        type="button"
        onClick={() => onChange('mine')}
        className={`text-sm px-3 py-1.5 inline-flex items-center transition-colors ${
          value === 'mine' ? activeClasses : inactiveClasses
        }`}
      >
        Mijn scholen
      </button>
      <button
        type="button"
        onClick={() => onChange('all')}
        className={`text-sm px-3 py-1.5 inline-flex items-center transition-colors ${
          value === 'all' ? activeClasses : inactiveClasses
        }`}
      >
        Alle scholen
      </button>
    </div>
  );
}
