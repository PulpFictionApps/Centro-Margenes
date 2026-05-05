"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/appointments", label: "Citas", icon: Calendar, exact: false },
  { href: "/dashboard/calendar", label: "Calendario", icon: Calendar, exact: false },
  { href: "/dashboard/patients", label: "Pacientes", icon: User, exact: false },
  { href: "/dashboard/clinical-records", label: "Fichas", icon: FileText, exact: false },
  { href: "/dashboard/availability", label: "Disponibilidad", icon: Clock, exact: false },
  { href: "/dashboard/evaluations", label: "Evaluaciones", icon: Star, exact: false },
  { href: "/dashboard/services", label: "Servicios", icon: Briefcase, exact: false },
  { href: "/dashboard/profile", label: "Mi perfil", icon: User, exact: false },
];

interface DashboardNavProps {
  therapistName: string;
}

export function DashboardNav({ therapistName }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

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
          {/* Left: logo + desktop nav */}
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/dashboard" className="flex-shrink-0">
              <span className="text-sm font-medium uppercase tracking-[3px] text-brand">
                Dashboard
              </span>
            </Link>
            {/* Desktop nav — icon only at md, icon+text at lg */}
            <nav className="hidden items-center gap-0.5 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 text-[11px] uppercase tracking-[0.15em] transition-colors lg:px-3",
                    isActive(item)
                      ? "text-brand"
                      : "text-neutral-400 hover:text-neutral-700"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: name + logout (desktop) + hamburger (mobile) */}
          <div className="flex flex-shrink-0 items-center gap-3">
            <span className="hidden text-[11px] uppercase tracking-[0.15em] text-neutral-400 xl:inline">
              {therapistName}
            </span>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="hidden h-9 w-9 items-center justify-center text-neutral-400 transition-colors hover:text-brand md:flex"
            >
              <LogOut className="h-4 w-4" />
            </button>
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              className="flex h-9 w-9 items-center justify-center text-neutral-600 transition-colors hover:text-brand md:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-b border-neutral-200 bg-[#EDE6CA] md:hidden">
          <nav className="mx-auto max-w-[1200px] space-y-0.5 px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-sm px-4 py-3 text-[11px] uppercase tracking-[0.15em] transition-colors",
                  isActive(item)
                    ? "bg-[#5b2525]/10 text-brand"
                    : "text-neutral-500 hover:bg-[#5b2525]/5 hover:text-brand"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            ))}

            {/* Footer: name + logout */}
            <div className="mt-2 flex items-center justify-between border-t border-neutral-200 px-4 pb-2 pt-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400">
                {therapistName}
              </p>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-neutral-400 transition-colors hover:text-brand"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
