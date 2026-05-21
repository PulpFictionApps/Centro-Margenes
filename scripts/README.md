# Scripts

This folder intentionally contains no executable scripts.

Historically, local helper scripts existed here for direct database setup/testing,
but they were removed because they were environment-specific and risky to keep in-repo.

Recommended approach:
- Use Supabase SQL Editor for migration files in `supabase/`.
- Use environment variables in Vercel/Supabase instead of embedding credentials.
