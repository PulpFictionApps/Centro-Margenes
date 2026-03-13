-- ============================================
-- Centro Márgenes - Supabase Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor to set up the database.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Therapists (linked to Supabase Auth users for login/password)
CREATE TABLE therapists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  specialties TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Patients (created during booking, no auth account needed)
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  birthdate DATE,
  document TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Treatments offered by the center
CREATE TABLE treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration_minutes INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Branches (modalities: online or in-person locations)
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('online', 'in_person')),
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Weekly availability slots for each therapist
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

-- Appointments booked by patients
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE NOT NULL,
  treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'cancelled', 'completed', 'no_show')),
  cancellation_token UUID DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Newsletter subscribers
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_therapists_user_id ON therapists(user_id);
CREATE INDEX idx_therapists_email ON therapists(email);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_document ON patients(document);
CREATE INDEX idx_branches_type ON branches(type);
CREATE INDEX idx_availability_therapist ON availability(therapist_id, day_of_week);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_therapist_date ON appointments(therapist_id, date);
CREATE INDEX idx_appointments_branch ON appointments(branch_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE UNIQUE INDEX idx_appointments_cancel_token ON appointments(cancellation_token);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Therapists: public read, own write
CREATE POLICY "Public can view therapists"
  ON therapists FOR SELECT
  USING (true);

CREATE POLICY "Therapists can update own profile"
  ON therapists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Patients: anyone can insert (created during booking), therapists can read their own patients
CREATE POLICY "Anyone can create patients"
  ON patients FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Therapists can view their patients"
  ON patients FOR SELECT
  USING (
    id IN (
      SELECT patient_id FROM appointments
      WHERE therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
    )
  );

-- Treatments: public read
CREATE POLICY "Public can view treatments"
  ON treatments FOR SELECT
  USING (true);

-- Branches: public read
CREATE POLICY "Public can view branches"
  ON branches FOR SELECT
  USING (true);

-- Availability: public read, therapist write own
CREATE POLICY "Public can view availability"
  ON availability FOR SELECT
  USING (true);

CREATE POLICY "Therapists can manage own availability"
  ON availability FOR INSERT
  WITH CHECK (
    therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
  );

CREATE POLICY "Therapists can delete own availability"
  ON availability FOR DELETE
  USING (
    therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
  );

-- Appointments: anyone can insert, therapists read/update their own
CREATE POLICY "Anyone can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Therapists can view own appointments"
  ON appointments FOR SELECT
  USING (
    therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
  );

CREATE POLICY "Therapists can update own appointments"
  ON appointments FOR UPDATE
  USING (
    therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid())
  );

-- Newsletter: anyone can subscribe
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- ============================================
-- SEED DATA (Optional - remove before production)
-- ============================================

INSERT INTO treatments (name, description, duration_minutes) VALUES
  ('Terapia individual', 'Sesión individual de psicoterapia para adultos.', 50),
  ('Terapia de pareja', 'Sesión orientada a mejorar la relación de pareja.', 60),
  ('Terapia infanto-juvenil', 'Sesión especializada para niños y adolescentes.', 45),
  ('Evaluación psicológica', 'Evaluación completa con informe psicológico.', 90);

INSERT INTO branches (name, type, address) VALUES
  ('Online', 'online', NULL),
  ('Sede Santiago Centro', 'in_person', 'Av. Providencia 1234, Santiago');

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Create a public bucket called "therapist-photos" in your Supabase dashboard
-- Settings: Public bucket = true, Allowed MIME types: image/*

-- ============================================
-- NOTES
-- ============================================
-- 1. Create a Supabase Auth user for each therapist
-- 2. Then INSERT a row into `therapists` with the matching user_id
-- 3. Example:
--    INSERT INTO therapists (user_id, name, email, bio, specialties)
--    VALUES (
--      'auth-user-uuid-here',
--      'Dra. María González',
--      'maria@centromargenes.cl',
--      'Especialista en TCC...',
--      ARRAY['Ansiedad', 'Depresión']
--    );
