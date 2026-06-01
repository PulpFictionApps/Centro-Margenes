import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendAppointmentConfirmation,
  sendTherapistBookingNotification,
} from "@/lib/email";
import { sendPushToUser } from "@/lib/push";
import { buildGoogleCalendarUrl } from "@/lib/utils";

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

    // Service role client bypasses RLS for patient insert/lookup (public booking flow).
    // Falls back to anon client if service role key is not configured.
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error("[book-appointment] SUPABASE_SERVICE_ROLE_KEY is not set — patient operations may fail due to RLS");
    }
    const supabaseAdmin = serviceRoleKey
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )
      : supabase;

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
      console.error("[book-appointment] Appointment insert error:", appointmentError);
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

    const { error: linkError } = await supabaseAdmin
      .from("therapist_patients")
      .upsert(
        {
          therapist_id: therapistId,
          patient_id: patientId,
          source: "booking",
        },
        { onConflict: "therapist_id,patient_id" }
      );

    if (linkError) {
      console.error("[book-appointment] Failed to link patient with therapist roster:", linkError);
    }

    // 4. Fetch related data for confirmation email (non-blocking)
    // Include user_id in therapist query so we don't need a separate lookup
    const [therapistRes, serviceRes, branchRes] = await Promise.all([
      supabaseAdmin.from("therapists").select("name, user_id, email, meeting_link").eq("id", therapistId).single(),
      serviceId
        ? supabase.from("services").select("name").eq("id", serviceId).single()
        : Promise.resolve({ data: null }),
      supabase.from("branches").select("name, type").eq("id", branchId).single(),
    ]);

    const isOnline = branchRes.data?.type === "online";
    const therapistMeetingLink = (therapistRes.data as { meeting_link?: string | null } | null)?.meeting_link ?? null;
    const meetingLink = isOnline
      ? (therapistMeetingLink || process.env.DEFAULT_MEETING_LINK || null)
      : null;
    const cancelToken = appointmentRow?.cancellation_token;

    // Await confirmation email so serverless execution does not end before dispatch.
    const confirmationEmail = await sendAppointmentConfirmation({
      patientName: patient.name.trim(),
      patientEmail: patient.email.trim().toLowerCase(),
      therapistName: therapistRes.data?.name || "Tu terapeuta",
      serviceName: serviceRes.data?.name || "Consulta",
      date,
      time,
      modality: isOnline ? "Online" : "Presencial",
      branchName: branchRes.data?.name || "",
      meetingLink,
      cancellationToken: cancelToken || undefined,
    });

    if (confirmationEmail.error) {
      console.error("[book-appointment] Confirmation email was not sent:", confirmationEmail.error);
    }

    const therapistEmail = (therapistRes.data as { email?: string } | null)?.email?.trim().toLowerCase();
    if (therapistEmail) {
      const gcalUrl = buildGoogleCalendarUrl({
        title: `Cita — ${patient.name.trim()}${serviceRes.data?.name ? ` (${serviceRes.data.name})` : ""}`,
        date,
        time,
        durationMinutes: 60,
        location: branchRes.data?.name ?? "",
        details: meetingLink ? `Enlace Meet: ${meetingLink}` : "",
      });

      const therapistBookingEmail = await sendTherapistBookingNotification({
        therapistName: therapistRes.data?.name || "Terapeuta",
        therapistEmail,
        patientName: patient.name.trim(),
        patientEmail: patient.email.trim().toLowerCase(),
        serviceName: serviceRes.data?.name || "Consulta",
        date,
        time,
        modality: isOnline ? "Online" : "Presencial",
        branchName: branchRes.data?.name || "",
        googleCalendarUrl: gcalUrl,
      });

      if (therapistBookingEmail.error) {
        console.error("[book-appointment] Therapist notification email was not sent:", therapistBookingEmail.error);
      }
    } else {
      console.warn("[book-appointment] Therapist has no email configured, skipping notification email");
    }

    // Push notification to the therapist — awaited so Vercel doesn't kill it before it finishes
    const therapistUserId = (therapistRes.data as { user_id?: string } | null)?.user_id ?? null;
    console.log("[Push] therapistId:", therapistId, "user_id:", therapistUserId);

    if (therapistUserId) {
      try {
        const gcalUrl = buildGoogleCalendarUrl({
          title: `Cita — ${patient.name.trim()}${serviceRes.data?.name ? ` (${serviceRes.data.name})` : ""}`,
          date,
          time,
          durationMinutes: 60,
          location: branchRes.data?.name ?? "",
          details: meetingLink ? `Enlace Meet: ${meetingLink}` : "",
        });
        await sendPushToUser(supabaseAdmin, therapistUserId, {
          title: "Nueva cita agendada 📅",
          body: `${patient.name.trim()} reservó para el ${date} a las ${time}.`,
          url: "/dashboard/appointments",
          tag: "new-appointment",
          gcalUrl,
        });
        console.log("[Push] notification sent to user", therapistUserId);
      } catch (err) {
        console.error("[Push] sendPushToUser failed:", err);
      }
    } else {
      console.warn("[Push] No user_id found for therapist", therapistId, "— skipping push");
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
