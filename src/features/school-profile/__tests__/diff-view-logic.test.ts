import { describe, it, expect } from 'vitest';
import {
  computeModuleDiff,
  computeContactDiff,
  computeActionDiff,
} from '@/features/school-profile/utils/diff-view';
import type { IntakeExtractionV2 } from '@/features/school-profile/schemas/intake-extraction.schema';
import type { SchoolRecord, Contact } from '@/db/types';

// Minimal fixtures
const baseExtraction: IntakeExtractionV2 = {
  levels: ['havo'],
  studentCountsPerLevel: null,
  selectedModules: ['rekenwiskunde', 'nederlands'],
  moduleSetups: [
    { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: 5.2, customProviderName: undefined },
    { moduleId: 'nederlands', currentProvider: 'cito-oud', pricePerStudent: null, customProviderName: undefined },
  ],
  unsureAbout: [],
  contactPersonen: [
    { naam: 'Jan de Vries', rol: 'Toetscoordinator', dmuPositie: 'coordinator' },
    { naam: 'Petra Bakker', rol: 'MT-lid', dmuPositie: 'mt' },
  ],
  actiePunten: [
    { wat: 'Offerte opvragen', wanneer: 'Volgende week' },
  ],
  pipelineSignaal: 'interesse',
};

const baseSchool: SchoolRecord = {
  id: 'school-1',
  slug: 'test-school',
  name: 'Test School',
  createdAt: '',
  updatedAt: '',
  isComplete: false,
  completedSteps: [],
  levels: ['havo'],
  studentCounts: {},
  selectedModules: ['rekenwiskunde'],
  moduleSetups: [
    { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: 4.0 },
  ],
  scenario: null,
  appliedOverrides: [],
  migrationHourlyRate: 50,
  migrationTimeSavingOverrides: {},
  switchingCosts: 0,
  contacts: [],
  conversations: [],
  actions: [],
  systemEvents: [],
  pipelineStatus: 'prospect',
  region: '',
  tags: [],
  viewPreference: 'compact',
};

const existingContacts: Contact[] = [
  {
    id: 'c1',
    schoolId: 'school-1',
    name: 'Jan de Vries',
    dmuPosition: 'gebruiker',
    jobTitle: 'Coordinator',
    email: 'jan@school.nl',
    phone: '',
    preferredChannel: 'email',
    authority: 'adviserend',
    lastContactDate: null,
    notes: '',
    isPrimary: true,
    engagementStatus: 'nog-niet-benaderd',
    engagementStatusChangedAt: null,
    waitingForContactId: null,
    dropOffReason: null,
    createdAt: '',
  },
];

describe('DiffView logic', () => {
  it('marks extracted module as new when not in existing school profile', () => {
    const items = computeModuleDiff(baseExtraction, baseSchool);
    const nlItem = items.find(i => i.label === 'nederlands');
    expect(nlItem).toBeDefined();
    expect(nlItem!.status).toBe('new');
    expect(nlItem!.checked).toBe(true);
  });

  it('marks extracted module as existing when already in school profile with same provider', () => {
    // rekenwiskunde exists with dia in both
    const items = computeModuleDiff(baseExtraction, baseSchool);
    const rkItem = items.find(i => i.label === 'rekenwiskunde');
    expect(rkItem).toBeDefined();
    expect(rkItem!.status).toBe('existing');
  });

  it('marks contact as conflict when name matches but details differ', () => {
    const items = computeContactDiff(baseExtraction, existingContacts);
    const janItem = items.find(i => i.label === 'Jan de Vries');
    expect(janItem).toBeDefined();
    expect(janItem!.status).toBe('conflict');
    expect(janItem!.checked).toBe(false);
    expect(janItem!.editable).toBe(true);
  });

  it('defaults new items to checked and existing items to disabled', () => {
    const modules = computeModuleDiff(baseExtraction, baseSchool);
    const newItem = modules.find(i => i.status === 'new');
    expect(newItem?.checked).toBe(true);

    const existingItem = modules.find(i => i.status === 'existing');
    // existing items have checked=false and are disabled at the DiffViewItem level
    expect(existingItem?.checked).toBe(false);
  });

  it('allows user to edit extracted field values before saving (INTAKE-03 correction)', () => {
    const contacts = computeContactDiff(baseExtraction, existingContacts);
    const petraItem = contacts.find(i => i.label === 'Petra Bakker');
    expect(petraItem).toBeDefined();
    expect(petraItem!.status).toBe('new');
    expect(petraItem!.editable).toBe(true);

    const actions = computeActionDiff(baseExtraction);
    expect(actions[0].editable).toBe(true);
  });
});
