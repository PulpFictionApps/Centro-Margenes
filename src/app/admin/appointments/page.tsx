import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppointmentManager } from "@/components/admin/appointment-manager";

export default async function AdminAppointmentsPage() {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentUser } = await supabase
    .from("therapists")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "super_admin")) {
    redirect("/dashboard");
  }

  const { data: therapists } = await supabase
    .from("therapists")
    .select("*")
    .order("name");

  return (
    <div className="animate-in">
      <AppointmentManager therapists={therapists ?? []} />
    </div>
  );
}
