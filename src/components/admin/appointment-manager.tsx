"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Therapist } from "@/lib/types";
// icons used inline via status styles

type AppointmentRow = {
  id: string;
  date: string;
  time: string;
  status: string;
  patient_name: string;
  therapist_name: string;
  treatment_name: string;
};

interface AppointmentManagerProps {
  therapists: Therapist[];
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "border-green-300 bg-green-50 text-green-700",
  cancelled: "border-red-300 bg-red-50 text-red-600",
  completed: "border-blue-300 bg-blue-50 text-blue-600",
  no_show: "border-amber-300 bg-amber-50 text-amber-700",
};

export function AppointmentManager({ therapists }: AppointmentManagerProps) {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDate, setFilterDate] = useState("");
  const [filterTherapist, setFilterTherapist] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("appointments")
      .select("*, patients(name), therapists(name), treatments(name)")
      .order("date", { ascending: false })
      .order("time", { ascending: true })
      .limit(100);

    if (filterDate) {
      query = query.eq("date", filterDate);
    }
    if (filterTherapist) {
      query = query.eq("therapist_id", filterTherapist);
    }
    if (filterStatus) {
      query = query.eq("status", filterStatus);
    }

    const { data } = await query;

    setAppointments(
      (data ?? []).map((a: Record<string, unknown>) => ({
        id: a.id as string,
        date: a.date as string,
        time: a.time as string,
        status: a.status as string,
        patient_name:
          (a.patients as { name: string } | null)?.name ?? "—",
        therapist_name:
          (a.therapists as { name: string } | null)?.name ?? "—",
        treatment_name:
          (a.treatments as { name: string } | null)?.name ?? "—",
      }))
    );
    setLoading(false);
  }, [filterDate, filterTherapist, filterStatus]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const supabase = createClient();
    await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id);
    await fetchAppointments();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-playfair text-3xl font-normal text-brand">
          Citas
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Visualiza y administra todas las citas del centro.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 border border-neutral-200 bg-white p-5">
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
            Fecha
          </label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="mt-1 block w-44 border border-neutral-300 bg-white px-3 py-2 text-sm text-brand outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
            Terapeuta
          </label>
          <select
            value={filterTherapist}
            onChange={(e) => setFilterTherapist(e.target.value)}
            className="mt-1 block w-52 border border-neutral-300 bg-white px-3 py-2 text-sm text-brand outline-none focus:border-brand"
          >
            <option value="">Todos</option>
            {therapists.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
            Estado
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="mt-1 block w-44 border border-neutral-300 bg-white px-3 py-2 text-sm text-brand outline-none focus:border-brand"
          >
            <option value="">Todos</option>
            <option value="scheduled">Programada</option>
            <option value="cancelled">Cancelada</option>
            <option value="completed">Completada</option>
            <option value="no_show">No asistió</option>
          </select>
        </div>
        {(filterDate || filterTherapist || filterStatus) && (
          <button
            onClick={() => {
              setFilterDate("");
              setFilterTherapist("");
              setFilterStatus("");
            }}
            className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 transition-colors hover:text-brand"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                Paciente
              </th>
              <th className="px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                Terapeuta
              </th>
              <th className="px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                Tratamiento
              </th>
              <th className="px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                Fecha
              </th>
              <th className="px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                Hora
              </th>
              <th className="px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-16 text-center text-sm text-neutral-400"
                >
                  Cargando citas...
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-16 text-center text-sm text-neutral-400"
                >
                  No se encontraron citas con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              appointments.map((ap) => (
                <tr
                  key={ap.id}
                  className="border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-cream/30"
                >
                  <td className="px-5 py-4 font-medium text-brand">
                    {ap.patient_name}
                  </td>
                  <td className="px-5 py-4 text-neutral-600">
                    {ap.therapist_name}
                  </td>
                  <td className="px-5 py-4 text-neutral-500">
                    {ap.treatment_name || "—"}
                  </td>
                  <td className="px-5 py-4 text-neutral-600">{ap.date}</td>
                  <td className="px-5 py-4 text-neutral-600">{ap.time}</td>
                  <td className="px-5 py-4">
                    <select
                      value={ap.status}
                      onChange={(e) =>
                        handleStatusChange(ap.id, e.target.value)
                      }
                      className={`border px-2 py-1 text-[9px] uppercase tracking-[0.1em] outline-none cursor-pointer ${STATUS_STYLES[ap.status] ?? "border-neutral-300 text-neutral-500"}`}
                    >
                      <option value="scheduled">Programada</option>
                      <option value="cancelled">Cancelada</option>
                      <option value="completed">Completada</option>
                      <option value="no_show">No asistió</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
