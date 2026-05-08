-- Combined migrations for concurrentool-prod bootstrap
-- Generated 2026-05-08
-- Run this once in Supabase SQL Editor for the new prod project

-- ========================================================
-- File: 001_initial_schema.sql
-- ========================================================
-- 001_initial_schema.sql
-- Complete normalized schema for Rekentool VO
-- 8 tables: teams, users, schools, contacts, conversations, actions, system_events, school_prices

-- =============================================================================
-- 1. Teams
-- =============================================================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2. Users (references auth.users for Supabase Auth integration)
-- =============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('accountmanager', 'manager', 'viewer')),
  region TEXT DEFAULT '',
  team_id UUID REFERENCES teams(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 3. Schools
-- =============================================================================
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  team_id UUID REFERENCES teams(id) NOT NULL,
  owner_id UUID REFERENCES users(id) NOT NULL,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  completed_steps INTEGER[] NOT NULL DEFAULT '{}',
  levels TEXT[] NOT NULL DEFAULT '{}',
  student_counts JSONB NOT NULL DEFAULT '{}',
  selected_modules TEXT[] NOT NULL DEFAULT '{}',
  module_setups JSONB NOT NULL DEFAULT '[]',
  scenario TEXT,
  migration_hourly_rate NUMERIC NOT NULL DEFAULT 50,
  migration_time_saving_overrides JSONB NOT NULL DEFAULT '{}',
  pipeline_status TEXT NOT NULL DEFAULT 'prospect',
  lost_deal_info JSONB,
  region TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  view_preference TEXT NOT NULL DEFAULT 'compact',
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 4. Contacts
-- =============================================================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dmu_position TEXT NOT NULL,
  job_title TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  preferred_channel TEXT NOT NULL DEFAULT 'email',
  authority TEXT NOT NULL DEFAULT 'adviserend',
  last_contact_date DATE,
  notes TEXT NOT NULL DEFAULT '',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 5. Conversations
-- =============================================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 6. Actions
-- =============================================================================
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  conversation_id UUID REFERENCES conversations(id),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 7. System Events
-- =============================================================================
CREATE TABLE system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  user_id UUID REFERENCES users(id)
);

-- =============================================================================
-- 8. School Prices (per D-04: school-specific price intelligence)
-- =============================================================================
CREATE TABLE school_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  module_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  price_type TEXT NOT NULL CHECK (price_type IN ('publication', 'agreed')),
  discount_percentage NUMERIC NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT '',
  verified_at TIMESTAMPTZ,
  note TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT false,
  activation_reason TEXT,
  activated_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX idx_schools_team_id ON schools(team_id);
CREATE INDEX idx_schools_owner_id ON schools(owner_id);
CREATE INDEX idx_schools_slug ON schools(slug);
CREATE INDEX idx_contacts_school_id ON contacts(school_id);
CREATE INDEX idx_conversations_school_id ON conversations(school_id);
CREATE INDEX idx_actions_school_id ON actions(school_id);
CREATE INDEX idx_system_events_school_id ON system_events(school_id);
CREATE INDEX idx_school_prices_school_id ON school_prices(school_id);
CREATE INDEX idx_school_prices_active ON school_prices(school_id, module_id) WHERE is_active = true;

-- =============================================================================
-- updated_at trigger function
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to tables with updated_at column
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON actions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON school_prices
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ========================================================
-- File: 002_rls_policies.sql
-- ========================================================
-- 002_rls_policies.sql
-- Row Level Security policies for team-based access control
-- Uses SECURITY DEFINER helper functions to avoid circular dependency (Pitfall 1)

-- =============================================================================
-- Enable RLS on all tables
-- =============================================================================
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_prices ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Security definer helper functions
-- These bypass RLS on the users table to prevent circular dependency:
-- users table has RLS -> policy queries users table -> infinite loop
-- SECURITY DEFINER runs as the function owner (postgres), not the calling user
-- =============================================================================
CREATE OR REPLACE FUNCTION get_user_team_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- =============================================================================
-- Teams policies
-- =============================================================================
CREATE POLICY "Users can view their own team"
  ON teams FOR SELECT
  USING (id = get_user_team_id());

-- =============================================================================
-- Users policies
-- =============================================================================
CREATE POLICY "Users can view team members"
  ON users FOR SELECT
  USING (team_id = get_user_team_id() OR id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =============================================================================
-- Schools policies
-- =============================================================================
CREATE POLICY "Team members can view schools"
  ON schools FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Account managers can create schools"
  ON schools FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND get_user_role() = 'accountmanager'
  );

