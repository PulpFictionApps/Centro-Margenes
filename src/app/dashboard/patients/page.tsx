import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PatientsListPage } from "@/components/dashboard/patients-list-page";

export default async function PatientsRoute() {
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

  return <PatientsListPage therapist={therapist} />;
}
