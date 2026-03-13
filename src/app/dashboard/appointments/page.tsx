import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppointmentsList } from "@/components/dashboard/appointments-list";

export default async function AppointmentsPage() {
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
        <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400 mb-3">Gestión</p>
        <h1 className="font-playfair text-3xl text-brand">Mis citas</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Visualiza y gestiona tus citas programadas.
        </p>
      </div>
      <AppointmentsList therapistId={therapist?.id} />
    </div>
  );
}