CREATE POLICY "Account managers can update own schools"
  ON schools FOR UPDATE
  USING (
    owner_id = auth.uid()
    AND get_user_role() = 'accountmanager'
  )
  WITH CHECK (
    owner_id = auth.uid()
    AND get_user_role() = 'accountmanager'
  );

CREATE POLICY "Account managers can delete own schools"
  ON schools FOR DELETE
  USING (
    owner_id = auth.uid()
    AND get_user_role() = 'accountmanager'
  );

-- =============================================================================
-- Contacts policies
-- =============================================================================
CREATE POLICY "Team members can view contacts"
  ON contacts FOR SELECT
  USING (school_id IN (SELECT id FROM schools WHERE team_id = get_user_team_id()));

CREATE POLICY "Account managers can manage contacts"
  ON contacts FOR INSERT
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

CREATE POLICY "Account managers can update contacts"
  ON contacts FOR UPDATE
  USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  )
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

CREATE POLICY "Account managers can delete contacts"
  ON contacts FOR DELETE
  USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

-- =============================================================================
-- Conversations policies
-- =============================================================================
CREATE POLICY "Team members can view conversations"
  ON conversations FOR SELECT
  USING (school_id IN (SELECT id FROM schools WHERE team_id = get_user_team_id()));

CREATE POLICY "Account managers can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

CREATE POLICY "Account managers can update conversations"
  ON conversations FOR UPDATE
  USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  )
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

CREATE POLICY "Account managers can delete conversations"
  ON conversations FOR DELETE
  USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

-- =============================================================================
-- Actions policies
-- =============================================================================
CREATE POLICY "Team members can view actions"
  ON actions FOR SELECT
  USING (school_id IN (SELECT id FROM schools WHERE team_id = get_user_team_id()));

CREATE POLICY "Account managers can create actions"
  ON actions FOR INSERT
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

CREATE POLICY "Account managers can update actions"
  ON actions FOR UPDATE
  USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  )
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

CREATE POLICY "Account managers can delete actions"
  ON actions FOR DELETE
  USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

-- =============================================================================
-- System Events policies
-- =============================================================================
CREATE POLICY "Team members can view system events"
  ON system_events FOR SELECT
  USING (school_id IN (SELECT id FROM schools WHERE team_id = get_user_team_id()));

CREATE POLICY "Account managers can create system events"
  ON system_events FOR INSERT
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

CREATE POLICY "Account managers can update system events"
  ON system_events FOR UPDATE
  USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  )
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

CREATE POLICY "Account managers can delete system events"
  ON system_events FOR DELETE
  USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

-- =============================================================================
-- School Prices policies
-- =============================================================================
CREATE POLICY "Team members can view school prices"
  ON school_prices FOR SELECT
  USING (school_id IN (SELECT id FROM schools WHERE team_id = get_user_team_id()));

CREATE POLICY "Account managers can create school prices"
  ON school_prices FOR INSERT
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

CREATE POLICY "Account managers can update school prices"
  ON school_prices FOR UPDATE
  USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  )
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

CREATE POLICY "Account managers can delete school prices"
  ON school_prices FOR DELETE
  USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );


-- ========================================================
-- File: 003_create_documents_bucket.sql
-- ========================================================
-- Create the documents storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: authenticated users can upload documents
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- RLS policy: authenticated users can read documents
CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

-- RLS policy: service role can download documents (for serverless function)
CREATE POLICY "Service role can download documents"
  ON storage.objects FOR SELECT
  TO service_role
  USING (bucket_id = 'documents');


-- ========================================================
-- File: 004_schoolplan_analyses.sql
-- ========================================================
-- Phase 14: Schoolplan analyses
CREATE TABLE schoolplan_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  page_count INTEGER,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary TEXT NOT NULL DEFAULT '',
  themes JSONB NOT NULL DEFAULT '[]',
  opportunities JSONB NOT NULL DEFAULT '[]',
  also_relevant JSONB NOT NULL DEFAULT '[]',
  opportunity_annotations JSONB NOT NULL DEFAULT '{}',
  analysis_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (analysis_status IN ('pending', 'analyzing', 'complete', 'failed')),
  error_message TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_schoolplan_analyses_school_id ON schoolplan_analyses(school_id);

-- Reuse existing trigger_set_updated_at function from 001
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON schoolplan_analyses
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- RLS policies
ALTER TABLE schoolplan_analyses ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (team-wide visibility per AUTH-02)
CREATE POLICY "schoolplan_analyses_select" ON schoolplan_analyses
  FOR SELECT TO authenticated USING (true);

-- Only accountmanagers can insert/update/delete their own analyses
CREATE POLICY "schoolplan_analyses_insert" ON schoolplan_analyses
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "schoolplan_analyses_update" ON schoolplan_analyses
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "schoolplan_analyses_delete" ON schoolplan_analyses
  FOR DELETE TO authenticated USING (true);


