-- ============================================
-- Centro Márgenes — Super Admin + Precio en servicios + columnas faltantes
-- Ejecutar en Supabase → SQL Editor → New Query → Run
-- ============================================

-- 0. Agregar columnas faltantes a therapists que el código espera
ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS offers_online BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS offers_in_person BOOLEAN NOT NULL DEFAULT true;

-- 1. Actualizar constraint de rol para incluir super_admin
ALTER TABLE therapists
  DROP CONSTRAINT IF EXISTS therapists_role_check;

ALTER TABLE therapists
  ADD CONSTRAINT therapists_role_check
  CHECK (role IN ('therapist', 'admin', 'super_admin'));

-- 2. Agregar columna precio a services (opcional, nullable)
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS price INTEGER;          -- en pesos CLP, sin decimales

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS price_notes TEXT;       -- ej: "Precio referencial, puede variar"

-- 3. Asignar rol super_admin al usuario administrador principal
--    Reemplaza 'tu-email@ejemplo.com' con el email real del super admin
UPDATE therapists
SET role = 'super_admin'
WHERE email = 'rafaelalbertobenguria@gmail.com';

-- Si necesitas verificar qué usuarios existen, ejecuta esto primero:
-- SELECT id, email, name, role FROM therapists ORDER BY created_at;

-- 4. (Opcional) Crear nuevo usuario super_admin si no existe registro en therapists
--    Descomenta y ajusta si es necesario:
-- INSERT INTO therapists (user_id, name, email, bio, specialties, role)
-- SELECT
--   id AS user_id,
--   'Nombre Admin' AS name,
--   'admin@centromargenes.cl' AS email,
--   '' AS bio,
--   '{}'::text[] AS specialties,
--   'super_admin' AS role
-- FROM auth.users
-- WHERE email = 'admin@centromargenes.cl'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
