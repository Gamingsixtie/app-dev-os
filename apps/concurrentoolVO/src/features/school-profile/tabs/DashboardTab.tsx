import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useSchoolProfileStore } from '../store';
import { updateSchoolData } from '@/db/operations';
import { uniqueSlug } from '@/lib/slugify';
import { calculateComparison, getTotalStudents } from '@/engine/price-comparison';
import { calculateUpsell } from '@/engine/upsell';
import { useSchoolPrices } from '@/hooks/useSchoolPrices';
import {
  SCHOOL_LEVELS,
  SCHOOL_LEVEL_LABELS,
  SCENARIO_LABELS,
} from '@/models/school';
import type { PipelineStatus, SchoolLevel, Scenario } from '@/models/school';
import PipelineBadge from '@/components/ui/PipelineBadge';
import { SCHOOL_TAB_ROUTES } from '@/router/routes';
import UpsellCard from '../components/UpsellCard';
import DmuMatrix from '../components/DmuMatrix';
import CustomerJourneySummary from '../components/CustomerJourneySummary';
import { useContacts } from '@/hooks/useContacts';
import { useSchool } from '@/hooks/useSchools';
import { useConversations } from '@/hooks/useConversations';
import { useSystemEvents } from '@/hooks/useSystemEvents';

// Context-smart actions per pipeline status
const SMART_ACTIONS: Record<
  PipelineStatus,
  { primary: { label: string; tab: string }; secondary: { label: string; tab: string }[] }
> = {
  prospect: {
    primary: { label: 'Vergelijking maken', tab: 'vergelijking' },
    secondary: [
      { label: 'Contact opnemen', tab: 'contacten' },
      { label: 'Gesprek vastleggen', tab: 'gesprekken' },
    ],
  },
  'contact-gelegd': {
    primary: { label: 'Demo inplannen', tab: 'gesprekken' },
    secondary: [
      { label: 'Gesprek vastleggen', tab: 'gesprekken' },
      { label: 'Vergelijking bekijken', tab: 'vergelijking' },
    ],
  },
  'demo-presentatie': {
    primary: { label: 'Offerte klaarmaken', tab: 'vergelijking' },
    secondary: [
      { label: 'Gesprek vastleggen', tab: 'gesprekken' },
      { label: 'Vergelijking bijwerken', tab: 'vergelijking' },
    ],
  },
  offerte: {
    primary: { label: 'Status bijwerken', tab: 'gesprekken' },
    secondary: [
      { label: 'Gesprek vastleggen', tab: 'gesprekken' },
      { label: 'Vergelijking bekijken', tab: 'vergelijking' },
    ],
  },
  gewonnen: {
    primary: { label: 'Producten bijwerken', tab: 'producten' },
    secondary: [
      { label: 'Migratie bekijken', tab: 'vergelijking' },
      { label: 'Gesprek vastleggen', tab: 'gesprekken' },
    ],
  },
  verloren: {
    primary: { label: 'Laatste gesprek bekijken', tab: 'gesprekken' },
    secondary: [
      { label: 'Vergelijking bekijken', tab: 'vergelijking' },
      { label: 'Opnieuw benaderen', tab: 'contacten' },
    ],
  },
};

