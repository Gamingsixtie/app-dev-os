import { useState, useCallback } from 'react';
import { MODULE_IDS, SCHOOL_LEVELS, PROVIDERS } from '@/features/school-profile/schemas/intake-extraction.schema';
import { YEARS_PER_LEVEL, type SchoolLevel } from '@/models/school';
import { useSchoolProfileStore } from '@/features/school-profile/store';

// Display labels for modules and providers
const MODULE_LABELS: Record<string, string> = {
  rekenwiskunde: 'Reken-Wiskunde',
  nederlands: 'Nederlands',
  engels: 'Engels',
  taalverzorging: 'Taalverzorging',
  'sociaal-emotioneel': 'Sociaal-emotioneel',
  'cognitieve-capaciteiten': 'Cognitieve capaciteiten',
};

const PROVIDER_LABELS: Record<string, string> = {
  'cito-oud': 'Cito (oud)',
  'cito-nieuw': 'Cito (nieuw)',
  dia: 'DIA',
  jij: 'JIJ (IEP)',
  overig: 'Overig',
  geen: 'Geen / onbekend',
};

const LEVEL_LABELS: Record<string, string> = {
  'vmbo-b': 'VMBO-B',
  'vmbo-k': 'VMBO-K',
  'vmbo-gt': 'VMBO-GT',
  havo: 'HAVO',
  vwo: 'VWO',
};

const SIGNAL_OPTIONS = [
  { value: 'interesse', label: 'Interesse' },
  { value: 'twijfel', label: 'Twijfel' },
  { value: 'neutraal', label: 'Neutraal' },
] as const;

interface ModuleEntry {
  moduleId: string;
  provider: string;
  price: string;
}

interface StructuredIntakeFormProps {
  disabled: boolean;
  onAnalyze: (notes: string) => void;
  onCancel: () => void;
}

function buildNotesFromFields(fields: {
  schoolName: string;
  levels: string[];
  studentCounts: Record<string, Record<string, string>>;
  modules: ModuleEntry[];
  contactName: string;
  contactRole: string;
  signal: string;
  notes: string;
}): string {
  const lines: string[] = [];

  if (fields.schoolName) lines.push(`School: ${fields.schoolName}`);
  if (fields.levels.length) lines.push(`Niveaus: ${fields.levels.join(', ')}`);

  for (const level of fields.levels) {
    const yearCounts = fields.studentCounts[level];
    if (!yearCounts) continue;
    const parts = Object.entries(yearCounts)
      .filter(([, count]) => count && Number(count) > 0)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, count]) => `leerjaar ${year}: ${count}`);
    if (parts.length > 0) {
      lines.push(`Leerlingen ${LEVEL_LABELS[level] || level}: ${parts.join(', ')}`);
    }
  }

  for (const mod of fields.modules) {
    if (mod.provider && mod.provider !== 'geen') {
      let line = `Module ${MODULE_LABELS[mod.moduleId] || mod.moduleId}: aanbieder ${PROVIDER_LABELS[mod.provider] || mod.provider}`;
      if (mod.price) line += `, €${mod.price} per leerling`;
      lines.push(line);
    }
  }

  if (fields.contactName) {
    let line = `Contactpersoon: ${fields.contactName}`;
    if (fields.contactRole) line += ` (${fields.contactRole})`;
    lines.push(line);
  }

  if (fields.signal) lines.push(`Signaal: ${fields.signal}`);
  if (fields.notes.trim()) lines.push(`\nOverige notities:\n${fields.notes.trim()}`);

  return lines.join('\n');
}

