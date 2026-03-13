import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AvailabilityEditor } from "@/components/dashboard/availability-editor";

export default async function AvailabilityPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400 mb-3">Configuración</p>
        <h1 className="font-playfair text-3xl text-brand">Disponibilidad</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Configura tu horario semanal de atención.
        </p>
      </div>
      <AvailabilityEditor therapistId={therapist?.id} />
    </div>
  );
}
