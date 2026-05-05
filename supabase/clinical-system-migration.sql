-- ============================================
-- Centro Márgenes - Clinical System Migration
-- ============================================
-- Run this SQL in Supabase SQL Editor to add clinical records,
-- evaluations, team management, and extended appointment features.

-- ============================================
-- EXTEND EXISTING TABLES
-- ============================================

-- Add payment_status to appointments if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE appointments 
    ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'refunded'));
  END IF;
END $$;

-- Add notes to appointments for quick notes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'notes'
  ) THEN
    ALTER TABLE appointments ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Extend therapists table with role and super_admin support
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'therapists' AND column_name = 'role'
  ) THEN
    ALTER TABLE therapists 
    ADD COLUMN role TEXT NOT NULL DEFAULT 'therapist'
    CHECK (role IN ('therapist', 'admin', 'super_admin'));
  END IF;
END $$;

-- Add salary and hire_date to therapists for team management
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'therapists' AND column_name = 'salary'
  ) THEN
    ALTER TABLE therapists ADD COLUMN salary DECIMAL(10, 2);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'therapists' AND column_name = 'hire_date'
  ) THEN
    ALTER TABLE therapists ADD COLUMN hire_date DATE;
  END IF;
END $$;

-- ============================================
-- NEW TABLES
-- ============================================

