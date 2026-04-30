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
