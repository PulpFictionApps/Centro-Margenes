import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PatientProfilePage } from "@/components/dashboard/patient-profile-page";

export default async function PatientRoute({
  params,
}: {
  params: { id: string };
}) {
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

  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!patient) {
    redirect("/dashboard/patients");
  }

  return <PatientProfilePage patient={patient} therapist={therapist} />;
}
