import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

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

  const { data: admin } = await supabase
    .from("therapists")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!admin || (admin.role !== "admin" && admin.role !== "super_admin")) return null;
  return user;
}

// PUT /api/admin/therapists — update existing therapist (including role)
export async function PUT(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json();
  const { id, name, email, bio, specialties, offers_online, offers_in_person, role, active } = body;

  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });

  const validRoles = ["therapist", "admin", "super_admin"];
  if (role && !validRoles.includes(role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const supabaseAdmin = getAdminClient();
  const updatePayload: Record<string, unknown> = {
    name: name.trim(),
    bio: (bio ?? "").trim(),
    specialties: specialties ?? [],
    offers_online: offers_online ?? false,
    offers_in_person: offers_in_person ?? true,
  };

  if (role !== undefined) updatePayload.role = role;
  if (active !== undefined) updatePayload.active = active;
  if (email) updatePayload.email = email.trim();

  const { error: updateErr } = await supabaseAdmin
    .from("therapists")
    .update(updatePayload)
    .eq("id", id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// POST /api/admin/therapists — create new therapist
export async function POST(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json();
  const { name, email, password, bio, specialties, offers_online, offers_in_person } = body;

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Nombre, email y contraseña son obligatorios" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }

  // Use service role key to create auth user
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "Configuración del servidor incompleta (service role key)" },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Create auth user
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: name.trim() },
    });

  if (authError) {
    return NextResponse.json(
      { error: authError.message },
      { status: 400 }
    );
  }

  if (!authData.user) {
    return NextResponse.json(
      { error: "No se pudo crear el usuario" },
      { status: 500 }
    );
  }

  // Create therapist record
  const { error: insertErr } = await supabaseAdmin.from("therapists").insert({
    user_id: authData.user.id,
    name: name.trim(),
    email: email.trim(),
    bio: (bio ?? "").trim(),
    specialties: specialties ?? [],
    offers_online: offers_online ?? false,
    offers_in_person: offers_in_person ?? true,
    active: true,
    role: "therapist",
  });

  if (insertErr) {
    // Roll back: delete the auth user so it doesn't become orphaned
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    // Give a clear error message for missing columns
    const msg = insertErr.message.includes("column")
      ? `Error de esquema en la BD: ${insertErr.message}. Ejecuta supabase/super-admin-and-prices.sql en el SQL Editor de Supabase.`
      : insertErr.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
