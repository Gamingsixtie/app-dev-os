import { useState, useEffect } from 'react';
import { db } from '@/db/database';
import {
  migrateIndexedDBToSupabase,
  type MigrationResult,
  type MigrationProgress,
} from '@/db/migrations';

// Inline type for Dexie data -- avoids conflict with parallel Plan 08-03
interface DexieSchoolRecord {
  id?: number;
  name: string;
  [key: string]: unknown;
}

interface CloudMigrationWizardProps {
  onComplete: () => void;
}

type WizardStatus = 'ready' | 'migrating' | 'success' | 'partial-failure' | 'failure';

export function CloudMigrationWizard({ onComplete }: CloudMigrationWizardProps) {
  const [status, setStatus] = useState<WizardStatus>('ready');
  const [progress, setProgress] = useState<MigrationProgress>({
    status: 'idle',
    current: 0,
    total: 0,
    currentSchoolName: '',
  });
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [localSchools, setLocalSchools] = useState<DexieSchoolRecord[]>([]);

  // Load school names from Dexie on mount
  useEffect(() => {
    (async () => {
      try {
        const schools = (await db.schools.toArray()) as unknown as DexieSchoolRecord[];
        setLocalSchools(schools);
      } catch {
        // IndexedDB might not exist
        setLocalSchools([]);
      }
    })();
  }, []);

  async function handleMigrate() {
    setStatus('migrating');
    setShowSkipConfirm(false);

    try {
      const migrationResult = await migrateIndexedDBToSupabase((p) => {
        setProgress(p);
      });

      setResult(migrationResult);

      if (migrationResult.success) {
        setStatus('success');
      } else if (migrationResult.migrated > 0) {
        setStatus('partial-failure');
      } else {
        setStatus('failure');
      }
    } catch {
      setStatus('failure');
      setResult({
        success: false,
        total: localSchools.length,
        migrated: 0,
        errors: [{ schoolName: 'Alle scholen', error: 'Onverwachte fout' }],
      });
    }
  }

  function handleSkip() {
    localStorage.setItem('supabase-migration-complete', 'true');
    onComplete();
  }

  const schoolCount = localSchools.length;
  const displaySchools = localSchools.slice(0, 5);
  const remainingCount = schoolCount - displaySchools.length;

  return (
    <div className="min-h-screen bg-cito-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md border border-neutral-200 w-full max-w-[500px] p-6">

        {/* Ready state */}
        {status === 'ready' && (
          <>
            <h1 className="text-xl font-semibold text-cito-primary mb-4">
              Uw data overzetten
            </h1>
            <p className="text-base text-neutral-700 mb-4">
              Er zijn {schoolCount} school(en) gevonden op dit apparaat. Wilt u deze veilig
              overzetten naar de cloud? Daarna is uw data overal beschikbaar.
            </p>

            {/* School list */}
            <ol className="list-decimal list-inside text-sm text-neutral-700 mb-6 space-y-1">
              {displaySchools.map((school, idx) => (
                <li key={school.id ?? idx}>{school.name}</li>
              ))}
              {remainingCount > 0 && (
                <li className="text-neutral-500 list-none ml-5">
                  +{remainingCount} meer
                </li>
              )}
            </ol>

            {/* Actions */}
            <button
              type="button"
              onClick={handleMigrate}
              className="bg-cito-accent text-white w-full min-h-[44px] rounded font-medium text-base hover:opacity-90 transition-opacity"
            >
              Data overzetten
            </button>

            {!showSkipConfirm ? (
              <button
                type="button"
                onClick={() => setShowSkipConfirm(true)}
                className="block mx-auto mt-3 text-neutral-500 underline text-sm hover:text-neutral-700 transition-colors"
              >
                Overslaan
              </button>
            ) : (
              <div className="mt-4 p-3 bg-neutral-50 rounded border border-neutral-200">
                <p className="text-sm text-neutral-700 mb-3">
                  Weet u het zeker? Lokale data wordt niet overgezet en is alleen op dit
                  apparaat beschikbaar.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="flex-1 text-sm px-3 py-1.5 rounded border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    Ja, overslaan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSkipConfirm(false)}
                    className="flex-1 text-sm px-3 py-1.5 rounded bg-cito-primary text-white hover:opacity-90 transition-opacity"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Migrating state */}
        {status === 'migrating' && (
          <>
            <h1 className="text-xl font-semibold text-cito-primary mb-4">
              Uw data overzetten
            </h1>
            <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-cito-accent transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-sm text-neutral-500">
              School {progress.currentSchoolName} overzetten... ({progress.current}/{progress.total})
            </p>
          </>
        )}

        {/* Success state */}
        {status === 'success' && (
          <div className="text-center">
            {/* Green checkmark SVG */}
            <svg
              className="mx-auto mb-4 text-status-verified"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p className="text-base text-status-verified mb-6">
              Alle data is succesvol overgezet!
            </p>
            <button
              type="button"
              onClick={onComplete}
              className="bg-cito-accent text-white w-full min-h-[44px] rounded font-medium text-base hover:opacity-90 transition-opacity"
            >
              Doorgaan naar overzicht
            </button>
          </div>
        )}

        {/* Partial failure state */}
        {status === 'partial-failure' && result && (
          <>
            {/* Amber warning icon */}
            <div className="flex justify-center mb-4">
              <svg
                className="text-amber-500"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <p className="text-base text-neutral-700 mb-4 text-center">
              {result.migrated} scholen overgezet, {result.errors.length} mislukt. Controleer de details hieronder.
            </p>

            {/* Expandable error list */}
            <div className="mb-4 space-y-2">
              {result.errors.map((err, idx) => (
                <details key={idx} className="border border-neutral-200 rounded p-2">
                  <summary className="text-sm text-neutral-700 cursor-pointer">
                    {err.schoolName}
                  </summary>
                  <p className="text-sm text-red-600 mt-1 pl-2">
                    {err.error}
                  </p>
                </details>
              ))}
            </div>

            <button
              type="button"
              onClick={handleMigrate}
              className="bg-cito-accent text-white w-full min-h-[44px] rounded font-medium text-base hover:opacity-90 transition-opacity mb-3"
            >
              Opnieuw proberen
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('supabase-migration-complete', 'true');
                onComplete();
              }}
              className="block mx-auto text-neutral-500 underline text-sm hover:text-neutral-700 transition-colors"
            >
              Doorgaan zonder mislukte scholen
            </button>
          </>
        )}

        {/* Failure state */}
        {status === 'failure' && (
          <div className="text-center">
            {/* Red error icon */}
            <svg
              className="mx-auto mb-4 text-red-600"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="text-base text-red-600 mb-6">
              Er is iets misgegaan bij het overzetten. Probeer het opnieuw.
            </p>
            <button
              type="button"
              onClick={handleMigrate}
              className="bg-cito-accent text-white w-full min-h-[44px] rounded font-medium text-base hover:opacity-90 transition-opacity mb-3"
            >
              Opnieuw proberen
            </button>
            <p className="text-sm text-neutral-500">
              Neem contact op met uw beheerder
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
