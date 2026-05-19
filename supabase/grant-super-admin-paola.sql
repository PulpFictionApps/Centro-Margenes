-- Grant super_admin role to paoladiazopazo@gmail.com
-- Run this in the Supabase SQL editor (https://app.supabase.com → SQL Editor)

UPDATE therapists
SET role = 'super_admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'paoladiazopazo@gmail.com'
);

-- Verify the change
SELECT t.name, t.email, t.role, u.email AS auth_email
FROM therapists t
JOIN auth.users u ON u.id = t.user_id
WHERE u.email = 'paoladiazopazo@gmail.com';
