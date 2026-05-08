import { useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useSchools } from '@/hooks/useSchools';
import { useAuth } from '@/features/auth/AuthProvider';
import { detectV1Data } from '@/db/migrations';
import type { SchoolRecord } from '@/db/types';
import type { PipelineStatus } from '@/models/school';
import { PIPELINE_STATUSES, PIPELINE_STATUS_LABELS, ENGAGEMENT_STATUSES } from '@/models/school';
import type { EngagementStatus } from '@/models/school';
import SchoolCard from './SchoolCard';
import SchoolSearchBar from './SchoolSearchBar';
import SchoolCardSkeleton from './SchoolCardSkeleton';
import AddSchoolButton from './AddSchoolButton';
import EmptySchoolState from './EmptySchoolState';
import DeleteSchoolDialog from '@/components/ui/DeleteSchoolDialog';
import NotFoundRedirect from '@/components/routing/NotFoundRedirect';
import MigrationWizard from '@/features/migration/MigrationWizard';
import FilterBar from './FilterBar';
import ViewToggle from './ViewToggle';
import CardModeToggle from './CardModeToggle';
import PipelineKanbanView from './PipelineKanbanView';
import { SchoolOwnerFilter } from './SchoolOwnerFilter';
import DmuStatusFilter from './DmuStatusFilter';
import type { DmuFilterValue } from './DmuStatusFilter';

type FilterValue = PipelineStatus | 'all';

