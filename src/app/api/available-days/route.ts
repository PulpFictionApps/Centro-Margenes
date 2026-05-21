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

  // Get the day_of_week values this therapist has availability configured, filtered by modality
  const { data: availability, error } = await supabase
    .from("availability")
    .select("day_of_week, modality")
    .eq("therapist_id", therapistId);

  if (error) {
    return NextResponse.json({ error: "Error al obtener disponibilidad" }, { status: 500 });
  }

  // Filter by modality: keep blocks that are "both" or match the requested modality
  const relevantBlocks = modality
    ? (availability ?? []).filter((a: { day_of_week: number; modality?: string }) => {
        const m = a.modality ?? "both";
        return m === "both" || m === modality;
      })
    : (availability ?? []);

  const workingDayNumbers = new Set(relevantBlocks.map((a: { day_of_week: number }) => a.day_of_week));

  if (workingDayNumbers.size === 0) {
    // Continue; date-specific overrides may still open one-off availability.
  }

  // Build list of dates in next 60 days that fall on working day_of_week
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const availableDates: string[] = [];

  for (let i = 0; i <= 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (workingDayNumbers.has(d.getDay())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      availableDates.push(`${yyyy}-${mm}-${dd}`);
    }
  }

  const lastDate = availableDates[availableDates.length - 1] ?? (() => {
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
    .select("date, override_type, modality")
    .eq("therapist_id", therapistId)
    .gte("date", todayStr)
    .lte("date", lastDate);

  const relevantOverrides = modality
    ? (overrides ?? []).filter((o: { modality?: string }) => {
        const m = o.modality ?? "both";
        return m === "both" || m === modality;
      })
    : (overrides ?? []);

  const merged = new Set(availableDates);
  for (const ov of relevantOverrides) {
    if (ov.override_type === "add") {
      merged.add(ov.date);
    }
  }

  return NextResponse.json(Array.from(merged).sort());
}
