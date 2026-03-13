-- ============================================
-- Migration: Services, Modality & Slot Duration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add slot_duration to availability
ALTER TABLE availability
  ADD COLUMN IF NOT EXISTS slot_duration INTEGER NOT NULL DEFAULT 50;

-- 2. Add modality fields to therapists
ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS offers_online BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS offers_in_person BOOLEAN NOT NULL DEFAULT false;

-- 3. Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration_minutes INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create therapist_services relation table
CREATE TABLE IF NOT EXISTS therapist_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(therapist_id, service_id)
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_therapist_services_therapist ON therapist_services(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_services_service ON therapist_services(service_id);

-- 6. RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_services ENABLE ROW LEVEL SECURITY;

-- Services: public read
CREATE POLICY "Public can view services"
  ON services FOR SELECT
  USING (true);

-- Therapist services: public read, therapist manage own
CREATE POLICY "Public can view therapist services"
  ON therapist_services FOR SELECT
  USING (true);

CREATE POLICY "Therapists can add own services"
  ON therapist_services FOR INSERT
  WITH CHECK (
    therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
  );

CREATE POLICY "Therapists can remove own services"
  ON therapist_services FOR DELETE
  USING (
    therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
  );

-- 7. Seed services
INSERT INTO services (name, description, duration_minutes) VALUES
  ('Psicoterapia adultos', 'Sesión individual de psicoterapia para adultos.', 50),
  ('Psicoterapia adolescentes', 'Sesión especializada para adolescentes.', 45),
  ('Terapia de pareja', 'Sesión orientada a mejorar la relación de pareja.', 60),
  ('Terapia familiar', 'Sesión de terapia con enfoque sistémico familiar.', 60)
ON CONFLICT DO NOTHING;
