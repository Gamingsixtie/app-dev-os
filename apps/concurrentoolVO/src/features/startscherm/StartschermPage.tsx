// Landing page at `/` — two equally-weighted entry cards (Schooloverzicht + Cito Prijzen + Concurrentie).
// Replaces the previous `/` -> `/scholen` redirect (phase 26, D-05).
// Both cards are visible to every logged-in user; access control for the Cito Prijzen card
// happens in PrijzenPage via the manager-only gate (D-06).

import { Link } from '@tanstack/react-router';

export function StartschermPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 mt-12">
      <h1 className="text-2xl font-bold text-cito-primary mb-8 text-center">
        Cito Rekentool
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Card A — Scholenoverzicht */}
        <Link
          to="/scholen"
          className="bg-white border border-neutral-200 rounded-lg p-8 hover:border-cito-primary hover:shadow-md transition-all min-h-[200px] flex flex-col items-center justify-center text-center"
        >
          <h2 className="text-xl font-semibold text-cito-primary mb-2">
            Scholenoverzicht
          </h2>
          <p className="text-sm text-neutral-600">
            Bekijk en beheer scholen, profielen en vergelijkingen
          </p>
        </Link>

        {/* Card B — Cito Prijzen + Concurrentie */}
        <Link
          to="/prijzen"
          className="bg-white border border-neutral-200 rounded-lg p-8 hover:border-cito-primary hover:shadow-md transition-all min-h-[200px] flex flex-col items-center justify-center text-center"
        >
          <h2 className="text-xl font-semibold text-cito-primary mb-2">
            Cito Prijzen + Concurrentie
          </h2>
          <p className="text-sm text-neutral-600">
            Beheer Cito-prijzen, concurrentieprijzen, import en export
          </p>
        </Link>
      </div>
    </div>
  );
}

export default StartschermPage;
