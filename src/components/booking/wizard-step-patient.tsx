"use client";

import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import type { BookingFormValues } from "./booking-wizard-modal";

export function WizardStepPatient() {
  const { control } = useFormContext<BookingFormValues>();

  const inputClasses = "mt-1 block w-full border-b border-neutral-300 bg-transparent px-0 py-3 text-sm text-brand placeholder:text-neutral-400 focus:border-brand focus:outline-none";

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-playfair text-xl font-normal text-brand">Tus datos</h3>
        <p className="mt-2 text-sm text-neutral-500">
          Necesitamos tu información para confirmar la reserva.
        </p>
      </div>

      <div className="space-y-5">
        <FormField
          control={control}
          name="patient.email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Correo electrónico *</FormLabel>
              <FormControl>
                <input
                  type="email"
                  placeholder="Ej: maria@ejemplo.com"
                  className={inputClasses}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="patient.name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Nombre completo *</FormLabel>
              <FormControl>
                <input
                  placeholder="Ej: María García López"
                  className={inputClasses}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="patient.phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Teléfono *</FormLabel>
              <FormControl>
                <input
                  type="tel"
                  placeholder="Ej: +56 9 1234 5678"
                  className={inputClasses}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="patient.birthdate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                Fecha de nacimiento{" "}
                <span className="normal-case tracking-normal text-neutral-400">(opcional)</span>
              </FormLabel>
              <FormControl>
                <input type="date" className={inputClasses} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="patient.document"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                RUT / Documento{" "}
                <span className="normal-case tracking-normal text-neutral-400">(opcional)</span>
              </FormLabel>
              <FormControl>
                <input
                  placeholder="Ej: 12.345.678-9"
                  className={inputClasses}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
