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
