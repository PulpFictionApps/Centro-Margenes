import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const therapistId = searchParams.get("therapist_id");
  const serviceId = searchParams.get("service_id");
  const modality = searchParams.get("modality"); // "online" | "in_person" | null

  if (!therapistId || !serviceId) {
    return NextResponse.json({ error: "Parámetros requeridos: therapist_id, service_id" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  // Fetch weekly blocks, service duration and date overrides.
  const [availabilityRes, serviceRes] = await Promise.all([
    supabase
      .from("availability")
      .select("day_of_week, start_time, end_time, modality")
      .eq("therapist_id", therapistId),
    supabase
      .from("services")
      .select("duration_minutes")
      .eq("id", serviceId)
      .maybeSingle(),
  ]);

  if (availabilityRes.error) {
    return NextResponse.json({ error: "Error al obtener disponibilidad" }, { status: 500 });
  }

  const availability = availabilityRes.data ?? [];

  // Filter by modality: keep blocks that are "both" or match the requested modality
  const relevantBlocks = modality
    ? availability.filter((a: { day_of_week: number; modality?: string }) => {
        const m = a.modality ?? "both";
        return m === "both" || m === modality;
      })
    : availability;

  const workingDayNumbers = new Set(relevantBlocks.map((a: { day_of_week: number }) => a.day_of_week));

  const serviceDuration = serviceRes.data?.duration_minutes ?? 60;

  // Build list of dates in next 60 days that fall on working day_of_week
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weeklyCandidateDates: string[] = [];

  for (let i = 0; i <= 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (workingDayNumbers.has(d.getDay())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      weeklyCandidateDates.push(`${yyyy}-${mm}-${dd}`);
    }
  }

  const lastDate = weeklyCandidateDates[weeklyCandidateDates.length - 1] ?? (() => {
    const d = new Date(today);
    d.setDate(today.getDate() + 60);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const { data: overrides } = await supabase
    .from("availability_overrides")
    .select("date, start_time, end_time, modality, override_type")
    .eq("therapist_id", therapistId)
    .gte("date", todayStr)
    .lte("date", lastDate);

  const relevantOverrides = modality
    ? (overrides ?? []).filter((o: { modality?: string }) => {
        const m = o.modality ?? "both";
        return m === "both" || m === modality;
      })
    : (overrides ?? []);

  const merged = new Set(weeklyCandidateDates);
  for (const ov of relevantOverrides) {
    if (ov.override_type === "add") {
      merged.add(ov.date);
    }
  }

  function timeToMinutes(value: string) {
    const [h, m] = value.split(":").map(Number);
    return h * 60 + m;
  }

  function hasAnySlotForDate(date: string): boolean {
    const dateObj = new Date(`${date}T12:00:00`);
    const dayOfWeek = dateObj.getDay();

    const weeklyForDate = relevantBlocks.filter((b: { day_of_week: number }) => b.day_of_week === dayOfWeek);
    const addForDate = relevantOverrides.filter(
      (o: { date: string; override_type: string }) => o.date === date && o.override_type === "add"
    );
    const blockForDate = relevantOverrides.filter(
      (o: { date: string; override_type: string }) => o.date === date && o.override_type === "block"
    );

    const openRanges: Array<{ start_time: string; end_time: string }> = [
      ...weeklyForDate,
      ...addForDate,
    ];

    if (openRanges.length === 0) return false;

    const blockRanges: [number, number][] = blockForDate.map((b: { start_time: string; end_time: string }) => [
      timeToMinutes(b.start_time),
      timeToMinutes(b.end_time),
    ]);

    for (const range of openRanges) {
      const windowStart = timeToMinutes(range.start_time);
      const windowEnd = timeToMinutes(range.end_time);

      for (let slotStart = windowStart; slotStart + serviceDuration <= windowEnd; slotStart += 60) {
        const slotEnd = slotStart + serviceDuration;
        const blocked = blockRanges.some(
          ([blockStart, blockEnd]) => slotStart < blockEnd && slotEnd > blockStart
        );

        if (!blocked) return true;
      }
    }

    return false;
  }

  const finalDates = Array.from(merged)
    .sort()
    .filter((date) => hasAnySlotForDate(date));

  return NextResponse.json(finalDates);
}
