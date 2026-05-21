import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

// GET /api/appointments/[id] - Get appointment details
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

    const { data: therapist } = await supabase
      .from("therapists")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (!therapist) {
      return NextResponse.json({ error: "Terapeuta no encontrado" }, { status: 404 });
    }

    const { data: appointment, error } = await supabase
      .from("appointments")
      .select(`
        *,
        patient:patients (*),
        therapist:therapists (id, name, email),
        treatment:treatments (id, name, duration_minutes),
        branch:branches (id, name, type, address),
        evaluation:evaluations (id, rating, comment, created_at)
      `)
      .eq("id", params.id)
      .single();

    if (error || !appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    // Check access
    const isAdmin = therapist.role === "admin" || therapist.role === "super_admin";
    if (!isAdmin && appointment.therapist_id !== therapist.id) {
      return NextResponse.json({ error: "No tienes acceso a esta cita" }, { status: 403 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Get appointment error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PATCH /api/appointments/[id] - Update appointment
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

    const { data: therapist } = await supabase
      .from("therapists")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (!therapist) {
      return NextResponse.json({ error: "Terapeuta no encontrado" }, { status: 404 });
    }

    // Check ownership
    const { data: existingAppointment } = await supabase
      .from("appointments")
      .select("therapist_id, date, time, status")
      .eq("id", params.id)
      .single();

    if (!existingAppointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    const isAdmin = therapist.role === "admin" || therapist.role === "super_admin";
    if (!isAdmin && existingAppointment.therapist_id !== therapist.id) {
      return NextResponse.json({ error: "No tienes acceso a esta cita" }, { status: 403 });
    }

    const body = await request.json();
    const { status, payment_status, notes, date, time } = body;

    const updateData: Record<string, unknown> = {};

    // Handle status change
    if (status !== undefined) {
      updateData.status = status;
    }

    // Handle payment status change
    if (payment_status !== undefined) {
      updateData.payment_status = payment_status;
    }

    // Handle notes
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Handle rescheduling
    if (date !== undefined || time !== undefined) {
      const newDate = date || existingAppointment.date;
      const newTime = time || existingAppointment.time;

      // Check if new slot is available
      const { data: conflict } = await supabase
        .from("appointments")
        .select("id")
        .eq("therapist_id", existingAppointment.therapist_id)
        .eq("date", newDate)
        .eq("time", newTime)
        .neq("id", params.id)
        .neq("status", "cancelled")
        .maybeSingle();

      if (conflict) {
        return NextResponse.json(
          { error: "El horario seleccionado no está disponible" },
          { status: 409 }
        );
      }

      if (date !== undefined) updateData.date = date;
      if (time !== undefined) updateData.time = time;
    }

    const { data: appointment, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", params.id)
      .select(`
        *,
        patient:patients (id, name, email, phone),
        therapist:therapists (id, name),
        treatment:treatments (id, name),
        branch:branches (id, name, type)
      `)
      .single();

    if (error) {
      console.error("Error updating appointment:", error);
      return NextResponse.json({ error: "Error al actualizar cita" }, { status: 500 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Update appointment error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/appointments/[id] - Delete appointment
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

    const { data: therapist } = await supabase
      .from("therapists")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (!therapist) {
      return NextResponse.json({ error: "Terapeuta no encontrado" }, { status: 404 });
    }

    const { data: existingAppointment } = await supabase
      .from("appointments")
      .select("therapist_id")
      .eq("id", params.id)
      .single();

    if (!existingAppointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    const isAdmin = therapist.role === "admin" || therapist.role === "super_admin";
    if (!isAdmin && existingAppointment.therapist_id !== therapist.id) {
      return NextResponse.json({ error: "No tienes acceso a esta cita" }, { status: 403 });
    }

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Error deleting appointment:", error);
      return NextResponse.json({ error: "Error al eliminar cita" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete appointment error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
