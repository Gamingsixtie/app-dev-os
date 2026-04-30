import { SCHOOL_LEVEL_LABELS } from '@/models/school';
import type { SchoolLevel } from '@/models/school';
import { db } from './database';
import type { SchoolRecord, PriceOverride } from './types';
import { uniqueSlug } from '@/lib/slugify';
import { supabase } from '@/lib/supabase/client';
import type { Json } from '@/lib/supabase/types';

// ── Cloud migration types ──────────────────────────────────────────

export interface MigrationResult {
  success: boolean;
  total: number;
  migrated: number;
  errors: Array<{ schoolName: string; error: string }>;
}

export type MigrationProgress = {
  status: 'idle' | 'migrating' | 'success' | 'partial-failure' | 'failure';
  current: number;
  total: number;
  currentSchoolName: string;
};

// Inline type for Dexie data -- avoids conflict with parallel Plan 08-03
// which changes SchoolRecord.id from number to string
interface DexieSchoolRecord {
  id?: number;
  slug: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  isComplete: boolean;
  completedSteps: number[];
  levels: string[];
  studentCounts: Record<string, Record<number, number>>;
  selectedModules: string[];
  moduleSetups: Array<{ moduleId: string; currentProvider: string; currentPrice?: number; source?: string }>;
  scenario: string | null;
  appliedOverrides: Array<{ moduleId: string; provider: string; price: number; source: string }>;
  migrationHourlyRate: number | null;
  migrationTimeSavingOverrides: Record<string, number>;
  contacts: Array<Record<string, unknown>>;
  conversations: Array<Record<string, unknown>>;
  actions: Array<Record<string, unknown>>;
  systemEvents: Array<Record<string, unknown>>;
  pipelineStatus: string;
  lostDealInfo?: Record<string, unknown>;
  region: string;
  tags: string[];
  viewPreference: string;
}

const MIGRATION_KEY = 'supabase-migration-complete';

// ── Cloud migration logic ──────────────────────────────────────────

/**
 * Migrates all IndexedDB school data to Supabase.
 * Processes each school individually with progress reporting.
 * Maps embedded arrays (contacts, conversations, actions, systemEvents)
 * to their respective normalized Supabase tables.
 */
