import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TeamManagementPage } from "@/components/admin/team-management-page";

export default async function TeamRoute() {
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

  // Only super_admin can access
  if (!therapist || therapist.role !== "super_admin") {
    redirect("/admin");
  }

  return <TeamManagementPage currentUser={therapist} />;
}
