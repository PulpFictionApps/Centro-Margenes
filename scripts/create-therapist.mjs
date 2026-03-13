// Script to create a therapist record for an existing auth user
const SUPABASE_URL = "https://yitovxgdaadtyjlqmwos.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdG92eGdkYWFkdHlqbHFtd29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDAyNzksImV4cCI6MjA4ODY3NjI3OX0.5aMpXcAoNIfEgnyQgAwY7RIumjZ4zXXJoaYRwcy3vao";

const EMAIL = "rafaelalbertobenguria@gmail.com";

async function main() {
  // First, let's check if a therapist already exists for this email
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/therapists?email=eq.${encodeURIComponent(EMAIL)}&select=id,user_id,name,email`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  const existing = await checkRes.json();
  
  if (existing.length > 0) {
    console.log("Ya existe un terapeuta con ese email:", existing[0]);
    
    // Check if it has a user_id
    if (!existing[0].user_id) {
      console.log("\nEl terapeuta existe pero sin user_id vinculado.");
      console.log("Necesitas actualizar el user_id manualmente en Supabase SQL Editor:");
      console.log(`UPDATE therapists SET user_id = '<AUTH_USER_UUID>' WHERE email = '${EMAIL}';`);
    }
    return;
  }

  // List all auth users to find the one with this email
  // This requires service role key. If not available, we'll try the admin API
  console.log(`No se encontró terapeuta con email ${EMAIL}.`);
  console.log("Intentando crear registro...\n");

  // Try to create using anon key (will work if RLS allows or if there's no RLS on insert)
  // First, let's just list what auth users exist by checking the therapists table
  const allTherapists = await fetch(
    `${SUPABASE_URL}/rest/v1/therapists?select=id,user_id,name,email`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  const allData = await allTherapists.json();
  console.log("Terapeutas actuales en la BD:", allData);
  
  // We need to get the auth user ID. Let's use the RPC or direct insert.
  // Since we can't list auth.users with anon key, we'll create the therapist
  // and the user_id will need to be updated later, OR we generate the SQL.
  
  console.log("\n========================================");
  console.log("INSTRUCCIONES:");
  console.log("========================================");
  console.log("Copia y pega este SQL en el Supabase SQL Editor:");
  console.log("(Dashboard -> SQL Editor -> New Query -> Run)\n");
  console.log(`
-- Vincular usuario de auth con tabla therapists
INSERT INTO therapists (user_id, name, email, bio, specialties)
SELECT 
  id as user_id,
  'Rafael Benguria' as name,
  '${EMAIL}' as email,
  'Terapeuta del Centro Márgenes' as bio,
  ARRAY['Psicología Clínica'] as specialties
FROM auth.users
WHERE email = '${EMAIL}'
ON CONFLICT (user_id) DO NOTHING;
  `);
}

main().catch(console.error);
