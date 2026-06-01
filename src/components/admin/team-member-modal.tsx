"use client";

import { useState } from "react";
import { Therapist, UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const newMemberSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(["therapist", "admin", "super_admin"]),
  bio: z.string().optional(),
  specialties: z.string().optional(),
  salary: z.string().optional(),
  hire_date: z.string().optional(),
  offers_online: z.boolean().optional(),
  offers_in_person: z.boolean().optional(),
});

const editMemberSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Email inválido"),
  role: z.enum(["therapist", "admin", "super_admin"]),
  bio: z.string().optional(),
  specialties: z.string().optional(),
  salary: z.string().optional(),
  hire_date: z.string().optional(),
  offers_online: z.boolean().optional(),
  offers_in_person: z.boolean().optional(),
});

type NewMemberFormData = z.infer<typeof newMemberSchema>;
type EditMemberFormData = z.infer<typeof editMemberSchema>;

interface TeamMemberModalProps {
  member: Therapist | null;
  onClose: () => void;
  onSave: () => void;
}

export function TeamMemberModal({
  member,
  onClose,
  onSave,
}: TeamMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const isEditing = !!member;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewMemberFormData | EditMemberFormData>({
    resolver: zodResolver(isEditing ? editMemberSchema : newMemberSchema),
    defaultValues: isEditing
      ? {
          name: member.name,
          email: member.email,
          role: member.role as UserRole,
          bio: member.bio || "",
          specialties: member.specialties?.join(", ") || "",
          salary: member.salary?.toString() || "",
          hire_date: member.hire_date || "",
          offers_online: member.offers_online,
          offers_in_person: member.offers_in_person,
        }
      : {
          role: "therapist" as UserRole,
          offers_online: true,
          offers_in_person: true,
        },
  });

  const onSubmit = async (data: NewMemberFormData | EditMemberFormData) => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...data,
        specialties: data.specialties
          ? data.specialties.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        salary: data.salary ? parseFloat(data.salary) : null,
      };

      const url = isEditing ? `/api/admin/team/${member.id}` : "/api/admin/team";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar");
      }

      onSave();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEditing ? "Editar miembro" : "Agregar nuevo miembro"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre completo *</Label>
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
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
                disabled={isEditing}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          {!isEditing && (
            <div>
              <Label htmlFor="password">Contraseña *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password" as keyof NewMemberFormData)}
                  className={
                    'password' in errors && errors.password
                      ? "border-red-500 pr-10"
                      : "pr-10"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {'password' in errors && errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Rol *</Label>
              <select
                id="role"
                {...register("role")}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="therapist">Terapeuta</option>
                <option value="admin">Administrador</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            <div>
              <Label htmlFor="hire_date">Fecha de contratación</Label>
              <Input
                id="hire_date"
                type="date"
                {...register("hire_date")}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Biografía</Label>
            <Textarea
              id="bio"
              {...register("bio")}
              rows={3}
              placeholder="Breve descripción profesional..."
            />
          </div>

          <div>
            <Label htmlFor="specialties">Especialidades</Label>
            <Input
              id="specialties"
              {...register("specialties")}
              placeholder="Terapia cognitiva, Ansiedad, Depresión..."
            />
            <p className="text-xs text-neutral-500 mt-1">
              Separadas por comas
            </p>
          </div>

          <div>
            <Label htmlFor="salary">Salario (opcional)</Label>
            <Input
              id="salary"
              type="number"
              step="0.01"
              {...register("salary")}
              placeholder="0.00"
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("offers_online")}
                className="rounded"
              />
              <span className="text-sm">Ofrece atención online</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("offers_in_person")}
                className="rounded"
              />
              <span className="text-sm">Ofrece atención presencial</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Guardando..."
                : isEditing
                ? "Guardar cambios"
                : "Crear miembro"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
