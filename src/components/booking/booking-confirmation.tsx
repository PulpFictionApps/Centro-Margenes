"use client";

import Link from "next/link";
import { CheckCircle2, Calendar, Clock, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { BookingFormData } from "@/lib/types";

interface BookingConfirmationProps {
  formData: BookingFormData;
}

export function BookingConfirmation({ formData }: BookingConfirmationProps) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-primary/10 p-8 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
        <h2 className="mt-4 text-2xl font-bold">¡Reserva confirmada!</h2>
        <p className="mt-2 text-muted-foreground">
          Tu cita ha sido registrada exitosamente. Te enviaremos un correo de
          confirmación.
        </p>
      </div>
      <CardContent className="p-6 sm:p-8">
        <h3 className="mb-4 font-semibold">Resumen de tu cita</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{formData.branch?.name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{formData.therapist?.name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {formData.date &&
                format(formData.date, "EEEE d 'de' MMMM, yyyy", {
                  locale: es,
                })}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {formData.time} ({formData.treatment?.duration_minutes} minutos –{" "}
              {formData.treatment?.name})
            </span>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Paciente:</span>{" "}
            {formData.patient.name}
          </p>
          <p>
            <span className="font-medium text-foreground">Email:</span>{" "}
            {formData.patient.email}
          </p>
          <p>
            <span className="font-medium text-foreground">Teléfono:</span>{" "}
            {formData.patient.phone}
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline">Volver al inicio</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