export default function DashboardTab() {
  const { slug } = useParams({ from: '/scholen/$slug' });
  const navigate = useNavigate();

  const activeSchoolId = useSchoolProfileStore((s) => s.activeSchoolId);
  const schoolName = useSchoolProfileStore((s) => s.schoolName);
  const pipelineStatus = useSchoolProfileStore((s) => s.pipelineStatus);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);
  const contacts = useSchoolProfileStore((s) => s.contacts);
  const levels = useSchoolProfileStore((s) => s.levels);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);
  const scenario = useSchoolProfileStore((s) => s.scenario);
  const region = useSchoolProfileStore((s) => s.region);

  // Check if school profile is complete via DB record
  const { data: schoolRecord } = useSchool(slug);
  const isComplete = schoolRecord?.isComplete ?? true;

  // School-specific prices for upsell calculation
  const { data: schoolPrices } = useSchoolPrices(activeSchoolId ?? '');

  // Live contacts from DB for DMU matrix (store contacts may be stale)
  const { data: liveContacts } = useContacts(activeSchoolId ?? '');
  const { data: liveConversations = [] } = useConversations(activeSchoolId ?? '');
  const { data: liveSystemEvents = [] } = useSystemEvents(activeSchoolId ?? '');

  // Compute upsell opportunities
  const hasModuleSetups = moduleSetups.some((m) => m.currentProvider !== 'geen');

  const upsellOpportunities = useMemo(() => {
    if (selectedModules.length === 0 || moduleSetups.length === 0) return [];

    try {
      const comparisonResult = calculateComparison(selectedModules, studentCounts);
      return calculateUpsell(moduleSetups, comparisonResult);
    } catch {
      return [];
    }
  }, [selectedModules, studentCounts, moduleSetups, schoolPrices]);


  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(schoolName);
  const [editRegion, setEditRegion] = useState(region);
  const [editLevels, setEditLevels] = useState<SchoolLevel[]>(levels);
  const [editScenario, setEditScenario] = useState<Scenario | null>(scenario);

  const totalStudents = getTotalStudents(studentCounts);
  const effectiveContacts = liveContacts ?? contacts;
  const lastContactDate = effectiveContacts
    .filter((c) => c.lastContactDate)
    .sort((a, b) => (b.lastContactDate! > a.lastContactDate! ? 1 : -1))[0]?.lastContactDate;

  const navigateToTab = (tab: string) => {
    const to = SCHOOL_TAB_ROUTES[tab as keyof typeof SCHOOL_TAB_ROUTES] ?? SCHOOL_TAB_ROUTES.overzicht;
    navigate({ to, params: { slug } });
  };

  const handleStartEdit = () => {
    setEditName(schoolName);
    setEditRegion(region);
    setEditLevels([...levels]);
    setEditScenario(scenario);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!activeSchoolId) return;

    const updates: Record<string, unknown> = {};
    if (editName !== schoolName) {
      updates.name = editName;
      updates.slug = await uniqueSlug(editName, activeSchoolId);
    }
    if (editRegion !== region) updates.region = editRegion;
    if (JSON.stringify(editLevels) !== JSON.stringify(levels)) updates.levels = editLevels;
    if (editScenario !== scenario) updates.scenario = editScenario;

    if (Object.keys(updates).length > 0) {
      await updateSchoolData(activeSchoolId, updates);
      // If slug changed, navigate to new URL
      if (updates.slug) {
        navigate({ to: '/scholen/$slug', params: { slug: updates.slug as string } });
      }
    }
    setIsEditing(false);
  };

  const handleLevelToggle = (level: SchoolLevel) => {
    setEditLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  };

  const actions = SMART_ACTIONS[pipelineStatus];

  if (!isComplete) {
    return (
      <div className="p-8 max-sm:p-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-amber-500 mb-3" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <h2 className="text-lg font-semibold text-amber-800">
            Schoolprofiel is nog niet voltooid
          </h2>
          <p className="mt-2 text-sm text-amber-700 max-w-md mx-auto">
            Vul de wizard in om prijsvergelijkingen te kunnen maken voor deze school.
          </p>
          <Link
            to="/scholen/$slug/wizard/$step"
            params={{ slug, step: '1' }}
            className="mt-4 inline-flex items-center gap-2 bg-cito-accent text-white font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm"
          >
            Profiel voltooien
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-sm:p-4">
      {/* Summary block */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-[14px] text-neutral-500">Pipeline</p>
            <div className="mt-1">
              <PipelineBadge status={pipelineStatus} />
            </div>
          </div>
          <div>
            <p className="text-[14px] text-neutral-500">Modules</p>
            <p className="text-[20px] font-semibold text-neutral-900 mt-1">
              {selectedModules.length}
            </p>
          </div>
          <div>
            <p className="text-[14px] text-neutral-500">Contacten</p>
            <p className="text-[20px] font-semibold text-neutral-900 mt-1">
              {effectiveContacts.length}
            </p>
          </div>
          <div>
            <p className="text-[14px] text-neutral-500">Laatst contact</p>
            <p className="text-[20px] font-semibold text-neutral-900 mt-1">
              {lastContactDate
                ? new Intl.DateTimeFormat('nl-NL', {
                    day: 'numeric',
                    month: 'short',
                  }).format(new Date(lastContactDate))
                : '--'}
            </p>
          </div>
        </div>
      </div>

      {/* Snelle acties */}
      <div className="mt-6">
        <h2 className="text-[20px] font-semibold text-neutral-900 mb-4">Snelle acties</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigateToTab(actions.primary.tab)}
            className="h-11 px-6 bg-cito-accent text-white text-[14px] font-semibold rounded-lg hover:opacity-90"
          >
            {actions.primary.label}
          </button>
          {actions.secondary.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => navigateToTab(action.tab)}
              className="h-11 px-6 text-cito-primary text-[14px] font-semibold rounded-lg hover:bg-neutral-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schoolgegevens */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-semibold text-neutral-900">Schoolgegevens</h2>
          {!isEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="text-[14px] text-cito-primary hover:underline"
            >
              Bewerken
            </button>
          )}
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          {isEditing ? (
            /* Edit mode */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] text-neutral-500 mb-1">Schoolnaam</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-11 px-4 border border-neutral-200 rounded-lg text-[16px] text-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-[14px] text-neutral-500 mb-1">Regio</label>
                  <input
                    type="text"
                    value={editRegion}
                    onChange={(e) => setEditRegion(e.target.value)}
                    className="w-full h-11 px-4 border border-neutral-200 rounded-lg text-[16px] text-neutral-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[14px] text-neutral-500 mb-2">Type</label>
                <div className="flex flex-wrap gap-3">
                  {SCHOOL_LEVELS.map((level) => (
                    <label key={level} className="inline-flex items-center gap-2 text-[14px]">
                      <input
                        type="checkbox"
                        checked={editLevels.includes(level)}
                        onChange={() => handleLevelToggle(level)}
                        className="rounded border-neutral-300"
                      />
                      {SCHOOL_LEVEL_LABELS[level]}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[14px] text-neutral-500 mb-2">Scenario</label>
                <div className="flex gap-4">
                  {(['A', 'B'] as const).map((s) => (
                    <label key={s} className="inline-flex items-center gap-2 text-[14px]">
                      <input
                        type="radio"
                        name="scenario"
                        checked={editScenario === s}
                        onChange={() => setEditScenario(s)}
                        className="border-neutral-300"
                      />
                      {SCENARIO_LABELS[s].title}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="h-11 px-6 bg-cito-accent text-white text-[14px] font-semibold rounded-lg hover:opacity-90"
                >
                  Opslaan
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="h-11 px-6 text-cito-primary text-[14px] font-semibold rounded-lg hover:bg-neutral-50"
                >
                  Annuleren
                </button>
              </div>
            </div>
          ) : (
            /* Display mode */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-[14px] text-neutral-500">Schoolnaam</p>
                <p className="text-[16px] text-neutral-700">{schoolName}</p>
              </div>
              <div>
                <p className="text-[14px] text-neutral-500">Regio</p>
                <p className="text-[16px] text-neutral-700">{region || '--'}</p>
              </div>
              <div>
                <p className="text-[14px] text-neutral-500">Type</p>
                <p className="text-[16px] text-neutral-700">
                  {levels.map((l) => SCHOOL_LEVEL_LABELS[l]).join(' / ') || '--'}
                </p>
              </div>
              <div>
                <p className="text-[14px] text-neutral-500">Leerlingen</p>
                <p className="text-[16px] text-neutral-700">
                  {totalStudents > 0 ? totalStudents.toLocaleString('nl-NL') : '--'}
                </p>
              </div>
              <div>
                <p className="text-[14px] text-neutral-500">Scenario</p>
                <p className="text-[16px] text-neutral-700">
                  {scenario ? SCENARIO_LABELS[scenario].title : '--'}
                </p>
              </div>
              <div>
                <p className="text-[14px] text-neutral-500">Modules</p>
                <p className="text-[16px] text-neutral-700">
                  {selectedModules.length > 0
                    ? `${selectedModules.length} geselecteerd`
                    : '--'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Klantreis-overzicht */}
      {(liveContacts ?? contacts).length > 0 && (
        <div className="mt-6">
          <CustomerJourneySummary
            contacts={liveContacts ?? contacts}
            conversations={liveConversations}
            systemEvents={liveSystemEvents}
          />
        </div>
      )}

      {/* DMU-beslissingsoverzicht */}
      <DmuMatrix
        schoolId={activeSchoolId ?? ''}
        contacts={liveContacts ?? contacts}
        conversations={liveConversations}
        pipelineStatus={pipelineStatus}
        onNavigateToPipeline={() => {
          // Scroll to profile header where pipeline dropdown lives
          const header = document.querySelector('[data-pipeline-select]');
          if (header) header.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Upsell-kansen */}
      <div className="mt-6">
        <UpsellCard
          opportunities={upsellOpportunities}
          schoolSlug={slug}
          hasModuleSetups={hasModuleSetups}
        />
      </div>
    </div>
  );
}
