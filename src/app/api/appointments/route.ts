import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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
      notes,
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
        notes: notes || null,
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
        therapist:therapists (id, name, email),
        treatment:treatments (id, name, duration_minutes),
        branch:branches (id, name, type)
      `)
      .single();

    if (error) {
      console.error("Error creating appointment:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "El horario seleccionado no está disponible" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "Error al crear cita" }, { status: 500 });
    }

    return NextResponse.json(
      {
        appointment: appointmentsCreated?.[0] ?? null,
        appointments: appointmentsCreated ?? [],
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
