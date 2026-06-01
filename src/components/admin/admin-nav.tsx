"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  Briefcase,
  CalendarDays,
  LogOut,
  ArrowLeft,
  Shield,
  Menu,
  X,
  Bell,
  ChevronDown,
  MapPin,
  BookOpen,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Resumen", icon: Shield },
  { href: "/admin/appointments", label: "Calendario", icon: CalendarDays },
  { href: "/admin/services", label: "Servicios", icon: Briefcase },
  { href: "/admin/therapists", label: "Terapeutas", icon: UserCog },
  { href: "/admin/team", label: "Equipo", icon: Users },
  { href: "/admin/branches", label: "Sedes", icon: MapPin },
  { href: "/admin/blog", label: "Blog", icon: BookOpen },
];

const mobileQuickItems = [
  { href: "/admin", label: "Resumen", icon: Shield },
  { href: "/admin/appointments", label: "Calendario", icon: CalendarDays },
  { href: "/admin/services", label: "Servicios", icon: Briefcase },
  { href: "/admin/team", label: "Equipo", icon: Users },
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

  const isActive = (item: { href: string }) => {
    if (pathname === item.href) return true;
    if (item.href !== "/admin" && pathname.startsWith(item.href)) return true;
    return false;
  };

  const todayLabel = new Date().toLocaleDateString("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <aside className="hidden h-screen w-[270px] shrink-0 border-r border-neutral-200 bg-[#EDE6CA] md:flex md:sticky md:top-0 md:flex-col">
        <div className="border-b border-neutral-200 px-5 py-3">
          <Link href="/admin" className="block">
            <Image
              src="/images/Logodashboard.png"
              alt="Centro Margenes"
              width={240}
              height={58}
              className="h-auto w-[220px]"
              priority
            />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                isActive(item)
                  ? "bg-[#5b2525]/10 text-brand"
                  : "text-neutral-700 hover:bg-[#5b2525]/5 hover:text-brand"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-neutral-200 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs text-neutral-500 transition-colors hover:text-brand"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Profesional
            </Link>
            <button
              onClick={handleLogout}
              title="Cerrar sesion"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-[#5b2525]/5 hover:text-brand"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 truncate text-xs text-neutral-500">{adminName}</p>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-[#EDE6CA] md:hidden">
        <div className="flex h-[72px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Cerrar menu" : "Abrir menu"}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-brand"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <button className="flex items-center gap-1 text-3xl font-semibold leading-none text-brand">
              <span>{todayLabel}</span>
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 items-center justify-center text-brand">
              <CalendarDays className="h-5 w-5" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center text-brand">
              <Bell className="h-5 w-5" />
            </button>
            <Link
              href="/admin"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#d9ceb2] text-xs font-semibold text-brand"
            >
              {adminName
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </Link>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="h-full w-[84%] max-w-[320px] border-r border-neutral-200 bg-[#EDE6CA] p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 px-2 py-2">
              <Link href="/admin" onClick={() => setMobileOpen(false)} className="block">
                <Image
                  src="/images/Logodashboard.png"
                  alt="Centro Margenes"
                  width={210}
                  height={50}
                  className="h-auto w-[190px]"
                />
              </Link>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    isActive(item)
                      ? "bg-[#5b2525]/10 text-brand"
                      : "text-neutral-700 hover:bg-[#5b2525]/5 hover:text-brand"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 flex items-center justify-between border-t border-neutral-200 px-3 pt-3">
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 text-xs text-neutral-500"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Profesional
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-brand"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-[#EDE6CA] px-1 pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid grid-cols-4">
          {mobileQuickItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[12px]",
                  isActive(item) ? "text-brand" : "text-neutral-700"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