-- Clinical Records (Fichas Clínicas)
CREATE TABLE IF NOT EXISTS clinical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_number INTEGER NOT NULL DEFAULT 1,
  chief_complaint TEXT, -- Motivo de consulta
  notes TEXT, -- Notas de la sesión
  diagnosis TEXT, -- Diagnóstico
  treatment_plan TEXT, -- Plan de tratamiento
  observations TEXT, -- Observaciones
  mood_state TEXT, -- Estado de ánimo del paciente
  progress_notes TEXT, -- Notas de progreso
  next_session_goals TEXT, -- Objetivos para próxima sesión
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clinical Record Attachments
CREATE TABLE IF NOT EXISTS clinical_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinical_record_id UUID REFERENCES clinical_records(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES therapists(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Patient Evaluations (Ratings after completed sessions)
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team Members (for additional non-therapist staff)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'staff'
    CHECK (role IN ('staff', 'receptionist', 'admin', 'super_admin')),
  phone TEXT,
  salary DECIMAL(10, 2),
  hire_date DATE,
  active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Log for tracking important changes
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clinical_records_patient ON clinical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_records_therapist ON clinical_records(therapist_id);
CREATE INDEX IF NOT EXISTS idx_clinical_records_date ON clinical_records(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_records_appointment ON clinical_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinical_attachments_record ON clinical_attachments(clinical_record_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_therapist ON evaluations(therapist_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_patient ON evaluations(patient_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_appointment ON evaluations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_appointments_payment ON appointments(payment_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_therapist_slot
  ON appointments (therapist_id, date, time)
  WHERE status <> 'cancelled';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin or super_admin
CREATE OR REPLACE FUNCTION is_admin_or_super()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM therapists 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM therapists 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get therapist_id for current user
CREATE OR REPLACE FUNCTION get_therapist_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT id FROM therapists WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES: Clinical Records
-- ============================================

-- Therapists can view records of their own patients
DROP POLICY IF EXISTS "Therapists view own patient records" ON clinical_records;
CREATE POLICY "Therapists view own patient records"
  ON clinical_records FOR SELECT
  USING (
    therapist_id = get_therapist_id()
    OR is_admin_or_super()
  );

-- Therapists can insert records for their patients
DROP POLICY IF EXISTS "Therapists create records" ON clinical_records;
CREATE POLICY "Therapists create records"
  ON clinical_records FOR INSERT
  WITH CHECK (
    therapist_id = get_therapist_id()
    OR is_admin_or_super()
  );

-- Therapists can update their own records
DROP POLICY IF EXISTS "Therapists update own records" ON clinical_records;
CREATE POLICY "Therapists update own records"
  ON clinical_records FOR UPDATE
  USING (
    therapist_id = get_therapist_id()
    OR is_admin_or_super()
  )
  WITH CHECK (
    therapist_id = get_therapist_id()
    OR is_admin_or_super()
  );

-- Only admins can delete records
DROP POLICY IF EXISTS "Admins delete records" ON clinical_records;
CREATE POLICY "Admins delete records"
  ON clinical_records FOR DELETE
  USING (is_admin_or_super());

-- ============================================
-- RLS POLICIES: Clinical Attachments
-- ============================================

DROP POLICY IF EXISTS "View own attachments" ON clinical_attachments;
CREATE POLICY "View own attachments"
  ON clinical_attachments FOR SELECT
  USING (
    clinical_record_id IN (
      SELECT id FROM clinical_records 
      WHERE therapist_id = get_therapist_id()
    )
    OR is_admin_or_super()
  );

DROP POLICY IF EXISTS "Upload attachments" ON clinical_attachments;
CREATE POLICY "Upload attachments"
  ON clinical_attachments FOR INSERT
  WITH CHECK (
    clinical_record_id IN (
      SELECT id FROM clinical_records 
      WHERE therapist_id = get_therapist_id()
    )
    OR is_admin_or_super()
  );

DROP POLICY IF EXISTS "Delete own attachments" ON clinical_attachments;
CREATE POLICY "Delete own attachments"
  ON clinical_attachments FOR DELETE
  USING (
    uploaded_by = get_therapist_id()
    OR is_admin_or_super()
  );

-- ============================================
-- RLS POLICIES: Evaluations
-- ============================================

-- Anyone can create evaluations (for completed appointments)
DROP POLICY IF EXISTS "Create evaluations" ON evaluations;
CREATE POLICY "Create evaluations"
  ON evaluations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE id = appointment_id 
      AND status = 'completed'
    )
  );

-- Therapists see their own evaluations
DROP POLICY IF EXISTS "View evaluations" ON evaluations;
CREATE POLICY "View evaluations"
  ON evaluations FOR SELECT
  USING (
    therapist_id = get_therapist_id()
    OR is_admin_or_super()
  );

-- ============================================
-- RLS POLICIES: Team Members
-- ============================================

-- Only super_admin can view team
DROP POLICY IF EXISTS "Super admin views team" ON team_members;
CREATE POLICY "Super admin views team"
  ON team_members FOR SELECT
  USING (is_super_admin() OR is_admin_or_super());

-- Only super_admin can manage team
DROP POLICY IF EXISTS "Super admin manages team" ON team_members;
CREATE POLICY "Super admin manages team"
  ON team_members FOR INSERT
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admin updates team" ON team_members;
CREATE POLICY "Super admin updates team"
  ON team_members FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admin deletes team" ON team_members;
CREATE POLICY "Super admin deletes team"
  ON team_members FOR DELETE
  USING (is_super_admin());

-- ============================================
-- RLS POLICIES: Audit Log
-- ============================================

-- Only admins can view audit logs
DROP POLICY IF EXISTS "Admins view audit log" ON audit_log;
CREATE POLICY "Admins view audit log"
  ON audit_log FOR SELECT
  USING (is_admin_or_super());

-- System can insert (via trigger or API)
DROP POLICY IF EXISTS "System creates audit log" ON audit_log;
CREATE POLICY "System creates audit log"
  ON audit_log FOR INSERT
  WITH CHECK (true);

-- ============================================
-- RLS POLICIES: Extended Patients
-- ============================================

-- Allow admins to view all patients
DROP POLICY IF EXISTS "Therapists can view their patients" ON patients;
DROP POLICY IF EXISTS "View patients" ON patients;

CREATE POLICY "View patients"
  ON patients FOR SELECT
  USING (
    id IN (
      SELECT patient_id FROM appointments
      WHERE therapist_id = get_therapist_id()
    )
    OR is_admin_or_super()
  );

-- Allow therapists to update patient info
DROP POLICY IF EXISTS "Update patients" ON patients;
CREATE POLICY "Update patients"
  ON patients FOR UPDATE
  USING (
    id IN (
      SELECT patient_id FROM appointments
      WHERE therapist_id = get_therapist_id()
    )
    OR is_admin_or_super()
  );

-- ============================================
-- RLS POLICIES: Extended Appointments
-- ============================================

-- Admins can view all appointments
DROP POLICY IF EXISTS "Therapists can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Therapists can update own appointments" ON appointments;
DROP POLICY IF EXISTS "View appointments" ON appointments;

CREATE POLICY "View appointments"
  ON appointments FOR SELECT
  USING (
    therapist_id = get_therapist_id()
    OR is_admin_or_super()
    OR cancellation_token IS NOT NULL -- Allow public access with token
  );

DROP POLICY IF EXISTS "Update appointments" ON appointments;
CREATE POLICY "Update appointments"
  ON appointments FOR UPDATE
  USING (
    therapist_id = get_therapist_id()
    OR is_admin_or_super()
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to clinical_records
DROP TRIGGER IF EXISTS update_clinical_records_updated_at ON clinical_records;
CREATE TRIGGER update_clinical_records_updated_at
  BEFORE UPDATE ON clinical_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Apply to team_members
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-calculate session number
CREATE OR REPLACE FUNCTION calculate_session_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.session_number = (
    SELECT COALESCE(MAX(session_number), 0) + 1
    FROM clinical_records
    WHERE patient_id = NEW.patient_id
    AND therapist_id = NEW.therapist_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_session_number ON clinical_records;
CREATE TRIGGER auto_session_number
  BEFORE INSERT ON clinical_records
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_number();

-- Enforce that evaluations can only be created for completed appointments
CREATE OR REPLACE FUNCTION ensure_completed_appointment_for_evaluation()
RETURNS TRIGGER AS $$
DECLARE
  appointment_status TEXT;
BEGIN
  SELECT status INTO appointment_status
  FROM appointments
  WHERE id = NEW.appointment_id;

  IF appointment_status IS NULL THEN
    RAISE EXCEPTION 'Appointment % does not exist', NEW.appointment_id;
  END IF;

  IF appointment_status <> 'completed' THEN
    RAISE EXCEPTION 'Only completed appointments can be evaluated';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ensure_completed_appointment_for_evaluation ON evaluations;
CREATE TRIGGER trg_ensure_completed_appointment_for_evaluation
  BEFORE INSERT OR UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION ensure_completed_appointment_for_evaluation();

-- ============================================
-- STORAGE BUCKET FOR CLINICAL ATTACHMENTS
-- ============================================

-- Run this separately in Supabase Dashboard > Storage:
-- 1. Create bucket named 'clinical-attachments'
-- 2. Set it to private
-- 3. Add RLS policies below

-- Storage policies (run in SQL Editor):
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('clinical-attachments', 'clinical-attachments', false)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Patient summary view
CREATE OR REPLACE VIEW patient_summary AS
SELECT 
  p.*,
  COUNT(DISTINCT a.id) as total_appointments,
  COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_sessions,
  COUNT(DISTINCT cr.id) as total_records,
  MAX(a.date) as last_appointment,
  MIN(a.date) as first_appointment
FROM patients p
LEFT JOIN appointments a ON p.id = a.patient_id
LEFT JOIN clinical_records cr ON p.id = cr.patient_id
GROUP BY p.id;

-- Therapist statistics view
CREATE OR REPLACE VIEW therapist_stats AS
SELECT 
  t.*,
  COUNT(DISTINCT a.id) as total_appointments,
  COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_sessions,
  COUNT(DISTINCT a.patient_id) as unique_patients,
  AVG(e.rating)::DECIMAL(3,2) as average_rating,
  COUNT(e.id) as total_reviews
FROM therapists t
LEFT JOIN appointments a ON t.id = a.therapist_id
LEFT JOIN evaluations e ON t.id = e.therapist_id
GROUP BY t.id;

-- ============================================
-- SAMPLE DATA (Optional - remove for production)
-- ============================================

-- You can uncomment and run this to create a super_admin
-- UPDATE therapists SET role = 'super_admin' WHERE email = 'admin@centromargenes.com';
