import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendAppointmentReminder, type AppointmentEmailData } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";

export const dynamic = 'force-dynamic';

const REMINDER_TIMEZONE = "America/Santiago";

type ReminderKind = "24h" | "1h";

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
 *   - 1 hour before
 *
 * Call this endpoint every 30 minutes via an external cron scheduler
 * (Vercel Cron, cron-job.org, Supabase pg_cron, etc.).
 */
export async function GET(request: NextRequest) {
  // Verify cron secret — supports both Vercel Cron (Authorization header)
  // and manual calls (?secret=… query string for testing).
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-cron-secret");
  const querySecret = request.nextUrl.searchParams.get("secret");
  const isAuthorized =
    (authHeader && cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (headerSecret && cronSecret && headerSecret === cronSecret) ||
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
  const results = {
    sent24h: 0,
    sent1h: 0,
    errors: 0,
    queryErrors: 0,
    emailErrors: 0,
    candidates24h: 0,
    candidates1h: 0,
    alreadyClaimed24h: 0,
    alreadyClaimed1h: 0,
    skippedMissingPatientEmail: 0,
    skippedMissingTherapistUser: 0,
    pushSent: 0,
    pushFailed: 0,
    pushNoSubscription: 0,
  };

  function toDateAndTimeInTZ(value: Date) {
    const parts = new Intl.DateTimeFormat("sv-SE", {
      timeZone: REMINDER_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(value)
      .reduce<Record<string, string>>((acc, part) => {
        if (part.type !== "literal") {
          acc[part.type] = part.value;
        }
        return acc;
      }, {});

    return {
      date: `${parts.year}-${parts.month}-${parts.day}`,
      time: `${parts.hour}:${parts.minute}`,
    };
  }

  // ── Helper: compute window boundaries ────────────────────────────
  // We look for appointments whose date+time falls within a 30-min
  // window around the target offset (24h or 1h from now).
  function getWindow(hoursAhead: number) {
    const center = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
    const from = new Date(center.getTime() - 15 * 60 * 1000);
    const to = new Date(center.getTime() + 15 * 60 * 1000);
    return { from, to };
  }

  // ── Fetch candidates for a time window ───────────────────────────
  async function fetchAppointmentsInWindow(from: Date, to: Date): Promise<AppointmentRow[]> {
    const fromParts = toDateAndTimeInTZ(from);
    const toParts = toDateAndTimeInTZ(to);

    const fromDate = fromParts.date;
    const toDate = toParts.date;
    const fromTime = fromParts.time;
    const toTime = toParts.time;

    let query = supabaseAdmin.from("appointments")
      .select(`
        id, date, time, status,
        patients ( name, email ),
        therapists ( name, user_id, meeting_link ),
        branches ( name, type )
      `)
      .in("status", ["scheduled"]);

    if (fromDate === toDate) {
      query = query
        .eq("date", fromDate)
        .gte("time", fromTime)
        .lte("time", toTime);
    } else {
      query = query.or(
        `and(date.eq.${fromDate},time.gte.${fromTime}),and(date.eq.${toDate},time.lte.${toTime})`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error(
        `[Cron] failed to fetch appointments for window ${fromDate} ${fromTime} -> ${toDate} ${toTime}:`,
        error
      );
      results.errors++;
      results.queryErrors++;
      return [];
    }
    if (!data) return [];

    const normalized = (data as SupabaseAppointmentRow[]).map((row) => ({
      id: row.id,
      date: row.date,
      time: row.time,
      patients: row.patients?.[0] ?? null,
      therapists: row.therapists?.[0] ?? null,
      branches: row.branches?.[0] ?? null,
    }));

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
    const column = kind === "24h" ? "reminder_24h_sent_at" : "reminder_1h_sent_at";
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

  async function releaseReminderClaim(appointmentId: string, kind: ReminderKind) {
    const column = kind === "24h" ? "reminder_24h_sent_at" : "reminder_1h_sent_at";
    const { error } = await supabaseAdmin
      .from("appointments")
      .update({ [column]: null })
      .eq("id", appointmentId);

    if (error) {
      console.error(`[Cron] failed to release ${kind} reminder claim for appointment ${appointmentId}:`, error);
    }
  }

  // ── Helper: send push to therapist ──────────────────────────────
  async function notifyTherapist(appt: AppointmentRow, hoursLabel: string) {
    const therapist = appt.therapists;
    if (!therapist?.user_id) {
      results.skippedMissingTherapistUser++;
      return;
    }
    const date = appt.date;
    const time = appt.time;
    const patient = appt.patients;
    try {
      const pushResult = await sendPushToUser(supabaseAdmin, therapist.user_id, {
        title: `Cita en ${hoursLabel} ⏰`,
        body: `${patient?.name || "Paciente"} — ${date} a las ${time}`,
        url: "/dashboard/calendar",
        tag: `reminder-${appt.id}-${hoursLabel}`,
      });

      if (pushResult.subscriptions === 0) {
        results.pushNoSubscription++;
      }
      results.pushSent += pushResult.sent;
      results.pushFailed += pushResult.failed;
      if (pushResult.failed > 0) {
        results.errors += pushResult.failed;
      }
    } catch (err) {
      results.errors++;
      results.pushFailed++;
      console.error("[Push] reminder notification failed:", err);
    }
  }

  async function processWindow(
    hoursAhead: number,
    hoursLabel: string,
    kind: ReminderKind
  ) {
    const window = getWindow(hoursAhead);
    const appointments = await fetchAppointmentsInWindow(window.from, window.to);

    if (kind === "24h") results.candidates24h += appointments.length;
    if (kind === "1h") results.candidates1h += appointments.length;

    for (const appt of appointments) {
      const claim = await claimReminder(appt.id, kind);
      if (claim.error) {
        results.errors++;
        continue;
      }
      if (!claim.claimed) {
        if (kind === "24h") results.alreadyClaimed24h++;
        if (kind === "1h") results.alreadyClaimed1h++;
        continue;
      }

      const emailData = toEmailData(appt);
      if (!emailData) {
        results.skippedMissingPatientEmail++;
        await releaseReminderClaim(appt.id, kind);
        continue;
      }

      const { error } = await sendAppointmentReminder(emailData, hoursLabel);
      if (error) {
        results.errors++;
        results.emailErrors++;
        await releaseReminderClaim(appt.id, kind);
        continue;
      }

      if (kind === "24h") results.sent24h++;
      if (kind === "1h") results.sent1h++;
      await notifyTherapist(appt, hoursLabel);
    }
  }

  await processWindow(24, "24 horas", "24h");
  await processWindow(1, "1 hora", "1h");

  return NextResponse.json({
    ok: true,
    ...results,
    timezone: REMINDER_TIMEZONE,
    checkedAt: now.toISOString(),
  });
}
