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
