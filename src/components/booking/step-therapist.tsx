"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Therapist } from "@/lib/types";

interface StepTherapistProps {
  therapists: Therapist[];
  selected: Therapist | null;
  onSelect: (therapist: Therapist) => void;
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

export function StepTherapist({
  therapists,
  selected,
  onSelect,
}: StepTherapistProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Elige tu terapeuta</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecciona el profesional con quien quieres tener tu sesión.
        </p>
      </div>
      <div className="grid gap-3">
        {therapists.map((therapist) => (
          <button
            key={therapist.id}
            type="button"
            onClick={() => onSelect(therapist)}
            className={cn(
              "flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all hover:border-primary/50",
              selected?.id === therapist.id
                ? "border-primary bg-primary/5"
                : "border-border"
            )}
          >
            <Avatar className="h-14 w-14 shrink-0">
              {therapist.photo_url && (
                <AvatarImage src={therapist.photo_url} alt={therapist.name} />
              )}
              <AvatarFallback className="bg-secondary text-primary">
                {getInitials(therapist.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium">{therapist.name}</h3>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {therapist.specialties.slice(0, 3).map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