function getStoredPreference<T extends string>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return (stored as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function storePreference(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/** Mini pipeline distribution bar */
function PipelineMiniBar({ schools }: { schools: SchoolRecord[] }) {
  const total = schools.length;
  if (total === 0) return null;

  const segments: { status: PipelineStatus; count: number; color: string }[] = [
    { status: 'prospect', count: 0, color: 'bg-neutral-300' },
    { status: 'contact-gelegd', count: 0, color: 'bg-blue-400' },
    { status: 'demo-presentatie', count: 0, color: 'bg-purple-400' },
    { status: 'offerte', count: 0, color: 'bg-orange-400' },
    { status: 'gewonnen', count: 0, color: 'bg-green-500' },
    { status: 'verloren', count: 0, color: 'bg-red-400' },
  ];

  for (const school of schools) {
    const seg = segments.find((s) => s.status === school.pipelineStatus);
    if (seg) seg.count++;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-2 flex-1 rounded-full overflow-hidden bg-neutral-100">
        {segments
          .filter((s) => s.count > 0)
          .map((seg) => (
            <div
              key={seg.status}
              className={`${seg.color} transition-all duration-300`}
              style={{ width: `${(seg.count / total) * 100}%` }}
              title={`${PIPELINE_STATUS_LABELS[seg.status]}: ${seg.count}`}
            />
          ))}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {segments
          .filter((s) => s.count > 0)
          .map((seg) => (
            <span
              key={seg.status}
              className="flex items-center gap-1 text-[11px] text-neutral-500"
            >
              <span className={`inline-block w-2 h-2 rounded-full ${seg.color}`} />
              {seg.count}
            </span>
          ))}
      </div>
    </div>
  );
}

export default function SchoolOverviewPage() {
  const search = useSearch({ from: '/scholen' }) as { error?: string };
  const { data: schools, isLoading, isError, refetch } = useSchools();
  const { userProfile } = useAuth();
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SchoolRecord | null>(null);
  const [showMigration, setShowMigration] = useState(() => detectV1Data());
  const [ownerFilter, setOwnerFilter] = useState<'mine' | 'all'>(() =>
    userProfile?.role === 'accountmanager' ? 'mine' : 'all',
  );
  const [showFilters, setShowFilters] = useState(false);

  // View preferences persisted in localStorage
  const [pipelineFilter, setPipelineFilter] = useState<FilterValue>('all');
  const [dmuFilter, setDmuFilter] = useState<DmuFilterValue>('all');
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>(() =>
    getStoredPreference('school-overview-viewMode', 'list'),
  );
  const [cardMode, setCardMode] = useState<'compact' | 'extended'>(() =>
    getStoredPreference('school-overview-cardMode', 'extended'),
  );

  const handleViewModeChange = (mode: 'list' | 'pipeline') => {
    setViewMode(mode);
    storePreference('school-overview-viewMode', mode);
  };

  const handleCardModeChange = (mode: 'compact' | 'extended') => {
    setCardMode(mode);
    storePreference('school-overview-cardMode', mode);
  };

  const activeFilterCount =
    (pipelineFilter !== 'all' ? 1 : 0) + (dmuFilter !== 'all' ? 1 : 0);

  // Error state
  if (isError && !isLoading) {
    return (
      <div className="min-h-screen bg-cito-bg">
        <div className="max-w-[1200px] mx-auto pt-12 px-8 sm:px-4">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-red-500"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6M9 9l6 6" />
              </svg>
            </div>
            <p className="text-base font-medium text-neutral-700 mb-1">
              Kon scholen niet laden
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

  // Loading
  if (isLoading || !schools) {
    return (
      <div className="min-h-screen bg-cito-bg">
        <div className="max-w-[1200px] mx-auto pt-10 px-8 sm:px-4">
          <div className="h-8 w-48 bg-neutral-200 rounded-lg animate-pulse mb-6" />
          <div className="h-11 w-full bg-neutral-200 rounded-lg animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <SchoolCardSkeleton />
            <SchoolCardSkeleton />
            <SchoolCardSkeleton />
            <SchoolCardSkeleton />
            <SchoolCardSkeleton />
            <SchoolCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Migration wizard
  if (showMigration) {
    return (
      <div className="min-h-screen bg-cito-bg">
        <MigrationWizard onDismiss={() => setShowMigration(false)} />
      </div>
    );
  }

  // Empty state
  if (schools.length === 0) {
    return (
      <div className="min-h-screen bg-cito-bg">
        <EmptySchoolState />
      </div>
    );
  }

  // Apply owner filter first
  const ownerFiltered =
    ownerFilter === 'mine'
      ? schools.filter((s) => s.ownerId === userProfile?.id)
      : schools;

  // Calculate filter counts from owner-filtered schools (before text search)
  const filterCounts: Record<FilterValue, number> = {
    all: ownerFiltered.length,
  } as Record<FilterValue, number>;
  for (const status of PIPELINE_STATUSES) {
    filterCounts[status] = ownerFiltered.filter(
      (s) => s.pipelineStatus === status,
    ).length;
  }

  // Calculate DMU filter counts
  const dmuFilterCounts: Record<DmuFilterValue, number> = {
    all: ownerFiltered.length,
  } as Record<DmuFilterValue, number>;
  for (const status of ENGAGEMENT_STATUSES) {
    dmuFilterCounts[status as DmuFilterValue] = ownerFiltered.filter((s) =>
      s.contacts?.some((c) => c.engagementStatus === status),
    ).length;
  }

  // Apply text search filter
  let filtered = query
    ? ownerFiltered.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase()),
      )
    : ownerFiltered;

  // Apply pipeline filter
  if (pipelineFilter !== 'all') {
    filtered = filtered.filter((s) => s.pipelineStatus === pipelineFilter);
  }

  // Apply DMU engagement status filter (AND logic with pipeline filter)
  if (dmuFilter !== 'all') {
    filtered = filtered.filter((s) =>
      s.contacts?.some(
        (c) => c.engagementStatus === (dmuFilter as EngagementStatus),
      ),
    );
  }

  // Stats
  const wonCount = ownerFiltered.filter(
    (s) => s.pipelineStatus === 'gewonnen',
  ).length;
  const activeCount = ownerFiltered.filter(
    (s) =>
      s.pipelineStatus !== 'gewonnen' && s.pipelineStatus !== 'verloren',
  ).length;

  return (
    <div className="min-h-screen bg-cito-bg">
      <div className="max-w-[1200px] mx-auto pt-8 pb-12 px-8 sm:px-4">
        <NotFoundRedirect show={search.error === 'not-found'} />

        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-cito-primary tracking-tight">
              Scholenoverzicht
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {ownerFiltered.length}{' '}
              {ownerFiltered.length === 1 ? 'school' : 'scholen'}
              {activeCount > 0 && (
                <>
                  <span className="mx-1.5 text-neutral-300">|</span>
                  <span>{activeCount} actief in pipeline</span>
                </>
              )}
              {wonCount > 0 && (
                <>
                  <span className="mx-1.5 text-neutral-300">|</span>
                  <span className="text-green-600 font-medium">
                    {wonCount} gewonnen
                  </span>
                </>
              )}
            </p>
          </div>
          <AddSchoolButton />
        </div>

        {/* Stats bar: pipeline distribution */}
        {ownerFiltered.length > 2 && (
          <div className="bg-white rounded-xl border border-neutral-200 px-5 py-3 mb-5">
            <PipelineMiniBar schools={ownerFiltered} />
          </div>
        )}

        {/* Unified toolbar */}
        <div className="bg-white rounded-xl border border-neutral-200 px-4 py-3 mb-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Search bar */}
            <div className="flex-1 min-w-0">
              <SchoolSearchBar value={query} onChange={setQuery} />
            </div>

            {/* Controls group */}
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {/* Owner filter */}
              {userProfile && (
                <SchoolOwnerFilter
                  value={ownerFilter}
                  onChange={setOwnerFilter}
                  userRole={userProfile.role}
                />
              )}

              {/* Divider */}
              <div className="w-px h-6 bg-neutral-200 hidden lg:block" />

              {/* Filters toggle */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-medium transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-cito-primary/10 text-cito-primary'
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="4" x2="4" y1="21" y2="14" />
                  <line x1="4" x2="4" y1="10" y2="3" />
                  <line x1="12" x2="12" y1="21" y2="12" />
                  <line x1="12" x2="12" y1="8" y2="3" />
                  <line x1="20" x2="20" y1="21" y2="16" />
                  <line x1="20" x2="20" y1="12" y2="3" />
                  <line x1="1" x2="7" y1="14" y2="14" />
                  <line x1="9" x2="15" y1="8" y2="8" />
                  <line x1="17" x2="23" y1="16" y2="16" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-cito-primary text-white text-[11px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="w-px h-6 bg-neutral-200 hidden lg:block" />

              {/* View & card toggles */}
              <ViewToggle
                activeView={viewMode}
                onViewChange={handleViewModeChange}
              />
              <CardModeToggle
                mode={cardMode}
                onModeChange={handleCardModeChange}
              />
            </div>
          </div>

          {/* Collapsible filter panel */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-neutral-100 space-y-3">
              <div>
                <span className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 block">
                  Pipeline status
                </span>
                <FilterBar
                  activeFilter={pipelineFilter}
                  onFilterChange={setPipelineFilter}
                  counts={filterCounts}
                />
              </div>
              <div>
                <span className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 block">
                  DMU engagement
                </span>
                <DmuStatusFilter
                  activeFilter={dmuFilter}
                  onFilterChange={setDmuFilter}
                  counts={dmuFilterCounts}
                />
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPipelineFilter('all');
                    setDmuFilter('all');
                  }}
                  className="text-[13px] text-cito-primary hover:text-cito-primary-light font-medium"
                >
                  Alle filters wissen
                </button>
              )}
            </div>
          )}
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && !showFilters && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[12px] text-neutral-400">
              Actieve filters:
            </span>
            {pipelineFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-cito-primary/10 text-cito-primary text-[12px] font-medium">
                {PIPELINE_STATUS_LABELS[pipelineFilter]}
                <button
                  type="button"
                  onClick={() => setPipelineFilter('all')}
                  className="hover:text-cito-primary-dark ml-0.5"
                  aria-label="Filter verwijderen"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {dmuFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-purple-50 text-purple-700 text-[12px] font-medium">
                DMU: {dmuFilter}
                <button
                  type="button"
                  onClick={() => setDmuFilter('all')}
                  className="hover:text-purple-900 ml-0.5"
                  aria-label="Filter verwijderen"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results count */}
        {(query || activeFilterCount > 0) && (
          <p className="text-[13px] text-neutral-400 mb-3">
            {filtered.length}{' '}
            {filtered.length === 1 ? 'resultaat' : 'resultaten'}
          </p>
        )}

        {/* Content: List or Kanban */}
        {viewMode === 'list' ? (
          filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((school) => (
                <SchoolCard
                  key={school.id}
                  school={school}
                  onDelete={setDeleteTarget}
                  mode={cardMode}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-neutral-400"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <p className="text-sm font-medium text-neutral-600">
                Geen scholen gevonden
              </p>
              {query && (
                <p className="text-[13px] text-neutral-400 mt-1">
                  Geen resultaten voor &lsquo;{query}&rsquo;
                </p>
              )}
            </div>
          )
        ) : (
          <PipelineKanbanView
            schools={filtered}
            cardMode={cardMode}
            onDeleteSchool={setDeleteTarget}
          />
        )}
      </div>

      <DeleteSchoolDialog
        school={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => setDeleteTarget(null)}
      />
    </div>
  );
}
