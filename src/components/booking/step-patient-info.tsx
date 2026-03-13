"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PatientData {
  name: string;
  email: string;
  phone: string;
  birthdate: string;
  document: string;
}

interface StepPatientInfoProps {
  patient: PatientData;
  onChange: (patient: PatientData) => void;
}

export function StepPatientInfo({ patient, onChange }: StepPatientInfoProps) {
  const update = (field: keyof PatientData, value: string) => {
    onChange({ ...patient, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Tus datos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Necesitamos tu información para confirmar la reserva.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre completo *</Label>
          <Input
            id="name"
            placeholder="Ej: María García López"
            value={patient.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico *</Label>
          <Input
            id="email"
            type="email"
            placeholder="Ej: maria@ejemplo.com"
            value={patient.email}
            onChange={(e) => update("email", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Ej: +56 9 1234 5678"
            value={patient.phone}
            onChange={(e) => update("phone", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthdate">
            Fecha de nacimiento{" "}
            <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="birthdate"
            type="date"
            value={patient.birthdate}
            onChange={(e) => update("birthdate", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="document">
            RUT / Documento{" "}
            <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="document"
            placeholder="Ej: 12.345.678-9"
            value={patient.document}
            onChange={(e) => update("document", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
