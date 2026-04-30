import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthProvider';

/**
 * Header dropdown menu showing user name, role, and sign-out button.
 * Opens on click, closes on click outside.
 */
export function UserMenu() {
  const { userProfile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleSignOut = useCallback(async () => {
    setOpen(false);
    await signOut();
  }, [signOut]);

  if (!userProfile) return null;

  const initial = userProfile.name.charAt(0).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-neutral-100"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {/* User initial avatar */}
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-xs font-medium text-neutral-700">
          {initial}
        </span>
        {/* Chevron down icon */}
        <svg
          className={`h-4 w-4 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-neutral-200 bg-white shadow-lg">
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-neutral-700">
              {userProfile.name}
            </p>
            <p className="text-sm text-neutral-500">{userProfile.role}</p>
          </div>
          <div className="border-t border-neutral-200" />
          <div className="py-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Uitloggen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
