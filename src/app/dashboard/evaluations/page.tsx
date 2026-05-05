import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EvaluationsPage } from "@/components/dashboard/evaluations-page";

export default async function EvaluationsRoute() {
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

  return <EvaluationsPage therapist={therapist} />;
}
