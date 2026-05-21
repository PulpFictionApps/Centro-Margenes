-- ============================================
-- Therapist-owned patients + one-off availability overrides
-- ============================================

-- Link table: allows therapists to keep their own patient roster,
-- even before creating any appointment in the system.
CREATE TABLE IF NOT EXISTS therapist_patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'booking', 'imported')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (therapist_id, patient_id)
);

CREATE INDEX IF NOT EXISTS idx_therapist_patients_therapist
  ON therapist_patients (therapist_id);

CREATE INDEX IF NOT EXISTS idx_therapist_patients_patient
  ON therapist_patients (patient_id);

ALTER TABLE therapist_patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapists can view own therapist_patients"
  ON therapist_patients FOR SELECT
  USING (
    therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
  );

CREATE POLICY "Therapists can insert own therapist_patients"
  ON therapist_patients FOR INSERT
  WITH CHECK (
    therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
  );

CREATE POLICY "Therapists can delete own therapist_patients"
  ON therapist_patients FOR DELETE
  USING (
    therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
  );

-- Allow therapists to read patients they own directly,
-- in addition to patients tied by appointments.
DROP POLICY IF EXISTS "Therapists can view their patients" ON patients;

CREATE POLICY "Therapists can view their patients"
  ON patients FOR SELECT
  USING (
    id IN (
      SELECT patient_id FROM appointments
      WHERE therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
    )
    OR id IN (
      SELECT patient_id FROM therapist_patients
      WHERE therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
    )
  );

-- One-off overrides for specific dates.
-- "add" opens extra blocks on one date.
-- "block" removes availability for the matching period on one date.
CREATE TABLE IF NOT EXISTS availability_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration INTEGER NOT NULL DEFAULT 50 CHECK (slot_duration > 0),
  modality TEXT NOT NULL DEFAULT 'both' CHECK (modality IN ('online', 'in_person', 'both')),
  override_type TEXT NOT NULL DEFAULT 'add' CHECK (override_type IN ('add', 'block')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_availability_overrides_therapist_date
  ON availability_overrides (therapist_id, date);

ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view availability_overrides"
  ON availability_overrides FOR SELECT
  USING (true);

CREATE POLICY "Therapists can manage own availability_overrides"
  ON availability_overrides FOR INSERT
  WITH CHECK (
    therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
  );

CREATE POLICY "Therapists can update own availability_overrides"
  ON availability_overrides FOR UPDATE
  USING (
    therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
  )
  WITH CHECK (
    therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
  );

CREATE POLICY "Therapists can delete own availability_overrides"
  ON availability_overrides FOR DELETE
  USING (
    therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
  );
