"use client";

import { useFormContext } from "react-hook-form";
import { Monitor, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Branch } from "@/lib/types";
import type { BookingFormValues } from "./booking-wizard-modal";

interface WizardStepBranchProps {
  branches: Branch[];
}

const branchIcons: Record<string, typeof Monitor> = {
  online: Monitor,
  in_person: Building2,
};

export function WizardStepBranch({ branches }: WizardStepBranchProps) {
  const { setValue, watch, clearErrors } = useFormContext<BookingFormValues>();
  const selected = watch("branchId");

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-playfair text-xl font-normal text-brand">¿Cómo prefieres tu sesión?</h3>
        <p className="mt-2 text-sm text-neutral-500">
          Selecciona la modalidad que mejor se adapte a ti.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {branches.map((branch) => {
          const Icon = branchIcons[branch.type] ?? Building2;
          return (
            <button
              key={branch.id}
              type="button"
              onClick={() => {
                setValue("branchId", branch.id);
                clearErrors("branchId");
              }}
              className={cn(
                "flex flex-col items-center border p-8 text-center transition-all duration-200 hover:border-brand",
                selected === branch.id
                  ? "border-brand bg-brand/5"
                  : "border-neutral-300"
              )}
            >
              <div
                className={cn(
                  "mb-5 flex h-14 w-14 items-center justify-center transition-colors",
                  selected === branch.id
                    ? "bg-brand text-white"
                    : "bg-[#ddd6b3] text-neutral-600"
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h4 className="font-playfair text-base font-normal text-brand">{branch.name}</h4>
              {branch.address && (
                <p className="mt-1.5 text-xs text-neutral-500">
                  {branch.address}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
