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
