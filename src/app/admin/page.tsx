import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, Briefcase, CalendarDays } from "lucide-react";

export default async function AdminPage() {
  const supabase = createServerSupabaseClient();

  const [therapistsRes, servicesRes, appointmentsRes] = await Promise.all([
    supabase.from("therapists").select("id, active", { count: "exact" }),
    supabase.from("services").select("id", { count: "exact" }),
    supabase
      .from("appointments")
      .select("id", { count: "exact" })
      .eq("status", "scheduled"),
  ]);

  const totalTherapists = therapistsRes.count ?? 0;
  const activeTherapists =
    therapistsRes.data?.filter((t) => t.active !== false).length ?? 0;
  const totalServices = servicesRes.count ?? 0;
  const scheduledAppointments = appointmentsRes.count ?? 0;

  const cards = [
    {
      title: "Terapeutas",
      value: `${activeTherapists} / ${totalTherapists}`,
      subtitle: "activos / total",
      icon: Users,
      href: "/admin/therapists",
    },
    {
      title: "Servicios",
      value: totalServices,
      subtitle: "configurados",
      icon: Briefcase,
      href: "/admin/services",
    },
    {
      title: "Citas programadas",
      value: scheduledAppointments,
      subtitle: "activas",
      icon: CalendarDays,
      href: "/admin/appointments",
    },
  ];

  return (
    <div className="space-y-10 animate-in">
      <div>
        <h1 className="font-playfair text-3xl font-normal text-brand">
          Panel de administración
        </h1>
        <p className="mt-3 text-sm text-neutral-500">
          Gestiona terapeutas, servicios y citas del centro.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group border border-neutral-200 bg-white p-8 transition-colors hover:border-brand"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">
                  {card.title}
                </h3>
                <p className="mt-3 font-playfair text-3xl text-brand">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-neutral-400">{card.subtitle}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center bg-[#ddd6b3] text-neutral-600 transition-colors group-hover:bg-brand group-hover:text-white">
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
