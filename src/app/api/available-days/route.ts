import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const therapistId = searchParams.get("therapist_id");
  const serviceId = searchParams.get("service_id");

  if (!therapistId || !serviceId) {
    return NextResponse.json({ error: "Parámetros requeridos: therapist_id, service_id" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  // Get the day_of_week values this therapist has availability configured
  const { data: availability, error } = await supabase
    .from("availability")
    .select("day_of_week")
    .eq("therapist_id", therapistId);

  if (error) {
    return NextResponse.json({ error: "Error al obtener disponibilidad" }, { status: 500 });
  }

  const workingDayNumbers = new Set((availability ?? []).map((a: { day_of_week: number }) => a.day_of_week));

  if (workingDayNumbers.size === 0) {
    return NextResponse.json([]);
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

  return NextResponse.json(availableDates);
}
