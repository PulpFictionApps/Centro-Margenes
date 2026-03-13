-- ============================================
-- Centro Márgenes — Setup completo
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================

-- =====================
-- 1. MIGRACIÓN: Services, Modality & Slot Duration
-- =====================

-- Slot duration en availability
ALTER TABLE availability
  ADD COLUMN IF NOT EXISTS slot_duration INTEGER NOT NULL DEFAULT 50;

-- Modalidad en therapists
ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS offers_online BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS offers_in_person BOOLEAN NOT NULL DEFAULT false;

-- Tabla de servicios
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration_minutes INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Relación terapeuta-servicios
CREATE TABLE IF NOT EXISTS therapist_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(therapist_id, service_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_therapist_services_therapist ON therapist_services(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_services_service ON therapist_services(service_id);

-- RLS para nuevas tablas
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_services ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view services') THEN
    CREATE POLICY "Public can view services" ON services FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view therapist services') THEN
    CREATE POLICY "Public can view therapist services" ON therapist_services FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Therapists can add own services') THEN
    CREATE POLICY "Therapists can add own services" ON therapist_services FOR INSERT
      WITH CHECK (therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Therapists can remove own services') THEN
    CREATE POLICY "Therapists can remove own services" ON therapist_services FOR DELETE
      USING (therapist_id IN (SELECT id FROM therapists WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Servicios iniciales
INSERT INTO services (name, description, duration_minutes) VALUES
  ('Psicoterapia adultos', 'Sesión individual de psicoterapia para adultos.', 50),
  ('Psicoterapia adolescentes', 'Sesión especializada para adolescentes.', 45),
  ('Terapia de pareja', 'Sesión orientada a mejorar la relación de pareja.', 60),
  ('Terapia familiar', 'Sesión de terapia con enfoque sistémico familiar.', 60)
ON CONFLICT DO NOTHING;

-- =====================
-- 2. POLÍTICA INSERT para auto-crear perfil de terapeuta
-- =====================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can create own therapist profile') THEN
    CREATE POLICY "Authenticated users can create own therapist profile"
      ON therapists FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- =====================
-- 3. CREAR TERAPEUTA para el usuario actual
-- =====================
INSERT INTO therapists (user_id, name, email, bio, specialties, offers_online, offers_in_person)
SELECT 
  id AS user_id,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) AS name,
  email,
  '' AS bio,
  ARRAY[]::TEXT[] AS specialties,
  false AS offers_online,
  true AS offers_in_person
FROM auth.users
WHERE email = 'rafaelalbertobenguria@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
