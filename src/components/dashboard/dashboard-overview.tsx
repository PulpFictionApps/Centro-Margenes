"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { format, parseISO, isToday } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  Clock,
  User,
  ArrowRight,
} from "lucide-react";
import type { Appointment } from "@/lib/types";

interface DashboardOverviewProps {
  therapistId?: string;
}

type AppointmentWithRelations = Appointment & {
  treatments?: { name: string } | null;
  patients?: { name: string } | null;
};

const statusLabels: Record<string, string> = {
  scheduled: "Programada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No asistió",
};

export function DashboardOverview({ therapistId }: DashboardOverviewProps) {
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!therapistId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const supabase = createClient();
        const today = new Date().toISOString().split("T")[0];

        const { data } = await supabase
          .from("appointments")
          .select("*, treatments(name), patients(name)")
          .eq("therapist_id", therapistId)
          .gte("date", today)
          .neq("status", "cancelled")
          .order("date", { ascending: true })
          .order("time", { ascending: true })
          .limit(50);

        setAppointments((data as AppointmentWithRelations[]) ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [therapistId]);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-neutral-500">
        Cargando resumen...
      </div>
    );
  }

  if (!therapistId) {
    return (
      <div className="border border-neutral-300 p-12 text-center text-sm text-neutral-500">
        No se encontró tu perfil de terapeuta. Contacta al administrador.
      </div>
    );
  }

  const todayAppts = appointments.filter((a) => isToday(parseISO(a.date)));
  const scheduledAppts = appointments.filter((a) => a.status === "scheduled");

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-3">
        {[
          { label: "Citas hoy", value: todayAppts.length },
          { label: "Programadas", value: scheduledAppts.length },
          { label: "Total próximas", value: appointments.length },
        ].map((stat) => (
          <div key={stat.label} className="border border-neutral-300 bg-white p-6">
            <p className="font-playfair text-3xl font-normal text-brand">{stat.value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-neutral-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Today's schedule */}
      <div className="border border-neutral-300 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h3 className="font-playfair text-lg font-normal text-brand">Citas de hoy</h3>
          <Link
            href="/dashboard/appointments"
            className="flex items-center gap-1 text-[11px] uppercase tracking-[0.15em] text-neutral-400 transition-colors hover:text-brand"
          >
            Ver todas <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="p-6">
          {todayAppts.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400">
              No tienes citas programadas para hoy.
            </p>
          ) : (
            <div className="space-y-0">
              {todayAppts.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between border-b border-neutral-200 py-4 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#ddd6b3]">
                      <Clock className="h-4 w-4 text-neutral-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-playfair text-base text-brand">{appt.time}</span>
                        <span className="border border-neutral-300 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-neutral-500">
                          {statusLabels[appt.status]}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {appt.patients?.name ?? "—"}
                        </span>
                        {appt.treatments?.name && (
                          <span>· {appt.treatments.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming */}
      <div className="border border-neutral-300 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h3 className="font-playfair text-lg font-normal text-brand">Próximas citas</h3>
          <Link
            href="/dashboard/appointments"
            className="flex items-center gap-1 text-[11px] uppercase tracking-[0.15em] text-neutral-400 transition-colors hover:text-brand"
          >
            Ver todas <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="p-6">
          {appointments.filter((a) => !isToday(parseISO(a.date))).length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400">
              No tienes citas próximas.
            </p>
          ) : (
            <div className="space-y-0">
              {appointments
                .filter((a) => !isToday(parseISO(a.date)))
                .slice(0, 5)
                .map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between border-b border-neutral-200 py-4 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#ddd6b3]">
                        <Calendar className="h-4 w-4 text-neutral-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-playfair text-base text-brand">
                            {format(parseISO(appt.date), "EEE d MMM", {
                              locale: es,
                            })}
                          </span>
                          <span className="text-sm text-neutral-500">
                            {appt.time}
                          </span>
                          <span className="border border-neutral-300 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-neutral-500">
                            {statusLabels[appt.status]}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-neutral-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {appt.patients?.name ?? "—"}
                          </span>
                          {appt.treatments?.name && (
                            <span>· {appt.treatments.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
