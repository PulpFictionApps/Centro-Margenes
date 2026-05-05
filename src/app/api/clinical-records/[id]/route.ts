import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

// GET /api/clinical-records/[id] - Get clinical record details
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

    const { data: record, error } = await supabase
      .from("clinical_records")
      .select(`
        *,
        patient:patients (*),
        therapist:therapists (id, name, email),
        appointment:appointments (id, date, time, status),
        attachments:clinical_attachments (*)
      `)
      .eq("id", params.id)
      .single();

    if (error || !record) {
      return NextResponse.json({ error: "Ficha clínica no encontrada" }, { status: 404 });
    }

    // Check access
    const isAdmin = therapist.role === "admin" || therapist.role === "super_admin";
    if (!isAdmin && record.therapist_id !== therapist.id) {
      return NextResponse.json({ error: "No tienes acceso a esta ficha" }, { status: 403 });
    }

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Get clinical record error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PATCH /api/clinical-records/[id] - Update clinical record
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
    const { data: existingRecord } = await supabase
      .from("clinical_records")
      .select("therapist_id")
      .eq("id", params.id)
      .single();

    if (!existingRecord) {
      return NextResponse.json({ error: "Ficha clínica no encontrada" }, { status: 404 });
    }

    const isAdmin = therapist.role === "admin" || therapist.role === "super_admin";
    if (!isAdmin && existingRecord.therapist_id !== therapist.id) {
      return NextResponse.json({ error: "No tienes acceso a esta ficha" }, { status: 403 });
    }

    const body = await request.json();
    const {
      session_date,
      chief_complaint,
      notes,
      diagnosis,
      treatment_plan,
      observations,
      mood_state,
      progress_notes,
      next_session_goals,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (session_date !== undefined) updateData.session_date = session_date;
    if (chief_complaint !== undefined) updateData.chief_complaint = chief_complaint;
    if (notes !== undefined) updateData.notes = notes;
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
    if (treatment_plan !== undefined) updateData.treatment_plan = treatment_plan;
    if (observations !== undefined) updateData.observations = observations;
    if (mood_state !== undefined) updateData.mood_state = mood_state;
    if (progress_notes !== undefined) updateData.progress_notes = progress_notes;
    if (next_session_goals !== undefined) updateData.next_session_goals = next_session_goals;

    const { data: record, error } = await supabase
      .from("clinical_records")
      .update(updateData)
      .eq("id", params.id)
      .select(`
        *,
        patient:patients (id, name, email),
        therapist:therapists (id, name),
        attachments:clinical_attachments (*)
      `)
      .single();

    if (error) {
      console.error("Error updating clinical record:", error);
      return NextResponse.json({ error: "Error al actualizar ficha clínica" }, { status: 500 });
    }

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Update clinical record error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/clinical-records/[id] - Delete clinical record (admin only)
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

    // Only admins can delete records
    if (therapist.role !== "admin" && therapist.role !== "super_admin") {
      return NextResponse.json(
        { error: "Solo los administradores pueden eliminar fichas clínicas" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("clinical_records")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Error deleting clinical record:", error);
      return NextResponse.json({ error: "Error al eliminar ficha clínica" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete clinical record error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
