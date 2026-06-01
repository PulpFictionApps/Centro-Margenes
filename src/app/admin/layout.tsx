import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
};

export default async function AdminLayout({
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

  const { data: therapist } = await supabase
    .from("therapists")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!therapist || (therapist.role !== "admin" && therapist.role !== "super_admin")) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#EDE6CA] md:flex">
      <AdminNav adminName={therapist.name ?? user.email ?? "Admin"} />
      <main className="min-w-0 flex-1 px-3 pb-24 pt-4 sm:px-4 md:px-6 md:pb-6 md:pt-6">
        {children}
      </main>
    </div>
  );
}
