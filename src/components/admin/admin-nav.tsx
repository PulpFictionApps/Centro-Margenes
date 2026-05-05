"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarDays,
  LogOut,
  ArrowLeft,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/admin/therapists", label: "Terapeutas", icon: Users, exact: false },
  { href: "/admin/services", label: "Servicios", icon: Briefcase, exact: false },
  { href: "/admin/appointments", label: "Citas", icon: CalendarDays, exact: false },
  { href: "/admin/team", label: "Equipo", icon: Shield, exact: false },
];

interface AdminNavProps {
  adminName: string;
}

export function AdminNav({ adminName }: AdminNavProps) {
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
      <header className="border-b border-neutral-200 bg-[#EDE6CA]">
        <div className="mx-auto flex h-[4.5rem] max-w-[1200px] items-center justify-between px-4 sm:px-6">
          {/* Left: logo + desktop nav */}
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex-shrink-0">
              <span className="text-sm font-medium uppercase tracking-[3px] text-brand">
                Admin
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-[0.15em] transition-colors",
                    isActive(item)
                      ? "text-brand"
                      : "text-neutral-400 hover:text-neutral-700"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: name + logout (desktop) + hamburger (mobile) */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-neutral-400 transition-colors hover:text-brand lg:flex"
            >
              <ArrowLeft className="h-3 w-3" />
              Dashboard
            </Link>
            <span className="hidden text-[11px] uppercase tracking-[0.15em] text-neutral-400 lg:inline">
              {adminName}
            </span>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="hidden h-9 w-9 items-center justify-center text-neutral-400 transition-colors hover:text-brand md:flex"
            >
              <LogOut className="h-4 w-4" />
            </button>
            {/* Hamburger — visible only on mobile */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              className="flex h-9 w-9 items-center justify-center text-neutral-600 transition-colors hover:text-brand md:hidden"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
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
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            ))}

            {/* Footer row: name + dashboard + logout */}
            <div className="mt-2 flex items-center justify-between border-t border-neutral-200 px-4 pt-4 pb-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400">
                  {adminName}
                </p>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-neutral-400 hover:text-brand"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Dashboard
                </Link>
              </div>
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
