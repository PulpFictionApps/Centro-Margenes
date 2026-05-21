-- ============================================
-- Therapist meeting link support (Google Meet per therapist)
-- Run in Supabase SQL Editor
-- ============================================

ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS meeting_link TEXT;

COMMENT ON COLUMN therapists.meeting_link IS 'Default online meeting URL for therapist appointments';
