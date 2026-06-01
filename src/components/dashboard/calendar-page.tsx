"use client";

import { useState, useEffect, useCallback } from "react";
import { Therapist, AppointmentWithRelations, Patient, Branch, Service } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import type { DatesSetArg, EventContentArg, EventInput } from "@fullcalendar/core";
import { Calendar, Plus } from "lucide-react";
import { AppointmentDetailModal } from "./appointment-detail-modal";

interface CalendarPageProps {
  therapist: Therapist;
}

type CalendarEvent = EventInput & {
  extendedProps: {
    appointment: AppointmentWithRelations;
  };
};

export function CalendarPage({ therapist }: CalendarPageProps) {
  const supabase = createClient();
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [createError, setCreateError] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    patient_id: "",
    date: "",
    time: "",
    branch_id: "",
    service_id: "",
  });
  const [visibleStart, setVisibleStart] = useState<string>(new Date().toISOString().split("T")[0]);
  const [visibleEnd, setVisibleEnd] = useState<string>(new Date().toISOString().split("T")[0]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    async function fetchFormCatalogs() {
      try {
        const [patientsRes, branchRes, serviceRes] = await Promise.all([
          fetch("/api/patients?limit=200"),
          supabase.from("branches").select("*").order("name"),
          supabase.from("services").select("*").order("name"),
        ]);

        const patientsPayload = await patientsRes.json().catch(() => ({ patients: [] }));
        setPatients((patientsPayload.patients as Patient[]) ?? []);
        setBranches((branchRes.data as Branch[]) ?? []);
        setServices((serviceRes.data as Service[]) ?? []);
      } catch (error) {
        console.error("Error loading calendar form catalogs:", error);
      }
    }

    fetchFormCatalogs();
  }, [supabase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return { bg: "#DBEAFE", border: "#60A5FA", text: "#1D4ED8" }; // blue
      case "completed":
        return { bg: "#DCFCE7", border: "#4ADE80", text: "#166534" }; // green
      case "cancelled":
        return { bg: "#FEE2E2", border: "#F87171", text: "#B91C1C" }; // red
      default:
        return { bg: "#F3F4F6", border: "#D1D5DB", text: "#374151" };
    }
  };

  const mapAppointmentsToEvents = useCallback((list: AppointmentWithRelations[]) => {
    const mapped: CalendarEvent[] = list.map((appointment) => {
      const start = new Date(`${appointment.date}T${appointment.time}`);
      const durationMinutes = appointment.treatment?.duration_minutes ?? 60;
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
      const colors = getStatusColor(appointment.status);

      return {
        id: appointment.id,
        title: appointment.patient?.name ?? "Paciente",
        start,
        end,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        extendedProps: {
          appointment,
        },
      };
    });

    setEvents(mapped);
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: visibleStart,
        end_date: visibleEnd,
        limit: "500",
        therapist_id: therapist.id,
      });

      const response = await fetch(`/api/appointments?${params}`);
      const data = await response.json();

      if (data.appointments) {
        const list = data.appointments as AppointmentWithRelations[];
        setAppointments(list);
        mapAppointmentsToEvents(list);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [visibleStart, visibleEnd, mapAppointmentsToEvents, therapist.id]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleDatesSet = (arg: DatesSetArg) => {
    setVisibleStart(arg.startStr.split("T")[0]);
    setVisibleEnd(arg.endStr.split("T")[0]);
  };

  const handleEventClick = (eventId: string) => {
    const appointment = appointments.find((a) => a.id === eventId);
    if (appointment) {
      setSelectedAppointment(appointment);
    }
  };

  const renderEventContent = (content: EventContentArg) => {
    const appointment = content.event.extendedProps.appointment as AppointmentWithRelations;
    const service = appointment.treatment?.name ?? "Servicio";
    const modality = appointment.branch?.type === "online" ? "Online" : "Presencial";
    const isTimeGridView = content.view.type === "timeGridWeek" || content.view.type === "timeGridDay";

    if (isTimeGridView) {
      return (
        <div className="px-1 py-0.5 text-[11px] leading-tight">
          <div className="font-semibold truncate">{appointment.patient?.name ?? "Paciente"}</div>
          <div className="truncate opacity-90">{service} · {modality}</div>
        </div>
      );
    }

    return (
      <div className="px-1 py-0.5 text-[11px] leading-tight">
        <div className="font-semibold truncate">{appointment.patient?.name ?? "Paciente"}</div>
        <div className="truncate">{content.timeText}</div>
        <div className="truncate">{service}</div>
        <div className="truncate opacity-90">{modality}</div>
      </div>
    );
  };

  const handleCreateAppointment = async () => {
    if (!formData.patient_id || !formData.date || !formData.time) {
      setCreateError("Debes seleccionar paciente, fecha y hora.");
      return;
    }

    setCreateError("");
    setCreatingAppointment(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: formData.patient_id,
          date: formData.date,
          time: formData.time,
          branch_id: formData.branch_id || null,
          service_id: formData.service_id || null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setCreateError(payload.error || "No se pudo crear la cita.");
        return;
      }

      setShowCreateModal(false);
      setFormData({
        patient_id: "",
        date: "",
        time: "",
        branch_id: "",
        service_id: "",
      });
      await fetchAppointments();
    } catch (error) {
      console.error("Error creating appointment from calendar:", error);
      setCreateError("No se pudo crear la cita.");
    } finally {
      setCreatingAppointment(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">
            Calendario
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Visualiza y gestiona las citas de {therapist.name} en vista mensual, semanal y diaria
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Agenda de citas
          </CardTitle>
        </CardHeader>

        <CardContent>
          {!hasLoaded && loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-neutral-500">Cargando citas...</div>
            </div>
          ) : (
            <div className="dashboard-calendar relative rounded-2xl border border-[#d9ceb2] bg-[#fffdf7] p-3 shadow-sm overflow-hidden">
              {loading && (
                <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1 text-xs text-neutral-500 shadow">
                  Actualizando...
                </div>
              )}
              <FullCalendar
                key={isMobile ? "mobile" : "desktop"}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={isMobile ? "timeGridDay" : "dayGridMonth"}
                headerToolbar={
                  isMobile
                    ? { left: "prev,next", center: "title", right: "today dayGridMonth,timeGridWeek,timeGridDay" }
                    : { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }
                }
                buttonText={{
                  today: "Hoy",
                  dayGridMonth: "Mes",
                  timeGridWeek: "Semana",
                  timeGridDay: "Día",
                  month: "Mes",
                  week: "Semana",
                  day: "Día",
                }}
                locale={esLocale}
                firstDay={1}
                height="auto"
                events={events}
                eventClick={(info) => handleEventClick(info.event.id)}
                eventContent={renderEventContent}
                datesSet={handleDatesSet}
                eventDisplay="block"
                dayMaxEventRows={3}
                eventMinHeight={26}
                eventShortHeight={22}
                slotMinTime="08:00:00"
                slotMaxTime="21:00:00"
                allDaySlot={false}
                nowIndicator={true}
              />

              <button
                type="button"
                onClick={() => {
                  setCreateError("");
                  setShowCreateModal(true);
                }}
                className="absolute bottom-4 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-[#5b2525] text-white shadow-lg transition hover:bg-[#4a1f1f] focus:outline-none focus:ring-2 focus:ring-[#5b2525]/40"
                aria-label="Agregar cita"
                title="Agregar cita"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Nueva cita</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calendar-patient">Paciente</Label>
              <select
                id="calendar-patient"
                value={formData.patient_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, patient_id: e.target.value }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Selecciona un paciente</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} {patient.email ? `(${patient.email})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="calendar-date">Fecha</Label>
                <Input
                  id="calendar-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calendar-time">Hora</Label>
                <Input
                  id="calendar-time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="calendar-branch">Sucursal / modalidad</Label>
              <select
                id="calendar-branch"
                value={formData.branch_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, branch_id: e.target.value }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Sin sucursal (opcional)</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.type === "online" ? "Online" : "Presencial"})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="calendar-service">Servicio</Label>
              <select
                id="calendar-service"
                value={formData.service_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, service_id: e.target.value }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Sin servicio (opcional)</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            {createError && (
              <p className="text-sm text-red-600">{createError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={creatingAppointment}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateAppointment}
                disabled={creatingAppointment}
              >
                {creatingAppointment ? "Guardando..." : "Crear cita"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          therapist={therapist}
          onClose={() => setSelectedAppointment(null)}
          onUpdate={(updated) => {
            setAppointments(prev =>
              prev.map(a => a.id === updated.id ? updated : a)
            );
            setSelectedAppointment(null);
          }}
        />
      )}
    </div>
  );
}
