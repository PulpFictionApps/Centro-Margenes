"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Therapist, Service, Branch, TherapistService } from "@/lib/types";
import { WizardStepBranch } from "./wizard-step-branch";
import { WizardStepTreatment } from "./wizard-step-treatment";
import { WizardStepTherapist } from "./wizard-step-therapist";
import { WizardStepDateTime } from "./wizard-step-date-time";
import { WizardStepPatient } from "./wizard-step-patient";
import { WizardStepConditions } from "./wizard-step-conditions";
import { WizardConfirmation } from "./wizard-confirmation";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";

// ----- Zod schema for the full wizard -----
const patientSchema = z.object({
  email: z
    .string()
    .min(1, "El correo es obligatorio")
    .email("Ingresa un correo válido"),
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z
    .string()
    .min(1, "El teléfono es obligatorio")
    .min(8, "El teléfono debe tener al menos 8 dígitos"),
  birthdate: z.string().optional(),
  document: z.string().optional(),
});

const bookingSchema = z.object({
  branchId: z.string().min(1, "Selecciona una modalidad"),
  treatmentId: z.string().min(1, "Selecciona un tratamiento"),
  therapistId: z.string().min(1, "Selecciona un terapeuta"),
  date: z.string().min(1, "Selecciona una fecha"),
  time: z.string().min(1, "Selecciona un horario"),
  patient: patientSchema,
});

export type BookingFormValues = z.infer<typeof bookingSchema>;

// ----- Step definitions -----
const STEPS = [
  { id: 1, label: "Modalidad" },
  { id: 2, label: "Tratamiento" },
  { id: 3, label: "Terapeuta" },
  { id: 4, label: "Fecha y hora" },
  { id: 5, label: "Condiciones" },
  { id: 6, label: "Tus datos" },
] as const;

// Validation fields per step to enable partial validation
const STEP_FIELDS: Record<number, (keyof BookingFormValues)[]> = {
  1: ["branchId"],
  2: ["treatmentId"],
  3: ["therapistId"],
  4: ["date", "time"],
  5: [],
  6: ["patient"],
};

interface BookingWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: Service[];
  therapists: Therapist[];
  branches: Branch[];
  therapistServices: TherapistService[];
}

