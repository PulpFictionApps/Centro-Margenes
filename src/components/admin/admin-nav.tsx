"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarDays,
  LogOut,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Inicio", shortLabel: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/admin/therapists", label: "Terapeutas", shortLabel: "Terapeutas", icon: Users, exact: false },
  { href: "/admin/services", label: "Servicios", shortLabel: "Servicios", icon: Briefcase, exact: false },
  { href: "/admin/appointments", label: "Citas", shortLabel: "Citas", icon: CalendarDays, exact: false },
  { href: "/admin/team", label: "Equipo", shortLabel: "Equipo", icon: Shield, exact: false },
];

interface AdminNavProps {
  adminName: string;
}

export function AdminNav({ adminName }: AdminNavProps) {
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
          {/* Left: logo + desktop nav */}
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex-shrink-0">
              <span className="text-sm font-medium uppercase tracking-[3px] text-brand">
                Admin
              </span>
            </Link>
            <nav className="hidden items-center gap-0.5 md:flex">
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
                  <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span className="text-[8px] uppercase tracking-[0.05em] leading-none">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: dashboard link + name + logout (desktop only) */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-neutral-400 transition-colors hover:text-brand"
            >
              <ArrowLeft className="h-3 w-3" />
              Dashboard
            </Link>
            <span className="text-[11px] uppercase tracking-[0.15em] text-neutral-400 lg:inline hidden">
              {adminName}
            </span>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-sm text-neutral-400 transition-colors hover:text-brand"
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
                "flex flex-1 flex-col items-center justify-center gap-1 px-1 py-6 transition-colors",
                isActive(item) ? "text-brand" : "text-neutral-400 hover:text-brand"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="text-[8px] uppercase tracking-[0.03em] leading-none">{item.shortLabel}</span>
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="flex flex-1 flex-col items-center justify-center gap-1 px-1 py-6 text-neutral-400 transition-colors hover:text-brand"
          >
            <ArrowLeft className="h-5 w-5 flex-shrink-0" />
            <span className="text-[8px] uppercase tracking-[0.03em] leading-none">Volver</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex flex-1 flex-col items-center justify-center gap-1 px-1 py-6 text-neutral-400 transition-colors hover:text-brand"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="text-[8px] uppercase tracking-[0.03em] leading-none">Salir</span>
          </button>
        </div>
      </nav>
    </>
  );
}

