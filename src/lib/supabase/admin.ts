import { createClient } from "@supabase/supabase-js";

// Uses the service role key — bypasses RLS. Only use server-side after auth checks.
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
