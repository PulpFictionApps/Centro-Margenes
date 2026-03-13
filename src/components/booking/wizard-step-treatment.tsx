"use client";

import { useFormContext } from "react-hook-form";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Service } from "@/lib/types";
import type { BookingFormValues } from "./booking-wizard-modal";

interface WizardStepTreatmentProps {
  treatments: Service[];
}

export function WizardStepTreatment({ treatments }: WizardStepTreatmentProps) {
  const { setValue, watch, clearErrors } = useFormContext<BookingFormValues>();
  const selected = watch("treatmentId");

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-playfair text-xl font-normal text-brand">¿Qué tipo de sesión necesitas?</h3>
        <p className="mt-2 text-sm text-neutral-500">
          Selecciona el tratamiento que mejor se adapte a tu situación.
        </p>
      </div>
      <div className="grid gap-3">
        {treatments.map((treatment) => (
          <button
            key={treatment.id}
            type="button"
            onClick={() => {
              setValue("treatmentId", treatment.id);
              clearErrors("treatmentId");
            }}
            className={cn(
              "flex items-start border p-5 text-left transition-all duration-200 hover:border-brand",
              selected === treatment.id
                ? "border-brand bg-brand/5"
                : "border-neutral-300"
            )}
          >
            <div className="flex-1">
              <h4 className="font-playfair text-base font-normal text-brand">{treatment.name}</h4>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                {treatment.description}
              </p>
            </div>
            <div className="ml-4 flex shrink-0 items-center gap-1.5 border border-neutral-300 px-3 py-1 text-[10px] uppercase tracking-[0.1em] text-neutral-500">
              <Clock className="h-3 w-3" />
              {treatment.duration_minutes} min
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
