import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: therapist } = await supabase
    .from("therapists")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair text-3xl font-normal text-brand">
          Bienvenido, {therapist?.name?.split(" ")[0] ?? "Terapeuta"}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Resumen de tu actividad y citas.
        </p>
      </div>
      <DashboardOverview therapistId={therapist?.id} />
    </div>
  );
}
