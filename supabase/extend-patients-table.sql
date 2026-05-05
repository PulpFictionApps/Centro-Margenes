-- ============================================
-- Extend Patients Table with Additional Fields
-- ============================================
-- Run this SQL to add demographic fields to the patients table

-- Add missing fields to patients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'address'
  ) THEN
    ALTER TABLE patients ADD COLUMN address TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'gender'
  ) THEN
    ALTER TABLE patients ADD COLUMN gender TEXT
    CHECK (gender IN ('M', 'F', 'O', 'N') OR gender IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'profession'
  ) THEN
    ALTER TABLE patients ADD COLUMN profession TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'marital_status'
  ) THEN
    ALTER TABLE patients ADD COLUMN marital_status TEXT
    CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'other') OR marital_status IS NULL);
  END IF;
END $$;
