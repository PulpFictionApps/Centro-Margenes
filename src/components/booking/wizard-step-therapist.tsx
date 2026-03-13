"use client";

import { useFormContext } from "react-hook-form";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Therapist } from "@/lib/types";
import type { BookingFormValues } from "./booking-wizard-modal";

interface WizardStepTherapistProps {
  therapists: Therapist[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function WizardStepTherapist({ therapists }: WizardStepTherapistProps) {
  const { setValue, watch, clearErrors } = useFormContext<BookingFormValues>();
  const selected = watch("therapistId");

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-playfair text-xl font-normal text-brand">Elige tu terapeuta</h3>
        <p className="mt-2 text-sm text-neutral-500">
          Selecciona el profesional con quien quieres tener tu sesión.
        </p>
      </div>
      {therapists.length === 0 ? (
        <div className="border border-neutral-300 p-8 text-center">
          <p className="font-playfair text-base text-brand">Sin terapeutas disponibles</p>
          <p className="mt-2 text-sm text-neutral-500">
            No hay terapeutas disponibles para la modalidad y servicio seleccionados.
            Intenta cambiar tu selección anterior.
          </p>
        </div>
      ) : (
      <div className="grid gap-3">
        {therapists.map((therapist) => (
          <button
            key={therapist.id}
            type="button"
            onClick={() => {
              setValue("therapistId", therapist.id);
              clearErrors("therapistId");
            }}
            className={cn(
              "flex items-center gap-4 border p-5 text-left transition-all duration-200 hover:border-brand",
              selected === therapist.id
                ? "border-brand bg-brand/5"
                : "border-neutral-300"
            )}
          >
            {therapist.photo_url ? (
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden">
                <Image src={therapist.photo_url} alt={therapist.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center bg-[#ddd6b3] font-playfair text-sm text-neutral-600">
                {getInitials(therapist.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-playfair text-base font-normal text-brand">{therapist.name}</h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {therapist.specialties.slice(0, 3).map((s) => (
                  <span key={s} className="border border-neutral-300 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-neutral-500">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
      )}
    </div>
  );
}
