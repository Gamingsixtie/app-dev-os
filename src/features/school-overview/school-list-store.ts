import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SchoolListEntry {
  id: string;
  name: string;
  city: string;
  region: string;
  brinCode: string;
  levels: string;
  studentCount: number | null;
}

interface SchoolListState {
  entries: SchoolListEntry[];
  fileName: string | null;
  importedAt: string | null;
  importFromFile: (file: File) => Promise<{ count: number; errors: string[] }>;
  clear: () => void;
}

/** Normalize a header string for flexible column matching */
function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

/** Map common Dutch/English column names to our fields */
const COLUMN_MAP: Record<string, keyof SchoolListEntry> = {
  schoolnaam: 'name',
  school: 'name',
  naam: 'name',
  name: 'name',
  stad: 'city',
  plaats: 'city',
  city: 'city',
  woonplaats: 'city',
  vestigingsplaats: 'city',
  regio: 'region',
  region: 'region',
  gebied: 'region',
  brincode: 'brinCode',
  brin: 'brinCode',
  brinnummer: 'brinCode',
  niveaus: 'levels',
  levels: 'levels',
  schooltype: 'levels',
  onderwijstype: 'levels',
  leerlingen: 'studentCount',
  aantallleerlingen: 'studentCount',
  students: 'studentCount',
  studentcount: 'studentCount',
  aantalleerlingen: 'studentCount',
};

function generateId(): string {
  return `sl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useSchoolListStore = create<SchoolListState>()(
  persist(
    (set) => ({
      entries: [],
      fileName: null,
      importedAt: null,

      importFromFile: async (file: File) => {
        const errors: string[] = [];
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          return { count: 0, errors: ['Geen werkbladen gevonden in het bestand.'] };
        }

        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

        if (rows.length === 0) {
          return { count: 0, errors: ['Geen rijen gevonden in het werkblad.'] };
        }

        // Map headers
        const rawHeaders = Object.keys(rows[0]);
        const headerMapping: Record<string, keyof SchoolListEntry> = {};
        for (const header of rawHeaders) {
          const normalized = normalizeHeader(header);
          const mapped = COLUMN_MAP[normalized];
          if (mapped) {
            headerMapping[header] = mapped;
          }
        }

        if (!Object.values(headerMapping).includes('name')) {
          return {
            count: 0,
            errors: [
              'Geen kolom "Schoolnaam", "School" of "Naam" gevonden. ' +
              'Zorg dat het Excel-bestand een kolom heeft met de schoolnaam.',
            ],
          };
        }

        const entries: SchoolListEntry[] = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const entry: SchoolListEntry = {
            id: generateId(),
            name: '',
            city: '',
            region: '',
            brinCode: '',
            levels: '',
            studentCount: null,
          };

          for (const [header, field] of Object.entries(headerMapping)) {
            const value = row[header];
            if (field === 'studentCount') {
              const num = Number(value);
              entry.studentCount = isNaN(num) ? null : Math.round(num);
            } else {
              entry[field] = String(value ?? '').trim();
            }
          }

          if (!entry.name) {
            errors.push(`Rij ${i + 2}: schoolnaam ontbreekt, overgeslagen.`);
            continue;
          }

          entries.push(entry);
        }

        set({
          entries,
          fileName: file.name,
          importedAt: new Date().toISOString(),
        });

        return { count: entries.length, errors };
      },

      clear: () => set({ entries: [], fileName: null, importedAt: null }),
    }),
    {
      name: 'school-list-storage',
    },
  ),
);
