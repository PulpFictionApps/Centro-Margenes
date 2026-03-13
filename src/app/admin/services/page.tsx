import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ServiceManager } from "@/components/admin/service-manager";

export default async function AdminServicesPage() {
  const supabase = createServerSupabaseClient();
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .order("name");

  return (
    <div className="animate-in">
      <ServiceManager initialServices={services ?? []} />
    </div>
  );
}
