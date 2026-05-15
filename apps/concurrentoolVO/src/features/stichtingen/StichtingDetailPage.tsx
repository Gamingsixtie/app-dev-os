/**
 * StichtingDetailPage — `/stichtingen/:id` (Phase 27 Plan 02 R1, D-05).
 *
 * Header has Bewerken + Verwijderen buttons. The delete-flow honours D-04:
 * when scholen are linked the dialog blocks delete and shows the unlink
 * instruction. The body is the 3-tab StichtingDetailTabs panel.
 *
 * Phase 27 Plan 07 (R11, D-03) added the "+ Scholen koppelen" header action
 * and the `BulkLinkSchoolsDialog` for smart-suggestion bulk-link.
 */
import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useStichting, useUpdateStichting, useSchoolsForStichting } from './hooks/useStichting';
import { useDeleteStichting, useUnlinkedSchools } from './hooks/useStichtingen';
import StichtingDetailTabs from './components/StichtingDetailTabs';
import StichtingForm from './components/StichtingForm';
import BulkLinkSchoolsDialog from './components/BulkLinkSchoolsDialog';
import { StichtingCascadeError } from '@/models/stichting';

export function StichtingDetailPage() {
  const { id } = useParams({ from: '/stichtingen/$id' });
  const navigate = useNavigate();
  const { data: stichting, isLoading, isError } = useStichting(id);
  const { data: linkedSchools } = useSchoolsForStichting(id);
  const { data: ongekoppeldeSchools } = useUnlinkedSchools();
  const updateMutation = useUpdateStichting();
  const deleteMutation = useDeleteStichting();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulkLinkOpen, setBulkLinkOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cito-bg">
        <div className="max-w-[1200px] mx-auto pt-10 px-8 sm:px-4">
          <div className="h-8 w-64 bg-neutral-200 rounded-lg animate-pulse mb-6" />
          <div className="h-48 bg-white border border-neutral-200 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !stichting) {
    return (
      <div className="min-h-screen bg-cito-bg">
        <div className="max-w-[1200px] mx-auto pt-12 px-8 sm:px-4">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-base font-medium text-neutral-700 mb-1">
              Stichting niet gevonden
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: '/stichtingen' })}
              className="mt-4 px-5 py-2.5 text-sm font-medium text-white bg-cito-primary rounded-lg hover:bg-cito-primary-light transition-colors"
            >
              Terug naar stichtingen
            </button>
          </div>
        </div>
      </div>
    );
  }

  const linkedCount = linkedSchools?.length ?? 0;
  const canDelete = linkedCount === 0;

  const handleEdit = async (values: { name: string; region?: string }) => {
    setEditError(null);
    try {
      await updateMutation.mutateAsync({
        id: stichting.id,
        patch: { name: values.name, region: values.region },
      });
      setEditOpen(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Bijwerken mislukt');
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(stichting.id);
      setDeleteOpen(false);
      navigate({ to: '/stichtingen' });
    } catch (err) {
      if (err instanceof StichtingCascadeError) {
        setDeleteError(err.message);
      } else {
        setDeleteError(err instanceof Error ? err.message : 'Verwijderen mislukt');
      }
    }
  };

  return (
    <div className="min-h-screen bg-cito-bg">
      <div className="max-w-[1200px] mx-auto pt-8 pb-12 px-8 sm:px-4">
        {/* Back link */}
        <button
          type="button"
          onClick={() => navigate({ to: '/stichtingen' })}
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-cito-primary mb-4 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Alle stichtingen
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-cito-primary tracking-tight">
              {stichting.name}
            </h1>
            {stichting.region && (
              <p className="text-sm text-neutral-500 mt-1">{stichting.region}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBulkLinkOpen(true)}
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
              Scholen koppelen
            </button>
            <button
              type="button"
              onClick={() => {
                setEditError(null);
                setEditOpen(true);
              }}
              className="px-4 py-2 text-sm font-medium text-cito-primary border border-cito-primary/30 rounded-lg hover:bg-cito-primary/5 transition-colors"
            >
              Bewerken
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setDeleteOpen(true);
              }}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Verwijderen
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-neutral-200 px-6">
          <StichtingDetailTabs stichting={stichting} />
        </div>

        {/* Edit dialog */}
        {editOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setEditOpen(false);
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-stichting-title"
          >
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2
                id="edit-stichting-title"
                className="text-lg font-semibold text-cito-primary mb-4"
              >
                Stichting bewerken
              </h2>
              {editError && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-sm text-red-700">
                  {editError}
                </div>
              )}
              <StichtingForm
                defaultValues={{ name: stichting.name, region: stichting.region }}
                onSubmit={handleEdit}
                onCancel={() => setEditOpen(false)}
                isSubmitting={updateMutation.isPending}
                submitLabel="Opslaan"
              />
            </div>
          </div>
        )}

        {/* Delete dialog */}
        {deleteOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeleteOpen(false);
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-stichting-title"
          >
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2
                id="delete-stichting-title"
                className="text-lg font-semibold text-neutral-900 mb-2"
              >
                Stichting verwijderen?
              </h2>
              {canDelete ? (
                <p className="text-sm text-neutral-600 mb-5">
                  Weet je zeker dat je <strong>{stichting.name}</strong>{' '}
                  permanent wilt verwijderen? Deze actie kan niet ongedaan
                  worden gemaakt.
                </p>
              ) : (
                <p className="text-sm text-neutral-700 mb-5">
                  Eerst {linkedCount}{' '}
                  {linkedCount === 1 ? 'school' : 'scholen'} loskoppelen voordat
                  stichting verwijderd kan worden. Loskoppelen kan via het
                  tabblad <strong>Scholen</strong>.
                </p>
              )}
              {deleteError && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-sm text-red-700">
                  {deleteError}
                </div>
              )}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!canDelete || deleteMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleteMutation.isPending ? 'Bezig...' : 'Verwijderen'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk-link dialog (Plan 27-07 — R11) */}
        {bulkLinkOpen && (
          <BulkLinkSchoolsDialog
            stichting={stichting}
            ongekoppeldeSchools={ongekoppeldeSchools ?? []}
            open={bulkLinkOpen}
            onClose={() => setBulkLinkOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

export default StichtingDetailPage;
