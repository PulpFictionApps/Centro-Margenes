import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

// GET /api/clinical-records - List clinical records
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patient_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("clinical_records")
      .select(`
        *,
        patient:patients (id, name, email, phone),
        therapist:therapists (id, name),
        attachments:clinical_attachments (id, file_name, file_type, file_size)
      `, { count: "exact" });

    // Filter by patient if provided
    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    // Filter by therapist unless admin
    const isAdmin = therapist.role === "admin" || therapist.role === "super_admin";
    if (!isAdmin) {
      query = query.eq("therapist_id", therapist.id);
    }

    const { data: records, error, count } = await query
      .order("session_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching clinical records:", error);
      return NextResponse.json({ error: "Error al obtener fichas clínicas" }, { status: 500 });
    }

    return NextResponse.json({
      records,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Clinical records API error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/clinical-records - Create clinical record
export async function POST(request: NextRequest) {
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
    const {
      patient_id,
      appointment_id,
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

    if (!patient_id) {
      return NextResponse.json(
        { error: "El paciente es obligatorio" },
        { status: 400 }
      );
    }

    // Verify therapist has access to this patient
    const isAdmin = therapist.role === "admin" || therapist.role === "super_admin";
    
    if (!isAdmin) {
      const { data: hasAccess } = await supabase
        .from("appointments")
        .select("id")
        .eq("patient_id", patient_id)
        .eq("therapist_id", therapist.id)
        .limit(1)
        .single();

      if (!hasAccess) {
        return NextResponse.json(
          { error: "No tienes acceso a este paciente" },
          { status: 403 }
        );
      }
    }

    const { data: record, error } = await supabase
      .from("clinical_records")
      .insert({
        patient_id,
        therapist_id: therapist.id,
        appointment_id: appointment_id || null,
        session_date: session_date || new Date().toISOString().split("T")[0],
        chief_complaint: chief_complaint || null,
        notes: notes || null,
        diagnosis: diagnosis || null,
        treatment_plan: treatment_plan || null,
        observations: observations || null,
        mood_state: mood_state || null,
        progress_notes: progress_notes || null,
        next_session_goals: next_session_goals || null,
      })
      .select(`
        *,
        patient:patients (id, name, email),
        therapist:therapists (id, name)
      `)
      .single();

    if (error) {
      console.error("Error creating clinical record:", error);
      return NextResponse.json({ error: "Error al crear ficha clínica" }, { status: 500 });
    }

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error("Create clinical record error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
