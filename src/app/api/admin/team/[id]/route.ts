import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET /api/admin/team/[id] - Get team member details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: currentUser } = await supabase
      .from("therapists")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (!currentUser || currentUser.role !== "super_admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { data: member, error } = await supabase
      .from("therapists")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !member) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }

    // Get statistics
    const { data: appointments } = await supabase
      .from("appointments")
      .select("id, status, date")
      .eq("therapist_id", params.id);

    const { data: evaluations } = await supabase
      .from("evaluations")
      .select("rating")
      .eq("therapist_id", params.id);

    const stats = {
      total_appointments: appointments?.length || 0,
      completed_appointments: appointments?.filter(a => a.status === "completed").length || 0,
      cancelled_appointments: appointments?.filter(a => a.status === "cancelled").length || 0,
      average_rating: evaluations && evaluations.length > 0
        ? evaluations.reduce((acc, e) => acc + e.rating, 0) / evaluations.length
        : null,
      total_reviews: evaluations?.length || 0,
    };

    return NextResponse.json({ member: { ...member, stats } });
  } catch (error) {
    console.error("Get team member error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PATCH /api/admin/team/[id] - Update team member
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: currentUser } = await supabase
      .from("therapists")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (!currentUser || currentUser.role !== "super_admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      bio,
      specialties,
      role,
      salary,
      hire_date,
      active,
      offers_online,
      offers_in_person,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim();
    if (bio !== undefined) updateData.bio = bio;
    if (specialties !== undefined) updateData.specialties = specialties;
    if (role !== undefined) updateData.role = role;
    if (salary !== undefined) updateData.salary = salary;
    if (hire_date !== undefined) updateData.hire_date = hire_date;
    if (active !== undefined) updateData.active = active;
    if (offers_online !== undefined) updateData.offers_online = offers_online;
    if (offers_in_person !== undefined) updateData.offers_in_person = offers_in_person;

    const { data: member, error } = await supabase
      .from("therapists")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating team member:", error);
      return NextResponse.json({ error: "Error al actualizar miembro" }, { status: 500 });
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Update team member error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/admin/team/[id] - Deactivate team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: currentUser } = await supabase
      .from("therapists")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (!currentUser || currentUser.role !== "super_admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Cannot deactivate yourself
    if (currentUser.id === params.id) {
      return NextResponse.json(
        { error: "No puedes desactivarte a ti mismo" },
        { status: 400 }
      );
    }

    // Soft delete - just deactivate
    const { error } = await supabase
      .from("therapists")
      .update({ active: false })
      .eq("id", params.id);

    if (error) {
      console.error("Error deactivating team member:", error);
      return NextResponse.json({ error: "Error al desactivar miembro" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete team member error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
