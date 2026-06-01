import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  sendAppointmentConfirmation,
  sendTherapistBookingNotification,
} from "@/lib/email";
import { sendPushToUser } from "@/lib/push";
import { buildGoogleCalendarUrl } from "@/lib/utils";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// POST /api/appointments - Create appointment manually from dashboard
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: therapist } = await supabase
      .from("therapists")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!therapist) {
      return NextResponse.json({ error: "Terapeuta no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const {
      patient_id,
      date,
      time,
      service_id,
      treatment_id,
      branch_id,
      repeat_weekly,
      repeat_until,
      repeat_weeks,
    } = body;

    if (!patient_id || !date || !time) {
      return NextResponse.json(
        { error: "patient_id, date y time son obligatorios" },
        { status: 400 }
      );
    }

    const { data: ownLink } = await supabase
      .from("therapist_patients")
      .select("id")
      .eq("therapist_id", therapist.id)
      .eq("patient_id", patient_id)
      .maybeSingle();

    const { data: priorAppointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("therapist_id", therapist.id)
      .eq("patient_id", patient_id)
      .maybeSingle();

    if (!ownLink && !priorAppointment) {
      return NextResponse.json(
        { error: "No tienes acceso a este paciente" },
        { status: 403 }
      );
    }

    const shouldRepeatWeekly = Boolean(repeat_weekly);
    const maxGeneratedWeeks = 104;
    const candidateDates: string[] = [date];

    if (shouldRepeatWeekly) {
      const numericRepeatWeeks = Number.isFinite(Number(repeat_weeks))
        ? Math.max(0, Number(repeat_weeks))
        : 0;

      if (repeat_until) {
        const until = new Date(`${repeat_until}T12:00:00`);
        let i = 1;
        while (i <= maxGeneratedWeeks) {
          const nextDate = addDays(date, i * 7);
          const next = new Date(`${nextDate}T12:00:00`);
          if (next > until) break;
          candidateDates.push(nextDate);
          i += 1;
        }
      } else {
        const boundedWeeks = Math.min(maxGeneratedWeeks, numericRepeatWeeks);
        for (let i = 1; i <= boundedWeeks; i += 1) {
          candidateDates.push(addDays(date, i * 7));
        }
      }
    }

    const { data: conflicts } = await supabase
      .from("appointments")
      .select("date")
      .eq("therapist_id", therapist.id)
      .eq("time", time)
      .in("date", candidateDates)
      .neq("status", "cancelled");

    const conflictDates = new Set((conflicts ?? []).map((c) => c.date));

    const rowsToInsert = candidateDates
      .filter((d) => !conflictDates.has(d))
      .map((d) => ({
        patient_id,
        therapist_id: therapist.id,
        treatment_id: treatment_id || null,
        branch_id: branch_id || null,
        date: d,
        time,
        status: "scheduled",
      }));

    if (rowsToInsert.length === 0) {
      return NextResponse.json(
        { error: "No se pudo agendar: todos los horarios están ocupados" },
        { status: 409 }
      );
    }

    const { data: appointmentsCreated, error } = await supabase
      .from("appointments")
      .insert(rowsToInsert)
      .select(`
        *,
        patient:patients (id, name, email, phone),
        therapist:therapists (id, name, email, user_id, meeting_link),
        treatment:treatments (id, name, duration_minutes),
        branch:branches (id, name, type)
      `)
      ;

    if (error) {
      console.error("Error creating appointment:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "El horario seleccionado no está disponible" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          error: "Error al crear cita",
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    const createdList = appointmentsCreated ?? [];

    if (createdList.length > 0) {
      const serviceNamePromise = service_id
        ? supabase.from("services").select("name").eq("id", service_id).maybeSingle()
        : Promise.resolve({ data: null });

      const [{ data: serviceData }] = await Promise.all([serviceNamePromise]);
      const fallbackServiceName = serviceData?.name ?? "Consulta";

      for (const created of createdList) {
        const patient = unwrapRelation(created.patient as {
          name?: string;
          email?: string;
        } | null);
        const therapistData = unwrapRelation(created.therapist as {
          name?: string;
          email?: string;
          user_id?: string;
          meeting_link?: string | null;
        } | null);
        const branch = unwrapRelation(created.branch as {
          name?: string;
          type?: string;
        } | null);
        const treatment = unwrapRelation(created.treatment as {
          name?: string;
        } | null);

        const isOnline = branch?.type === "online";
        const meetingLink = isOnline
          ? (therapistData?.meeting_link || process.env.DEFAULT_MEETING_LINK || null)
          : null;
        const serviceName = treatment?.name || fallbackServiceName;

        if (patient?.email) {
          const confirmationEmail = await sendAppointmentConfirmation({
            patientName: patient.name || "Paciente",
            patientEmail: patient.email.trim().toLowerCase(),
            therapistName: therapistData?.name || "Tu terapeuta",
            serviceName,
            date: created.date,
            time: created.time,
            modality: isOnline ? "Online" : "Presencial",
            branchName: branch?.name || "",
            meetingLink,
            cancellationToken: created.cancellation_token || undefined,
          });

          if (confirmationEmail.error) {
            console.error("[appointments] Confirmation email was not sent:", confirmationEmail.error);
          }
        }

        const therapistEmail = therapistData?.email?.trim().toLowerCase();
        if (therapistEmail) {
          const gcalUrl = buildGoogleCalendarUrl({
            title: `Cita — ${patient?.name || "Paciente"}${serviceName ? ` (${serviceName})` : ""}`,
            date: created.date,
            time: created.time,
            durationMinutes: 60,
            location: branch?.name ?? "",
            details: meetingLink ? `Enlace Meet: ${meetingLink}` : "",
          });

          const therapistBookingEmail = await sendTherapistBookingNotification({
            therapistName: therapistData?.name || "Terapeuta",
            therapistEmail,
            patientName: patient?.name || "Paciente",
            patientEmail: patient?.email?.trim().toLowerCase() || "",
            serviceName,
            date: created.date,
            time: created.time,
            modality: isOnline ? "Online" : "Presencial",
            branchName: branch?.name || "",
            googleCalendarUrl: gcalUrl,
          });

          if (therapistBookingEmail.error) {
            console.error("[appointments] Therapist booking notification email was not sent:", therapistBookingEmail.error);
          }
        }
      }

      const firstCreated = createdList[0];
      const firstTherapist = unwrapRelation(firstCreated.therapist as {
        user_id?: string;
      } | null);
      const firstPatient = unwrapRelation(firstCreated.patient as {
        name?: string;
      } | null);
      const firstBranch = unwrapRelation(firstCreated.branch as {
        name?: string;
        type?: string;
      } | null);
      const firstTherapistWithMeeting = unwrapRelation(firstCreated.therapist as {
        user_id?: string;
        meeting_link?: string | null;
      } | null);
      const firstMeetingLink = firstBranch?.type === "online"
        ? (firstTherapistWithMeeting?.meeting_link || process.env.DEFAULT_MEETING_LINK || null)
        : null;

      if (firstTherapist?.user_id) {
        try {
          const adminSupabase = createAdminSupabaseClient();
          const gcalUrl = buildGoogleCalendarUrl({
            title: `Cita — ${firstPatient?.name || "Paciente"}`,
            date: firstCreated.date,
            time: firstCreated.time,
            durationMinutes: 60,
            location: firstBranch?.name ?? "",
            details: firstMeetingLink ? `Enlace Meet: ${firstMeetingLink}` : "",
          });

          await sendPushToUser(adminSupabase, firstTherapist.user_id, {
            title: "Nueva cita agendada 📅",
            body:
              createdList.length > 1
                ? `${firstPatient?.name || "Paciente"}: ${createdList.length} citas creadas desde agenda profesional.`
                : `${firstPatient?.name || "Paciente"} fue agendado para el ${firstCreated.date} a las ${firstCreated.time}.`,
            url: "/dashboard/appointments",
            tag: "new-appointment",
            gcalUrl,
          });
        } catch (pushError) {
          console.error("[appointments] Therapist push notification failed:", pushError);
        }
      }
    }

    return NextResponse.json(
      {
        appointment: createdList[0] ?? null,
        appointments: createdList,
        created_count: rowsToInsert.length,
        skipped_conflicts: Array.from(conflictDates).sort(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// GET /api/appointments - List appointments with filters
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
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("payment_status");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const therapistId = searchParams.get("therapist_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("appointments")
      .select(`
        *,
        patient:patients (id, name, email, phone),
        therapist:therapists (id, name, email),
        treatment:treatments (id, name, duration_minutes),
        branch:branches (id, name, type)
      `, { count: "exact" });

    // Filter by therapist unless admin
    const isAdmin = therapist.role === "admin" || therapist.role === "super_admin";
    
    if (!isAdmin) {
      query = query.eq("therapist_id", therapist.id);
    } else if (therapistId) {
      query = query.eq("therapist_id", therapistId);
    }

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (paymentStatus) {
      query = query.eq("payment_status", paymentStatus);
    }
    if (startDate) {
      query = query.gte("date", startDate);
    }
    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data: appointments, error, count } = await query
      .order("date", { ascending: false })
      .order("time", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching appointments:", error);
      return NextResponse.json({ error: "Error al obtener citas" }, { status: 500 });
    }

    return NextResponse.json({
      appointments,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Appointments API error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
