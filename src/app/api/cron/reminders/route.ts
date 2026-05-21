import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendAppointmentReminder, type AppointmentEmailData } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";

export const dynamic = 'force-dynamic';

type ReminderKind = "24h" | "2h";

type AppointmentRow = {
  id: string;
  date: string;
  time: string;
  patients: { name: string; email: string } | null;
  therapists: { name: string; user_id?: string; meeting_link?: string | null } | null;
  branches: { name: string; type: string } | null;
};

type SupabaseAppointmentRow = {
  id: string;
  date: string;
  time: string;
  patients: Array<{ name: string; email: string }> | null;
  therapists: Array<{ name: string; user_id?: string; meeting_link?: string | null }> | null;
  branches: Array<{ name: string; type: string }> | null;
};

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
  // Verify cron secret — supports both Vercel Cron (Authorization header)
  // and manual calls (?secret=… query string for testing).
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");
  const isAuthorized =
    (authHeader && cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (querySecret && cronSecret && querySecret === cronSecret);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY for cron execution" },
      { status: 500 }
    );
  }

  const supabase = createServerSupabaseClient();

  // Service-role client for push subscription lookups (bypasses RLS)
  const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
    : supabase;

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
  async function fetchAppointmentsInWindow(from: Date, to: Date): Promise<AppointmentRow[]> {
    const fromDate = from.toISOString().slice(0, 10);
    const toDate = to.toISOString().slice(0, 10);
    const fromTime = from.toTimeString().slice(0, 5);
    const toTime = to.toTimeString().slice(0, 5);

    // If the window crosses midnight, handle both days
    const dates = fromDate === toDate ? [fromDate] : [fromDate, toDate];

    let query = supabaseAdmin
      .from("appointments")
      .select(`
        id, date, time, status,
        patients ( name, email ),
        therapists ( name, user_id, meeting_link ),
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

    const normalized = (data as SupabaseAppointmentRow[]).map((row) => ({
      id: row.id,
      date: row.date,
      time: row.time,
      patients: row.patients?.[0] ?? null,
      therapists: row.therapists?.[0] ?? null,
      branches: row.branches?.[0] ?? null,
    }));

    // If cross-midnight, filter in JS
    if (fromDate !== toDate) {
      return normalized.filter((a) => {
        const dt = new Date(`${a.date}T${a.time}`);
        return dt >= from && dt <= to;
      });
    }

    return normalized;
  }

  // ── Build email data from appointment row ────────────────────────
  function toEmailData(row: AppointmentRow): AppointmentEmailData | null {
    const patient = row.patients;
    const therapist = row.therapists;
    const branch = row.branches;

    if (!patient?.email) return null;

    const isOnline = branch?.type === "online";
    const meetingLink = therapist?.meeting_link || process.env.DEFAULT_MEETING_LINK || null;

    return {
      patientName: patient.name,
      patientEmail: patient.email,
      therapistName: therapist?.name || "Tu terapeuta",
      serviceName: "Consulta",
      date: row.date,
      time: row.time,
      modality: isOnline ? "Online" : "Presencial",
      branchName: branch?.name || "",
      meetingLink: isOnline ? meetingLink : null,
    };
  }

  async function claimReminder(appointmentId: string, kind: ReminderKind) {
    const column = kind === "24h" ? "reminder_24h_sent_at" : "reminder_2h_sent_at";
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update({ [column]: new Date().toISOString() })
      .eq("id", appointmentId)
      .is(column, null)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error(`[Cron] failed to claim ${kind} reminder for appointment ${appointmentId}:`, error);
      return { claimed: false, error: true };
    }

    return { claimed: !!data, error: false };
  }

  // ── Helper: send push to therapist ──────────────────────────────
  async function notifyTherapist(appt: AppointmentRow, hoursLabel: string) {
    const therapist = appt.therapists;
    if (!therapist?.user_id) return;
    const date = appt.date;
    const time = appt.time;
    const patient = appt.patients;
    await sendPushToUser(supabaseAdmin, therapist.user_id, {
      title: `Cita en ${hoursLabel} ⏰`,
      body: `${patient?.name || "Paciente"} — ${date} a las ${time}`,
      url: "/dashboard/calendar",
      tag: `reminder-${appt.id}-${hoursLabel}`,
    }).catch((err) => console.error("[Push] reminder notification failed:", err));
  }

  async function processWindow(
    hoursAhead: number,
    hoursLabel: string,
    kind: ReminderKind
  ) {
    const window = getWindow(hoursAhead);
    const appointments = await fetchAppointmentsInWindow(window.from, window.to);

    for (const appt of appointments) {
      const claim = await claimReminder(appt.id, kind);
      if (claim.error) {
        results.errors++;
        continue;
      }
      if (!claim.claimed) {
        continue;
      }

      const emailData = toEmailData(appt);
      if (!emailData) continue;

      const { error } = await sendAppointmentReminder(emailData, hoursLabel);
      if (error) {
        results.errors++;
        continue;
      }

      if (kind === "24h") results.sent24h++;
      if (kind === "2h") results.sent2h++;
      await notifyTherapist(appt, hoursLabel);
    }
  }

  await processWindow(24, "24 horas", "24h");
  await processWindow(2, "2 horas", "2h");

  return NextResponse.json({
    ok: true,
    ...results,
    checkedAt: now.toISOString(),
  });
}
