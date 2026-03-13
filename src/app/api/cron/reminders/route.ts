import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendAppointmentReminder, type AppointmentEmailData } from "@/lib/email";

/**
 * GET /api/cron/reminders?secret=<CRON_SECRET>
 *
 * Sends reminder emails for upcoming appointments:
 *   - 24 hours before
 *   - 2 hours before
 *
 * Call this endpoint every 30 minutes via an external cron scheduler
 * (Vercel Cron, cron-job.org, Supabase pg_cron, etc.).
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const now = new Date();
  const results = { sent24h: 0, sent2h: 0, errors: 0 };

  // ── Helper: compute window boundaries ────────────────────────────
  // We look for appointments whose date+time falls within a 30-min
  // window around the target offset (24h or 2h from now).
  function getWindow(hoursAhead: number) {
    const center = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
    const from = new Date(center.getTime() - 15 * 60 * 1000);
    const to = new Date(center.getTime() + 15 * 60 * 1000);
    return { from, to };
  }

  // ── Fetch candidates for a time window ───────────────────────────
  async function fetchAppointmentsInWindow(from: Date, to: Date) {
    const fromDate = from.toISOString().slice(0, 10);
    const toDate = to.toISOString().slice(0, 10);
    const fromTime = from.toTimeString().slice(0, 5);
    const toTime = to.toTimeString().slice(0, 5);

    // If the window crosses midnight, handle both days
    const dates = fromDate === toDate ? [fromDate] : [fromDate, toDate];

    let query = supabase
      .from("appointments")
      .select(`
        id, date, time, status,
        patients ( name, email ),
        therapists ( name ),
        branches ( name, type )
      `)
      .in("status", ["scheduled"])
      .in("date", dates);

    // If same day, we can constrain time directly
    if (fromDate === toDate) {
      query = query.gte("time", fromTime).lte("time", toTime);
    }

    const { data } = await query;
    if (!data) return [];

    // If cross-midnight, filter in JS
    if (fromDate !== toDate) {
      return data.filter((a) => {
        const dt = new Date(`${a.date}T${a.time}`);
        return dt >= from && dt <= to;
      });
    }

    return data;
  }

  // ── Build email data from appointment row ────────────────────────
  function toEmailData(row: Record<string, unknown>): AppointmentEmailData | null {
    const patient = row.patients as { name: string; email: string } | null;
    const therapist = row.therapists as { name: string } | null;
    const branch = row.branches as { name: string; type: string } | null;

    if (!patient?.email) return null;

    const isOnline = branch?.type === "online";

    return {
      patientName: patient.name,
      patientEmail: patient.email,
      therapistName: therapist?.name || "Tu terapeuta",
      serviceName: "Consulta",
      date: row.date as string,
      time: row.time as string,
      modality: isOnline ? "Online" : "Presencial",
      branchName: branch?.name || "",
      meetingLink: isOnline ? (process.env.DEFAULT_MEETING_LINK || null) : null,
    };
  }

  // ── Process 24-hour reminders ────────────────────────────────────
  const window24 = getWindow(24);
  const appointments24 = await fetchAppointmentsInWindow(window24.from, window24.to);

  for (const appt of appointments24) {
    const emailData = toEmailData(appt as unknown as Record<string, unknown>);
    if (!emailData) continue;
    const { error } = await sendAppointmentReminder(emailData, "24 horas");
    if (error) results.errors++;
    else results.sent24h++;
  }

  // ── Process 2-hour reminders ─────────────────────────────────────
  const window2 = getWindow(2);
  const appointments2 = await fetchAppointmentsInWindow(window2.from, window2.to);

  for (const appt of appointments2) {
    const emailData = toEmailData(appt as unknown as Record<string, unknown>);
    if (!emailData) continue;
    const { error } = await sendAppointmentReminder(emailData, "2 horas");
    if (error) results.errors++;
    else results.sent2h++;
  }

  return NextResponse.json({
    ok: true,
    ...results,
    checkedAt: now.toISOString(),
  });
}
