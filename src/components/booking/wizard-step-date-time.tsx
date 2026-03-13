"use client";

import { useFormContext } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { addDays, startOfDay, isBefore, format } from "date-fns";
import { es } from "date-fns/locale";
import type { BookingFormValues } from "./booking-wizard-modal";

interface WizardStepDateTimeProps {
  availableSlots: string[];
  loadingSlots: boolean;
}

export function WizardStepDateTime({
  availableSlots,
  loadingSlots,
}: WizardStepDateTimeProps) {
  const { setValue, watch, clearErrors } = useFormContext<BookingFormValues>();
  const selectedDateStr = watch("date");
  const selectedTime = watch("time");

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 60);

  const selectedDate = selectedDateStr
    ? new Date(selectedDateStr + "T12:00:00")
    : undefined;

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = format(date, "yyyy-MM-dd");
    setValue("date", dateStr);
    setValue("time", "");
    clearErrors("date");
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
            disabled={(date) =>
              isBefore(date, today) ||
              date > maxDate ||
              date.getDay() === 0
            }
            locale={es}
            className="border border-neutral-300"
          />
        </div>

        {/* Time slots */}
        <div>
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
