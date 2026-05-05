"use client";

import { useState } from "react";
import { Therapist, AppointmentWithRelations, AppointmentStatus, PaymentStatus } from "@/lib/types";
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
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone,
  Mail,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppointmentDetailModalProps {
  appointment: AppointmentWithRelations;
  therapist: Therapist;
  onClose: () => void;
  onUpdate: (appointment: AppointmentWithRelations) => void;
}

export function AppointmentDetailModal({
  appointment,
  therapist,
  onClose,
  onUpdate,
}: AppointmentDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState(appointment.date);
  const [newTime, setNewTime] = useState(appointment.time);
  const [notes, setNotes] = useState(appointment.notes || "");

  const handleUpdateStatus = async (status: AppointmentStatus) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar");
      }

      const { appointment: updated } = await response.json();
      onUpdate(updated);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async (payment_status: PaymentStatus) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar");
      }

      const { appointment: updated } = await response.json();
      onUpdate(updated);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate, time: newTime }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al reagendar");
      }

      const { appointment: updated } = await response.json();
      onUpdate(updated);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Horario no disponible");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        const { appointment: updated } = await response.json();
        onUpdate(updated);
      }
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + "T00:00:00").toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "scheduled":
        return { label: "Programada", color: "bg-blue-100 text-blue-800", icon: Calendar };
      case "completed":
        return { label: "Completada", color: "bg-green-100 text-green-800", icon: CheckCircle };
      case "cancelled":
        return { label: "Cancelada", color: "bg-red-100 text-red-800", icon: XCircle };
      case "no_show":
        return { label: "No asistió", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle };
      default:
        return { label: status, color: "bg-gray-100 text-gray-800", icon: Calendar };
    }
  };

  const getPaymentInfo = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" };
      case "paid":
        return { label: "Pagada", color: "bg-green-100 text-green-800" };
      case "refunded":
        return { label: "Reembolsada", color: "bg-purple-100 text-purple-800" };
      default:
        return { label: status, color: "bg-gray-100 text-gray-800" };
    }
  };

  const statusInfo = getStatusInfo(appointment.status);
  const paymentInfo = getPaymentInfo(appointment.payment_status);
  const StatusIcon = statusInfo.icon;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Detalle de la Cita
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Status badges */}
          <div className="flex items-center gap-3">
            <span className={cn("px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1", statusInfo.color)}>
              <StatusIcon className="h-4 w-4" />
              {statusInfo.label}
            </span>
            <span className={cn("px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1", paymentInfo.color)}>
              <CreditCard className="h-4 w-4" />
              {paymentInfo.label}
            </span>
          </div>

          {/* Date and time */}
          <div className="p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-brand" />
                <span className="font-medium capitalize">{formatDate(appointment.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-brand" />
                <span className="font-medium">{appointment.time.slice(0, 5)}</span>
              </div>
            </div>
            {appointment.branch && (
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="h-5 w-5 text-neutral-400" />
                <span>{appointment.branch.name} ({appointment.branch.type === "online" ? "Online" : "Presencial"})</span>
              </div>
            )}
          </div>

          {/* Patient info */}
          {appointment.patient && (
            <div className="space-y-3">
              <h3 className="font-semibold text-neutral-800">Paciente</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg">
                  <User className="h-4 w-4 text-neutral-400" />
                  <span>{appointment.patient.name}</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg">
                  <Phone className="h-4 w-4 text-neutral-400" />
                  <span>{appointment.patient.phone}</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg col-span-2">
                  <Mail className="h-4 w-4 text-neutral-400" />
                  <span>{appointment.patient.email}</span>
                </div>
              </div>
            </div>
          )}

          {/* Reschedule section */}
          {showReschedule && appointment.status === "scheduled" && (
            <div className="p-4 border rounded-lg space-y-3">
              <h3 className="font-semibold">Reagendar cita</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nueva fecha</Label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <Label>Nueva hora</Label>
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleReschedule} disabled={loading}>
                  Confirmar cambio
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowReschedule(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas de la cita</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Agregar notas..."
            />
            {notes !== (appointment.notes || "") && (
              <Button size="sm" onClick={handleSaveNotes} disabled={loading}>
                Guardar notas
              </Button>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4 pt-4 border-t">
            {appointment.status === "scheduled" && (
              <>
                <h3 className="font-semibold text-sm text-neutral-600">Cambiar estado</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus("completed")}
                    disabled={loading}
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Marcar completada
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus("no_show")}
                    disabled={loading}
                    className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    No asistió
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowReschedule(true)}
                    disabled={loading}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Reagendar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus("cancelled")}
                    disabled={loading}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </>
            )}

            <h3 className="font-semibold text-sm text-neutral-600">Pago</h3>
            <div className="flex flex-wrap gap-2">
              {appointment.payment_status !== "paid" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdatePayment("paid")}
                  disabled={loading}
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Marcar como pagada
                </Button>
              )}
              {appointment.payment_status === "paid" && appointment.status === "cancelled" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdatePayment("refunded")}
                  disabled={loading}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  Marcar reembolso
                </Button>
              )}
            </div>

            {/* Create clinical record link */}
            {appointment.status === "completed" && (
              <div className="pt-2 space-y-2">
                <Button asChild variant="outline" className="w-full">
                  <a href={`/dashboard/clinical-records?patient_id=${appointment.patient_id}`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Crear ficha clínica
                  </a>
                </Button>

                {appointment.cancellation_token && (
                  <Button asChild variant="outline" className="w-full">
                    <a href={`/evaluar/${appointment.cancellation_token}`} target="_blank" rel="noreferrer">
                      Evaluar sesión
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
