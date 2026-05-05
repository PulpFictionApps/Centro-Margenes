"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Calendar,
  User,
  Clock,
  Briefcase,
  LogOut,
  FileText,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Inicio", shortLabel: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/appointments", label: "Citas", shortLabel: "Citas", icon: Calendar, exact: false },
  { href: "/dashboard/calendar", label: "Calendario", shortLabel: "Agenda", icon: Calendar, exact: false },
  { href: "/dashboard/patients", label: "Pacientes", shortLabel: "Pacientes", icon: User, exact: false },
  { href: "/dashboard/clinical-records", label: "Fichas", shortLabel: "Fichas", icon: FileText, exact: false },
  { href: "/dashboard/availability", label: "Disponibilidad", shortLabel: "Horarios", icon: Clock, exact: false },
  { href: "/dashboard/evaluations", label: "Evaluaciones", shortLabel: "Evaluar", icon: Star, exact: false },
  { href: "/dashboard/services", label: "Servicios", shortLabel: "Servicios", icon: Briefcase, exact: false },
  { href: "/dashboard/profile", label: "Mi perfil", shortLabel: "Perfil", icon: User, exact: false },
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

  const isActive = (item: (typeof navItems)[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <>
      <header className="border-b border-neutral-200 bg-[#EDE6CA] overflow-hidden">
        <div className="mx-auto flex h-[4.5rem] max-w-[1200px] items-center justify-between px-4 sm:px-6">
          {/* Left: logo + desktop nav (icons only — 9 items can't fit with text) */}
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/dashboard" className="flex-shrink-0">
              <span className="text-sm font-medium uppercase tracking-[3px] text-brand">
                Dashboard
              </span>
            </Link>
            <span className="hidden h-4 w-px bg-neutral-300 md:block" />
            {/* Desktop nav — icon + label */}
            <nav className="hidden items-center gap-0 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 transition-colors rounded-sm",
                    isActive(item)
                      ? "text-brand"
                      : "text-neutral-400 hover:text-brand hover:bg-[#5b2525]/5"
                  )}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  <span className="text-[8px] uppercase tracking-[0.05em] leading-none">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: name + logout (desktop) + hamburger (mobile) */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <span className="hidden max-w-[160px] truncate text-[11px] uppercase tracking-[0.15em] text-neutral-400 lg:inline">
              {therapistName}
            </span>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="hidden flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-sm text-neutral-400 transition-colors hover:text-brand md:flex"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-[8px] uppercase tracking-[0.05em] leading-none">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-[#EDE6CA] md:hidden">
        <div
          className="flex overflow-x-auto"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-[4.5rem] flex-col items-center justify-center gap-1 px-1 py-6 transition-colors",
                isActive(item) ? "text-brand" : "text-neutral-400 hover:text-brand"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="text-[8px] uppercase tracking-[0.03em] leading-none whitespace-nowrap">{item.shortLabel}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex min-w-[4.5rem] flex-col items-center justify-center gap-1 px-1 py-6 text-neutral-400 transition-colors hover:text-brand"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="text-[8px] uppercase tracking-[0.03em] leading-none">Salir</span>
          </button>
        </div>
      </nav>
    </>
  );
}
