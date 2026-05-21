import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Availability } from "@/lib/types";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const therapistId = searchParams.get("therapist_id");
  const serviceId = searchParams.get("service_id");
  const date = searchParams.get("date");
  const modality = searchParams.get("modality"); // "online" | "in_person" | null

  if (!therapistId || !serviceId || !date) {
    return NextResponse.json(
      { error: "Parámetros requeridos: therapist_id, service_id, date" },
      { status: 400 }
    );
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "La fecha debe tener el formato AAAA-MM-DD" },
      { status: 400 }
    );
  }

  const dateObj = new Date(date + "T12:00:00");
  if (isNaN(dateObj.getTime())) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

  const supabase = createServerSupabaseClient();

  // Fetch in parallel: availability, service duration, booked appointments
  const [availabilityRes, serviceRes, appointmentsRes, overridesRes] = await Promise.all([
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
    supabase
      .from("availability_overrides")
      .select("start_time, end_time, slot_duration, modality, override_type")
      .eq("therapist_id", therapistId)
      .eq("date", date),
  ]);

  if (availabilityRes.error) {
    return NextResponse.json(
      { error: "Error al obtener disponibilidad" },
      { status: 500 }
    );
  }

  const availability = (availabilityRes.data as Availability[]) ?? [];
  const overrides = (overridesRes.data ?? []) as Array<{
    start_time: string;
    end_time: string;
    slot_duration?: number | null;
    modality?: string | null;
    override_type: "add" | "block";
  }>;

  // Filter blocks by requested modality
  const filteredAvailability = modality
    ? availability.filter((av) => {
        const m = (av as Availability & { modality?: string }).modality ?? "both";
        return m === "both" || m === modality;
      })
    : availability;

  const relevantOverrides = modality
    ? overrides.filter((ov) => {
        const m = ov.modality ?? "both";
        return m === "both" || m === modality;
      })
    : overrides;

  const addOverrides = relevantOverrides.filter((ov) => ov.override_type === "add");
  const blockOverrides = relevantOverrides.filter((ov) => ov.override_type === "block");

  type SlotBlock = {
    start_time: string;
    end_time: string;
    slot_duration?: number | null;
  };

  const slotBlocks: SlotBlock[] = [
    ...filteredAvailability,
    ...addOverrides,
  ];

  if (slotBlocks.length === 0) {
    return NextResponse.json([]);
  }

  // Service duration — fall back to slot_duration from availability if service not found
  const serviceDuration =
    (serviceRes.data as { duration_minutes: number } | null)?.duration_minutes ??
    slotBlocks[0].slot_duration ??
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

  const blockRanges: [number, number][] = blockOverrides.map((ov) => {
    const [startH, startM] = ov.start_time.split(":").map(Number);
    const [endH, endM] = ov.end_time.split(":").map(Number);
    return [startH * 60 + startM, endH * 60 + endM];
  });

  for (const block of slotBlocks) {
    const [startH, startM] = block.start_time.split(":").map(Number);
    const [endH, endM] = block.end_time.split(":").map(Number);
    const windowStart = startH * 60 + startM;
    const windowEnd = endH * 60 + endM;
    const step = Math.max(5, block.slot_duration ?? 60);

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

      const blocked = blockRanges.some(
        ([blockStart, blockEnd]) => slotStart < blockEnd && slotEnd > blockStart
      );

      if (!overlaps && !blocked) {
        const hh = String(Math.floor(slotStart / 60)).padStart(2, "0");
        const mm = String(slotStart % 60).padStart(2, "0");
        slots.push(`${hh}:${mm}`);
      }
    }
  }

  return NextResponse.json(Array.from(new Set(slots)).sort());
}
