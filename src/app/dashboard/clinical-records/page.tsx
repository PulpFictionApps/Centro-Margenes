import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ClinicalRecordsPage } from "@/components/dashboard/clinical-records-page";

export default async function ClinicalRecordsRoute() {
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

  return <ClinicalRecordsPage therapist={therapist} />;
}
