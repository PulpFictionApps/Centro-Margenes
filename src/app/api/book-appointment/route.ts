import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendAppointmentConfirmation } from "@/lib/email";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patient, therapistId, branchId, serviceId, date, time } = body;

    if (!patient || !therapistId || !branchId || !date || !time) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Service role client bypasses RLS for patient insert/lookup (public booking flow)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Check if the slot is still available
    const { data: existing } = await supabase
      .from("appointments")
      .select("id")
      .eq("therapist_id", therapistId)
      .eq("date", date)
      .eq("time", time)
      .neq("status", "cancelled")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "El horario seleccionado ya no está disponible. Por favor, elige otro." },
        { status: 409 }
      );
    }

    // 2. Find or create patient (using service role to bypass RLS)
    let patientId: string;

    const { data: existingPatient } = await supabaseAdmin
      .from("patients")
      .select("id")
      .eq("email", patient.email.trim().toLowerCase())
      .maybeSingle();

    if (existingPatient) {
      patientId = existingPatient.id;
    } else {
      const { data: newPatient, error: patientError } = await supabaseAdmin
        .from("patients")
        .insert({
          name: patient.name.trim(),
          email: patient.email.trim().toLowerCase(),
          phone: patient.phone.trim(),
          birthdate: patient.birthdate || null,
          document: patient.document?.trim() || null,
        })
        .select("id")
        .single();

      if (patientError || !newPatient) {
        console.error("Patient insert error:", patientError);
        return NextResponse.json(
          { error: "No se pudo registrar al paciente." },
          { status: 500 }
        );
      }
      patientId = newPatient.id;
    }

    // 3. Insert appointment — the DB unique index guards against races
    const { data: appointmentRow, error: appointmentError } = await supabaseAdmin
      .from("appointments")
      .insert({
        patient_id: patientId,
        therapist_id: therapistId,
        treatment_id: null,
        branch_id: branchId,
        date,
        time,
        status: "scheduled",
      })
      .select("cancellation_token")
      .single();

    if (appointmentError) {
      if (appointmentError.code === "23505") {
        return NextResponse.json(
          { error: "El horario seleccionado ya no está disponible. Por favor, elige otro." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "No se pudo crear la cita." },
        { status: 500 }
      );
    }

    // 4. Fetch related data for confirmation email (non-blocking)
    const [therapistRes, serviceRes, branchRes] = await Promise.all([
      supabase.from("therapists").select("name").eq("id", therapistId).single(),
      serviceId
        ? supabase.from("services").select("name").eq("id", serviceId).single()
        : Promise.resolve({ data: null }),
      supabase.from("branches").select("name, type").eq("id", branchId).single(),
    ]);

    const isOnline = branchRes.data?.type === "online";
    const cancelToken = appointmentRow?.cancellation_token;

    // Fire-and-forget: don't block the response on email delivery
    sendAppointmentConfirmation({
      patientName: patient.name.trim(),
      patientEmail: patient.email.trim(),
      therapistName: therapistRes.data?.name || "Tu terapeuta",
      serviceName: serviceRes.data?.name || "Consulta",
      date,
      time,
      modality: isOnline ? "Online" : "Presencial",
      branchName: branchRes.data?.name || "",
      meetingLink: isOnline ? (process.env.DEFAULT_MEETING_LINK || null) : null,
      cancellationToken: cancelToken || undefined,
    }).catch((err) => console.error("[Email] fire-and-forget failed:", err));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
