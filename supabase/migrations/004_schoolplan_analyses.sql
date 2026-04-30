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
