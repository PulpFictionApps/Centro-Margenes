import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/dashboard/profile-editor";
import type { Therapist } from "@/lib/types";

export default async function ProfilePage() {
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
    <div className="space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400 mb-3">Configuración</p>
        <h1 className="font-playfair text-3xl text-brand">Mi perfil</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Edita tu información profesional visible para los pacientes.
        </p>
      </div>
      <ProfileEditor therapist={therapist as Therapist | null} />
    </div>
  );
}
