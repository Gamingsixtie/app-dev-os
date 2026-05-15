import Dexie, { type EntityTable } from 'dexie';
import type { SchoolRecord, StichtingDexieRow } from './types';

class RekenToolDB extends Dexie {
  schools!: EntityTable<SchoolRecord, 'id'>;
  stichtingen!: EntityTable<StichtingDexieRow, 'id'>;

  constructor() {
    super('rekentool-vo');
    this.version(1).stores({
      schools: '++id, slug, name, updatedAt',
    });
    this.version(2).stores({
      schools: '++id, slug, name, updatedAt, pipelineStatus',
    }).upgrade(tx => {
      return tx.table('schools').toCollection().modify(school => {
        school.contacts = school.contacts ?? [];
        school.conversations = school.conversations ?? [];
        school.actions = school.actions ?? [];
        school.systemEvents = school.systemEvents ?? [];
        school.tags = school.tags ?? [];
        school.pipelineStatus = school.pipelineStatus ?? 'prospect';
        school.region = school.region ?? '';
        school.viewPreference = school.viewPreference ?? 'compact';
      });
    });
    // Phase 27 Plan 02 — Stichting (bestuur) entity + nullable FK on schools.
    // Phase 27 Plan 03 — Sales-context fields (customerType, schoolType,
    // customSchoolType, growthTrajectory) appended into the same v3 upgrade.
    // Phase 27 Plan 05 — currentToolUsage (R5) appended into the same v3
    // upgrade as an empty-map default so legacy schools don't carry stale
    // shape (a v4 bump would be wasteful — same migration window).
    // Idempotent: re-running the upgrade only touches schools that don't yet
    // have these fields (newly opened DBs already get them via the schema).
    // The cito-oud moduleSetups cleanup explicitly stays out of this wave —
    // Plan 27-10 handles the full cleanup.
    this.version(3).stores({
      schools: '++id, slug, name, updatedAt, pipelineStatus, stichtingId',
      stichtingen: 'id, name, region, updatedAt',
    }).upgrade(tx => {
      return tx.table('schools').toCollection().modify(school => {
        if (!('stichtingId' in school)) {
          school.stichtingId = null;
        }
        // Phase 27 Plan 03 — sales-context fields (R3 + R4)
        school.customerType = school.customerType ?? null;
        school.schoolType = school.schoolType ?? null;
        school.customSchoolType = school.customSchoolType ?? null;
        school.growthTrajectory = school.growthTrajectory ?? null;
        // Phase 27 Plan 05 — currentToolUsage per-niveau map (R5)
        school.currentToolUsage = school.currentToolUsage ?? {};
      });
    });
  }
}

export const db = new RekenToolDB();
export { RekenToolDB };
