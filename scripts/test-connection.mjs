// Test Supabase connection and check table status
const SUPABASE_URL = "https://yitovxgdaadtyjlqmwos.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdG92eGdkYWFkdHlqbHFtd29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDAyNzksImV4cCI6MjA4ODY3NjI3OX0.5aMpXcAoNIfEgnyQgAwY7RIumjZ4zXXJoaYRwcy3vao";

const tables = ["therapists", "treatments", "branches", "patients", "availability", "appointments", "newsletter_subscribers"];

console.log("Testing Supabase connection...\n");

for (const table of tables) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count&limit=0`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "count=exact",
      },
    });
    const count = res.headers.get("content-range");
    if (res.ok) {
      console.log(`✓ ${table} — exists (${count ?? "accessible"})`);
    } else if (res.status === 404) {
      console.log(`✗ ${table} — NOT FOUND (needs schema setup)`);
    } else {
      const body = await res.text();
      console.log(`? ${table} — status ${res.status}: ${body.slice(0, 100)}`);
    }
  } catch (err) {
    console.log(`✗ ${table} — connection error: ${err.message}`);
  }
}

// Test auth endpoint
try {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  if (res.ok) {
    console.log("\n✓ Auth service is accessible");
  } else {
    console.log(`\n? Auth service returned ${res.status}`);
  }
} catch (err) {
  console.log(`\n✗ Auth service error: ${err.message}`);
}
