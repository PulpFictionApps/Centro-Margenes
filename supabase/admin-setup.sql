-- ============================================
-- Centro Márgenes — Admin Setup
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================

-- 1. Add 'active' column to therapists
ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- 2. Add 'role' column to therapists ('therapist' or 'admin')
ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'therapist'
    CHECK (role IN ('therapist', 'admin'));

-- 3. RLS: Admins can manage everything
-- Allow admins to read all patients
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all patients') THEN
    CREATE POLICY "Admins can view all patients"
      ON patients FOR SELECT
      USING (
        EXISTS (SELECT 1 FROM therapists WHERE user_id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

-- Allow admins to manage therapists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert therapists') THEN
    CREATE POLICY "Admins can insert therapists"
      ON therapists FOR INSERT
      WITH CHECK (
        EXISTS (SELECT 1 FROM therapists WHERE user_id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update therapists') THEN
    CREATE POLICY "Admins can update therapists"
      ON therapists FOR UPDATE
      USING (
        EXISTS (SELECT 1 FROM therapists WHERE user_id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete therapists') THEN
    CREATE POLICY "Admins can delete therapists"
      ON therapists FOR DELETE
      USING (
        EXISTS (SELECT 1 FROM therapists WHERE user_id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

-- Allow admins to view all appointments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all appointments') THEN
    CREATE POLICY "Admins can view all appointments"
      ON appointments FOR SELECT
      USING (
        EXISTS (SELECT 1 FROM therapists WHERE user_id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

-- Allow admins to update any appointment
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update all appointments') THEN
    CREATE POLICY "Admins can update all appointments"
      ON appointments FOR UPDATE
      USING (
        EXISTS (SELECT 1 FROM therapists WHERE user_id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

-- Allow admins to manage services
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert services') THEN
    CREATE POLICY "Admins can insert services"
      ON services FOR INSERT
      WITH CHECK (
        EXISTS (SELECT 1 FROM therapists WHERE user_id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update services') THEN
    CREATE POLICY "Admins can update services"
      ON services FOR UPDATE
      USING (
        EXISTS (SELECT 1 FROM therapists WHERE user_id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete services') THEN
    CREATE POLICY "Admins can delete services"
      ON services FOR DELETE
      USING (
        EXISTS (SELECT 1 FROM therapists WHERE user_id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

-- Allow admins to view all availability
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all availability') THEN
    CREATE POLICY "Admins can view all availability"
      ON availability FOR SELECT
      USING (
        EXISTS (SELECT 1 FROM therapists WHERE user_id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

-- 4. Promote your user to admin (update email as needed)
UPDATE therapists SET role = 'admin'
WHERE email = 'rafaelalbertobenguria@gmail.com';
