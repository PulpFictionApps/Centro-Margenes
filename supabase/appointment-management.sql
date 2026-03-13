-- ============================================
-- Appointment management migration
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Add cancellation_token column for patient self-cancel links
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS cancellation_token UUID DEFAULT uuid_generate_v4();

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_cancel_token
  ON appointments (cancellation_token);

-- 2. Migrate statuses: pending → scheduled, confirmed → scheduled
UPDATE appointments SET status = 'scheduled' WHERE status IN ('pending', 'confirmed');

-- 3. Replace the CHECK constraint with new status values
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('scheduled', 'cancelled', 'completed', 'no_show'));

-- 4. Update default value
ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'scheduled';
