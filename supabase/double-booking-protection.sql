-- ============================================
-- Double-booking protection
-- Run in Supabase SQL Editor
-- ============================================

-- Partial unique index: only one active (non-cancelled) appointment
-- per therapist per date per time slot.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_therapist_slot
  ON appointments (therapist_id, date, time)
  WHERE status <> 'cancelled';
