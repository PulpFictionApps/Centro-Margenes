"use client";

import { CheckCircle2, Calendar, Clock, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Branch, Service, Therapist } from "@/lib/types";

interface WizardConfirmationProps {
  branch: Branch | null;
  treatment: Service | null;
  therapist: Therapist | null;
  date: string;
  time: string;
  patientName: string;
  onClose: () => void;
}

export function WizardConfirmation({
  branch,
  treatment,
  therapist,
  date,
  time,
  patientName,
  onClose,
}: WizardConfirmationProps) {
  return (
    <div className="space-y-6 py-2">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center bg-brand">
          <CheckCircle2 className="h-7 w-7 text-white" />
        </div>
        <h2 className="mt-5 font-playfair text-2xl font-normal text-brand">¡Reserva confirmada!</h2>
        <p className="mt-3 text-sm text-neutral-500">
          Tu cita ha sido registrada exitosamente. Te enviaremos un correo de
          confirmación.
        </p>
      </div>

      <div className="border-t border-neutral-300/60" />

      <div className="border border-neutral-300 p-5 space-y-4">
        <h3 className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Resumen de tu cita</h3>
        {branch && (
          <div className="flex items-center gap-3 text-sm text-neutral-700">
            <MapPin className="h-4 w-4 text-neutral-400" />
            <span>{branch.name}</span>
          </div>
        )}
        {therapist && (
          <div className="flex items-center gap-3 text-sm text-neutral-700">
            <User className="h-4 w-4 text-neutral-400" />
            <span>{therapist.name}</span>
          </div>
        )}
        {date && (
          <div className="flex items-center gap-3 text-sm text-neutral-700">
            <Calendar className="h-4 w-4 text-neutral-400" />
            <span>
              {format(new Date(date + "T12:00:00"), "EEEE d 'de' MMMM, yyyy", {
                locale: es,
              })}
            </span>
          </div>
        )}
        {time && treatment && (
          <div className="flex items-center gap-3 text-sm text-neutral-700">
            <Clock className="h-4 w-4 text-neutral-400" />
            <span>
              {time} ({treatment.duration_minutes} minutos – {treatment.name})
            </span>
          </div>
        )}
      </div>

      <div className="text-sm text-neutral-500">
        <span className="text-[11px] uppercase tracking-[0.15em] text-neutral-400">Paciente:</span>{" "}
        <span className="text-neutral-700">{patientName}</span>
      </div>

      <div className="text-center pt-2">
        <button
          onClick={onClose}
          className="btn-fill btn-fill-tan border-y border-[#5b2525] px-10 py-3 text-[11px] uppercase tracking-[0.2em] text-[#5b2525] transition-all duration-300"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
