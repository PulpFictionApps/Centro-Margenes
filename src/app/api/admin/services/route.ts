import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function verifyAdmin() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("therapists")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!data || (data.role !== "admin" && data.role !== "super_admin")) return null;
  return user;
}

// GET /api/admin/services
export async function GET() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const supabaseAdmin = getAdminClient();
  const { data, error } = await supabaseAdmin
    .from("services")
    .select("*")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/services — create
export async function POST(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json();
  const { name, description, duration_minutes, price, price_notes } = body;

  if (!name || !duration_minutes) {
    return NextResponse.json({ error: "Nombre y duración son obligatorios" }, { status: 400 });
  }

  const supabaseAdmin = getAdminClient();
  const { data, error } = await supabaseAdmin
    .from("services")
    .insert({
      name: String(name).trim(),
      description: description ? String(description).trim() : "",
      duration_minutes: Number(duration_minutes),
      price: price !== undefined && price !== "" && price !== null ? Number(price) : null,
      price_notes: price_notes ? String(price_notes).trim() || null : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PUT /api/admin/services — update
export async function PUT(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json();
  const { id, name, description, duration_minutes, price, price_notes } = body;

  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  if (!name || !duration_minutes) {
    return NextResponse.json({ error: "Nombre y duración son obligatorios" }, { status: 400 });
  }

  const supabaseAdmin = getAdminClient();
  const { data, error } = await supabaseAdmin
    .from("services")
    .update({
      name: String(name).trim(),
      description: description ? String(description).trim() : "",
      duration_minutes: Number(duration_minutes),
      price: price !== undefined && price !== "" && price !== null ? Number(price) : null,
      price_notes: price_notes ? String(price_notes).trim() || null : null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/admin/services?id=...
export async function DELETE(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const supabaseAdmin = getAdminClient();
  const { error } = await supabaseAdmin
    .from("services")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
