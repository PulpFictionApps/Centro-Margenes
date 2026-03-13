"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Calendar, User, Clock, Briefcase, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/appointments", label: "Citas", icon: Calendar, exact: false },
  { href: "/dashboard/availability", label: "Disponibilidad", icon: Clock, exact: false },
  { href: "/dashboard/services", label: "Servicios", icon: Briefcase, exact: false },
  { href: "/dashboard/profile", label: "Mi perfil", icon: User, exact: false },
];

interface DashboardNavProps {
  therapistName: string;
}

export function DashboardNav({ therapistName }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="border-b border-neutral-200 bg-[#EDE6CA]">
      <div className="mx-auto flex h-[4.5rem] max-w-[1200px] items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex-shrink-0">
            <span className="text-sm font-medium uppercase tracking-[3px] text-brand">
              Dashboard
            </span>
          </Link>
          <div className="mx-2 hidden h-px w-8 bg-neutral-400/40 md:block" />
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-[0.15em] transition-colors",
                  (item.exact ? pathname === item.href : pathname.startsWith(item.href))
                    ? "text-brand"
                    : "text-neutral-400 hover:text-neutral-700"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-[11px] uppercase tracking-[0.15em] text-neutral-400 lg:inline">
            {therapistName}
          </span>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="flex h-9 w-9 items-center justify-center text-neutral-400 transition-colors hover:text-brand"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
