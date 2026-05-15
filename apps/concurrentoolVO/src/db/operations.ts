import { supabase } from '@/lib/supabase/client';
import type { SchoolRecord, Contact, Conversation, ActionItem, SystemEvent, LostDealInfo, PlannedTouchpoint } from './types';
import { StichtingCascadeError, type StichtingRecord } from '@/models/stichting';
import type { PipelineStatus, EngagementStatus } from '@/models/school';
import { PIPELINE_STATUS_ORDER } from '@/models/school';
import { contactSchema } from '@/features/school-profile/schemas/contact.schema';
import { conversationSchema } from '@/features/school-profile/schemas/conversation.schema';
import { actionSchema } from '@/features/school-profile/schemas/action.schema';
import type { z } from 'zod';

type ContactFormInput = z.input<typeof contactSchema>;
type ConversationFormInput = z.input<typeof conversationSchema>;
type ActionFormInput = z.input<typeof actionSchema>;
import { uniqueSlug } from '@/lib/slugify';
import { useOfflineQueue } from '@/lib/offline-queue';
import type { OfflineQueueTable } from '@/lib/offline-queue';

// --- Offline queue helper ---

/**
 * Queue a mutation for later sync if the browser is offline.
 * Returns true if queued (caller should return early), false if online.
 */
function queueIfOffline(
  table: OfflineQueueTable,
  operation: 'insert' | 'update' | 'delete',
  payload: Record<string, unknown>,
): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    useOfflineQueue.getState().addMutation({ table, operation, payload });
    return true;
  }
  return false;
}

// --- Auth helpers ---

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Niet ingelogd');
  return user;
}

async function getTeamId(): Promise<string> {
  const user = await getCurrentUser();
  const { data, error } = await supabase.from('users').select('team_id').eq('id', user.id).single();
  if (error || !data) throw new Error('Gebruikersprofiel niet gevonden');
  return data.team_id;
}

// --- Snake_case <-> camelCase mapping ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSchoolRow(row: any): SchoolRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isComplete: row.is_complete,
    completedSteps: row.completed_steps ?? [],
    levels: row.levels ?? [],
    studentCounts: row.student_counts ?? {},
    selectedModules: row.selected_modules ?? [],
    moduleSetups: row.module_setups ?? [],
    scenario: row.scenario ?? null,
    appliedOverrides: [],  // Overrides now live in school_prices table
    migrationHourlyRate: row.migration_hourly_rate ?? null,
    migrationTimeSavingOverrides: row.migration_time_saving_overrides ?? {},
    switchingCosts: row.switching_costs ?? 0,
    contacts: [],        // Loaded separately via hooks
    conversations: [],   // Loaded separately via hooks
    actions: [],         // Loaded separately via hooks
    systemEvents: [],    // Loaded separately via hooks
    pipelineStatus: row.pipeline_status ?? 'prospect',
    lostDealInfo: row.lost_deal_info ?? undefined,
    region: row.region ?? '',
    tags: row.tags ?? [],
    viewPreference: row.view_preference ?? 'compact',
    ownerId: row.owner_id,
    teamId: row.team_id,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    ownerName: row.owner?.name ?? undefined,
    stichtingId: row.stichting_id ?? null,
    // Phase 27 Plan 03 — sales-context fields (R3 + R4)
    customerType: row.customer_type ?? null,
    schoolType: row.school_type ?? null,
    customSchoolType: row.custom_school_type ?? null,
    growthTrajectory: row.growth_trajectory ?? null,
    // Phase 27 Plan 05 — currentToolUsage per-niveau map (R5). Postgres
    // JSONB default is `{}` (migration 016) — fall back to `{}` defensively
    // for any pre-migration cached row that still lacks the column.
    currentToolUsage: row.current_tool_usage ?? {},
  };
}

