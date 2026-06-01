"use client";

import { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { addDays, startOfDay, isBefore, format } from "date-fns";
import { es } from "date-fns/locale";
import type { BookingFormValues } from "./booking-wizard-modal";

interface WizardStepDateTimeProps {
  availableSlots: string[];
  loadingSlots: boolean;
  availableDays: string[];
}

export function WizardStepDateTime({
  availableSlots,
  loadingSlots,
  availableDays,
}: WizardStepDateTimeProps) {
  const { setValue, watch, clearErrors } = useFormContext<BookingFormValues>();
  const selectedDateStr = watch("date");
  const selectedTime = watch("time");
  const slotsSectionRef = useRef<HTMLDivElement | null>(null);
  const [slotsHighlighted, setSlotsHighlighted] = useState(false);

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 60);

  const selectedDate = selectedDateStr
    ? new Date(selectedDateStr + "T12:00:00")
    : undefined;

  const scrollToSlots = () => {
    if (!slotsSectionRef.current) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    slotsSectionRef.current.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });

    setSlotsHighlighted(true);
    window.setTimeout(() => setSlotsHighlighted(false), 700);
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = format(date, "yyyy-MM-dd");
    setValue("date", dateStr);
    setValue("time", "");
    clearErrors("date");

    window.requestAnimationFrame(() => {
      scrollToSlots();
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-playfair text-xl font-normal text-brand">Selecciona fecha y hora</h3>
        <p className="mt-2 text-sm text-neutral-500">
          Elige el día y horario que prefieras.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Calendar */}
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelectDate}
            disabled={(date) => {
              if (isBefore(date, today) || date > maxDate || date.getDay() === 0) return true;
              if (availableDays.length > 0) {
                const dateStr = format(date, "yyyy-MM-dd");
                return !availableDays.includes(dateStr);
              }
              return false;
            }}
            locale={es}
            className="border border-neutral-300"
          />
        </div>

        {/* Time slots */}
        <div
          ref={slotsSectionRef}
          className={cn(
            "transition-all duration-500",
            slotsHighlighted && "rounded-lg bg-[#efe3cc]/35 p-2"
          )}
        >
          {selectedDateStr ? (
            <>
              <p className="mb-4 text-[11px] uppercase tracking-[0.15em] text-neutral-500">
                Horarios para{" "}
                <span className="text-brand">
                  {format(
                    new Date(selectedDateStr + "T12:00:00"),
                    "EEEE d 'de' MMMM",
                    { locale: es }
                  )}
                </span>
              </p>
              {loadingSlots ? (
                <p className="text-sm text-neutral-500">
                  Cargando horarios...
                </p>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        setValue("time", slot);
                        clearErrors("time");
                      }}
                      className={cn(
                        "border px-3 py-2.5 text-sm transition-all duration-200 hover:border-brand",
                        selectedTime === slot
                          ? "border-brand bg-brand text-white"
                          : "border-neutral-300 text-neutral-600"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  No hay horarios disponibles para este día.
                </p>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center border border-dashed border-neutral-300 p-8 text-sm text-neutral-400">
              Selecciona una fecha para ver los horarios disponibles.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
