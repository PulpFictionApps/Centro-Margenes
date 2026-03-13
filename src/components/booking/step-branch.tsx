"use client";

import { Monitor, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Branch } from "@/lib/types";

interface StepBranchProps {
  branches: Branch[];
  selected: Branch | null;
  onSelect: (branch: Branch) => void;
}

const branchIcons: Record<string, typeof Monitor> = {
  online: Monitor,
  in_person: Building2,
};

export function StepBranch({ branches, selected, onSelect }: StepBranchProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">¿Cómo prefieres tu sesión?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
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
              onClick={() => onSelect(branch)}
              className={cn(
                "flex flex-col items-center rounded-2xl border-2 p-6 text-center transition-all hover:border-primary/50 hover:shadow-sm",
                selected?.id === branch.id
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <div
                className={cn(
                  "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors",
                  selected?.id === branch.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-primary"
                )}
              >
                <Icon className="h-8 w-8" />
              </div>
              <h3 className="font-semibold">{branch.name}</h3>
              {branch.address && (
                <p className="mt-1 text-sm text-muted-foreground">
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