function mapContactRow(row: Record<string, unknown>): Contact {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    name: row.name as string,
    dmuPosition: row.dmu_position as Contact['dmuPosition'],
    jobTitle: (row.job_title as string) ?? '',
    email: (row.email as string) ?? '',
    phone: (row.phone as string) ?? '',
    preferredChannel: (row.preferred_channel as Contact['preferredChannel']) ?? 'email',
    authority: (row.authority as Contact['authority']) ?? 'adviserend',
    lastContactDate: (row.last_contact_date as string | null) ?? null,
    notes: (row.notes as string) ?? '',
    isPrimary: (row.is_primary as boolean) ?? false,
    engagementStatus: (row.engagement_status as Contact['engagementStatus']) ?? 'nog-niet-benaderd',
    engagementStatusChangedAt: (row.engagement_status_changed_at as string | null) ?? null,
    waitingForContactId: (row.waiting_for_contact_id as string | null) ?? null,
    dropOffReason: (row.drop_off_reason as string | null) ?? null,
    createdBy: (row.created_by as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

function mapConversationRow(row: Record<string, unknown>): Conversation {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    date: row.date as string,
    contactId: (row.contact_id as string) ?? '',
    content: row.content as string,
    tags: (row.tags as string[]) ?? [],
    createdBy: (row.created_by as string) ?? undefined,
    updatedBy: (row.updated_by as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapActionRow(row: Record<string, unknown>): ActionItem {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    title: row.title as string,
    status: (row.status as ActionItem['status']) ?? 'todo',
    conversationId: (row.conversation_id as string | null) ?? null,
    type: (row.type as string | null) ?? null,
    dueDate: (row.due_date as string | null) ?? null,
    createdBy: (row.created_by as string) ?? undefined,
    updatedBy: (row.updated_by as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapSystemEventRow(row: Record<string, unknown>): SystemEvent {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    timestamp: row.timestamp as string,
    eventType: row.event_type as SystemEvent['eventType'],
    description: row.description as string,
    metadata: (row.metadata as Record<string, string>) ?? undefined,
    userId: (row.user_id as string) ?? undefined,
  };
}

// Map camelCase SchoolRecord fields to snake_case for Supabase updates
function mapSchoolUpdateToSnakeCase(data: Partial<SchoolRecord>): Record<string, unknown> {
  const map: Record<string, string> = {
    name: 'name',
    slug: 'slug',
    isComplete: 'is_complete',
    completedSteps: 'completed_steps',
    levels: 'levels',
    studentCounts: 'student_counts',
    selectedModules: 'selected_modules',
    moduleSetups: 'module_setups',
    scenario: 'scenario',
    migrationHourlyRate: 'migration_hourly_rate',
    migrationTimeSavingOverrides: 'migration_time_saving_overrides',
    switchingCosts: 'switching_costs',
    pipelineStatus: 'pipeline_status',
    lostDealInfo: 'lost_deal_info',
    region: 'region',
    tags: 'tags',
    viewPreference: 'view_preference',
    stichtingId: 'stichting_id',
    // Phase 27 Plan 03 — sales-context fields (R3 + R4)
    customerType: 'customer_type',
    schoolType: 'school_type',
    customSchoolType: 'custom_school_type',
    growthTrajectory: 'growth_trajectory',
    // Phase 27 Plan 05 — currentToolUsage per-niveau map (R5)
    currentToolUsage: 'current_tool_usage',
  };

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const snakeKey = map[key];
    if (snakeKey) {
      result[snakeKey] = value;
    }
  }
  return result;
}

// --- School CRUD ---

export async function createSchool(name: string): Promise<SchoolRecord> {
  const user = await getCurrentUser();
  const slug = await uniqueSlug(name);
  const teamId = await getTeamId();

  const { data, error } = await supabase.from('schools')
    .insert({
      name,
      slug,
      owner_id: user.id,
      team_id: teamId,
      created_by: user.id,
      updated_by: user.id,
    })
    .select('*, owner:users!owner_id(name)')
    .single();

  if (error) throw error;

  // Insert school_created system event
  await supabase.from('system_events').insert({
    school_id: data.id,
    event_type: 'school_created',
    description: 'School aangemaakt',
    user_id: user.id,
  });

  return mapSchoolRow(data);
}

export async function updateSchoolData(
  id: string,
  data: Partial<SchoolRecord>,
): Promise<void> {
  const snakeData = mapSchoolUpdateToSnakeCase(data);
  if (queueIfOffline('schools', 'update', { id, ...snakeData })) return;
  const user = await getCurrentUser();
  const { error } = await supabase.from('schools')
    .update({ ...snakeData, updated_by: user.id })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteSchool(id: string): Promise<void> {
  const { error } = await supabase.from('schools').delete().eq('id', id);
  if (error) throw error;
}

export async function getSchoolBySlug(
  slug: string,
): Promise<SchoolRecord | undefined> {
  const { data, error } = await supabase.from('schools')
    .select('*, owner:users!owner_id(name)')
    .eq('slug', slug)
    .single();
  if (error) return undefined;
  return mapSchoolRow(data);
}

export async function getAllSchools(): Promise<SchoolRecord[]> {
  const { data, error } = await supabase.from('schools')
    .select('*, owner:users!owner_id(name), contacts(*)')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...mapSchoolRow(row),
    contacts: ((row as Record<string, unknown>).contacts as Record<string, unknown>[] ?? []).map(mapContactRow),
  }));
}

// --- Contact CRUD ---

export async function addContact(
  schoolId: string,
  data: ContactFormInput,
): Promise<Contact> {
  if (queueIfOffline('contacts', 'insert', {
    school_id: schoolId,
    name: data.name,
    dmu_position: data.dmuPosition,
    job_title: data.jobTitle ?? '',
    email: data.email ?? '',
    phone: data.phone ?? '',
    preferred_channel: data.preferredChannel ?? 'email',
    authority: data.authority ?? 'adviserend',
    notes: data.notes ?? '',
    is_primary: data.isPrimary ?? false,
  })) {
    // Return a temporary Contact object for optimistic UI
    return {
      id: crypto.randomUUID(),
      schoolId,
      name: data.name,
      dmuPosition: data.dmuPosition,
      jobTitle: data.jobTitle ?? '',
      email: data.email ?? '',
      phone: data.phone ?? '',
      preferredChannel: data.preferredChannel ?? 'email',
      authority: data.authority ?? 'adviserend',
      lastContactDate: null,
      notes: data.notes ?? '',
      isPrimary: data.isPrimary ?? false,
      engagementStatus: 'nog-niet-benaderd',
      engagementStatusChangedAt: null,
      waitingForContactId: null,
      dropOffReason: null,
      createdAt: new Date().toISOString(),
    };
  }
  const user = await getCurrentUser();

  // If this contact is primary, unset all others first
  if (data.isPrimary) {
    await supabase.from('contacts')
      .update({ is_primary: false })
      .eq('school_id', schoolId);
  }

  const { data: row, error } = await supabase.from('contacts')
    .insert({
      school_id: schoolId,
      name: data.name,
      dmu_position: data.dmuPosition,
      job_title: data.jobTitle ?? '',
      email: data.email ?? '',
      phone: data.phone ?? '',
      preferred_channel: data.preferredChannel ?? 'email',
      authority: data.authority ?? 'adviserend',
      notes: data.notes ?? '',
      is_primary: data.isPrimary ?? false,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return mapContactRow(row);
}

export async function updateContact(
  schoolId: string,
  contactId: string,
  data: Partial<Contact>,
): Promise<void> {
  if (queueIfOffline('contacts', 'update', { id: contactId, school_id: schoolId, ...data })) return;
  // If setting as primary, unset all others first
  if (data.isPrimary === true) {
    await supabase.from('contacts')
      .update({ is_primary: false })
      .eq('school_id', schoolId);
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.dmuPosition !== undefined) updateData.dmu_position = data.dmuPosition;
  if (data.jobTitle !== undefined) updateData.job_title = data.jobTitle;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.preferredChannel !== undefined) updateData.preferred_channel = data.preferredChannel;
  if (data.authority !== undefined) updateData.authority = data.authority;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.isPrimary !== undefined) updateData.is_primary = data.isPrimary;
  if (data.lastContactDate !== undefined) updateData.last_contact_date = data.lastContactDate;

  const { error } = await supabase.from('contacts')
    .update(updateData)
    .eq('id', contactId);
  if (error) throw error;
}

export async function canDeleteContact(
  schoolId: string,
  contactId: string,
): Promise<{ canDelete: boolean; linkedConversations: number }> {
  const { count, error } = await supabase.from('conversations')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('contact_id', contactId);

  if (error) throw error;
  const linkedConversations = count ?? 0;
  return {
    canDelete: linkedConversations === 0,
    linkedConversations,
  };
}

export async function deleteContact(
  schoolId: string,
  contactId: string,
): Promise<void> {
  if (queueIfOffline('contacts', 'delete', { id: contactId, school_id: schoolId })) return;
  const { error } = await supabase.from('contacts')
    .delete()
    .eq('id', contactId)
    .eq('school_id', schoolId);
  if (error) throw error;
}

// --- Conversation CRUD ---

export async function addConversation(
  schoolId: string,
  data: ConversationFormInput,
): Promise<Conversation> {
  if (queueIfOffline('conversations', 'insert', {
    school_id: schoolId,
    date: data.date,
    contact_id: data.contactId,
    content: data.content,
    tags: data.tags ?? [],
  })) {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      schoolId,
      date: data.date,
      contactId: data.contactId,
      content: data.content,
      tags: data.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
  }
  const user = await getCurrentUser();

  const { data: row, error } = await supabase.from('conversations')
    .insert({
      school_id: schoolId,
      date: data.date,
      contact_id: data.contactId,
      content: data.content,
      tags: data.tags ?? [],
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Update the linked contact's lastContactDate
  await supabase.from('contacts')
    .update({ last_contact_date: data.date })
    .eq('id', data.contactId)
    .eq('school_id', schoolId);

  return mapConversationRow(row);
}

export async function updateConversation(
  schoolId: string,
  conversationId: string,
  data: Partial<Conversation>,
): Promise<void> {
  if (queueIfOffline('conversations', 'update', { id: conversationId, school_id: schoolId, ...data })) return;
  const user = await getCurrentUser();

  const updateData: Record<string, unknown> = { updated_by: user.id };
  if (data.date !== undefined) updateData.date = data.date;
  if (data.contactId !== undefined) updateData.contact_id = data.contactId;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.tags !== undefined) updateData.tags = data.tags;

  const { error } = await supabase.from('conversations')
    .update(updateData)
    .eq('id', conversationId)
    .eq('school_id', schoolId);
  if (error) throw error;
}

export async function deleteConversation(
  schoolId: string,
  conversationId: string,
): Promise<void> {
  if (queueIfOffline('conversations', 'delete', { id: conversationId, school_id: schoolId })) return;
  const { error } = await supabase.from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('school_id', schoolId);
  if (error) throw error;
}

// --- Action CRUD ---

export async function addAction(
  schoolId: string,
  data: ActionFormInput,
): Promise<ActionItem> {
  if (queueIfOffline('actions', 'insert', {
    school_id: schoolId,
    title: data.title,
    status: data.status ?? 'todo',
    conversation_id: data.conversationId ?? null,
    type: data.type ?? null,
    due_date: data.dueDate ?? null,
  })) {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      schoolId,
      title: data.title,
      status: data.status ?? 'todo',
      conversationId: data.conversationId ?? null,
      type: data.type ?? null,
      dueDate: data.dueDate ?? null,
      createdAt: now,
      updatedAt: now,
    };
  }
  const user = await getCurrentUser();

  const { data: row, error } = await supabase.from('actions')
    .insert({
      school_id: schoolId,
      title: data.title,
      status: data.status ?? 'todo',
      conversation_id: data.conversationId ?? null,
      type: data.type ?? null,
      due_date: data.dueDate ?? null,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return mapActionRow(row);
}

export async function updateAction(
  schoolId: string,
  actionId: string,
  data: Partial<ActionItem>,
): Promise<void> {
  if (queueIfOffline('actions', 'update', { id: actionId, school_id: schoolId, ...data })) return;
  const user = await getCurrentUser();

  const updateData: Record<string, unknown> = { updated_by: user.id };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.conversationId !== undefined) updateData.conversation_id = data.conversationId;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.dueDate !== undefined) updateData.due_date = data.dueDate;

  const { error } = await supabase.from('actions')
    .update(updateData)
    .eq('id', actionId)
    .eq('school_id', schoolId);
  if (error) throw error;
}

export async function deleteAction(
  schoolId: string,
  actionId: string,
): Promise<void> {
  if (queueIfOffline('actions', 'delete', { id: actionId, school_id: schoolId })) return;
  const { error } = await supabase.from('actions')
    .delete()
    .eq('id', actionId)
    .eq('school_id', schoolId);
  if (error) throw error;
}

// --- Pipeline status ---

export async function setPipelineStatus(
  schoolId: string,
  newStatus: PipelineStatus,
  reason?: string,
  lostDealInfo?: LostDealInfo,
): Promise<void> {
  const updatePayload: Record<string, unknown> = { id: schoolId, pipeline_status: newStatus };
  if (newStatus === 'verloren' && lostDealInfo) {
    updatePayload.lost_deal_info = lostDealInfo;
  }
  if (queueIfOffline('schools', 'update', updatePayload)) return;
  const user = await getCurrentUser();

  // Get current school to read old status
  const { data: school, error: fetchError } = await supabase.from('schools')
    .select('pipeline_status')
    .eq('id', schoolId)
    .single();
  if (fetchError || !school) throw fetchError ?? new Error('School niet gevonden');

  const oldStatus = school.pipeline_status;

  // Update school pipeline status
  const updateData: Record<string, unknown> = {
    pipeline_status: newStatus,
    updated_by: user.id,
  };
  if (newStatus === 'verloren' && lostDealInfo) {
    updateData.lost_deal_info = lostDealInfo;
  }

  const { error: updateError } = await supabase.from('schools')
    .update(updateData)
    .eq('id', schoolId);
  if (updateError) throw updateError;

  // Insert pipeline_changed system event
  await supabase.from('system_events').insert({
    school_id: schoolId,
    event_type: 'pipeline_changed',
    description: `Pipeline gewijzigd: ${oldStatus} \u2192 ${newStatus}`,
    metadata: reason ? { reason } : null,
    user_id: user.id,
  });
}

export async function addSystemEvent(
  schoolId: string,
  event: Omit<SystemEvent, 'id' | 'timestamp' | 'schoolId'>,
): Promise<void> {
  const user = await getCurrentUser();
  await supabase.from('system_events').insert({
    school_id: schoolId,
    event_type: event.eventType,
    description: event.description,
    metadata: event.metadata ?? null,
    user_id: event.userId ?? user.id,
  });
}

// --- Engagement status ---

export async function setEngagementStatus(
  schoolId: string,
  contactId: string,
  newStatus: EngagementStatus,
  options?: {
    waitingForContactId?: string | null;
    dropOffReason?: string;
  },
): Promise<void> {
  if (queueIfOffline('contacts', 'update', {
    id: contactId,
    school_id: schoolId,
    engagement_status: newStatus,
    engagement_status_changed_at: new Date().toISOString(),
    ...(newStatus === 'wacht-op-intern' ? { waiting_for_contact_id: options?.waitingForContactId ?? null } : { waiting_for_contact_id: null }),
    ...(newStatus === 'afgehaakt' && options?.dropOffReason ? { drop_off_reason: options.dropOffReason } : newStatus !== 'afgehaakt' ? { drop_off_reason: null } : {}),
  })) return;
  const user = await getCurrentUser();

  // Get current engagement status for the event log
  const { data: contactRow, error: fetchError } = await supabase.from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();
  if (fetchError || !contactRow) throw fetchError ?? new Error('Contact niet gevonden');

  const contact = contactRow as Record<string, unknown>;
  const oldStatus = (contact.engagement_status as string) ?? 'nog-niet-benaderd';
  const contactName = contact.name as string;

  // Build update payload
  const updateData: Record<string, unknown> = {
    engagement_status: newStatus,
    engagement_status_changed_at: new Date().toISOString(),
  };

  // Clear waiting_for when not in "wacht-op-intern"
  if (newStatus === 'wacht-op-intern') {
    updateData.waiting_for_contact_id = options?.waitingForContactId ?? null;
  } else {
    updateData.waiting_for_contact_id = null;
  }

  // Set drop-off reason when "afgehaakt"
  if (newStatus === 'afgehaakt' && options?.dropOffReason) {
    updateData.drop_off_reason = options.dropOffReason;
  } else if (newStatus !== 'afgehaakt') {
    updateData.drop_off_reason = null;
  }

  const { error: updateError } = await supabase.from('contacts')
    .update(updateData)
    .eq('id', contactId);
  if (updateError) throw updateError;

  // Log system event for timeline
  await supabase.from('system_events').insert({
    school_id: schoolId,
    event_type: 'engagement_changed',
    description: `${contactName}: ${oldStatus} \u2192 ${newStatus}`,
    metadata: {
      contactId,
      contactName,
      oldStatus,
      newStatus,
      ...(options?.dropOffReason ? { reason: options.dropOffReason } : {}),
    },
    user_id: user.id,
  });
}

// --- Pipeline validation ---

export function validatePipelineTransition(
  from: PipelineStatus,
  to: PipelineStatus,
): { allowed: boolean; requiresReason: boolean; requiresLostDeal: boolean } {
  const fromOrder = PIPELINE_STATUS_ORDER[from];
  const toOrder = PIPELINE_STATUS_ORDER[to];
  const isBackward = toOrder < fromOrder;

  return {
    allowed: true,
    requiresReason: isBackward,
    requiresLostDeal: to === 'verloren',
  };
}

// --- DMU Position Migration ---

const DMU_MIGRATION_KEY = 'dmu-position-migration-v2';

/**
 * One-time migration: update old DMU position values (coordinator, mt, finance)
 * to new model (gebruiker, beslisser, inkoper). Guarded by localStorage flag.
 */
export async function migrateDmuPositions(): Promise<void> {
  if (localStorage.getItem(DMU_MIGRATION_KEY) === 'true') return;

  const mapping: Record<string, string> = {
    coordinator: 'gebruiker',
    mt: 'beslisser',
    finance: 'inkoper',
    // 'overig' stays 'overig'
  };

  for (const [oldPos, newPos] of Object.entries(mapping)) {
    await supabase.from('contacts')
      .update({ dmu_position: newPos })
      .eq('dmu_position', oldPos);
  }

  localStorage.setItem(DMU_MIGRATION_KEY, 'true');
}

// --- Planned Touchpoints CRUD ---

function mapPlannedTouchpointRow(row: Record<string, unknown>): PlannedTouchpoint {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    contactId: row.contact_id as string,
    schoolYearStart: row.school_year_start as number,
    monthIndex: row.month_index as number,
    note: (row.note as string) ?? '',
    status: (row.status as PlannedTouchpoint['status']) ?? 'planned',
    createdBy: (row.created_by as string) ?? undefined,
    updatedBy: (row.updated_by as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function addPlannedTouchpoint(
  schoolId: string,
  data: { contactId: string; schoolYearStart: number; monthIndex: number; note?: string },
): Promise<PlannedTouchpoint> {
  if (queueIfOffline('planned_touchpoints', 'insert', {
    school_id: schoolId,
    contact_id: data.contactId,
    school_year_start: data.schoolYearStart,
    month_index: data.monthIndex,
    note: data.note ?? '',
  })) {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      schoolId,
      contactId: data.contactId,
      schoolYearStart: data.schoolYearStart,
      monthIndex: data.monthIndex,
      note: data.note ?? '',
      status: 'planned',
      createdAt: now,
      updatedAt: now,
    };
  }
  const user = await getCurrentUser();

  const { data: row, error } = await supabase.from('planned_touchpoints')
    .insert({
      school_id: schoolId,
      contact_id: data.contactId,
      school_year_start: data.schoolYearStart,
      month_index: data.monthIndex,
      note: data.note ?? '',
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return mapPlannedTouchpointRow(row);
}

export async function updatePlannedTouchpoint(
  schoolId: string,
  touchpointId: string,
  data: Partial<Pick<PlannedTouchpoint, 'note' | 'status' | 'monthIndex'>>,
): Promise<void> {
  if (queueIfOffline('planned_touchpoints', 'update', {
    id: touchpointId, school_id: schoolId, ...data,
  })) return;
  const user = await getCurrentUser();

  const updateData: Record<string, unknown> = { updated_by: user.id };
  if (data.note !== undefined) updateData.note = data.note;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.monthIndex !== undefined) updateData.month_index = data.monthIndex;

  const { error } = await supabase.from('planned_touchpoints')
    .update(updateData)
    .eq('id', touchpointId)
    .eq('school_id', schoolId);
  if (error) throw error;
}

export async function deletePlannedTouchpoint(
  schoolId: string,
  touchpointId: string,
): Promise<void> {
  if (queueIfOffline('planned_touchpoints', 'delete', {
    id: touchpointId, school_id: schoolId,
  })) return;
  const { error } = await supabase.from('planned_touchpoints')
    .delete()
    .eq('id', touchpointId)
    .eq('school_id', schoolId);
  if (error) throw error;
}

// =============================================================================
// Stichting CRUD (Phase 27 Plan 02 — R1, D-01, D-04)
// =============================================================================

function mapStichtingRow(row: Record<string, unknown>): StichtingRecord {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    name: row.name as string,
    region: (row.region as string) ?? '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    createdBy: (row.created_by as string) ?? undefined,
    updatedBy: (row.updated_by as string) ?? undefined,
  };
}

export interface StichtingCreateInput {
  name: string;
  region?: string;
}

export interface StichtingUpdateInput {
  name?: string;
  region?: string;
}

/**
 * Create a new Stichting. Inserts into Supabase (team-scoped via RLS) and
 * mirrors to Dexie on success.
 */
export async function createStichting(input: StichtingCreateInput): Promise<StichtingRecord> {
  const user = await getCurrentUser();
  const teamId = await getTeamId();

  const { data, error } = await supabase.from('stichtingen')
    .insert({
      name: input.name,
      region: input.region ?? '',
      team_id: teamId,
      created_by: user.id,
      updated_by: user.id,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapStichtingRow(data);
}

/**
 * List all Stichtingen the current user can see (RLS-scoped to their team).
 * Ordered by `updated_at` descending so the most recently touched bestuur
 * appears first on the overview.
 */
export async function listStichtingen(): Promise<StichtingRecord[]> {
  const { data, error } = await supabase.from('stichtingen')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapStichtingRow(row as Record<string, unknown>));
}

/**
 * Fetch a single Stichting by id. Returns `undefined` if not found (or RLS
 * blocked).
 */
export async function getStichting(id: string): Promise<StichtingRecord | undefined> {
  const { data, error } = await supabase.from('stichtingen')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return undefined;
  return mapStichtingRow(data as Record<string, unknown>);
}

/**
 * Patch an existing Stichting. Only `name` and `region` are editable.
 */
export async function updateStichting(id: string, patch: StichtingUpdateInput): Promise<void> {
  if (queueIfOffline('stichtingen', 'update', { id, ...patch })) return;
  const user = await getCurrentUser();
  const updateData: Record<string, unknown> = { updated_by: user.id };
  if (patch.name !== undefined) updateData.name = patch.name;
  if (patch.region !== undefined) updateData.region = patch.region;

  const { error } = await supabase.from('stichtingen')
    .update(updateData)
    .eq('id', id);
  if (error) throw error;
}

/**
 * Delete a Stichting — guarded by D-04: throws `StichtingCascadeError`
 * when one or more schools are still linked. Sales must explicitly
 * unlink schools first via the detail-view "Scholen" tab.
 */
export async function deleteStichting(id: string): Promise<void> {
  const { count, error: countError } = await supabase.from('schools')
    .select('id', { count: 'exact', head: true })
    .eq('stichting_id', id);
  if (countError) throw countError;
  const linkedCount = count ?? 0;
  if (linkedCount > 0) {
    throw new StichtingCascadeError(id, linkedCount);
  }
  const { error } = await supabase.from('stichtingen').delete().eq('id', id);
  if (error) throw error;
}

/**
 * List all schools currently linked to a Stichting. Returns the same
 * camelCase shape as the rest of the school CRUD.
 */
export async function listSchoolsForStichting(stichtingId: string): Promise<SchoolRecord[]> {
  const { data, error } = await supabase.from('schools')
    .select('*, owner:users!owner_id(name)')
    .eq('stichting_id', stichtingId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapSchoolRow(row));
}

/**
 * Link an existing school to a Stichting. Overwrites any prior link.
 * Bulk variant lands in Plan 27-07 (R11).
 */
export async function linkSchoolToStichting(schoolId: string, stichtingId: string): Promise<void> {
  if (queueIfOffline('schools', 'update', { id: schoolId, stichting_id: stichtingId })) return;
  const user = await getCurrentUser();
  const { error } = await supabase.from('schools')
    .update({ stichting_id: stichtingId, updated_by: user.id })
    .eq('id', schoolId);
  if (error) throw error;
}

/**
 * Unlink a school from its Stichting (sets `stichting_id` to NULL).
 */
export async function unlinkSchoolFromStichting(schoolId: string): Promise<void> {
  if (queueIfOffline('schools', 'update', { id: schoolId, stichting_id: null })) return;
  const user = await getCurrentUser();
  const { error } = await supabase.from('schools')
    .update({ stichting_id: null, updated_by: user.id })
    .eq('id', schoolId);
  if (error) throw error;
}

/**
 * Bulk-link N schools to a single Stichting in one Supabase `UPDATE ... WHERE id IN (...)`
 * call (Phase 27 Plan 07, R11, D-03). Used by the smart-suggestion dialog
 * on the Stichting-detail page.
 *
 * - No-op when `schoolIds` is empty (saves a needless round-trip).
 * - Overwrites any prior `stichting_id` for the targeted rows — assume the
 *   caller has already filtered out already-linked schools (smart-suggestion
 *   does this via `suggestSchoolsForStichting`).
 * - Cross-team writes are blocked by the existing schools UPDATE RLS policy
 *   (mitigates threat T-27-07-03).
 */
export async function bulkLinkSchools(stichtingId: string, schoolIds: string[]): Promise<void> {
  if (schoolIds.length === 0) return;
  const user = await getCurrentUser();
  const { error } = await supabase.from('schools')
    .update({ stichting_id: stichtingId, updated_by: user.id })
    .in('id', schoolIds);
  if (error) throw error;
}

/**
 * Bulk-unlink N schools from any Stichting in one Supabase call. Symmetric
 * partner of `bulkLinkSchools` — kept here for future "verplaats meerdere
 * scholen tegelijk" flows. Not currently wired into UI.
 */
export async function bulkUnlinkSchools(schoolIds: string[]): Promise<void> {
  if (schoolIds.length === 0) return;
  const user = await getCurrentUser();
  const { error } = await supabase.from('schools')
    .update({ stichting_id: null, updated_by: user.id })
    .in('id', schoolIds);
  if (error) throw error;
}

// Re-export mappers for use in hooks
export { mapContactRow, mapConversationRow, mapActionRow, mapSystemEventRow, mapPlannedTouchpointRow, mapStichtingRow };
