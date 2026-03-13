"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Treatment } from "@/lib/types";

interface StepTreatmentProps {
  treatments: Treatment[];
  selected: Treatment | null;
  onSelect: (treatment: Treatment) => void;
}

export function StepTreatment({
  treatments,
  selected,
  onSelect,
}: StepTreatmentProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">¿Qué tipo de sesión necesitas?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecciona el tratamiento que mejor se adapte a tu situación.
        </p>
      </div>
      <div className="grid gap-3">
        {treatments.map((treatment) => (
          <button
            key={treatment.id}
            type="button"
            onClick={() => onSelect(treatment)}
            className={cn(
              "flex items-start rounded-xl border-2 p-4 text-left transition-all hover:border-primary/50",
              selected?.id === treatment.id
                ? "border-primary bg-primary/5"
                : "border-border"
            )}
          >
            <div className="flex-1">
              <h3 className="font-medium">{treatment.name}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {treatment.description}
              </p>
            </div>
            <div className="ml-4 flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {treatment.duration_minutes} min
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
