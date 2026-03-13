"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import type { Therapist, Availability } from "@/lib/types";

interface StepDateTimeProps {
  therapist: Therapist;
  selectedDate: Date | null;
  selectedTime: string | null;
  onSelectDate: (date: Date) => void;
  onSelectTime: (time: string) => void;
}

// Default availability when Supabase is not connected
function getDefaultTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 9; h < 18; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }
  return slots;
}

export function StepDateTime({
  therapist,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}: StepDateTimeProps) {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 60);

  useEffect(() => {
    if (!selectedDate) return;

    async function fetchSlots() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const dayOfWeek = selectedDate!.getDay();
        const dateStr = format(selectedDate!, "yyyy-MM-dd");

        // Get therapist availability for this day
        const { data: availability } = await supabase
          .from("availability")
          .select("*")
          .eq("therapist_id", therapist.id)
          .eq("day_of_week", dayOfWeek);

        // Get existing appointments for this date
        const { data: appointments } = await supabase
          .from("appointments")
          .select("time")
          .eq("therapist_id", therapist.id)
          .eq("date", dateStr)
          .neq("status", "cancelled");

        if (availability && availability.length > 0) {
          const bookedTimes = new Set(
            (appointments ?? []).map((a: { time: string }) => a.time)
          );
          const slots: string[] = [];

          (availability as Availability[]).forEach((av) => {
            const [startH, startM] = av.start_time.split(":").map(Number);
            const [endH, endM] = av.end_time.split(":").map(Number);
            const startMin = startH * 60 + startM;
            const endMin = endH * 60 + endM;

            for (let m = startMin; m < endMin; m += 60) {
              const t = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
              if (!bookedTimes.has(t)) {
                slots.push(t);
              }
            }
          });

          setAvailableSlots(slots.sort());
        } else {
          // Use default slots for demo
          const bookedTimes = new Set(
            (appointments ?? []).map((a: { time: string }) => a.time)
          );
          setAvailableSlots(
            getDefaultTimeSlots().filter((t) => !bookedTimes.has(t))
          );
        }
      } catch {
        setAvailableSlots(getDefaultTimeSlots());
      } finally {
        setIsLoading(false);
      }
    }

    fetchSlots();
  }, [selectedDate, therapist.id]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Selecciona fecha y hora</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Elige el día y horario que prefieras.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Calendar */}
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={(date) => date && onSelectDate(date)}
            disabled={(date) =>
              isBefore(date, today) ||
              date > maxDate ||
              date.getDay() === 0 // Disable Sundays
            }
            locale={es}
            className="rounded-xl border"
          />
        </div>

        {/* Time slots */}
        <div>
          {selectedDate ? (
            <>
              <p className="mb-3 text-sm font-medium">
                Horarios disponibles para{" "}
                <span className="text-primary">
                  {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                </span>
              </p>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando horarios...</p>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => onSelectTime(slot)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm font-medium transition-all hover:border-primary/50",
                        selectedTime === slot
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-accent"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay horarios disponibles para este día.
                </p>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Selecciona una fecha para ver los horarios disponibles.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
