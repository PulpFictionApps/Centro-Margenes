"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Availability } from "@/lib/types";

const dayLabels = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const slotOptions = [15, 20, 30, 45, 50, 60, 90];

interface AvailabilityEditorProps {
  therapistId?: string;
}

type AvailabilitySlot = {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
};

export function AvailabilityEditor({ therapistId }: AvailabilityEditorProps) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [enabledDays, setEnabledDays] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!therapistId) {
      setLoading(false);
      return;
    }

    async function fetchAvailability() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("availability")
          .select("*")
          .eq("therapist_id", therapistId)
          .order("day_of_week")
          .order("start_time");

        const mapped =
          (data as Availability[])?.map((a) => ({
            id: a.id,
            day_of_week: a.day_of_week,
            start_time: a.start_time,
            end_time: a.end_time,
            slot_duration: a.slot_duration ?? 50,
          })) ?? [];

        setSlots(mapped);
        setEnabledDays(new Set(mapped.map((s) => s.day_of_week)));
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchAvailability();
  }, [therapistId]);

  const toggleDay = (day: number) => {
    const next = new Set(enabledDays);
    if (next.has(day)) {
      next.delete(day);
      setSlots(slots.filter((s) => s.day_of_week !== day));
    } else {
      next.add(day);
      setSlots([
        ...slots,
        { day_of_week: day, start_time: "09:00", end_time: "13:00", slot_duration: 50 },
      ]);
    }
    setEnabledDays(next);
  };

  const addSlot = (dayOfWeek: number) => {
    setSlots([
      ...slots,
      { day_of_week: dayOfWeek, start_time: "09:00", end_time: "13:00", slot_duration: 50 },
    ]);
  };

  const removeSlot = (index: number) => {
    const slot = slots[index];
    const remaining = slots.filter((_, i) => i !== index);
    setSlots(remaining);
    if (!remaining.some((s) => s.day_of_week === slot.day_of_week)) {
      const next = new Set(enabledDays);
      next.delete(slot.day_of_week);
      setEnabledDays(next);
    }
  };

  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: string | number) => {
    const updated = [...slots];
    (updated[index] as Record<string, unknown>)[field] = value;
    setSlots(updated);
  };

  const handleSave = async () => {
    if (!therapistId) return;
    setSaving(true);
    setMessage("");

    try {
      const supabase = createClient();

      await supabase.from("availability").delete().eq("therapist_id", therapistId);

      if (slots.length > 0) {
        const { error } = await supabase.from("availability").insert(
          slots.map((slot) => ({
            therapist_id: therapistId,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            slot_duration: slot.slot_duration,
          }))
        );
        if (error) throw error;
      }

      setMessage("Disponibilidad guardada correctamente.");
    } catch {
      setMessage("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (!therapistId) {
    return (
      <div className="border-t border-neutral-200 bg-white px-8 py-16 text-center text-sm text-neutral-500">
        No se encontró tu perfil. Contacta al administrador.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-neutral-400">
        Cargando disponibilidad...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {[1, 2, 3, 4, 5, 6, 0].map((day) => {
        const isEnabled = enabledDays.has(day);
        const daySlots = slots
          .map((s, i) => ({ ...s, _index: i }))
          .filter((s) => s.day_of_week === day);

        return (
          <div key={day} className="border-t border-neutral-200 bg-white">
            {/* Day header with toggle */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    isEnabled ? "bg-brand" : "bg-neutral-200"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      isEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <h3
                  className={`font-playfair text-lg ${
                    isEnabled ? "text-brand" : "text-neutral-300"
                  }`}
                >
                  {dayLabels[day]}
                </h3>
              </div>
              {isEnabled && (
                <button
                  onClick={() => addSlot(day)}
                  className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:text-brand"
                >
                  + Agregar bloque
                </button>
              )}
            </div>

            {/* Slots */}
            {isEnabled && (
              <div className="px-6 pb-5">
                {daySlots.length === 0 ? (
                  <p className="text-sm text-neutral-400">
                    Sin bloques configurados.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {daySlots.map((slot) => (
                      <div
                        key={slot._index}
                        className="flex flex-wrap items-end gap-4 border border-neutral-200 p-4"
                      >
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                            Inicio
                          </label>
                          <input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) =>
                              updateSlot(slot._index, "start_time", e.target.value)
                            }
                            className="block w-32 border-b border-neutral-300 bg-transparent pb-1 text-sm text-brand outline-none focus:border-brand"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                            Fin
                          </label>
                          <input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) =>
                              updateSlot(slot._index, "end_time", e.target.value)
                            }
                            className="block w-32 border-b border-neutral-300 bg-transparent pb-1 text-sm text-brand outline-none focus:border-brand"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                            Duración sesión
                          </label>
                          <select
                            value={slot.slot_duration}
                            onChange={(e) =>
                              updateSlot(slot._index, "slot_duration", Number(e.target.value))
                            }
                            className="block w-28 border-b border-neutral-300 bg-transparent pb-1 text-sm text-brand outline-none focus:border-brand"
                          >
                            {slotOptions.map((m) => (
                              <option key={m} value={m}>
                                {m} min
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => removeSlot(slot._index)}
                          className="ml-auto text-[10px] uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:text-red-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="border-y border-brand px-8 py-3 text-[11px] uppercase tracking-[0.2em] text-brand transition-colors hover:bg-brand hover:text-white disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar disponibilidad"}
        </button>
        {message && (
          <p
            className={`text-sm ${
              message.includes("Error") ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
