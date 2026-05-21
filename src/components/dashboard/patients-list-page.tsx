"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Therapist, Patient, Branch, Service } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  Phone,
  Mail,
  MessageCircle,
  Plus,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface PatientsListPageProps {
  therapist: Therapist;
}

interface PatientWithStats extends Patient {
  last_appointment?: string;
  next_appointment?: string;
  total_sessions?: number;
  pending_amount?: number;
  active?: boolean;
}

export function PatientsListPage({ therapist }: PatientsListPageProps) {
  const [patients, setPatients] = useState<PatientWithStats[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientWithStats[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [newPatient, setNewPatient] = useState({
    name: "",
    email: "",
    phone: "",
    birthdate: "",
    document: "",
  });
  const [scheduleOnCreate, setScheduleOnCreate] = useState(false);
  const [initialAppointment, setInitialAppointment] = useState({
    date: "",
    time: "",
    branch_id: "",
    treatment_id: "",
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"count" | "until" | "forever">("count");
  const [repeatWeeks, setRepeatWeeks] = useState(12);
  const [repeatUntil, setRepeatUntil] = useState("");

  const supabase = createClient();

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/patients?limit=100`);
      const { patients: data } = await response.json();

      if (data) {
        // Transform and enrich patient data with appointment data
        const enrichedPatients = await Promise.all(
          data.map(async (patient: Patient) => {
            const { data: appointments } = await supabase
              .from("appointments")
              .select("date, status")
              .eq("patient_id", patient.id)
              .eq("therapist_id", therapist.id)
              .order("date", { ascending: false });

            const lastAppt = appointments?.[0];
            const nextAppt = appointments?.find(
              (a) => new Date(a.date) > new Date() && a.status === "scheduled"
            );

            const completedCount = appointments?.filter(
              (a) => a.status === "completed"
            ).length || 0;

            return {
              ...patient,
              last_appointment: lastAppt?.date,
              next_appointment: nextAppt?.date,
              total_sessions: completedCount,
              active: true, // Can be extended with actual active status
            };
          })
        );

        setPatients(enrichedPatients);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, therapist.id]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    async function fetchSchedulingCatalog() {
      const [branchRes, serviceRes] = await Promise.all([
        supabase.from("branches").select("*").order("name"),
        supabase.from("services").select("*").order("name"),
      ]);

      setBranches((branchRes.data as Branch[]) ?? []);
      setServices((serviceRes.data as Service[]) ?? []);
    }

    fetchSchedulingCatalog();
  }, [supabase]);

  // Filter patients by search and active status
  useEffect(() => {
    const filtered = patients.filter((patient) => {
      const matchesSearch =
        !search ||
        patient.name.toLowerCase().includes(search.toLowerCase()) ||
        patient.email.toLowerCase().includes(search.toLowerCase()) ||
        patient.phone.includes(search) ||
        patient.document?.includes(search);

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "active" && patient.active) ||
        (activeFilter === "inactive" && !patient.active);

      return matchesSearch && matchesFilter;
    });

    setFilteredPatients(filtered);
  }, [search, activeFilter, patients]);

  const formatDateShort = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return format(parseISO(dateString), "dd MMM yyyy", { locale: es });
    } catch {
      return "—";
    }
  };

  const handleCreatePatient = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateMessage("");
    let successMessage = "";

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPatient),
      });

      const result = await response.json();
      if (!response.ok) {
        setCreateMessage(result.error || "No se pudo crear el paciente");
        return;
      }

      if (scheduleOnCreate) {
        if (!initialAppointment.date || !initialAppointment.time) {
          setCreateMessage("Paciente guardado, pero falta fecha/hora para agendar la cita.");
          await fetchPatients();
          return;
        }

        if (repeatWeekly && repeatMode === "until" && !repeatUntil) {
          setCreateMessage("Paciente guardado, pero debes indicar la fecha límite de repetición.");
          await fetchPatients();
          return;
        }

        const patientId = result.patient?.id;
        if (!patientId) {
          setCreateMessage("Paciente guardado, pero no se pudo obtener el ID para agendar cita.");
          await fetchPatients();
          return;
        }

        const apptResponse = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_id: patientId,
            date: initialAppointment.date,
            time: initialAppointment.time,
            branch_id: initialAppointment.branch_id || null,
            service_id: initialAppointment.treatment_id || null,
            repeat_weekly: repeatWeekly,
            repeat_weeks: repeatWeekly
              ? repeatMode === "forever"
                ? 52
                : repeatMode === "count"
                  ? repeatWeeks
                  : 0
              : 0,
            repeat_until: repeatWeekly && repeatMode === "until" ? repeatUntil : null,
          }),
        });

        const apptResult = await apptResponse.json();
        if (!apptResponse.ok) {
          setCreateMessage(
            `Paciente guardado, pero no se pudo agendar la cita: ${apptResult.error || "Error desconocido"}`
          );
          await fetchPatients();
          return;
        }

        if (apptResult.created_count > 1 || (apptResult.skipped_conflicts?.length ?? 0) > 0) {
          const created = apptResult.created_count ?? 0;
          const skipped = apptResult.skipped_conflicts?.length ?? 0;
          successMessage = `Paciente guardado. Citas creadas: ${created}. ${skipped > 0 ? `Conflictos omitidos: ${skipped}.` : ""}`;
        }
      }

      setCreateMessage(successMessage || result.message || "Paciente agregado correctamente.");
      setNewPatient({
        name: "",
        email: "",
        phone: "",
        birthdate: "",
        document: "",
      });
      setInitialAppointment({ date: "", time: "", branch_id: "", treatment_id: "" });
      setScheduleOnCreate(false);
      setRepeatWeekly(false);
      setRepeatMode("count");
      setRepeatWeeks(12);
      setRepeatUntil("");
      await fetchPatients();
    } catch {
      setCreateMessage("Error al guardar el paciente.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-playfair text-brand">Pacientes</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Base de datos centralizada de tus pacientes
          </p>
        </div>
        <Button
          onClick={() => {
            setShowCreateForm((prev) => !prev);
            setCreateMessage("");
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Agregar paciente
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nuevo paciente propio</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreatePatient}>
              <Input
                required
                placeholder="Nombre completo"
                value={newPatient.name}
                onChange={(e) => setNewPatient((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Input
                required
                type="email"
                placeholder="Correo"
                value={newPatient.email}
                onChange={(e) => setNewPatient((prev) => ({ ...prev, email: e.target.value }))}
              />
              <Input
                required
                placeholder="Teléfono"
                value={newPatient.phone}
                onChange={(e) => setNewPatient((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <Input
                placeholder="Documento (opcional)"
                value={newPatient.document}
                onChange={(e) => setNewPatient((prev) => ({ ...prev, document: e.target.value }))}
              />
              <Input
                type="date"
                value={newPatient.birthdate}
                onChange={(e) => setNewPatient((prev) => ({ ...prev, birthdate: e.target.value }))}
              />

              <label className="md:col-span-2 flex items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={scheduleOnCreate}
                  onChange={(e) => setScheduleOnCreate(e.target.checked)}
                />
                Agendar primera cita al guardar paciente
              </label>

              {scheduleOnCreate && (
                <>
                  <Input
                    required
                    type="date"
                    value={initialAppointment.date}
                    onChange={(e) =>
                      setInitialAppointment((prev) => ({ ...prev, date: e.target.value }))
                    }
                  />
                  <Input
                    required
                    type="time"
                    value={initialAppointment.time}
                    onChange={(e) =>
                      setInitialAppointment((prev) => ({ ...prev, time: e.target.value }))
                    }
                  />

                  <select
                    value={initialAppointment.branch_id}
                    onChange={(e) =>
                      setInitialAppointment((prev) => ({ ...prev, branch_id: e.target.value }))
                    }
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Sucursal / modalidad (opcional)</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} ({branch.type === "online" ? "Online" : "Presencial"})
                      </option>
                    ))}
                  </select>

                  <select
                    value={initialAppointment.treatment_id}
                    onChange={(e) =>
                      setInitialAppointment((prev) => ({ ...prev, treatment_id: e.target.value }))
                    }
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Servicio (opcional)</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>

                  <label className="md:col-span-2 flex items-center gap-2 text-sm text-neutral-600">
                    <input
                      type="checkbox"
                      checked={repeatWeekly}
                      onChange={(e) => setRepeatWeekly(e.target.checked)}
                    />
                    Repetir semanalmente este horario
                  </label>

                  {repeatWeekly && (
                    <>
                      <select
                        value={repeatMode}
                        onChange={(e) => setRepeatMode(e.target.value as "count" | "until" | "forever")}
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="count">Repetir por cantidad de semanas</option>
                        <option value="until">Repetir hasta una fecha</option>
                        <option value="forever">Sin fin (crea 52 semanas)</option>
                      </select>

                      {repeatMode === "count" && (
                        <Input
                          type="number"
                          min={1}
                          max={52}
                          value={repeatWeeks}
                          onChange={(e) => setRepeatWeeks(Math.max(1, Number(e.target.value || 1)))}
                          placeholder="Cantidad de semanas"
                        />
                      )}

                      {repeatMode === "until" && (
                        <Input
                          type="date"
                          value={repeatUntil}
                          onChange={(e) => setRepeatUntil(e.target.value)}
                        />
                      )}
                    </>
                  )}
                </>
              )}

              <div className="md:col-span-2 flex items-center gap-3">
                <Button type="submit" disabled={creating}>
                  {creating ? "Guardando..." : "Guardar paciente"}
                </Button>
                {createMessage && (
                  <span
                    className={`text-sm ${
                      createMessage.toLowerCase().includes("error")
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {createMessage}
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Buscar por nombre, email, teléfono..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              {(["all", "active", "inactive"] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter)}
                  className="text-xs"
                >
                  {filter === "all"
                    ? `Todos (${patients.length})`
                    : filter === "active"
                      ? `Activos (${patients.filter((p) => p.active).length})`
                      : `Inactivos (${patients.filter((p) => !p.active).length})`}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {filteredPatients.length} Paciente{filteredPatients.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-neutral-500">
              Cargando pacientes...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              {search
                ? "No se encontraron pacientes con esos criterios"
                : "No tienes pacientes registrados"}
            </div>
          ) : (
            <>
              {/* Mobile cards — visible below md */}
              <div className="block md:hidden space-y-3">
                {filteredPatients.map((patient) => (
                  <div key={patient.id} className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
                    {/* Name */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                        {patient.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-neutral-900 truncate">{patient.name}</div>
                        {patient.document && <div className="text-xs text-neutral-500">{patient.document}</div>}
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0 text-xs">
                        {patient.total_sessions || 0} ses.
                      </Badge>
                    </div>
                    {/* Contact */}
                    <div className="space-y-1">
                      {patient.email && (
                        <div className="flex items-center gap-2 text-xs text-neutral-600">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                      )}
                      {patient.phone && (
                        <div className="flex items-center gap-2 text-xs text-neutral-600">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {patient.phone}
                        </div>
                      )}
                    </div>
                    {/* Dates */}
                    <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-neutral-400">Última cita</span>
                        {formatDateShort(patient.last_appointment)}
                      </div>
                      {patient.next_appointment && (
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-neutral-400">Próxima cita</span>
                          <Badge variant="outline" className="text-xs">
                            {formatDateShort(patient.next_appointment)}
                          </Badge>
                        </div>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-neutral-100">
                      <Link href={`/dashboard/patients/${patient.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <User className="h-4 w-4" />
                          Perfil
                        </Button>
                      </Link>
                      {patient.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={() =>
                            window.open(
                              `https://wa.me/${patient.phone}?text=Hola%20${encodeURIComponent(patient.name.split(" ")[0])},`,
                              "_blank"
                            )
                          }
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table — visible from md */}
              <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 font-semibold text-neutral-600">
                      Nombre
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-neutral-600">
                      Contacto
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-neutral-600">
                      Última cita
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-neutral-600">
                      Próxima cita
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-neutral-600">
                      Sesiones
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-neutral-600">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                    >
                      {/* Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                            {patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-neutral-900">
                              {patient.name}
                            </div>
                            {patient.document && (
                              <div className="text-xs text-neutral-500">
                                {patient.document}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {patient.email && (
                            <div className="flex items-center gap-2 text-xs text-neutral-600">
                              <Mail className="h-3 w-3" />
                              {patient.email}
                            </div>
                          )}
                          {patient.phone && (
                            <div className="flex items-center gap-2 text-xs text-neutral-600">
                              <Phone className="h-3 w-3" />
                              {patient.phone}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Last Appointment */}
                      <td className="py-4 px-4">
                        <div className="text-xs text-neutral-600">
                          {formatDateShort(patient.last_appointment)}
                        </div>
                      </td>

                      {/* Next Appointment */}
                      <td className="py-4 px-4">
                        {patient.next_appointment ? (
                          <Badge variant="outline" className="text-xs">
                            {formatDateShort(patient.next_appointment)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </td>

                      {/* Sessions Count */}
                      <td className="py-4 px-4 text-center">
                        <Badge variant="secondary" className="text-xs">
                          {patient.total_sessions || 0}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/patients/${patient.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              title="Ver perfil"
                            >
                              <User className="h-4 w-4" />
                              <span className="hidden sm:inline">Perfil</span>
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Contactar por WhatsApp"
                            onClick={() => {
                              if (patient.phone) {
                                window.open(
                                  `https://wa.me/${patient.phone}?text=Hola%20${encodeURIComponent(patient.name.split(" ")[0])},`,
                                  "_blank"
                                );
                              }
                            }}
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
