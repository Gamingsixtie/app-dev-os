import { describe, it, expect } from 'vitest';
import type { IntakeExtractionV2 } from '@/features/school-profile/schemas/intake-extraction.schema';
import type { SchoolRecord, Contact } from '@/db/types';
import {
  computeModuleDiff,
  computeContactDiff,
  computeActionDiff,
} from '@/features/school-profile/utils/diff-view';

// Fixtures
const existingSchool: SchoolRecord = {
  id: 'school-1',
  slug: 'test',
  name: 'Test',
  createdAt: '',
  updatedAt: '',
  isComplete: false,
  completedSteps: [],
  levels: ['havo'],
  studentCounts: {},
  selectedModules: ['rekenwiskunde'],
  moduleSetups: [
    { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: 5.0 },
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
    name: 'Bestaande Persoon',
    dmuPosition: 'gebruiker',
    jobTitle: '',
    email: 'bp@school.nl',
    phone: '',
    preferredChannel: 'email',
    authority: 'adviserend',
    lastContactDate: null,
    notes: '',
    isPrimary: false,
    engagementStatus: 'nog-niet-benaderd',
    engagementStatusChangedAt: null,
    waitingForContactId: null,
    dropOffReason: null,
    createdAt: '',
  },
];

const extraction: IntakeExtractionV2 = {
  levels: ['havo', 'vwo'],
  studentCountsPerLevel: { havo: 200, vwo: 150 },
  selectedModules: ['rekenwiskunde', 'engels'],
  moduleSetups: [
    { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: 5.0 },
    { moduleId: 'engels', currentProvider: 'cito-nieuw', pricePerStudent: 4.5 },
  ],
  unsureAbout: [],
  contactPersonen: [
    { naam: 'Nieuwe Contact', rol: 'MT' },
    { naam: 'Bestaande Persoon', rol: 'Updated Role' },
  ],
  actiePunten: [
    { wat: 'Offerte sturen', wanneer: 'Volgende week' },
    { wat: 'Demo plannen' },
  ],
  pipelineSignaal: 'interesse',
};

describe('intake merge (append-only)', () => {
  it('appends new modules without removing existing ones', () => {
    const diff = computeModuleDiff(extraction, existingSchool);
    // rekenwiskunde already exists with same provider -> existing
    const rkItem = diff.find(i => i.label === 'rekenwiskunde');
    expect(rkItem!.status).toBe('existing');
    // engels is new
    const enItem = diff.find(i => i.label === 'engels');
    expect(enItem!.status).toBe('new');
    expect(enItem!.checked).toBe(true);
    // Both should be present (no removal)
    expect(diff).toHaveLength(2);
  });

  it('appends new contacts without overwriting existing contacts', () => {
    const diff = computeContactDiff(extraction, existingContacts);
    // 'Nieuwe Contact' is new
    const newItem = diff.find(i => i.label === 'Nieuwe Contact');
    expect(newItem!.status).toBe('new');
    expect(newItem!.checked).toBe(true);
    // 'Bestaande Persoon' is conflict (name matches)
    const conflictItem = diff.find(i => i.label === 'Bestaande Persoon');
    expect(conflictItem!.status).toBe('conflict');
    expect(conflictItem!.checked).toBe(false);
  });

  it('appends new actions without modifying existing actions', () => {
    const diff = computeActionDiff(extraction);
    // All actions are always 'new'
    expect(diff).toHaveLength(2);
    expect(diff[0].status).toBe('new');
    expect(diff[0].checked).toBe(true);
    expect(diff[1].status).toBe('new');
  });

  it('preserves existing moduleSetups when merging new extraction', () => {
    const diff = computeModuleDiff(extraction, existingSchool);
    // The existing module should be marked as 'existing' and not editable
    const existingModule = diff.find(i => i.status === 'existing');
    expect(existingModule).toBeDefined();
    expect(existingModule!.editable).toBe(false);
    // Existing modules won't be added again (checkbox is disabled/unchecked)
    expect(existingModule!.checked).toBe(false);
  });
});