-- ========================================================
-- File: 005_engagement_status.sql
-- ========================================================
-- =============================================================================
-- Phase 15: DMU Klantreis Registratie — engagement status per contact
-- =============================================================================

-- Add engagement status columns to contacts table
ALTER TABLE contacts
  ADD COLUMN engagement_status TEXT NOT NULL DEFAULT 'nog-niet-benaderd',
  ADD COLUMN engagement_status_changed_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN waiting_for_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN drop_off_reason TEXT;

-- Index for filtering schools by engagement status
CREATE INDEX idx_contacts_engagement_status ON contacts(engagement_status);
CREATE INDEX idx_contacts_school_engagement ON contacts(school_id, engagement_status);


-- ========================================================
-- File: 006_fix_schoolplan_rls.sql
-- ========================================================
-- 006_fix_schoolplan_rls.sql
-- Fix permissive RLS policies on schoolplan_analyses table
-- Replace `USING (true)` with team-scoped policies matching 002_rls_policies.sql pattern
-- NOTE: Apply via Supabase dashboard SQL editor or `supabase db push`

-- Drop existing permissive policies
DROP POLICY IF EXISTS "schoolplan_analyses_select" ON schoolplan_analyses;
DROP POLICY IF EXISTS "schoolplan_analyses_insert" ON schoolplan_analyses;
DROP POLICY IF EXISTS "schoolplan_analyses_update" ON schoolplan_analyses;
DROP POLICY IF EXISTS "schoolplan_analyses_delete" ON schoolplan_analyses;

-- All team members can view analyses (team-wide visibility per AUTH-02)
CREATE POLICY "schoolplan_analyses_select" ON schoolplan_analyses
  FOR SELECT TO authenticated
  USING (school_id IN (SELECT id FROM schools WHERE team_id = get_user_team_id()));

-- Only accountmanagers can create analyses for their own schools
CREATE POLICY "schoolplan_analyses_insert" ON schoolplan_analyses
  FOR INSERT TO authenticated
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

-- Only accountmanagers can update analyses for their own schools
CREATE POLICY "schoolplan_analyses_update" ON schoolplan_analyses
  FOR UPDATE TO authenticated
  USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  )
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

-- Only accountmanagers can delete analyses for their own schools
CREATE POLICY "schoolplan_analyses_delete" ON schoolplan_analyses
  FOR DELETE TO authenticated
  USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );


-- ========================================================
-- File: 007_fix_storage_bucket_rls.sql
-- ========================================================
-- 007_fix_storage_bucket_rls.sql
-- Fix permissive storage RLS policies on documents bucket
-- Replace global authenticated access with team-scoped path-based policies
-- Documents must be stored under {team_id}/{school_id}/{filename} path pattern
-- NOTE: Apply via Supabase dashboard SQL editor or `supabase db push`

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;

-- Team members can read documents in their team's folder
CREATE POLICY "Team members can read documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = get_user_team_id()::text
  );

-- Accountmanagers can upload documents to their team's folder
CREATE POLICY "Accountmanagers can upload documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = get_user_team_id()::text
  );

-- Accountmanagers can delete documents in their team's folder
CREATE POLICY "Accountmanagers can delete documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = get_user_team_id()::text
  );

-- Keep service role access for serverless functions
-- (existing policy "Service role can download documents" is preserved)


-- ========================================================
-- File: 008_planned_touchpoints.sql
-- ========================================================
-- =============================================================================
-- Planned Touchpoints — contactmoment-planning per schooljaar
-- =============================================================================

CREATE TABLE planned_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  school_year_start INTEGER NOT NULL,        -- e.g. 2025 for schooljaar 2025-2026
  month_index INTEGER NOT NULL CHECK (month_index BETWEEN 0 AND 11), -- 0=Sep, 11=Aug
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'skipped')),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_planned_touchpoints_school ON planned_touchpoints(school_id);
CREATE INDEX idx_planned_touchpoints_contact ON planned_touchpoints(contact_id);
CREATE INDEX idx_planned_touchpoints_year ON planned_touchpoints(school_id, school_year_start);

-- RLS
ALTER TABLE planned_touchpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view planned touchpoints"
  ON planned_touchpoints FOR SELECT
  USING (school_id IN (SELECT id FROM schools WHERE team_id = get_user_team_id()));

CREATE POLICY "Account managers can create planned touchpoints"
  ON planned_touchpoints FOR INSERT
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

CREATE POLICY "Account managers can update planned touchpoints"
  ON planned_touchpoints FOR UPDATE
  USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  )
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

CREATE POLICY "Account managers can delete planned touchpoints"
  ON planned_touchpoints FOR DELETE
  USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );


