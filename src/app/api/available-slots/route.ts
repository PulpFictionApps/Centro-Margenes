import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Availability } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const therapistId = searchParams.get("therapist_id");
  const serviceId = searchParams.get("service_id");
  const date = searchParams.get("date");

  if (!therapistId || !serviceId || !date) {
    return NextResponse.json(
      { error: "Missing required params: therapist_id, service_id, date" },
      { status: 400 }
    );
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  const dateObj = new Date(date + "T12:00:00");
  if (isNaN(dateObj.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

  const supabase = createServerSupabaseClient();

  // Fetch in parallel: availability, service duration, booked appointments
  const [availabilityRes, serviceRes, appointmentsRes] = await Promise.all([
    supabase
      .from("availability")
      .select("*")
      .eq("therapist_id", therapistId)
      .eq("day_of_week", dayOfWeek),
    supabase
      .from("services")
      .select("duration_minutes")
      .eq("id", serviceId)
      .single(),
    supabase
      .from("appointments")
      .select("time")
      .eq("therapist_id", therapistId)
      .eq("date", date)
      .neq("status", "cancelled"),
  ]);

  if (availabilityRes.error) {
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }

  const availability = (availabilityRes.data as Availability[]) ?? [];
  if (availability.length === 0) {
    return NextResponse.json([]);
  }

  // Service duration — fall back to slot_duration from availability if service not found
  const serviceDuration =
    (serviceRes.data as { duration_minutes: number } | null)?.duration_minutes ??
    availability[0].slot_duration ??
    60;

  // Build occupied minute ranges from booked appointments.
  // Each booked appointment blocks the full service duration from its start time.
  const bookedAppointments = (appointmentsRes.data ?? []) as {
    time: string;
  }[];

  const occupiedRanges: [number, number][] = bookedAppointments.map((a) => {
    const [h, m] = a.time.split(":").map(Number);
    const start = h * 60 + m;
    return [start, start + serviceDuration];
  });

  // Generate candidate slots and filter out overlapping ones
  const slots: string[] = [];

  for (const av of availability) {
    const [startH, startM] = av.start_time.split(":").map(Number);
    const [endH, endM] = av.end_time.split(":").map(Number);
    const windowStart = startH * 60 + startM;
    const windowEnd = endH * 60 + endM;
    const step = 60; // Always 1-hour blocks

    for (
      let slotStart = windowStart;
      slotStart + serviceDuration <= windowEnd;
      slotStart += step
    ) {
      const slotEnd = slotStart + serviceDuration;

      // Check overlap with every booked range
      const overlaps = occupiedRanges.some(
        ([occStart, occEnd]) => slotStart < occEnd && slotEnd > occStart
      );

      if (!overlaps) {
        const hh = String(Math.floor(slotStart / 60)).padStart(2, "0");
        const mm = String(slotStart % 60).padStart(2, "0");
        slots.push(`${hh}:${mm}`);
      }
    }
  }

  slots.sort();
  return NextResponse.json(slots);
}
