import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

// GET /api/patients/[id] - Get patient details
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

    // Get patient with summary stats
    const { data: patient, error } = await supabase
      .from("patients")
      .select(`
        *,
        appointments (
          id,
          therapist_id,
          date,
          time,
          status,
          payment_status,
          therapist:therapists (name),
          branch:branches (name, type)
        )
      `)
      .eq("id", params.id)
      .single();

    if (error || !patient) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    // Check access: only allow if admin or has appointments with this patient
    const isAdmin = therapist.role === "admin" || therapist.role === "super_admin";
    const hasAccess = isAdmin || patient.appointments?.some(
      (a: { therapist_id: string }) => a.therapist_id === therapist.id
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "No tienes acceso a este paciente" }, { status: 403 });
    }

    // Get clinical records count
    const { count: recordsCount } = await supabase
      .from("clinical_records")
      .select("id", { count: "exact", head: true })
      .eq("patient_id", params.id);

    // Calculate stats
    const appointments = patient.appointments || [];
    const completedSessions = appointments.filter(
      (a: { status: string }) => a.status === "completed"
    ).length;

    return NextResponse.json({
      patient: {
        ...patient,
        total_appointments: appointments.length,
        completed_sessions: completedSessions,
        total_records: recordsCount || 0,
        last_appointment: appointments.length > 0 
          ? appointments.sort((a: { date: string }, b: { date: string }) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            )[0]?.date 
          : null,
      },
    });
  } catch (error) {
    console.error("Get patient error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PATCH /api/patients/[id] - Update patient
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

    const body = await request.json();
    const { name, email, phone, birthdate, document } = body;

    // Verify access to this patient
    const { data: existingPatient } = await supabase
      .from("patients")
      .select(`
        id,
        appointments (therapist_id)
      `)
      .eq("id", params.id)
      .single();

    if (!existingPatient) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    const isAdmin = therapist.role === "admin" || therapist.role === "super_admin";
    const hasAccess = isAdmin || existingPatient.appointments?.some(
      (a: { therapist_id: string }) => a.therapist_id === therapist.id
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "No tienes acceso a este paciente" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim();
    if (phone) updateData.phone = phone.trim();
    if (birthdate !== undefined) updateData.birthdate = birthdate || null;
    if (document !== undefined) updateData.document = document?.trim() || null;

    const { data: patient, error } = await supabase
      .from("patients")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating patient:", error);
      return NextResponse.json({ error: "Error al actualizar paciente" }, { status: 500 });
    }

    return NextResponse.json({ patient });
  } catch (error) {
    console.error("Update patient error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