-- ========================================================
-- File: 009_publication_prices.sql
-- ========================================================
-- 009_publication_prices.sql
-- Publication prices table: team-wide pricing data per module per provider
-- Source of truth for pricing intelligence (replaces TS-based DEFAULT_PRICES at runtime)

CREATE TABLE publication_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) NOT NULL,
  module_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('cito', 'dia', 'jij', 'saqi')),
  amount_per_student NUMERIC NOT NULL,
  source TEXT NOT NULL DEFAULT 'seed' CHECK (source IN ('seed', 'manual', 'proposal', 'ai-lookup')),
  source_label TEXT NOT NULL DEFAULT '',
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, module_id, provider)
);

ALTER TABLE publication_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view publication prices"
  ON publication_prices FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Team members can insert publication prices"
  ON publication_prices FOR INSERT
  WITH CHECK (team_id = get_user_team_id());

CREATE POLICY "Managers can update publication prices"
  ON publication_prices FOR UPDATE
  USING (team_id = get_user_team_id() AND get_user_role() = 'manager');


-- ========================================================
-- File: 010_pricing_configs.sql
-- ========================================================
-- 010_pricing_configs.sql
-- Pricing configuration per provider: stores full PricingStrategy as JSONB
-- Versioned for audit trail, unique active config per provider per team

CREATE TABLE pricing_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('cito', 'dia', 'jij', 'saqi')),
  config_type TEXT NOT NULL CHECK (config_type IN ('platform+module', 'package-bundle', 'tiered-license', 'flat')),
  config_data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pricing_configs ENABLE ROW LEVEL SECURITY;

-- Only one active config per provider per team
CREATE UNIQUE INDEX pricing_configs_active_provider ON pricing_configs (team_id, provider) WHERE (is_active = true);

CREATE POLICY "Team members can view pricing configs"
  ON pricing_configs FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Managers can insert pricing configs"
  ON pricing_configs FOR INSERT
  WITH CHECK (team_id = get_user_team_id() AND get_user_role() = 'manager');

CREATE POLICY "Managers can update pricing configs"
  ON pricing_configs FOR UPDATE
  USING (team_id = get_user_team_id() AND get_user_role() = 'manager');


-- ========================================================
-- File: 011_price_proposals.sql
-- ========================================================
-- 011_price_proposals.sql
-- Price proposals: team members can flag incorrect prices and propose corrections
-- Managers approve or reject; approved proposals update publication_prices directly (D-08)

CREATE TABLE price_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) NOT NULL,
  module_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('cito', 'dia', 'jij', 'saqi')),
  current_price NUMERIC NOT NULL,
  proposed_price NUMERIC NOT NULL,
  source TEXT NOT NULL,
  explanation TEXT NOT NULL,
  evidence_path TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'approved', 'rejected')),
  rejection_reason TEXT,
  submitted_by UUID REFERENCES auth.users(id) NOT NULL,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE price_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view proposals"
  ON price_proposals FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Team members can create proposals"
  ON price_proposals FOR INSERT
  WITH CHECK (team_id = get_user_team_id() AND submitted_by = auth.uid());

CREATE POLICY "Managers can update proposals"
  ON price_proposals FOR UPDATE
  USING (team_id = get_user_team_id() AND get_user_role() = 'manager');

CREATE INDEX idx_price_proposals_status ON price_proposals(team_id, status);


-- ========================================================
-- File: 012_price_audit_log.sql
-- ========================================================
-- 012_price_audit_log.sql
-- Audit log for all pricing changes: tracks who changed what, when, and why
-- Links to proposals when changes originate from the proposal workflow

CREATE TABLE price_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('publication_price', 'pricing_config', 'price_proposal')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'approved', 'rejected', 'seeded')),
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  proposal_id UUID REFERENCES price_proposals(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE price_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view audit log"
  ON price_audit_log FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Team members can insert audit log"
  ON price_audit_log FOR INSERT
  WITH CHECK (team_id = get_user_team_id());

CREATE INDEX idx_audit_log_entity ON price_audit_log(entity_type, entity_id);


-- ========================================================
-- File: 013_proposal_scope.sql
-- ========================================================
-- 013_proposal_scope.sql
-- Add scope distinction to price proposals: 'global' (new price list, affects all)
-- vs 'school' (specific discount for one school, no global price change)

ALTER TABLE price_proposals
  ADD COLUMN scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'school')),
  ADD COLUMN school_id UUID REFERENCES schools(id),
  ADD COLUMN school_name TEXT;

-- Index for filtering proposals by school
CREATE INDEX idx_price_proposals_school ON price_proposals(school_id) WHERE school_id IS NOT NULL;


