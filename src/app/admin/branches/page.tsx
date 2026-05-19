import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BranchManager } from "@/components/admin/branch-manager";

export default async function AdminBranchesPage() {
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

  const { data: branches } = await supabase
    .from("branches")
    .select("*")
    .order("name");

  return (
    <div className="animate-in">
      <BranchManager initialBranches={branches ?? []} />
    </div>
  );
}
