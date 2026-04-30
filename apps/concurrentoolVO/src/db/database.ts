import Dexie, { type EntityTable } from 'dexie';
import type { SchoolRecord } from './types';

class RekenToolDB extends Dexie {
  schools!: EntityTable<SchoolRecord, 'id'>;

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
  }
}

export const db = new RekenToolDB();
export { RekenToolDB };
