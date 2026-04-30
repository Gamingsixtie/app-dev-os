import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  extractIntakeFromNotes,
  resolveStudentCounts,
  enrichModuleSetupsWithDefaultPrices,
  type EnrichedModuleSetup,
} from '../../lib/ai-intake';
import type { IntakeExtraction } from '../../lib/ai-intake';
import { useSchoolProfileStore } from '../school-profile/store';
import { SCHOOL_LEVEL_LABELS, CURRENT_PROVIDER_LABELS, type SchoolLevel, type DMUPosition } from '../../models/school';
import { detectScenario } from '../../engine/scenario-detection';
import { MODULE_CATALOG } from '../../models/modules';
import { formatCurrency } from '../../lib/format';
import { addContact, addAction, addConversation } from '../../db/operations';
import { useConversations } from '../../hooks/useConversations';

interface IntakePanelProps {
  onComplete: () => void;
  onSkip: () => void;
}

// ─── 4-section notes structure ──────────────────────────────────────────────

const SECTIONS = [
  {
    key: 'school',
    label: 'School & Niveaus',
    placeholder:
      'Bijv. "HAVO en VWO, totaal 350 leerlingen. Leerjaar 1: 150, leerjaar 2: 140..."',
  },
  {
    key: 'modules',
    label: 'Modules & Aanbieders',
    placeholder:
      'Bijv. "Rekenwiskunde en Nederlands via DIA, pakket NE voor €5,84. Engels ook DIA. JIJ! voor sociaal-emotioneel (zit in licentie). Of: IEP voor alles."',
  },
  {
    key: 'contacts',
    label: 'Contactpersonen',
    placeholder:
      'Bijv. "Jan de Vries, toetscoördinator, jan@school.nl. Lisa Bakker, MT-lid."',
  },
  {
    key: 'actions',
    label: 'Actiepunten & Overig',
    placeholder:
      'Bijv. "Offerte sturen volgende week. School wil overstappen van DIA naar Leerling in Beeld. Interesse in Plus-bundel. Staffelkorting 10% bij DIA."',
  },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

function combineNotes(sections: Record<SectionKey, string>): string {
  return SECTIONS.map((s) => {
    const text = sections[s.key].trim();
    if (!text) return '';
    return `## ${s.label}\n${text}`;
  })
    .filter(Boolean)
    .join('\n\n');
}

function hasAnyContent(sections: Record<SectionKey, string>): boolean {
  return SECTIONS.some((s) => sections[s.key].trim().length > 0);
}

// ─── DMU position mapping ───────────────────────────────────────────────────

function mapDmuPosition(dmuPos?: string): DMUPosition {
  // Map legacy position names to new model
  const LEGACY_MAP: Record<string, DMUPosition> = {
    coordinator: 'gebruiker',
    mt: 'beslisser',
    finance: 'inkoper',
  };
  if (dmuPos && dmuPos in LEGACY_MAP) return LEGACY_MAP[dmuPos];
  // Check if it's already a valid new position
  const validPositions: string[] = ['beslisser', 'inkoper', 'adviseur', 'gebruiker', 'beinvloeder', 'overig'];
  if (dmuPos && validPositions.includes(dmuPos)) return dmuPos as DMUPosition;
  return 'overig';
}

// ─── Extracted data preview ───────────────────────────────────────────────────

function ExtractionPreview({
  extraction,
  enrichedSetups,
}: {
  extraction: IntakeExtraction;
  enrichedSetups: EnrichedModuleSetup[];
}) {
  const { levels, studentCountsPerLevel, studentCountsPerYear, unsureAbout } = extraction;
  const hasPerYear = studentCountsPerYear && Object.keys(studentCountsPerYear).length > 0;
  const hasPerLevel = studentCountsPerLevel && Object.keys(studentCountsPerLevel).length > 0;

  return (
    <div className="space-y-4">
      {/* Levels */}
      {levels.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
            Niveaus
          </div>
          <div className="flex flex-wrap gap-2">
            {levels.map((l) => (
              <span key={l} className="bg-cito-primary/10 text-cito-primary text-sm font-medium px-3 py-1 rounded-full">
                {SCHOOL_LEVEL_LABELS[l as SchoolLevel]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Student counts — per year (preferred) or per level (fallback) */}
      {hasPerYear && (
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
            Leerlingaantallen per leerjaar
          </div>
          <div className="space-y-2">
            {Object.entries(studentCountsPerYear!).map(([level, years]) => (
              <div key={level}>
                <span className="text-sm font-medium text-neutral-900">
                  {SCHOOL_LEVEL_LABELS[level as SchoolLevel] ?? level}
                </span>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                  {Object.entries(years)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([year, count]) => (
                      <span key={year} className="text-xs text-neutral-600">
                        Jaar {year}: <span className="font-medium text-neutral-800">{Number(count)}</span>
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {!hasPerYear && hasPerLevel && (
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
            Leerlingaantallen
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(studentCountsPerLevel!).map(([level, count]) => (
              <div key={level} className="text-sm">
                <span className="font-medium text-neutral-900">
                  {SCHOOL_LEVEL_LABELS[level as SchoolLevel] ?? level}:
                </span>{' '}
                <span className="text-neutral-600">{Number(count)} leerlingen</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module setups with price source labels */}
      {enrichedSetups.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
            Huidige situatie per module
          </div>
          <div className="space-y-2">
            {enrichedSetups.map((setup) => {
              const moduleDef = MODULE_CATALOG.find((m) => m.id === setup.moduleId);
              const providerLabel =
                setup.currentProvider === 'overig' && setup.customProviderName
                  ? setup.customProviderName
                  : CURRENT_PROVIDER_LABELS[setup.currentProvider as keyof typeof CURRENT_PROVIDER_LABELS];
              return (
                <div key={setup.moduleId} className="flex items-center justify-between gap-3 text-sm py-1 border-b border-neutral-100 last:border-0">
                  <span className="font-medium text-neutral-900">
                    {moduleDef?.name ?? setup.moduleId}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      setup.currentProvider === 'geen'
                        ? 'bg-neutral-100 text-neutral-500'
                        : setup.currentProvider.startsWith('cito')
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-orange-50 text-orange-700'
                    }`}>
                      {providerLabel}
                    </span>
                    {setup.pricePerStudent !== null && (
                      <span className="text-neutral-500 text-xs">
                        {formatCurrency(setup.pricePerStudent)}/lln
                        {setup.priceSource === 'default' && setup.priceContext && (
                          <span className="ml-1 text-neutral-400">({setup.priceContext})</span>
                        )}
                        {setup.priceSource === 'default' && !setup.priceContext && (
                          <span className="ml-1 text-neutral-400">(publicatieprijs)</span>
                        )}
                      </span>
                    )}
                    {setup.currentProvider === 'jij' && setup.pricePerStudent === null && (
                      <span className="text-blue-600 text-xs">licentiemodel — prijs wordt berekend</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact persons */}
      {extraction.contactPersonen.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
            Contactpersonen
          </div>
          <div className="space-y-1">
            {extraction.contactPersonen.map((cp, i) => (
              <div key={i} className="text-sm text-neutral-700">
                <span className="font-medium">{cp.naam}</span>
                {cp.rol && <span className="text-neutral-500"> — {cp.rol}</span>}
                {cp.email && <span className="text-neutral-500"> ({cp.email})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action items */}
      {extraction.actiePunten.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
            Actiepunten
          </div>
          <ul className="space-y-1">
            {extraction.actiePunten.map((ap, i) => (
              <li key={i} className="text-sm text-neutral-700">
                • <span className="font-medium">{ap.wat}</span>
                {ap.wanneer && <span className="text-neutral-500"> — {ap.wanneer}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Unsure about */}
      {unsureAbout.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 flex-shrink-0" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
              Controleer deze punten
            </span>
          </div>
          <ul className="space-y-1">
            {unsureAbout.map((item, i) => (
              <li key={i} className="text-sm text-amber-800">• {item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function IntakePanel({ onComplete, onSkip }: IntakePanelProps) {
  const [sections, setSections] = useState<Record<SectionKey, string>>({
    school: '',
    modules: '',
    contacts: '',
    actions: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [extraction, setExtraction] = useState<IntakeExtraction | null>(null);
  const [enrichedSetups, setEnrichedSetups] = useState<EnrichedModuleSetup[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { setLevels, setStudentCounts, setSelectedModules, setModuleSetups, setCurrentStep, setScenario, activeSchoolId } = useSchoolProfileStore();
  const queryClient = useQueryClient();
  const { data: conversations } = useConversations(activeSchoolId ?? '');

  const updateSection = (key: SectionKey, value: string) => {
    setSections((prev) => ({ ...prev, [key]: value }));
  };

  const handleAnalyse = async () => {
    if (!hasAnyContent(sections)) return;
    setStatus('loading');
    setErrorMsg('');
    setExtraction(null);
    setEnrichedSetups([]);

    try {
      const combinedNotes = combineNotes(sections);
      const result = await extractIntakeFromNotes(combinedNotes);
      setExtraction(result);
      setEnrichedSetups(enrichModuleSetupsWithDefaultPrices(result.moduleSetups));
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Onbekende fout');
      setStatus('error');
    }
  };

  const handleConfirm = async () => {
    if (!extraction) return;

    setIsSaving(true);
    try {
      // Populate school profile store
      const levels = extraction.levels as SchoolLevel[];
      setLevels(levels);

      // Resolve student counts: prefer per-year, fallback to per-level distribution
      const studentCounts = resolveStudentCounts(levels, extraction);
      setStudentCounts(studentCounts);

      setSelectedModules(extraction.selectedModules);

      // Use enriched setups (with auto-filled default prices)
      const mappedSetups = enrichedSetups.map((s) => ({
        moduleId: s.moduleId,
        currentProvider: s.currentProvider,
        pricePerStudent: s.pricePerStudent,
        customProviderName: s.customProviderName,
      }));

      if (mappedSetups.length > 0) {
        setModuleSetups(mappedSetups);

        // Auto-detect and set scenario from module setups
        const detection = detectScenario(mappedSetups);
        setScenario(detection.recommended);
      }

      // Save to Supabase if we have a school context
      const schoolId = activeSchoolId;
      if (schoolId) {
        // Save extracted contacts
        for (const cp of extraction.contactPersonen) {
          if (!cp.naam) continue;
          await addContact(schoolId, {
            name: cp.naam,
            dmuPosition: mapDmuPosition(cp.dmuPositie),
            jobTitle: cp.rol || '',
            email: cp.email || '',
            phone: cp.telefoon || '',
          });
        }

        // Save extracted action items
        for (const ap of extraction.actiePunten) {
          if (!ap.wat) continue;
          await addAction(schoolId, {
            title: [ap.wat, ap.wanneer, ap.verantwoordelijke].filter(Boolean).join(' — '),
          });
        }

        // Save conversation record with combined notes
        const combinedNotes = combineNotes(sections);
        await addConversation(schoolId, {
          date: new Date().toISOString().slice(0, 10),
          contactId: conversations?.[0]?.contactId ?? '',
          content: combinedNotes,
          tags: ['ai-intake'],
        });

        // Invalidate React Query caches
        queryClient.invalidateQueries({ queryKey: ['contacts', schoolId] });
        queryClient.invalidateQueries({ queryKey: ['actions', schoolId] });
        queryClient.invalidateQueries({ queryKey: ['conversations', schoolId] });
        queryClient.invalidateQueries({ queryKey: ['schools'] });
        queryClient.invalidateQueries({ queryKey: ['school'] });
      }

      // Jump to step 4 (Situatie) or 0 depending on what was extracted
      const jumpStep = levels.length > 0 ? 3 : 0;
      setCurrentStep(jumpStep);

      onComplete();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Opslaan mislukt. Probeer het opnieuw.');
      setStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-8 py-12">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 bg-cito-primary/10 text-cito-primary text-xs font-semibold px-3 py-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Gespreksnotities
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
            ✦ AI
          </span>
        </div>
        <h1 className="text-[24px] font-semibold text-cito-primary leading-tight">
          Noteer wat u hoort — AI vult de wizard in
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Vul per sectie uw aantekeningen in. De AI extraheert automatisch niveaus,
          leerlingaantallen, modules, contactpersonen en actiepunten.
        </p>
      </div>

      {/* Section textareas */}
      <div className="space-y-4 mb-4">
        {SECTIONS.map((section) => (
          <div key={section.key}>
            <label
              htmlFor={`intake-${section.key}`}
              className="block text-sm font-semibold text-neutral-700 mb-1"
            >
              {section.label}
            </label>
            <textarea
              id={`intake-${section.key}`}
              value={sections[section.key]}
              onChange={(e) => updateSection(section.key, e.target.value)}
              placeholder={section.placeholder}
              rows={3}
              className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-cito-primary focus:border-2 focus:outline-none resize-y leading-relaxed"
            />
          </div>
        ))}
      </div>

      {/* Analyse button */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={handleAnalyse}
          disabled={!hasAnyContent(sections) || status === 'loading'}
          className="inline-flex items-center gap-2 bg-cito-primary text-white text-sm font-semibold py-2.5 px-5 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? (
            <>
              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              AI analyseert...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Analyseer notities
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-neutral-500 hover:text-neutral-700 py-2.5 px-4 rounded-lg border border-neutral-200 hover:border-neutral-300"
        >
          Sla over — open wizard handmatig
        </button>
      </div>

      {/* Error */}
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Extraction preview */}
      {status === 'done' && extraction && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-600" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <h2 className="text-[15px] font-semibold text-neutral-900">
              AI heeft het volgende herkend
            </h2>
          </div>

          <ExtractionPreview extraction={extraction} enrichedSetups={enrichedSetups} />

          {/* Confirm / edit */}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-cito-primary text-white text-sm font-semibold py-2.5 px-5 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Opslaan...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Overnemen en doorgaan
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setExtraction(null); setStatus('idle'); }}
              className="text-sm text-neutral-500 hover:text-neutral-700 py-2.5 px-4 rounded-lg border border-neutral-200 hover:border-neutral-300"
            >
              Pas notities aan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
