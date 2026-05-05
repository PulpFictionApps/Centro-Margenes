import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Users,
  Briefcase,
  CalendarDays,
  ArrowRight,
  UserCheck,
  Clock,
} from "lucide-react";

export default async function AdminPage() {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentUser } = await supabase
    .from("therapists")
    .select("role, name")
    .eq("user_id", user.id)
    .single();

  if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "super_admin")) {
    redirect("/dashboard");
  }

  const today = new Date().toISOString().split("T")[0];

  const [therapistsRes, servicesRes, scheduledRes, todayRes, recentRes] =
    await Promise.all([
      supabase.from("therapists").select("id, active, name", { count: "exact" }),
      supabase.from("services").select("id", { count: "exact" }),
      supabase
        .from("appointments")
        .select("id", { count: "exact" })
        .eq("status", "scheduled"),
      supabase
        .from("appointments")
        .select("id", { count: "exact" })
        .eq("date", today)
        .neq("status", "cancelled"),
      supabase
        .from("appointments")
        .select("id, date, time, status, patients(name), therapists(name), treatments(name)")
        .order("date", { ascending: false })
        .order("time", { ascending: false })
        .limit(6),
    ]);

  const totalTherapists = therapistsRes.count ?? 0;
  const activeTherapists =
    therapistsRes.data?.filter((t) => t.active !== false).length ?? 0;
  const totalServices = servicesRes.count ?? 0;
  const scheduledAppointments = scheduledRes.count ?? 0;
  const todayAppointments = todayRes.count ?? 0;

  const recentAppointments = (recentRes.data ?? []) as Array<{
    id: string;
    date: string;
    time: string;
    status: string;
    patients: { name: string } | null;
    therapists: { name: string } | null;
    treatments: { name: string } | null;
  }>;

  const stats = [
    {
      label: "Terapeutas activos",
      value: activeTherapists,
      sub: `${totalTherapists} en total`,
      icon: UserCheck,
      href: "/admin/therapists",
      accent: "border-l-brand",
    },
    {
      label: "Citas hoy",
      value: todayAppointments,
      sub: "no canceladas",
      icon: Clock,
      href: "/admin/appointments",
      accent: "border-l-amber-400",
    },
    {
      label: "Citas programadas",
      value: scheduledAppointments,
      sub: "pendientes totales",
      icon: CalendarDays,
      href: "/admin/appointments",
      accent: "border-l-blue-400",
    },
    {
      label: "Servicios",
      value: totalServices,
      sub: "configurados",
      icon: Briefcase,
      href: "/admin/services",
      accent: "border-l-emerald-400",
    },
  ];

  const STATUS_LABEL: Record<string, string> = {
    scheduled: "Programada",
    completed: "Completada",
    cancelled: "Cancelada",
    no_show: "No asistió",
  };
  const STATUS_COLOR: Record<string, string> = {
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-600 border-red-200",
    no_show: "bg-amber-50 text-amber-700 border-amber-200",
  };

  const adminName = currentUser.name ?? user.email ?? "Admin";
  const dateLabel = new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-10">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 capitalize">
            {dateLabel}
          </p>
          <h1 className="mt-1 font-playfair text-3xl font-normal text-brand">
            Bienvenido, {adminName.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Resumen general del centro · {new Date().toLocaleDateString("es-CL")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 pt-2 sm:pt-0">
          <Link
            href="/admin/therapists"
            className="flex items-center gap-2 border border-[#5b2525] px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-brand transition-colors hover:bg-[#5b2525] hover:text-white"
          >
            <Users className="h-3.5 w-3.5" />
            Nuevo terapeuta
          </Link>
          <Link
            href="/admin/services"
            className="flex items-center gap-2 border border-neutral-300 bg-white px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-neutral-600 transition-colors hover:border-brand hover:text-brand"
          >
            <Briefcase className="h-3.5 w-3.5" />
            Ver servicios
          </Link>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`group flex items-start justify-between border-l-4 border border-neutral-200 bg-white p-6 transition-all hover:shadow-sm ${s.accent}`}
          >
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                {s.label}
              </p>
              <p className="mt-2 font-playfair text-4xl font-normal text-brand">
                {s.value}
              </p>
              <p className="mt-1 text-xs text-neutral-400">{s.sub}</p>
            </div>
            <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center bg-[#EDE6CA] text-neutral-500 transition-colors group-hover:bg-brand group-hover:text-white">
              <s.icon className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>

      {/* ── Main content: recent appointments + quick nav ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent appointments — 2/3 width on desktop */}
        <div className="lg:col-span-2">
          <div className="border border-neutral-200 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <h2 className="font-playfair text-lg font-normal text-brand">
                Actividad reciente
              </h2>
              <Link
                href="/admin/appointments"
                className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-neutral-400 transition-colors hover:text-brand"
              >
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentAppointments.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-neutral-400">
                No hay citas registradas aún.
              </div>
            ) : (
              <div className="divide-y divide-neutral-50">
                {recentAppointments.map((ap) => (
                  <div
                    key={ap.id}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-neutral-50/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-neutral-800">
                        {ap.patients?.name ?? "—"}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-500">
                        <span>{ap.therapists?.name ?? "—"}</span>
                        {ap.treatments?.name && (
                          <>
                            <span className="text-neutral-300">·</span>
                            <span>{ap.treatments.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                      <span className="text-xs text-neutral-500">
                        {ap.date} · {ap.time.slice(0, 5)}
                      </span>
                      <span
                        className={`border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${STATUS_COLOR[ap.status] ?? "border-neutral-200 text-neutral-500"}`}
                      >
                        {STATUS_LABEL[ap.status] ?? ap.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick navigation — 1/3 width */}
        <div className="space-y-4">
          <div className="border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 px-6 py-4">
              <h2 className="font-playfair text-lg font-normal text-brand">
                Gestión
              </h2>
            </div>
            <nav className="divide-y divide-neutral-50">
              {[
                {
                  href: "/admin/therapists",
                  icon: Users,
                  label: "Terapeutas",
                  desc: `${activeTherapists} activos`,
                },
                {
                  href: "/admin/appointments",
                  icon: CalendarDays,
                  label: "Citas",
                  desc: `${scheduledAppointments} programadas`,
                },
                {
                  href: "/admin/services",
                  icon: Briefcase,
                  label: "Servicios",
                  desc: `${totalServices} configurados`,
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-neutral-50/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center bg-[#EDE6CA] text-neutral-600">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">
                        {item.label}
                      </p>
                      <p className="text-xs text-neutral-400">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-neutral-300" />
                </Link>
              ))}
            </nav>
          </div>

          {/* Therapists list mini */}
          <div className="border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 px-6 py-4">
              <h2 className="font-playfair text-base font-normal text-brand">
                Terapeutas activos
              </h2>
            </div>
            <div className="divide-y divide-neutral-50">
              {(therapistsRes.data ?? [])
                .filter((t) => t.active !== false)
                .slice(0, 5)
                .map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center bg-[#ddd6b3] font-playfair text-[10px] text-neutral-600">
                      {t.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <span className="text-sm text-neutral-700">{t.name}</span>
                  </div>
                ))}
              {activeTherapists > 5 && (
                <div className="px-6 py-3 text-xs text-neutral-400">
                  +{activeTherapists - 5} más
                </div>
              )}
              {activeTherapists === 0 && (
                <div className="px-6 py-6 text-center text-xs text-neutral-400">
                  Sin terapeutas activos
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
