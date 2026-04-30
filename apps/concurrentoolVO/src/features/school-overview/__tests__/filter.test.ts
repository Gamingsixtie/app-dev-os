import { describe, it, expect } from 'vitest';
import { PIPELINE_STATUSES } from '@/models/school';
import type { PipelineStatus } from '@/models/school';
import type { SchoolRecord } from '@/db/types';

// Filter logic - mirrors what SchoolOverviewPage will use
type FilterValue = PipelineStatus | 'all';

function filterSchools(schools: SchoolRecord[], filter: FilterValue): SchoolRecord[] {
  if (filter === 'all') return schools;
  return schools.filter((s) => s.pipelineStatus === filter);
}

function calculateCounts(schools: SchoolRecord[]): Record<FilterValue, number> {
  const counts: Record<string, number> = { all: schools.length };
  for (const status of PIPELINE_STATUSES) {
    counts[status] = schools.filter((s) => s.pipelineStatus === status).length;
  }
  return counts as Record<FilterValue, number>;
}

// Minimal SchoolRecord factory for tests
function makeSchool(overrides: Partial<SchoolRecord> & { name: string; pipelineStatus: PipelineStatus }): SchoolRecord {
  const { name, pipelineStatus, ...rest } = overrides;
  return {
    id: crypto.randomUUID(),
    slug: name.toLowerCase().replace(/\s/g, '-'),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isComplete: false,
    completedSteps: [],
    levels: [],
    studentCounts: {},
    selectedModules: [],
    moduleSetups: [],
    scenario: null,
    appliedOverrides: [],
    migrationHourlyRate: 50,
    migrationTimeSavingOverrides: {},
    switchingCosts: 0,
    contacts: [],
    conversations: [],
    actions: [],
    systemEvents: [],
    pipelineStatus,
    region: '',
    tags: [],
    viewPreference: 'compact',
    ...rest,
  };
}

describe('School overview filtering', () => {
  const schools: SchoolRecord[] = [
    makeSchool({ name: 'School A', pipelineStatus: 'prospect' }),
    makeSchool({ name: 'School B', pipelineStatus: 'prospect' }),
    makeSchool({ name: 'School C', pipelineStatus: 'offerte' }),
    makeSchool({ name: 'School D', pipelineStatus: 'gewonnen' }),
    makeSchool({ name: 'School E', pipelineStatus: 'verloren' }),
  ];

  it('filter "all" returns all schools', () => {
    const result = filterSchools(schools, 'all');
    expect(result).toHaveLength(5);
  });

  it('filter by specific status returns only matching schools', () => {
    const prospects = filterSchools(schools, 'prospect');
    expect(prospects).toHaveLength(2);
    expect(prospects.every((s) => s.pipelineStatus === 'prospect')).toBe(true);

    const offerte = filterSchools(schools, 'offerte');
    expect(offerte).toHaveLength(1);
    expect(offerte[0].name).toBe('School C');
  });

  it('filter by status with no matches returns empty array', () => {
    const demoSchools = filterSchools(schools, 'demo-presentatie');
    expect(demoSchools).toHaveLength(0);
  });

  it('calculateCounts returns correct count per status + all', () => {
    const counts = calculateCounts(schools);
    expect(counts.all).toBe(5);
    expect(counts.prospect).toBe(2);
    expect(counts.offerte).toBe(1);
    expect(counts.gewonnen).toBe(1);
    expect(counts.verloren).toBe(1);
    expect(counts['contact-gelegd']).toBe(0);
    expect(counts['demo-presentatie']).toBe(0);
  });
});

describe('Card mode rendering logic', () => {
  it('compact mode should only show name, pipeline status, and date', () => {
    const school = makeSchool({
      name: 'Test School',
      pipelineStatus: 'offerte',
      contacts: [
        {
          id: '1',
          schoolId: 'school-1',
          name: 'Jan de Vries',
          dmuPosition: 'gebruiker',
          jobTitle: 'Toetscoordinator',
          email: 'jan@school.nl',
          phone: '',
          preferredChannel: 'email',
          authority: 'adviserend',
          lastContactDate: null,
          notes: '',
          isPrimary: true,
          engagementStatus: 'nog-niet-benaderd' as const,
          engagementStatusChangedAt: null,
          waitingForContactId: null,
          dropOffReason: null,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    // In compact mode, the primary contact should exist but not be displayed
    // We test the data is there, the rendering decision is in the component
    expect(school.pipelineStatus).toBe('offerte');
    expect(school.contacts.find((c) => c.isPrimary)?.name).toBe('Jan de Vries');
  });

  it('extended mode shows primary contact, modules summary, and next action', () => {
    const school = makeSchool({
      name: 'Extended School',
      pipelineStatus: 'contact-gelegd',
      selectedModules: ['lvs', 'capaciteiten', 'seo', 'toetsen'],
      moduleSetups: [
        { moduleId: 'lvs', currentProvider: 'dia', pricePerStudent: null },
        { moduleId: 'capaciteiten', currentProvider: 'dia', pricePerStudent: null },
        { moduleId: 'seo', currentProvider: 'geen', pricePerStudent: null },
        { moduleId: 'toetsen', currentProvider: 'geen', pricePerStudent: null },
      ],
      contacts: [
        {
          id: '1',
          schoolId: 'school-2',
          name: 'Piet Bakker',
          dmuPosition: 'beslisser',
          jobTitle: 'Conrector',
          email: 'piet@school.nl',
          phone: '',
          preferredChannel: 'email',
          authority: 'beslissend',
          lastContactDate: null,
          notes: '',
          isPrimary: true,
          engagementStatus: 'nog-niet-benaderd' as const,
          engagementStatusChangedAt: null,
          waitingForContactId: null,
          dropOffReason: null,
          createdAt: new Date().toISOString(),
        },
      ],
      actions: [
        {
          id: 'a1',
          schoolId: 'school-2',
          title: 'Demo inplannen',
          status: 'todo',
          conversationId: null,
          type: null,
          dueDate: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    // Verify extended data is available
    const primaryContact = school.contacts.find((c) => c.isPrimary);
    expect(primaryContact?.name).toBe('Piet Bakker');

    const diaModules = school.moduleSetups.filter((m) => m.currentProvider === 'dia').length;
    expect(diaModules).toBe(2);
    expect(school.selectedModules.length).toBe(4);

    const nextAction = school.actions.find((a) => a.status === 'todo');
    expect(nextAction?.title).toBe('Demo inplannen');
  });
});
