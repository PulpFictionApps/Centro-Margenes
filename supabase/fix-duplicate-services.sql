-- ============================================
-- Fix: Remove duplicate services
-- Run in Supabase SQL Editor
-- ============================================

-- Delete duplicate services (keeps the first inserted of each name)
DELETE FROM services
WHERE id NOT IN (
  SELECT DISTINCT ON (name) id
  FROM services
  ORDER BY name, created_at ASC
);

-- Prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_services_unique_name ON services (name);
