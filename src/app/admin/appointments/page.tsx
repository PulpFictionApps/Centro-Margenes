import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppointmentManager } from "@/components/admin/appointment-manager";

export default async function AdminAppointmentsPage() {
  const supabase = createServerSupabaseClient();
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