export async function migrateIndexedDBToSupabase(
  onProgress: (p: MigrationProgress) => void
): Promise<MigrationResult> {
  // Already migrated?
  if (localStorage.getItem(MIGRATION_KEY) === 'true') {
    return { success: true, total: 0, migrated: 0, errors: [] };
  }

  // Read all local schools
  const localSchools = (await db.schools.toArray()) as unknown as DexieSchoolRecord[];

  if (localSchools.length === 0) {
    localStorage.setItem(MIGRATION_KEY, 'true');
    return { success: true, total: 0, migrated: 0, errors: [] };
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, total: localSchools.length, migrated: 0, errors: [{ schoolName: 'Alle scholen', error: 'Niet ingelogd' }] };
  }

  // Fetch team_id from users table
  const { data: userRow } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .single();

  const teamId = userRow?.team_id ?? null;

  const errors: Array<{ schoolName: string; error: string }> = [];
  let migrated = 0;

  for (let i = 0; i < localSchools.length; i++) {
    const school = localSchools[i];

    onProgress({
      status: 'migrating',
      current: i + 1,
      total: localSchools.length,
      currentSchoolName: school.name,
    });

    try {
      // Insert school
      const { data: insertedSchool, error: schoolError } = await supabase
        .from('schools')
        .insert({
          slug: school.slug,
          name: school.name,
          is_complete: school.isComplete,
          completed_steps: school.completedSteps,
          levels: school.levels,
          student_counts: school.studentCounts as unknown as Json,
          selected_modules: school.selectedModules,
          module_setups: school.moduleSetups as unknown as Json,
          scenario: school.scenario,
          migration_hourly_rate: school.migrationHourlyRate ?? 0,
          migration_time_saving_overrides: school.migrationTimeSavingOverrides as unknown as Json,
          pipeline_status: school.pipelineStatus,
          lost_deal_info: (school.lostDealInfo ?? null) as unknown as Json | null,
          region: school.region,
          tags: school.tags,
          view_preference: school.viewPreference,
          owner_id: user.id,
          team_id: teamId ?? user.id,
          created_by: user.id,
          updated_by: user.id,
          created_at: typeof school.createdAt === 'string' ? school.createdAt : (school.createdAt as unknown as Date).toISOString(),
          updated_at: typeof school.updatedAt === 'string' ? school.updatedAt : (school.updatedAt as unknown as Date).toISOString(),
        })
        .select('id')
        .single();

      if (schoolError || !insertedSchool) {
        throw new Error(schoolError?.message ?? 'School insert mislukt');
      }

      const schoolId = insertedSchool.id;

      // Build contact ID map (old local id -> new Supabase id)
      const contactIdMap = new Map<string, string>();

      // Migrate contacts
      if (Array.isArray(school.contacts) && school.contacts.length > 0) {
        const contactRows = school.contacts.map((c: Record<string, unknown>) => ({
          school_id: schoolId,
          name: (c.name as string) ?? '',
          dmu_position: (c.dmuPosition as string) ?? 'gebruiker',
          job_title: (c.jobTitle as string) ?? '',
          email: (c.email as string) ?? '',
          phone: (c.phone as string) ?? '',
          preferred_channel: (c.preferredChannel as string) ?? 'email',
          authority: (c.authority as string) ?? 'influencer',
          last_contact_date: (c.lastContactDate as string) ?? null,
          notes: (c.notes as string) ?? '',
          is_primary: (c.isPrimary as boolean) ?? false,
          created_at: (c.createdAt as string) ?? new Date().toISOString(),
          created_by: user.id,
        }));

        const { data: insertedContacts, error: contactError } = await supabase
          .from('contacts')
          .insert(contactRows)
          .select('id, name');

        if (contactError) {
          console.warn('Contact migration error:', contactError.message);
        }

        // Build the contact ID map by matching on name + insertion order
        if (insertedContacts) {
          for (let ci = 0; ci < school.contacts.length; ci++) {
            const oldId = (school.contacts[ci].id as string) ?? '';
            if (insertedContacts[ci]) {
              contactIdMap.set(oldId, insertedContacts[ci].id);
            }
          }
        }
      }

      // Migrate conversations
      if (Array.isArray(school.conversations) && school.conversations.length > 0) {
        const conversationRows = school.conversations.map((conv: Record<string, unknown>) => ({
          school_id: schoolId,
          date: (conv.date as string) ?? new Date().toISOString(),
          contact_id: contactIdMap.get((conv.contactId as string) ?? '') ?? null,
          content: (conv.content as string) ?? '',
          tags: (conv.tags as string[]) ?? [],
          created_at: (conv.createdAt as string) ?? new Date().toISOString(),
          updated_at: (conv.updatedAt as string) ?? new Date().toISOString(),
          created_by: user.id,
          updated_by: user.id,
        }));

        const { data: insertedConversations, error: convError } = await supabase
          .from('conversations')
          .insert(conversationRows)
          .select('id');

        if (convError) {
          console.warn('Conversation migration error:', convError.message);
        }

        // Build conversation ID map for actions
        const conversationIdMap = new Map<string, string>();
        if (insertedConversations) {
          for (let ci = 0; ci < school.conversations.length; ci++) {
            const oldId = (school.conversations[ci].id as string) ?? '';
            if (insertedConversations[ci]) {
              conversationIdMap.set(oldId, insertedConversations[ci].id);
            }
          }
        }

        // Migrate actions
        if (Array.isArray(school.actions) && school.actions.length > 0) {
          const actionRows = school.actions.map((action: Record<string, unknown>) => ({
            school_id: schoolId,
            title: (action.title as string) ?? '',
            status: (action.status as string) ?? 'todo',
            conversation_id: conversationIdMap.get((action.conversationId as string) ?? '') ?? null,
            created_at: (action.createdAt as string) ?? new Date().toISOString(),
            updated_at: (action.updatedAt as string) ?? new Date().toISOString(),
            created_by: user.id,
            updated_by: user.id,
          }));

          const { error: actionError } = await supabase
            .from('actions')
            .insert(actionRows);

          if (actionError) {
            console.warn('Action migration error:', actionError.message);
          }
        }
      }

      // Migrate system events
      if (Array.isArray(school.systemEvents) && school.systemEvents.length > 0) {
        const eventRows = school.systemEvents.map((evt: Record<string, unknown>) => ({
          school_id: schoolId,
          event_type: (evt.eventType as string) ?? 'school_created',
          description: (evt.description as string) ?? '',
          metadata: (evt.metadata as Record<string, string>) ?? null,
          timestamp: (evt.timestamp as string) ?? new Date().toISOString(),
          created_by: user.id,
        }));

        const { error: eventError } = await supabase
          .from('system_events')
          .insert(eventRows);

        if (eventError) {
          console.warn('System event migration error:', eventError.message);
        }
      }

      // Migrate appliedOverrides to school_prices (per D-05)
      if (Array.isArray(school.appliedOverrides) && school.appliedOverrides.length > 0) {
        const priceRows = school.appliedOverrides.map((override) => ({
          school_id: schoolId,
          module_id: override.moduleId,
          provider: override.provider,
          amount: override.price,
          price_type: 'agreed',
          is_active: true,
          source: 'Gemigreerd uit v1',
          activation_reason: 'Automatische migratie',
          activated_at: new Date().toISOString(),
          created_by: user.id,
          updated_by: user.id,
        }));

        const { error: priceError } = await supabase
          .from('school_prices')
          .insert(priceRows);

        if (priceError) {
          console.warn('Price migration error:', priceError.message);
        }
      }

      migrated++;
    } catch (err) {
      errors.push({ schoolName: school.name, error: String(err) });
    }
  }

  // Mark migration complete if all succeeded
  if (errors.length === 0) {
    localStorage.setItem(MIGRATION_KEY, 'true');
  }

  return {
    success: errors.length === 0,
    total: localSchools.length,
    migrated,
    errors,
  };
}

