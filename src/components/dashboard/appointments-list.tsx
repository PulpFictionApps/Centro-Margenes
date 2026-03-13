"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, parseISO, isAfter, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import type { Appointment } from "@/lib/types";
import { X, CalendarClock, CheckCircle2, UserX } from "lucide-react";

interface AppointmentsListProps {
  therapistId?: string;
}

type AppointmentWithRelations = Appointment & {
  treatments?: { name: string } | null;
  patients?: { name: string; email: string; phone: string } | null;
  branches?: { name: string } | null;
};

const statusLabels: Record<string, string> = {
  scheduled: "Programada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No asistió",
};

const statusDot: Record<string, string> = {
  scheduled: "bg-emerald-500",
  cancelled: "bg-neutral-300",
  completed: "bg-blue-400",
  no_show: "bg-amber-400",
};

export function AppointmentsList({ therapistId }: AppointmentsListProps) {
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const fetchAppointments = async () => {
    if (!therapistId) {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("appointments")
        .select("*, treatments(name), patients(name, email, phone), branches(name)")
        .eq("therapist_id", therapistId)
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      setAppointments((data as AppointmentWithRelations[]) ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [therapistId]);

  const handleStatusChange = async (id: string, status: string) => {
    const supabase = createClient();
    await supabase.from("appointments").update({ status }).eq("id", id);
    fetchAppointments();
  };

  const handleReschedule = async (id: string) => {
    if (!rescheduleDate || !rescheduleTime) return;
    const supabase = createClient();
    await supabase
      .from("appointments")
      .update({ date: rescheduleDate, time: rescheduleTime })
      .eq("id", id);
    setRescheduleId(null);
    setRescheduleDate("");
    setRescheduleTime("");
    fetchAppointments();
  };

  const now = new Date();
  const upcoming = appointments.filter(
    (a) =>
      a.status !== "cancelled" &&
      a.status !== "completed" &&
      a.status !== "no_show" &&
      isAfter(parseISO(a.date), new Date(now.toDateString()))
  );
  const past = appointments.filter(
    (a) =>
      a.status === "completed" ||
      a.status === "cancelled" ||
      a.status === "no_show" ||
      isBefore(parseISO(a.date), new Date(now.toDateString()))
  );

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-neutral-400">
        Cargando citas...
      </div>
    );
  }

  if (!therapistId) {
    return (
      <div className="border-t border-neutral-200 bg-white px-8 py-16 text-center text-sm text-neutral-500">
        No se encontró tu perfil de terapeuta. Contacta al administrador.
      </div>
    );
  }

  const renderAppointment = (appointment: AppointmentWithRelations) => (
    <div
      key={appointment.id}
      className="border-t border-neutral-200 bg-white px-6 py-5 transition-colors hover:bg-neutral-50/50"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2.5">
          {/* Status + branch */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2">
              <span className={`inline-block h-2 w-2 ${statusDot[appointment.status]}`} />
              <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                {statusLabels[appointment.status]}
              </span>
            </span>
            {appointment.branches?.name && (
              <span className="text-[11px] uppercase tracking-[0.15em] text-neutral-400">
                · {appointment.branches.name}
              </span>
            )}
          </div>

          {/* Date + time */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-700">
            <span>
              {format(parseISO(appointment.date), "EEEE d MMM, yyyy", {
                locale: es,
              })}
            </span>
            <span className="text-neutral-400">|</span>
            <span>{appointment.time}</span>
          </div>

          {/* Treatment */}
          {appointment.treatments?.name && (
            <p className="text-sm text-neutral-500">{appointment.treatments.name}</p>
          )}

          {/* Patient info */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500">
            <span>{appointment.patients?.name}</span>
            <span>{appointment.patients?.email}</span>
            <span>{appointment.patients?.phone}</span>
          </div>
        </div>

        {/* Actions */}
        {appointment.status === "scheduled" && (
          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => handleStatusChange(appointment.id, "completed")}
              className="flex items-center gap-1.5 border-y border-brand px-5 py-2 text-[11px] uppercase tracking-[0.2em] text-brand transition-colors hover:bg-brand hover:text-white"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completar
            </button>
            <button
              onClick={() => {
                setRescheduleId(appointment.id);
                setRescheduleDate(appointment.date);
                setRescheduleTime(appointment.time);
              }}
              className="flex items-center gap-1.5 border-y border-neutral-300 px-5 py-2 text-[11px] uppercase tracking-[0.2em] text-neutral-500 transition-colors hover:border-brand hover:text-brand"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              Reprogramar
            </button>
            <button
              onClick={() => handleStatusChange(appointment.id, "cancelled")}
              className="flex items-center gap-1.5 border-y border-neutral-300 px-5 py-2 text-[11px] uppercase tracking-[0.2em] text-neutral-500 transition-colors hover:border-red-400 hover:text-red-600"
            >
              <X className="h-3.5 w-3.5" />
              Cancelar
            </button>
            <button
              onClick={() => handleStatusChange(appointment.id, "no_show")}
              className="flex items-center gap-1.5 border-y border-neutral-300 px-5 py-2 text-[11px] uppercase tracking-[0.2em] text-neutral-500 transition-colors hover:border-amber-400 hover:text-amber-600"
            >
              <UserX className="h-3.5 w-3.5" />
              No asistió
            </button>
          </div>
        )}

        {/* Reschedule inline form */}
        {rescheduleId === appointment.id && (
          <div className="flex flex-wrap items-end gap-3 border-t border-dashed border-neutral-200 pt-4 mt-2">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Nueva fecha</label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="mt-1 block w-40 border border-neutral-300 bg-white px-3 py-2 text-sm text-brand outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Nueva hora</label>
              <input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="mt-1 block w-32 border border-neutral-300 bg-white px-3 py-2 text-sm text-brand outline-none focus:border-brand"
              />
            </div>
            <button
              onClick={() => handleReschedule(appointment.id)}
              disabled={!rescheduleDate || !rescheduleTime}
              className="border-y border-brand px-5 py-2 text-[11px] uppercase tracking-[0.2em] text-brand transition-colors hover:bg-brand hover:text-white disabled:opacity-30"
            >
              Confirmar
            </button>
            <button
              onClick={() => setRescheduleId(null)}
              className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-neutral-600"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const activeList = activeTab === "upcoming" ? upcoming : past;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-6 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`pb-3 text-[11px] uppercase tracking-[0.2em] transition-colors ${
            activeTab === "upcoming"
              ? "border-b-2 border-brand text-brand"
              : "text-neutral-400 hover:text-neutral-600"
          }`}
        >
          Próximas ({upcoming.length})
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`pb-3 text-[11px] uppercase tracking-[0.2em] transition-colors ${
            activeTab === "past"
              ? "border-b-2 border-brand text-brand"
              : "text-neutral-400 hover:text-neutral-600"
          }`}
        >
          Historial ({past.length})
        </button>
      </div>

      {/* Content */}
      <div className="mt-4 space-y-0">
        {activeList.length === 0 ? (
          <div className="border-t border-neutral-200 bg-white px-8 py-16 text-center text-sm text-neutral-400">
            {activeTab === "upcoming"
              ? "No tienes citas próximas."
              : "No hay historial de citas."}
          </div>
        ) : (
          activeList.map(renderAppointment)
        )}
      </div>
    </div>
  );
}
