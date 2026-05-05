"use client";

import { useState, useEffect, useCallback } from "react";
import { Therapist, AppointmentWithRelations } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import type { DatesSetArg, EventContentArg, EventInput } from "@fullcalendar/core";
import { Calendar } from "lucide-react";
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
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null);
  const [visibleStart, setVisibleStart] = useState<string>(new Date().toISOString().split("T")[0]);
  const [visibleEnd, setVisibleEnd] = useState<string>(new Date().toISOString().split("T")[0]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
    }
  }, [visibleStart, visibleEnd, mapAppointmentsToEvents]);

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

    return (
      <div className="px-1 py-0.5 text-[11px] leading-tight">
        <div className="font-semibold truncate">{appointment.patient?.name ?? "Paciente"}</div>
        <div className="truncate">{content.timeText}</div>
        <div className="truncate">{service}</div>
        <div className="truncate opacity-90">{modality}</div>
      </div>
    );
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
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-neutral-500">Cargando citas...</div>
            </div>
          ) : (
            <div className="rounded-lg border p-2 overflow-hidden">
              <FullCalendar
                key={isMobile ? "mobile" : "desktop"}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={isMobile ? "timeGridDay" : "dayGridMonth"}
                headerToolbar={
                  isMobile
                    ? { left: "prev,next", center: "title", right: "today" }
                    : { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }
                }
                buttonText={{
                  today: "Hoy",
                  month: "Mes",
                  week: "Semana",
                  day: "Día",
                }}
                locale={esLocale}
                height="auto"
                events={events}
                eventClick={(info) => handleEventClick(info.event.id)}
                eventContent={renderEventContent}
                datesSet={handleDatesSet}
                eventDisplay="block"
                dayMaxEventRows={3}
                slotMinTime="08:00:00"
                slotMaxTime="21:00:00"
                allDaySlot={false}
              />
            </div>
          )}
        </CardContent>
      </Card>

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