/**
 * Checks if there is any local IndexedDB data to migrate.
 */
export async function hasLocalData(): Promise<boolean> {
  try {
    // Check if the IndexedDB database exists without opening via Dexie
    // (Dexie may fail due to schema type changes in 08-03)
    const databases = await indexedDB.databases();
    const exists = databases.some((d) => d.name === 'rekentool-vo');
    if (!exists) return false;
    const count = await db.schools.count();
    return count > 0;
  } catch {
    return false;
  }
}

/**
 * Returns whether the cloud migration has already been completed.
 */
export function isMigrationComplete(): boolean {
  return localStorage.getItem(MIGRATION_KEY) === 'true';
}

// ── V1 localStorage migration (existing) ──────────────────────────

export interface V1MigrationResult {
  success: boolean;
  schoolRecord?: Partial<SchoolRecord>;
  suggestedName?: string;
  error?: string;
}

export function detectV1Data(): boolean {
  return localStorage.getItem('rekentool-school-profile') !== null;
}

export function extractV1Data(): V1MigrationResult {
  try {
    const raw = localStorage.getItem('rekentool-school-profile');
    if (!raw) return { success: false, error: 'Geen gegevens gevonden' };

    const parsed = JSON.parse(raw);
    const state = parsed?.state;

    if (!state || !Array.isArray(state.levels)) {
      return { success: false, error: 'Corrupt data structure' };
    }

    const levels: SchoolLevel[] = state.levels;
    const levelLabels = levels.map((l) => SCHOOL_LEVEL_LABELS[l] || l);
    const suggestedName = levels.length > 0
      ? `${levelLabels.join('/')}-school`
      : 'Mijn school';

    return {
      success: true,
      schoolRecord: {
        levels: state.levels,
        studentCounts: state.studentCounts ?? {},
        selectedModules: state.selectedModules ?? [],
        moduleSetups: state.moduleSetups ?? [],
        scenario: state.scenario ?? null,
      },
      suggestedName,
    };
  } catch {
    return { success: false, error: 'Data kon niet worden gelezen' };
  }
}

export function extractV1PriceOverrides(): {
  appliedOverrides: PriceOverride[];
  migrationHourlyRate: number | null;
  migrationTimeSavingOverrides: Record<string, number>;
} | null {
  const raw = localStorage.getItem('rekentool-price-comparison');
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const state = parsed?.state;
    if (!state) return null;

    return {
      appliedOverrides: state.appliedOverrides ?? [],
      migrationHourlyRate: state.migrationHourlyRate ?? null,
      migrationTimeSavingOverrides: state.migrationTimeSavingOverrides ?? {},
    };
  } catch {
    return null;
  }
}

export async function migrateV1ToSchool(name: string): Promise<SchoolRecord> {
  const v1Data = extractV1Data();
  if (!v1Data.success || !v1Data.schoolRecord) {
    throw new Error(v1Data.error ?? 'Migration failed');
  }

  const priceData = extractV1PriceOverrides();
  const slug = await uniqueSlug(name);
  const now = new Date();

  const record: Omit<SchoolRecord, 'id'> = {
    slug,
    name,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    isComplete: true,
    completedSteps: [0, 1, 2, 3, 4],
    levels: v1Data.schoolRecord.levels ?? [],
    studentCounts: v1Data.schoolRecord.studentCounts ?? {},
    selectedModules: v1Data.schoolRecord.selectedModules ?? [],
    moduleSetups: v1Data.schoolRecord.moduleSetups ?? [],
    scenario: v1Data.schoolRecord.scenario ?? null,
    appliedOverrides: priceData?.appliedOverrides ?? [],
    migrationHourlyRate: priceData?.migrationHourlyRate ?? null,
    migrationTimeSavingOverrides: priceData?.migrationTimeSavingOverrides ?? {},
    switchingCosts: 0,
    // CRM-lite defaults
    contacts: [],
    conversations: [],
    actions: [],
    systemEvents: [{
      id: crypto.randomUUID(),
      schoolId: '',
      timestamp: now.toISOString(),
      eventType: 'school_created' as const,
      description: 'School gemigreerd vanuit v1',
    }],
    pipelineStatus: 'prospect',
    region: '',
    tags: [],
    viewPreference: 'compact',
  };

  const id = await db.schools.add(record as SchoolRecord);
  return { ...record, id } as SchoolRecord;
}

export function clearV1Data(): void {
  localStorage.removeItem('rekentool-school-profile');
  localStorage.removeItem('rekentool-price-comparison');
}
