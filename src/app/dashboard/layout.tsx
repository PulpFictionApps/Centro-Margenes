import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
};

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
    <div className="min-h-screen bg-[#EDE6CA] md:flex">
      <DashboardNav
        therapistName={therapist?.name ?? user.email ?? "Terapeuta"}
      />
      <main className="min-w-0 flex-1 px-3 pb-24 pt-4 sm:px-4 md:px-6 md:pb-6 md:pt-6">
        {children}
      </main>
    </div>
  );
}
