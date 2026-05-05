import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ServiceManager } from "@/components/admin/service-manager";

export default async function AdminServicesPage() {
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
