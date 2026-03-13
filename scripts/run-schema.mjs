import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaSQL = readFileSync(join(__dirname, "..", "supabase", "schema.sql"), "utf-8");

const SUPABASE_URL = "https://yitovxgdaadtyjlqmwos.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdG92eGdkYWFkdHlqbHFtd29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDAyNzksImV4cCI6MjA4ODY3NjI3OX0.5aMpXcAoNIfEgnyQgAwY7RIumjZ4zXXJoaYRwcy3vao";
const DB_PASSWORD = "7WfZGlEvoKZ46lH2";

// Split schema into individual statements to execute
const statements = schemaSQL
  .split(/;\s*$/m)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith("--"));

console.log(`Found ${statements.length} SQL statements to execute.\n`);

// First, sign in as the service_role or use the postgres connection via REST
// The anon key won't have permission to CREATE TABLE.
// We need to use the Management API or direct DB connection.

// Let's try using pg over npx
console.log("Will use direct PostgreSQL connection via dynamic import of pg...");

// Install pg on the fly and use it
const { default: pg } = await import("pg").catch(() => {
  console.error("pg not installed. Installing...");
  process.exit(1);
});

// Try multiple pooler regions
const regions = [
  "aws-0-sa-east-1",
  "aws-0-us-east-1", 
  "aws-0-us-west-1",
  "aws-0-eu-west-1",
  "aws-0-ap-southeast-1",
];

let connected = false;
let client;

for (const region of regions) {
  const connStr = `postgresql://postgres.yitovxgdaadtyjlqmwos:${DB_PASSWORD}@${region}.pooler.supabase.com:6543/postgres`;
  console.log(`Trying ${region}...`);
  client = new pg.Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  try {
    await client.connect();
    console.log(`Connected via ${region}!\n`);
    connected = true;
    break;
  } catch (err) {
    console.log(`  Failed: ${err.message}`);
    try { await client.end(); } catch {}
  }
}

if (!connected) {
  // Try port 5432 with pooler as fallback
  for (const region of regions) {
    const connStr = `postgresql://postgres.yitovxgdaadtyjlqmwos:${DB_PASSWORD}@${region}.pooler.supabase.com:5432/postgres`;
    console.log(`Trying ${region} on port 5432...`);
    client = new pg.Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
    try {
      await client.connect();
      console.log(`Connected via ${region}:5432!\n`);
      connected = true;
      break;
    } catch (err) {
      console.log(`  Failed: ${err.message}`);
      try { await client.end(); } catch {}
    }
  }
}

if (!connected) {
  console.error("\nCould not connect to any pooler region.");
  process.exit(1);
}

try {
  await client.connect();
  console.log("Connected to database!\n");

  // Run the entire schema as one transaction
  await client.query(schemaSQL);
  console.log("Schema executed successfully!");

} catch (err) {
  console.error("Error:", err.message);
  if (err.message.includes("already exists")) {
    console.log("\nTables may already exist. Trying to verify...");
    try {
      const res = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      console.log("Existing tables:", res.rows.map(r => r.table_name).join(", "));
    } catch (e2) {
      console.error("Verification failed:", e2.message);
    }
  }
} finally {
  await client.end();
}
