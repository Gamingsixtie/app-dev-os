import type { SchoolLevel, Scenario, ModuleCurrentSetup, PipelineStatus, DMUPosition, PreferredChannel, AuthorityLevel, EngagementStatus } from '@/models/school';
import type { SchoolplanOpportunity, AlsoRelevantItem, OpportunityAnnotation } from '@/features/school-profile/schemas/schoolplan-analysis.schema';

export interface PriceOverride {
  moduleId: string;
  provider: 'cito' | 'dia' | 'jij' | 'saqi';
  amount: number;
}

export interface Contact {
  id: string;
  schoolId: string;
  name: string;
  dmuPosition: DMUPosition;
  jobTitle: string;
  email: string;
  phone: string;
  preferredChannel: PreferredChannel;
  authority: AuthorityLevel;
  lastContactDate: string | null;
  notes: string;
  isPrimary: boolean;
  engagementStatus: EngagementStatus;
  engagementStatusChangedAt: string | null;
  waitingForContactId: string | null;
  dropOffReason: string | null;
  createdBy?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  schoolId: string;
  date: string;
  contactId: string;
  content: string;
  tags: string[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemEvent {
  id: string;
  schoolId: string;
  timestamp: string;
  eventType: 'pipeline_changed' | 'comparison_created' | 'prices_updated' | 'school_created' | 'engagement_changed' | 'blokkade_registered' | 'demo_gegeven' | 'offerte_verstuurd' | 'beslissing_genomen' | 'contract_getekend' | 'implementatie_gestart' | 'evaluatie_gepland';
  description: string;
  metadata?: Record<string, string>;
  userId?: string;
}

export interface ActionItem {
  id: string;
  schoolId: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  conversationId: string | null;
  type: string | null;
  dueDate: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type PlannedTouchpointStatus = 'planned' | 'completed' | 'skipped';

export interface PlannedTouchpoint {
  id: string;
  schoolId: string;
  contactId: string;
  schoolYearStart: number;
  monthIndex: number; // 0=Sep, 11=Aug
  note: string;
  status: PlannedTouchpointStatus;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LostDealInfo {
  competitor: 'dia' | 'jij' | 'overig';
  competitorName?: string;
  reason?: string;
}

export interface SchoolPriceEntry {
  id: string;
  schoolId: string;
  moduleId: string;
  provider: string;
  amount: number;
  priceType: 'publication' | 'agreed';
  discountPercentage: number;
  source: string;
  verifiedAt: string | null;
  note: string;
  isActive: boolean;
  activationReason: string | null;
  activatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolRecord {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isComplete: boolean;
  completedSteps: number[];

  // Wizard data
  levels: SchoolLevel[];
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>;
  selectedModules: string[];
  moduleSetups: ModuleCurrentSetup[];
  scenario: Scenario | null;

  // Price comparison data
  appliedOverrides: PriceOverride[];
  migrationHourlyRate: number | null;
  migrationTimeSavingOverrides: Record<string, number | null>;
  customTimeSavingTasks?: import('../models/migration').TimeSavingTask[];
  hiddenTimeSavingTaskIds?: string[];
  switchingCosts: number;

  // CRM-lite data
  contacts: Contact[];
  conversations: Conversation[];
  actions: ActionItem[];
  systemEvents: SystemEvent[];
  pipelineStatus: PipelineStatus;
  lostDealInfo?: LostDealInfo;
  region: string;
  tags: string[];
  viewPreference: 'compact' | 'extended';

  // Ownership & audit
  ownerId?: string;
  teamId?: string;
  createdBy?: string;
  updatedBy?: string;

  // Joined fields (not stored in DB)
  ownerName?: string;
}

export interface SchoolplanAnalysisRow {
  id: string;
  school_id: string;
  file_name: string;
  file_path: string;
  page_count: number | null;
  uploaded_at: string;
  summary: string;
  themes: string[];  // JSONB parsed
  opportunities: SchoolplanOpportunity[];  // JSONB parsed
  also_relevant: AlsoRelevantItem[];  // JSONB parsed
  opportunity_annotations: Record<string, OpportunityAnnotation>;  // JSONB parsed, keyed by opportunity index
  analysis_status: 'pending' | 'analyzing' | 'complete' | 'failed';
  error_message: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}
