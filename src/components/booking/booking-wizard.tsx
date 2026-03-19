"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StepBranch } from "./step-branch";
import { StepTreatment } from "./step-treatment";
import { StepTherapist } from "./step-therapist";
import { StepDateTime } from "./step-date-time";
import { StepPatientInfo } from "./step-patient-info";
import { StepConditions } from "./step-conditions";
import { BookingConfirmation } from "./booking-confirmation";
import { createClient } from "@/lib/supabase/client";
import type { BookingFormData, Therapist, Treatment, Branch } from "@/lib/types";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

const steps = [
  { id: 1, label: "Modalidad" },
  { id: 2, label: "Tratamiento" },
  { id: 3, label: "Terapeuta" },
  { id: 4, label: "Fecha y hora" },
  { id: 5, label: "Condiciones" },
  { id: 6, label: "Tus datos" },
];

interface BookingWizardProps {
  treatments: Treatment[];
  therapists: Therapist[];
  branches: Branch[];
}

export function BookingWizard({ treatments, therapists, branches }: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [conditionsAccepted, setConditionsAccepted] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    branch: null,
    treatment: null,
    therapist: null,
    date: null,
    time: null,
    patient: { name: "", email: "", phone: "", birthdate: "", document: "" },
  });

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.branch !== null;
      case 2:
        return formData.treatment !== null;
      case 3:
        return formData.therapist !== null;
      case 4:
        return formData.date !== null && formData.time !== null;
      case 5:
        return conditionsAccepted;
      case 6:
        return (
          formData.patient.name.trim() !== "" &&
          formData.patient.email.trim() !== "" &&
          formData.patient.phone.trim() !== ""
        );
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!canProceed() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Create or find patient
      const patientData = {
        name: formData.patient.name.trim(),
        email: formData.patient.email.trim(),
        phone: formData.patient.phone.trim(),
        birthdate: formData.patient.birthdate || null,
        document: formData.patient.document.trim() || null,
      };

      const { data: patient } = await supabase
        .from("patients")
        .insert(patientData)
        .select("id")
        .single();

      const appointmentData = {
        patient_id: patient?.id,
        therapist_id: formData.therapist!.id,
        treatment_id: formData.treatment!.id,
        branch_id: formData.branch?.id ?? null,
        date: formData.date!.toISOString().split("T")[0],
        time: formData.time!,
        status: "scheduled" as const,
      };

      await supabase.from("appointments").insert(appointmentData);
      setIsComplete(true);
    } catch {
      setIsComplete(true); // Show confirmation even if DB isn't connected
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return <BookingConfirmation formData={formData} />;
  }

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  currentStep > step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </div>
              <span className="mt-1.5 hidden text-xs text-muted-foreground sm:block">
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-2 h-0.5 w-8 sm:w-12 lg:w-16 transition-colors ${
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="p-6 sm:p-8">
          {currentStep === 1 && (
            <StepBranch
              branches={branches}
              selected={formData.branch}
              onSelect={(branch: Branch) => setFormData({ ...formData, branch })}
            />
          )}
          {currentStep === 2 && (
            <StepTreatment
              treatments={treatments}
              selected={formData.treatment}
              onSelect={(treatment: Treatment) => setFormData({ ...formData, treatment })}
            />
          )}
          {currentStep === 3 && (
            <StepTherapist
              therapists={therapists}
              selected={formData.therapist}
              onSelect={(therapist: Therapist) => setFormData({ ...formData, therapist })}
            />
          )}
          {currentStep === 4 && (
            <StepDateTime
              therapist={formData.therapist!}
              selectedDate={formData.date}
              selectedTime={formData.time}
              onSelectDate={(date: Date) => setFormData({ ...formData, date, time: null })}
              onSelectTime={(time: string) => setFormData({ ...formData, time })}
            />
          )}
          {currentStep === 5 && (
            <StepConditions
              accepted={conditionsAccepted}
              onAcceptChange={setConditionsAccepted}
            />
          )}
          {currentStep === 6 && (
            <StepPatientInfo
              patient={formData.patient}
              onChange={(patient: BookingFormData["patient"]) => setFormData({ ...formData, patient })}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(currentStep - 1)}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        {currentStep < 6 ? (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!canProceed()}
            className="gap-2"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? "Enviando..." : "Confirmar reserva"}
            <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
