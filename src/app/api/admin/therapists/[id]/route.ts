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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: admin } = await supabase
    .from("therapists")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (!admin || (admin.role !== "admin" && admin.role !== "super_admin"))
    return null;
  return { user, adminId: admin.id };
}

// DELETE /api/admin/therapists/[id]
// Permanently removes the therapist record AND their auth user.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdmin();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Prevent self-deletion
  if (auth.adminId === params.id) {
    return NextResponse.json(
      { error: "No puedes eliminarte a ti mismo" },
      { status: 400 }
    );
  }

  const supabaseAdmin = getAdminClient();

  // Get the therapist's auth user_id before deleting the row
  const { data: therapist, error: fetchErr } = await supabaseAdmin
    .from("therapists")
    .select("id, user_id")
    .eq("id", params.id)
    .single();

  if (fetchErr || !therapist) {
    return NextResponse.json({ error: "Terapeuta no encontrado" }, { status: 404 });
  }

  // Delete the therapist row (cascades to related records per DB FK rules)
  const { error: deleteRowErr } = await supabaseAdmin
    .from("therapists")
    .delete()
    .eq("id", params.id);

  if (deleteRowErr) {
    return NextResponse.json({ error: deleteRowErr.message }, { status: 500 });
  }

  // Delete the auth user so the account no longer exists
  if (therapist.user_id) {
    const { error: authErr } =
      await supabaseAdmin.auth.admin.deleteUser(therapist.user_id);
    if (authErr) {
      // Row is already deleted — log but don't fail the request
      console.error("[therapist delete] auth.admin.deleteUser failed:", authErr.message);
    }
  }

  return NextResponse.json({ success: true });
}
