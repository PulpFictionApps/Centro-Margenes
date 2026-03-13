import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get or auto-create therapist profile
  let { data: therapist } = await supabase
    .from("therapists")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!therapist) {
    const { data: created } = await supabase
      .from("therapists")
      .insert({
        user_id: user.id,
        name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Terapeuta",
        email: user.email ?? "",
        bio: "",
        specialties: [],
      })
      .select("*")
      .single();
    therapist = created;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#EDE6CA]">
      <DashboardNav
        therapistName={therapist?.name ?? user.email ?? "Terapeuta"}
      />
      <div className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-[1200px]">{children}</div>
      </div>
    </div>
  );
}
