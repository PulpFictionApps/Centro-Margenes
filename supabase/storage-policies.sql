-- ============================================
-- Supabase Storage Policies for Clinical Attachments
-- ============================================
-- Run this in the Supabase SQL Editor after creating
-- the 'clinical-attachments' bucket.

-- First, create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clinical-attachments',
  'clinical-attachments',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- Storage RLS Policies
-- ============================================

-- Helper function to get therapist_id
CREATE OR REPLACE FUNCTION storage_get_therapist_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT id FROM public.therapists WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if admin
CREATE OR REPLACE FUNCTION storage_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.therapists 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Upload Policy: Therapists can upload to clinical records they own
CREATE POLICY "Therapists upload to own records"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'clinical-attachments'
  AND (
    storage_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.clinical_records cr
      WHERE cr.id::text = (storage.foldername(name))[1]
      AND cr.therapist_id = storage_get_therapist_id()
    )
  )
);

-- Select Policy: Therapists can view files from their records
CREATE POLICY "Therapists view own record files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'clinical-attachments'
  AND (
    storage_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.clinical_records cr
      WHERE cr.id::text = (storage.foldername(name))[1]
      AND cr.therapist_id = storage_get_therapist_id()
    )
  )
);

-- Update Policy: Therapists can update their own files
CREATE POLICY "Therapists update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'clinical-attachments'
  AND (
    storage_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.clinical_attachments ca
      JOIN public.clinical_records cr ON ca.clinical_record_id = cr.id
      WHERE ca.file_url LIKE '%' || name
      AND ca.uploaded_by = storage_get_therapist_id()
    )
  )
);

-- Delete Policy: Therapists can delete their own uploads, admins can delete any
CREATE POLICY "Delete own uploads or admin"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'clinical-attachments'
  AND (
    storage_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.clinical_attachments ca
      WHERE ca.file_url LIKE '%' || name
      AND ca.uploaded_by = storage_get_therapist_id()
    )
  )
);

-- ============================================
-- Notes
-- ============================================
-- The file path structure is: {clinical_record_id}/{timestamp}-{random}.{ext}
-- This allows us to use the folder name to verify record ownership.
-- 
-- Make sure to run the clinical-system-migration.sql first to create
-- the clinical_records and clinical_attachments tables.
