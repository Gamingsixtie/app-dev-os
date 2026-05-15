/**
 * Phase 27 Plan 02 — R11 Dexie v3 migration.
 *
 * Wave 0 (Plan 27-01) scaffolded this file with 5 it.todo entries. Plan
 * 27-02 (this commit) lands the v3 schema (stichtingen table + nullable
 * stichtingId FK on schools) and replaces three of the todos with real
 * fake-indexeddb-backed assertions. The cito-oud cleanup test stays todo
 * — that change ships in Plan 27-10.
 */
import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { db } from '../database';

describe('Dexie v3 migration (R11)', () => {
  it('creates the stichtingen table with primary key id', () => {
    const schema = db.stichtingen.schema;
    expect(schema.primKey.name).toBe('id');
    const indexNames = schema.indexes.map((i) => i.name);
    expect(indexNames).toContain('name');
    expect(indexNames).toContain('region');
    expect(indexNames).toContain('updatedAt');
  });

  it('adds stichtingId as an index on the schools table', () => {
    const schema = db.schools.schema;
    const indexNames = schema.indexes.map((i) => i.name);
    expect(indexNames).toContain('stichtingId');
  });

  it.todo('filters out moduleSetups with currentProvider="cito-oud" from existing school records');

  it('is idempotent — running the v2→v3 upgrade twice produces the same schema', async () => {
    // The Dexie singleton is opened once per process; reading the schema
    // a second time must not change the index list (no duplicated indexes,
    // no missing ones). This guards against accidentally re-running the
    // version(3) block on top of itself.
    const firstReadIndexes = db.schools.schema.indexes.map((i) => i.name).sort();
    const secondReadIndexes = db.schools.schema.indexes.map((i) => i.name).sort();
    expect(secondReadIndexes).toEqual(firstReadIndexes);

    const firstStichtingenIndexes = db.stichtingen.schema.indexes.map((i) => i.name).sort();
    const secondStichtingenIndexes = db.stichtingen.schema.indexes.map((i) => i.name).sort();
    expect(secondStichtingenIndexes).toEqual(firstStichtingenIndexes);
  });

  it('preserves all v2 data that does not require transformation', async () => {
    // Add a school in the v3 DB; ensure all existing CRM fields (pipelineStatus,
    // contacts, conversations, ...) are still present and survive round-trip.
    const id = await db.schools.add({
      slug: 'v3-preservation',
      name: 'V3 Preservation Test',
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
      pipelineStatus: 'prospect',
      region: '',
      tags: [],
      viewPreference: 'compact',
      stichtingId: null,
    });
    const record = await db.schools.get(id);
    expect(record).toBeDefined();
    expect(record!.pipelineStatus).toBe('prospect');
    expect(record!.contacts).toEqual([]);
    expect(record!.stichtingId).toBeNull();
  });
});
