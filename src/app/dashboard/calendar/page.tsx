import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CalendarPage } from "@/components/dashboard/calendar-page";

export default async function CalendarRoute() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: therapist } = await supabase
    .from("therapists")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!therapist) {
    redirect("/login");
  }

  return <CalendarPage therapist={therapist} />;
}
