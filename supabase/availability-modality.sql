-- Add modality column to availability table
-- Possible values: 'online', 'in_person', 'both'
ALTER TABLE availability
  ADD COLUMN IF NOT EXISTS modality text NOT NULL DEFAULT 'both'
  CHECK (modality IN ('online', 'in_person', 'both'));
