-- ============================================
-- Reminder idempotency for cron reminders
-- Run in Supabase SQL Editor before enabling external cron
-- ============================================

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_1h_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_appointments_reminder_24h_sent_at
  ON appointments (reminder_24h_sent_at)
  WHERE reminder_24h_sent_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_reminder_1h_sent_at
  ON appointments (reminder_1h_sent_at)
  WHERE reminder_1h_sent_at IS NOT NULL;
