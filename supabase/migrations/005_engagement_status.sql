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
