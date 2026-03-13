import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  // Fetch all config in parallel
  const [availabilityRes, servicesRes, allServicesRes, therapistRes] =
    await Promise.all([
      supabase
        .from("availability")
        .select("*")
        .eq("therapist_id", therapist.id)
        .order("day_of_week")
        .order("start_time"),
      supabase
        .from("therapist_services")
        .select("service_id")
        .eq("therapist_id", therapist.id),
      supabase.from("services").select("*").order("name"),
      supabase
        .from("therapists")
        .select("offers_online, offers_in_person")
        .eq("id", therapist.id)
        .single(),
    ]);

  return NextResponse.json({
    therapist_id: therapist.id,
    availability: availabilityRes.data ?? [],
    therapist_service_ids: (servicesRes.data ?? []).map(
      (s: { service_id: string }) => s.service_id
    ),
    all_services: allServicesRes.data ?? [],
    modality: {
      offers_online: therapistRes.data?.offers_online ?? false,
      offers_in_person: therapistRes.data?.offers_in_person ?? false,
    },
  });
}
