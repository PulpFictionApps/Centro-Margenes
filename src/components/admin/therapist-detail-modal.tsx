"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Therapist, Availability, Appointment } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, Calendar, Monitor, Building2 } from "lucide-react";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface TherapistDetailModalProps {
  open: boolean;
  onClose: () => void;
  therapist: Therapist | null;
}

export function TherapistDetailModal({
  open,
  onClose,
  therapist,
}: TherapistDetailModalProps) {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [appointments, setAppointments] = useState<
    (Appointment & { patient_name?: string })[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"info" | "availability" | "appointments">(
    "info"
  );

  useEffect(() => {
    if (!open || !therapist) return;
    setTab("info");

    async function fetchDetail() {
      setLoading(true);
      const supabase = createClient();

      const [avRes, apptRes] = await Promise.all([
        supabase
          .from("availability")
          .select("*")
          .eq("therapist_id", therapist!.id)
          .order("day_of_week"),
        supabase
          .from("appointments")
          .select("*, patients(name)")
          .eq("therapist_id", therapist!.id)
          .order("date", { ascending: false })
          .limit(20),
      ]);

      setAvailability((avRes.data as Availability[]) ?? []);
      setAppointments(
        (apptRes.data ?? []).map((a: Record<string, unknown>) => ({
          ...(a as Appointment),
          patient_name:
            (a.patients as { name: string } | null)?.name ?? "—",
        }))
      );
      setLoading(false);
    }

    fetchDetail();
  }, [open, therapist]);

  if (!therapist) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[#EDE6CA] border-neutral-300/40">
        <DialogHeader>
          <DialogTitle className="font-playfair text-2xl font-normal text-brand">
            {therapist.name}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-neutral-200">
          {(
            [
              { key: "info", label: "Información" },
              { key: "availability", label: "Disponibilidad" },
              { key: "appointments", label: "Citas" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-[11px] uppercase tracking-[0.15em] transition-colors ${
                tab === t.key
                  ? "border-b-2 border-brand text-brand"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="min-h-[200px] pt-2">
          {/* Info tab */}
          {tab === "info" && (
            <div className="space-y-5">
              <div className="flex items-start gap-5">
                {therapist.photo_url ? (
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden">
                    <Image
                      src={therapist.photo_url}
                      alt={therapist.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center bg-[#ddd6b3] font-playfair text-lg text-neutral-600">
                    {therapist.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm text-neutral-500">{therapist.email}</p>
                  <div className="mt-2 flex gap-2">
                    {therapist.offers_online && (
                      <span className="flex items-center gap-1 border border-neutral-200 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-neutral-500">
                        <Monitor className="h-3 w-3" /> Online
                      </span>
                    )}
                    {therapist.offers_in_person && (
                      <span className="flex items-center gap-1 border border-neutral-200 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-neutral-500">
                        <Building2 className="h-3 w-3" /> Presencial
                      </span>
                    )}
                  </div>
                  <span
                    className={`mt-2 inline-block border px-3 py-1 text-[9px] uppercase tracking-[0.15em] ${
                      therapist.active !== false
                        ? "border-green-300 bg-green-50 text-green-700"
                        : "border-neutral-300 bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {therapist.active !== false ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
              {therapist.bio && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                    Biografía
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                    {therapist.bio}
                  </p>
                </div>
              )}
              {therapist.specialties.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                    Especialidades
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {therapist.specialties.map((s) => (
                      <span
                        key={s}
                        className="border border-neutral-200 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-neutral-500"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Availability tab */}
          {tab === "availability" && (
            <div>
              {loading ? (
                <p className="py-8 text-center text-sm text-neutral-400">
                  Cargando...
                </p>
              ) : availability.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-400">
                  Sin disponibilidad configurada.
                </p>
              ) : (
                <div className="space-y-2">
                  {availability.map((av) => (
                    <div
                      key={av.id}
                      className="flex items-center gap-4 border border-neutral-200 bg-white px-5 py-3"
                    >
                      <span className="w-12 text-[11px] uppercase tracking-[0.1em] text-brand">
                        {DAY_NAMES[av.day_of_week]}
                      </span>
                      <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                        {av.start_time} – {av.end_time}
                      </div>
                      <span className="text-xs text-neutral-400">
                        ({av.slot_duration} min)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Appointments tab */}
          {tab === "appointments" && (
            <div>
              {loading ? (
                <p className="py-8 text-center text-sm text-neutral-400">
                  Cargando...
                </p>
              ) : appointments.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-400">
                  Sin citas registradas.
                </p>
              ) : (
                <div className="space-y-2">
                  {appointments.map((ap) => (
                    <div
                      key={ap.id}
                      className="flex items-center justify-between border border-neutral-200 bg-white px-5 py-3"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                          {ap.date}
                        </div>
                        <span className="text-sm text-neutral-600">
                          {ap.time}
                        </span>
                        <span className="text-sm text-neutral-500">
                          {ap.patient_name}
                        </span>
                      </div>
                      <span
                        className={`border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${
                          ap.status === "scheduled"
                            ? "border-green-300 text-green-700"
                            : ap.status === "cancelled"
                              ? "border-red-300 text-red-600"
                              : ap.status === "completed"
                                ? "border-blue-300 text-blue-600"
                                : ap.status === "no_show"
                                  ? "border-amber-300 text-amber-700"
                                  : "border-neutral-300 text-neutral-500"
                        }`}
                      >
                        {ap.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