export default function StructuredIntakeForm({ disabled, onAnalyze, onCancel }: StructuredIntakeFormProps) {
  const storeSchoolName = useSchoolProfileStore((s) => s.schoolName);
  const [schoolName, setSchoolName] = useState(storeSchoolName || '');
  const [levels, setLevels] = useState<string[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, Record<string, string>>>({});
  const [modules, setModules] = useState<ModuleEntry[]>(
    MODULE_IDS.map((id) => ({ moduleId: id, provider: '', price: '' })),
  );
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [signal, setSignal] = useState('');
  const [notes, setNotes] = useState('');

  const toggleLevel = useCallback((level: string) => {
    setLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  }, []);

  const updateModuleProvider = useCallback((moduleId: string, provider: string) => {
    setModules((prev) =>
      prev.map((m) => (m.moduleId === moduleId ? { ...m, provider } : m)),
    );
  }, []);

  const updateModulePrice = useCallback((moduleId: string, price: string) => {
    setModules((prev) =>
      prev.map((m) => (m.moduleId === moduleId ? { ...m, price } : m)),
    );
  }, []);

  const updateStudentCount = useCallback((level: string, year: string, count: string) => {
    setStudentCounts((prev) => ({
      ...prev,
      [level]: { ...(prev[level] || {}), [year]: count },
    }));
  }, []);

  const hasContent = schoolName || levels.length > 0 || contactName || notes.trim();

  const handleSubmit = () => {
    const notesString = buildNotesFromFields({
      schoolName, levels, studentCounts, modules, contactName, contactRole, signal, notes,
    });
    if (notesString.trim()) onAnalyze(notesString);
  };

  const inputClass = 'h-[44px] w-full border border-neutral-200 rounded-lg px-4 text-base text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary disabled:opacity-50';
  const labelClass = 'block text-[14px] font-semibold text-neutral-700 mb-1';
  const subLabelClass = 'block text-xs text-neutral-500 mb-1';

  return (
    <div className="flex flex-col gap-5">
      {/* School & Niveaus */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 flex flex-col gap-4">
        <div>
          <label className={labelClass}>Schoolnaam</label>
          <input
            type="text"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            disabled={disabled}
            placeholder="Naam van de school"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Niveaus</label>
          <p className={subLabelClass}>Selecteer de niveaus die de school aanbiedt</p>
          <div className="flex flex-wrap gap-2">
            {SCHOOL_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                disabled={disabled}
                onClick={() => toggleLevel(level)}
                className={`px-4 h-[36px] rounded-full text-sm font-medium border transition-colors disabled:opacity-50 ${
                  levels.includes(level)
                    ? 'bg-cito-primary text-white border-cito-primary'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-cito-primary'
                }`}
              >
                {LEVEL_LABELS[level]}
              </button>
            ))}
          </div>
        </div>

        {levels.length > 0 && (
          <div>
            <label className={labelClass}>Leerlingaantal per leerjaar</label>
            <p className={subLabelClass}>Vul per niveau het aantal leerlingen per leerjaar in</p>
            <div className="flex flex-col gap-4 mt-2">
              {levels.map((level) => {
                const years = YEARS_PER_LEVEL[level as SchoolLevel] || [];
                return (
                  <div key={level}>
                    <span className="text-sm font-medium text-neutral-700">{LEVEL_LABELS[level]}</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {years.map((year) => (
                        <div key={year} className="flex items-center gap-1">
                          <span className="text-xs text-neutral-500 w-10">Jaar {year}</span>
                          <input
                            type="number"
                            min={0}
                            value={studentCounts[level]?.[String(year)] || ''}
                            onChange={(e) => updateStudentCount(level, String(year), e.target.value)}
                            disabled={disabled}
                            placeholder="0"
                            className="h-10 w-20 text-center border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cito-primary disabled:opacity-50"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modules & Aanbieders */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <label className={labelClass}>Huidige toetsen</label>
        <p className={subLabelClass}>Welke aanbieder gebruikt de school per module? Laat leeg als onbekend.</p>
        <div className="flex flex-col gap-3 mt-2">
          {MODULE_IDS.map((moduleId) => {
            const mod = modules.find((m) => m.moduleId === moduleId)!;
            return (
              <div key={moduleId} className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                <span className="text-sm text-neutral-700 font-medium w-40 shrink-0">
                  {MODULE_LABELS[moduleId]}
                </span>
                <select
                  value={mod.provider}
                  onChange={(e) => updateModuleProvider(moduleId, e.target.value)}
                  disabled={disabled}
                  className="h-10 border border-neutral-200 rounded-lg px-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary bg-white disabled:opacity-50 w-40"
                >
                  <option value="">— kies —</option>
                  {PROVIDERS.map((p) => (
                    <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
                  ))}
                </select>
                {mod.provider && mod.provider !== 'geen' && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-neutral-500">€</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={mod.price}
                      onChange={(e) => updateModulePrice(moduleId, e.target.value)}
                      disabled={disabled}
                      placeholder="prijs/lln"
                      className="h-10 w-28 border border-neutral-200 rounded-lg px-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary disabled:opacity-50"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contactpersoon */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 flex flex-col gap-3">
        <label className={labelClass}>Contactpersoon</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            disabled={disabled}
            placeholder="Naam contactpersoon"
            className={inputClass}
          />
          <input
            type="text"
            value={contactRole}
            onChange={(e) => setContactRole(e.target.value)}
            disabled={disabled}
            placeholder="Rol (bijv. toetscoordinator, MT-lid)"
            className={inputClass}
          />
        </div>
      </div>

      {/* Signaal */}
      <div>
        <label className={labelClass}>Wat is uw indruk?</label>
        <div className="flex gap-2">
          {SIGNAL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => setSignal(signal === opt.value ? '' : opt.value)}
              className={`px-4 h-[36px] rounded-full text-sm font-medium border transition-colors disabled:opacity-50 ${
                signal === opt.value
                  ? 'bg-cito-primary text-white border-cito-primary'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-cito-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vrije notities */}
      <div>
        <label className={labelClass}>Overige notities</label>
        <p className={subLabelClass}>Actiepunten, afspraken, bijzonderheden, of alles wat niet in bovenstaande velden past</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          disabled={disabled}
          placeholder="Bijv. volgende week offerte sturen, school twijfelt over DIA contract..."
          className="w-full border border-neutral-200 rounded-lg px-4 py-3 text-base text-neutral-700 focus:outline-none focus:ring-2 focus:ring-cito-primary resize-y disabled:opacity-50"
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="h-[44px] px-4 text-[14px] font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          Annuleren
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !hasContent}
          className="h-[44px] px-6 text-[14px] font-semibold bg-cito-primary text-white rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50"
        >
          {disabled ? 'AI analyseert...' : 'Analyseer notities'}
        </button>
      </div>
    </div>
  );
}
