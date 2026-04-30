import { useState, useEffect } from 'react';

interface NotFoundRedirectProps {
  show: boolean;
}

export default function NotFoundRedirect({ show }: NotFoundRedirectProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-center justify-between mb-6">
      <span>Dit schoolprofiel bestaat niet meer.</span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="ml-4 text-amber-600 hover:text-amber-800"
        aria-label="Melding sluiten"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
