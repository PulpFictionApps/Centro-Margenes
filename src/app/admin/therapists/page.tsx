import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TherapistList } from "@/components/admin/therapist-list";

export default async function AdminTherapistsPage() {
  const supabase = createServerSupabaseClient();
  const { data: therapists } = await supabase
    .from("therapists")
    .select("*")
    .order("name");

  return (
    <div className="animate-in">
      <TherapistList initialTherapists={therapists ?? []} />
    </div>
  );
}
