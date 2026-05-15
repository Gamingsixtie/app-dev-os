/**
 * StichtingOverviewPage — `/stichtingen` route (Phase 27 Plan 02 R1, D-02).
 *
 * Card-grid layout that mirrors `SchoolOverviewPage`. The header has a
 * "+ Nieuwe stichting" button that opens a dialog with `StichtingForm`.
 * Smart-suggestion bulk-link (D-03) lands in Plan 27-07 — not here.
 */
import { useState } from 'react';
import { useStichtingen, useCreateStichting } from './hooks/useStichtingen';
import StichtingCard from './components/StichtingCard';
import StichtingForm from './components/StichtingForm';
import { getStichtingUsageMix } from '@/models/stichting';

export function StichtingOverviewPage() {
  const { data: stichtingen, isLoading, isError, refetch } = useStichtingen();
  const createMutation = useCreateStichting();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleCreate = async (values: { name: string; region?: string }) => {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync({
        name: values.name,
        region: values.region,
      });
      setDialogOpen(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Aanmaken mislukt');
    }
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-cito-bg">
        <div className="max-w-[1200px] mx-auto pt-12 px-8 sm:px-4">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-base font-medium text-neutral-700 mb-1">
              Kon stichtingen niet laden
            </p>
            <p className="text-sm text-neutral-500 mb-6">
              Controleer je internetverbinding en probeer het opnieuw.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-5 py-2.5 text-sm font-medium text-white bg-cito-primary rounded-lg hover:bg-cito-primary-light transition-colors"
            >
              Opnieuw proberen
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !stichtingen) {
    return (
      <div className="min-h-screen bg-cito-bg">
        <div className="max-w-[1200px] mx-auto pt-10 px-8 sm:px-4">
          <div className="h-8 w-48 bg-neutral-200 rounded-lg animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-32 bg-white border border-neutral-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cito-bg">
      <div className="max-w-[1200px] mx-auto pt-8 pb-12 px-8 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-cito-primary tracking-tight">
              Stichtingen
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {stichtingen.length}{' '}
              {stichtingen.length === 1 ? 'stichting' : 'stichtingen'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSubmitError(null);
              setDialogOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cito-primary rounded-lg hover:bg-cito-primary-light transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nieuwe stichting
          </button>
        </div>

        {/* Empty state */}
        {stichtingen.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 px-8 py-16 text-center">
            <h2 className="text-base font-medium text-neutral-700 mb-1">
              Nog geen stichtingen
            </h2>
            <p className="text-sm text-neutral-500 mb-6">
              Maak een stichting aan om scholen te groeperen onder een bestuur.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitError(null);
                setDialogOpen(true);
              }}
              className="px-5 py-2.5 text-sm font-medium text-white bg-cito-primary rounded-lg hover:bg-cito-primary-light transition-colors"
            >
              Eerste stichting aanmaken
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {stichtingen.map((stichting) => (
              <StichtingCard
                key={stichting.id}
                stichting={stichting}
                // School-count is fetched on demand per Stichting card in a
                // follow-up plan; until then we render 0 + 'unknown' so the
                // card-anatomy still renders correctly without N+1 queries.
                schoolCount={0}
                usageMix={getStichtingUsageMix([])}
              />
            ))}
          </div>
        )}

        {/* Create dialog */}
        {dialogOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDialogOpen(false);
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-stichting-title"
          >
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2
                id="create-stichting-title"
                className="text-lg font-semibold text-cito-primary mb-1"
              >
                Nieuwe stichting
              </h2>
              <p className="text-sm text-neutral-500 mb-5">
                Vul de naam en optionele regio in.
              </p>
              {submitError && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-sm text-red-700">
                  {submitError}
                </div>
              )}
              <StichtingForm
                onSubmit={handleCreate}
                onCancel={() => setDialogOpen(false)}
                isSubmitting={createMutation.isPending}
                submitLabel="Aanmaken"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StichtingOverviewPage;
