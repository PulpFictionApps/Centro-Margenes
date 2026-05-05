"use client";

import { useState } from "react";
import { Patient } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Mail, Phone, Calendar, FileText, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const patientSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "Teléfono inválido"),
  birthdate: z.string().optional(),
  document: z.string().optional(),
  address: z.string().optional(),
  gender: z.enum(["M", "F", "O", "N"]).optional(),
  profession: z.string().optional(),
  marital_status: z.enum(["single", "married", "divorced", "widowed", "other"]).optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientDetailModalProps {
  patient: Patient;
  onClose: () => void;
  onUpdate: (patient: Patient) => void;
}

export function PatientDetailModal({
  patient,
  onClose,
  onUpdate,
}: PatientDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      birthdate: patient.birthdate || "",
      document: patient.document || "",
    },
  });

  const onSubmit = async (data: PatientFormData) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const { patient: updated } = await response.json();
        onUpdate(updated);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating patient:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No especificada";
    return new Date(dateString).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const calculateAge = (birthdate: string | null) => {
    if (!birthdate) return null;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil del Paciente
          </DialogTitle>
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                {...register("phone")}
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="birthdate">Fecha de nacimiento</Label>
              <Input
                id="birthdate"
                type="date"
                {...register("birthdate")}
              />
            </div>

            <div>
              <Label htmlFor="document">RUT / Documento</Label>
              <Input
                id="document"
                {...register("document")}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center">
                <span className="text-3xl font-semibold text-brand">
                  {patient.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-semibold text-neutral-800">
                {patient.name}
              </h3>
              {patient.birthdate && (
                <p className="text-neutral-500">
                  {calculateAge(patient.birthdate)} años
                </p>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <Mail className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500">Email</p>
                  <p className="text-sm font-medium">{patient.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <Phone className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500">Teléfono</p>
                  <p className="text-sm font-medium">{patient.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <Calendar className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500">Fecha de nacimiento</p>
                  <p className="text-sm font-medium">
                    {formatDate(patient.birthdate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <FileText className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500">RUT / Documento</p>
                  <p className="text-sm font-medium">
                    {patient.document || "No especificado"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setIsEditing(true)}>
                Editar información
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