export function BookingWizardModal({
  open,
  onOpenChange,
  services,
  therapists,
  branches,
  therapistServices,
}: BookingWizardModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [conditionsAccepted, setConditionsAccepted] = useState(false);

  // Availability & slot state for step 4
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      branchId: "",
      treatmentId: "",
      therapistId: "",
      date: "",
      time: "",
      patient: {
        email: "",
        name: "",
        phone: "",
        birthdate: "",
        document: "",
      },
    },
    mode: "onChange",
  });

  const { watch, trigger, setValue, reset } = form;

  const branchId = watch("branchId");
  const treatmentId = watch("treatmentId");
  const therapistId = watch("therapistId");
  const selectedDate = watch("date");
  const selectedTime = watch("time");

  // Derived objects for display
  const selectedBranch = branches.find((b) => b.id === branchId) ?? null;
  const selectedTreatment = services.find((s) => s.id === treatmentId) ?? null;
  const selectedTherapist = therapists.find((t) => t.id === therapistId) ?? null;

  // ----- Filter therapists by modality & service -----
  const filteredTherapists = therapists.filter((therapist) => {
    // Filter by modality (branch type)
    if (selectedBranch) {
      const isOnline = selectedBranch.type === "online";
      const hasModalityConfig = therapist.offers_online || therapist.offers_in_person;
      if (hasModalityConfig) {
        if (isOnline && !therapist.offers_online) return false;
        if (!isOnline && !therapist.offers_in_person) return false;
      }
      // If neither is configured, treat as available for all modalities
    }

    // Filter by selected service
    if (treatmentId) {
      const therapistHasAnyService = therapistServices.some(
        (ts) => ts.therapist_id === therapist.id
      );
      if (therapistHasAnyService) {
        const offersService = therapistServices.some(
          (ts) => ts.therapist_id === therapist.id && ts.service_id === treatmentId
        );
        if (!offersService) return false;
      }
      // If therapist has no services configured, show them (not configured yet)
    }

    return true;
  });

  // ----- Reset dependent fields when parent selection changes -----
  useEffect(() => {
    setValue("therapistId", "");
    setValue("date", "");
    setValue("time", "");
    setAvailableSlots([]);
  }, [branchId, treatmentId, setValue]);

  useEffect(() => {
    setValue("date", "");
    setValue("time", "");
    setAvailableSlots([]);
  }, [therapistId, setValue]);

  // Reset wizard when dialog closes
  useEffect(() => {
    if (!open) {
      const timeout = setTimeout(() => {
        reset();
        setStep(1);
        setIsComplete(false);
        setBookingError(null);
        setConditionsAccepted(false);
        setAvailableSlots([]);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [open, reset]);

  // ----- Fetch time slots from the API -----
  const fetchSlots = useCallback(async () => {
    if (!selectedDate || !therapistId || !treatmentId) return;

    setLoadingSlots(true);
    try {
      const params = new URLSearchParams({
        therapist_id: therapistId,
        service_id: treatmentId,
        date: selectedDate,
      });
      const res = await fetch(`/api/available-slots?${params}`);
      if (res.ok) {
        const slots: string[] = await res.json();
        setAvailableSlots(slots);
      } else {
        setAvailableSlots([]);
      }
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, therapistId, treatmentId]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Clear time when date changes
  useEffect(() => {
    setValue("time", "");
  }, [selectedDate, setValue]);

  // ----- Navigation -----
  const handleNext = async () => {
    const fieldsToValidate = STEP_FIELDS[step];
    const valid = await trigger(fieldsToValidate);
    if (!valid) return;

    if (step === 5 && !conditionsAccepted) return;

    if (step < 6) {
      setStep(step + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // ----- Submit appointment -----
  const handleSubmit = async () => {
    const valid = await trigger();
    if (!valid) return;
    setIsSubmitting(true);
    setBookingError(null);

    const values = form.getValues();

    try {
      const res = await fetch("/api/book-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: values.patient,
          therapistId: values.therapistId,
          branchId: values.branchId,
          serviceId: values.treatmentId,
          date: values.date,
          time: values.time,
        }),
      });

      if (res.ok) {
        setIsComplete(true);
      } else {
        const data = await res.json();
        setBookingError(data.error || "No se pudo completar la reserva.");
      }
    } catch {
      setBookingError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----- Quick check if step can advance (for button disabled state) -----
  const canProceed = () => {
    switch (step) {
      case 1:
        return !!branchId;
      case 2:
        return !!treatmentId;
      case 3:
        return !!therapistId;
      case 4:
        return !!selectedDate && !!selectedTime;
      case 5:
        return conditionsAccepted;
      case 6:
        return true; // RHF + Zod handles step-6 validation on submit
      default:
        return false;
    }
  };

  // ----- Render -----
  if (isComplete) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg sm:max-w-xl bg-[#EDE6CA] border-neutral-300/40">
          <WizardConfirmation
            branch={selectedBranch}
            treatment={selectedTreatment}
            therapist={selectedTherapist}
            date={selectedDate}
            time={selectedTime}
            patientName={form.getValues("patient.name")}
            onClose={() => onOpenChange(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[#EDE6CA] border-neutral-300/40">
        <DialogHeader className="pb-2">
          <DialogTitle className="font-playfair text-2xl font-normal text-brand">Reservar una cita</DialogTitle>
          <DialogDescription className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
            Paso {step} de 6 — {STEPS[step - 1].label}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-between px-2 py-1">
          {STEPS.map((s, index) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center text-xs font-medium transition-all duration-200 ${
                    step > s.id
                      ? "bg-brand text-white"
                      : step === s.id
                        ? "border border-brand text-brand"
                        : "border border-neutral-300 text-neutral-400"
                  }`}
                >
                  {step > s.id ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    s.id
                  )}
                </div>
                <span className={`mt-1.5 hidden text-[9px] uppercase tracking-[0.15em] sm:block ${step === s.id ? "text-brand" : "text-neutral-400"}`}>
                  {s.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-px w-6 sm:w-12 transition-colors ${
                    step > s.id ? "bg-brand" : "bg-neutral-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Booking error */}
        {bookingError && (
          <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {bookingError}
          </div>
        )}

        {/* Step content */}
        <FormProvider {...form}>
          <div className="min-h-[280px] py-2">
            {step === 1 && (
              <WizardStepBranch branches={branches} />
            )}
            {step === 2 && (
              <WizardStepTreatment treatments={services} />
            )}
            {step === 3 && (
              <WizardStepTherapist therapists={filteredTherapists} />
            )}
            {step === 4 && (
              <WizardStepDateTime
                availableSlots={availableSlots}
                loadingSlots={loadingSlots}
              />
            )}
            {step === 5 && (
              <WizardStepConditions
                accepted={conditionsAccepted}
                onAcceptChange={setConditionsAccepted}
              />
            )}
            {step === 6 && <WizardStepPatient />}
          </div>
        </FormProvider>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t border-neutral-300/60">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-neutral-500 transition-colors hover:text-brand disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          {step < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="btn-fill btn-fill-tan flex items-center gap-2 border-y border-[#5b2525] px-8 py-3 text-[11px] uppercase tracking-[0.2em] text-[#5b2525] transition-all duration-300 disabled:opacity-30"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="btn-fill btn-fill-tan flex items-center gap-2 border-y border-[#5b2525] px-8 py-3 text-[11px] uppercase tracking-[0.2em] text-[#5b2525] transition-all duration-300 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  Confirmar reserva
                  <Check className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
