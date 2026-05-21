"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Therapist, Patient, ClinicalRecordWithRelations, Appointment, Branch, Service } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  Edit,
  Copy,
  Plus,
  MessageCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ClinicalRecordModal } from "./clinical-record-modal";

interface PatientProfilePageProps {
  patient: Patient;
  therapist: Therapist;
}

interface EnrichedRecord extends ClinicalRecordWithRelations {
  next_appointment?: Appointment | null;
}

export function PatientProfilePage({
  patient,
  therapist,
}: PatientProfilePageProps) {
  const router = useRouter();
  const supabase = createClient();

  const [clinicalRecords, setClinicalRecords] = useState<EnrichedRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ClinicalRecordWithRelations | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [scheduleForm, setScheduleForm] = useState({
    date: "",
    time: "",
    branch_id: "",
    treatment_id: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch clinical records
      const { data: records } = await supabase
        .from("clinical_records")
        .select("*")
        .eq("patient_id", patient.id)
        .order("session_date", { ascending: false });

      // Fetch appointments
      const { data: appts } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patient.id)
        .eq("therapist_id", therapist.id)
        .order("date", { ascending: false });

      setClinicalRecords(records || []);
      setAppointments(appts || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, patient.id, therapist.id]);

  useEffect(() => {
    async function fetchCatalogs() {
      const [branchRes, serviceRes] = await Promise.all([
        supabase.from("branches").select("*").order("name"),
        supabase.from("services").select("*").order("name"),
      ]);

      setBranches((branchRes.data as Branch[]) ?? []);
      setServices((serviceRes.data as Service[]) ?? []);
    }

    fetchCatalogs();
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNewRecord = () => {
    setSelectedRecord(null);
    setShowRecordModal(true);
  };

  const handleEditRecord = (record: ClinicalRecordWithRelations) => {
    setSelectedRecord(record);
    setShowRecordModal(true);
  };

  const handleRecordSaved = () => {
    setShowRecordModal(false);
    fetchData();
  };

  const handleCopyRecord = async (record: ClinicalRecordWithRelations) => {
    const content = `
${record.notes}

${record.diagnosis ? `Diagnóstico: ${record.diagnosis}` : ""}
${record.observations ? `Observaciones: ${record.observations}` : ""}
    `.trim();

    try {
      await navigator.clipboard.writeText(content);
      alert("Contenido copiado al portapapeles");
    } catch (error) {
      console.error("Error copying:", error);
    }
  };

  const handleScheduleAppointment = async () => {
    if (!scheduleForm.date || !scheduleForm.time) {
      setScheduleMessage("Debes indicar fecha y hora.");
      return;
    }

    setScheduleLoading(true);
    setScheduleMessage("");

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patient.id,
          date: scheduleForm.date,
          time: scheduleForm.time,
          branch_id: scheduleForm.branch_id || null,
          treatment_id: scheduleForm.treatment_id || null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setScheduleMessage(payload.error || "No se pudo agendar la cita.");
        return;
      }

      setScheduleMessage("Cita agendada correctamente.");
      setShowScheduleForm(false);
      setScheduleForm({ date: "", time: "", branch_id: "", treatment_id: "" });
      fetchData();
    } catch {
      setScheduleMessage("Error al agendar la cita.");
    } finally {
      setScheduleLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "EEEE d 'de' MMMM yyyy, HH:mm", {
        locale: es,
      });
    } catch {
      return dateString;
    }
  };

  const formatDateShort = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd MMM yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  const totalSessions = clinicalRecords.length;
  const pendingAppointments = appointments.filter(
    (a) => a.status === "scheduled"
  ).length;
  const completedSessions = appointments.filter(
    (a) => a.status === "completed"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-playfair text-brand">{patient.name}</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Perfil de paciente
            </p>
          </div>
        </div>

        {patient.phone && (
          <Button
            variant="default"
            onClick={() => {
              window.open(
                `https://wa.me/${patient.phone}?text=Hola%20${encodeURIComponent(patient.name.split(" ")[0])}`,
                "_blank"
              );
            }}
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Patient Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-2xl font-semibold text-brand">
                  {patient.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              </div>

              {/* Data Fields */}
              {patient.email && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                  <p className="text-sm text-neutral-900 break-all">
                    {patient.email}
                  </p>
                </div>
              )}

              {patient.phone && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase">
                    <Phone className="h-4 w-4" />
                    Teléfono
                  </div>
                  <p className="text-sm text-neutral-900">{patient.phone}</p>
                </div>
              )}

              {patient.document && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-neutral-500 uppercase">
                    RUT/CI
                  </div>
                  <p className="text-sm text-neutral-900">{patient.document}</p>
                </div>
              )}

              {patient.birthdate && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-neutral-500 uppercase">
                    Fecha de Nacimiento
                  </div>
                  <p className="text-sm text-neutral-900">
                    {formatDateShort(patient.birthdate)}
                  </p>
                </div>
              )}

              {patient.gender && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-neutral-500 uppercase">
                    Género
                  </div>
                  <p className="text-sm text-neutral-900">
                    {patient.gender === "M"
                      ? "Masculino"
                      : patient.gender === "F"
                        ? "Femenino"
                        : patient.gender === "O"
                          ? "Otro"
                          : "No especificado"}
                  </p>
                </div>
              )}

              {patient.profession && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-neutral-500 uppercase">
                    Profesión
                  </div>
                  <p className="text-sm text-neutral-900">{patient.profession}</p>
                </div>
              )}

              {patient.marital_status && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-neutral-500 uppercase">
                    Estado Civil
                  </div>
                  <p className="text-sm text-neutral-900">
                    {patient.marital_status === "single"
                      ? "Soltero/a"
                      : patient.marital_status === "married"
                        ? "Casado/a"
                        : patient.marital_status === "divorced"
                          ? "Divorciado/a"
                          : patient.marital_status === "widowed"
                            ? "Viudo/a"
                            : "Otro"}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="border-t border-neutral-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Fichas clínicas</span>
                  <Badge variant="secondary">{totalSessions}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Citas completadas</span>
                  <Badge variant="secondary">{completedSessions}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Próximas citas</span>
                  <Badge variant="secondary">{pendingAppointments}</Badge>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowScheduleForm((prev) => !prev);
                    setScheduleMessage("");
                  }}
                >
                  {showScheduleForm ? "Cerrar agendamiento" : "Agendar cita"}
                </Button>

                {showScheduleForm && (
                  <div className="space-y-3 rounded-lg border border-neutral-200 p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={scheduleForm.date}
                        onChange={(e) => setScheduleForm((prev) => ({ ...prev, date: e.target.value }))}
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      />
                      <input
                        type="time"
                        value={scheduleForm.time}
                        onChange={(e) => setScheduleForm((prev) => ({ ...prev, time: e.target.value }))}
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      />
                    </div>

                    <select
                      value={scheduleForm.branch_id}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, branch_id: e.target.value }))}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Sucursal / modalidad (opcional)</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name} ({branch.type === "online" ? "Online" : "Presencial"})
                        </option>
                      ))}
                    </select>

                    <select
                      value={scheduleForm.treatment_id}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, treatment_id: e.target.value }))}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Servicio (opcional)</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={handleScheduleAppointment} disabled={scheduleLoading}>
                        {scheduleLoading ? "Agendando..." : "Agendar"}
                      </Button>
                      {scheduleMessage && (
                        <span className={`text-xs ${scheduleMessage.includes("Error") || scheduleMessage.includes("No se") ? "text-red-600" : "text-emerald-600"}`}>
                          {scheduleMessage}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Content - Tabs */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="history" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="history">
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Historial</span>
              </TabsTrigger>
              <TabsTrigger value="form">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Formulario</span>
              </TabsTrigger>
              <TabsTrigger value="payments">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Pagos</span>
              </TabsTrigger>
              <TabsTrigger value="files">
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Archivos</span>
              </TabsTrigger>
            </TabsList>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg">Historial de Sesiones</CardTitle>
                  <Button
                    onClick={handleNewRecord}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Escribir evolución
                  </Button>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-neutral-500">
                      Cargando historial...
                    </div>
                  ) : clinicalRecords.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No hay fichas clínicas registradas</p>
                      <p className="text-xs mt-2">
                        Comienza creando la primera ficha después de una cita
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {clinicalRecords.map((record) => (
                        <div
                          key={record.id}
                          className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-neutral-900">
                                {record.notes?.substring(0, 50) || "Sesión"}
                              </h3>
                              <p className="text-xs text-neutral-500 mt-1">
                                {formatDate(record.session_date)}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Sesión #{record.session_number}
                            </Badge>
                          </div>

                          {record.chief_complaint && (
                            <div className="mb-2 text-sm text-neutral-600">
                              <strong className="text-neutral-700">Motivo:</strong>{" "}
                              {record.chief_complaint}
                            </div>
                          )}

                          {record.diagnosis && (
                            <div className="mb-2 text-sm text-neutral-600">
                              <strong className="text-neutral-700">Diagnóstico:</strong>{" "}
                              {record.diagnosis}
                            </div>
                          )}

                          <div className="flex gap-2 mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditRecord(record)}
                              className="gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyRecord(record)}
                              className="gap-2"
                            >
                              <Copy className="h-4 w-4" />
                              Copiar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Form Tab */}
            <TabsContent value="form">
              <Card>
                <CardHeader>
                  <CardTitle>Información del Paciente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-neutral-500 uppercase">
                        Nombre
                      </label>
                      <p className="text-sm mt-1 text-neutral-900">
                        {patient.name}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-500 uppercase">
                        Email
                      </label>
                      <p className="text-sm mt-1 text-neutral-900">
                        {patient.email || "—"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-500 uppercase">
                        Teléfono
                      </label>
                      <p className="text-sm mt-1 text-neutral-900">
                        {patient.phone || "—"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-500 uppercase">
                        RUT/CI
                      </label>
                      <p className="text-sm mt-1 text-neutral-900">
                        {patient.document || "—"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-500 uppercase">
                        Fecha de Nacimiento
                      </label>
                      <p className="text-sm mt-1 text-neutral-900">
                        {patient.birthdate
                          ? formatDateShort(patient.birthdate)
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-500 uppercase">
                        Género
                      </label>
                      <p className="text-sm mt-1 text-neutral-900">
                        {patient.gender
                          ? patient.gender === "M"
                            ? "Masculino"
                            : patient.gender === "F"
                              ? "Femenino"
                              : patient.gender === "O"
                                ? "Otro"
                                : "No especificado"
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-500 uppercase">
                        Profesión
                      </label>
                      <p className="text-sm mt-1 text-neutral-900">
                        {patient.profession || "—"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-500 uppercase">
                        Estado Civil
                      </label>
                      <p className="text-sm mt-1 text-neutral-900">
                        {patient.marital_status
                          ? patient.marital_status === "single"
                            ? "Soltero/a"
                            : patient.marital_status === "married"
                              ? "Casado/a"
                              : patient.marital_status === "divorced"
                                ? "Divorciado/a"
                                : patient.marital_status === "widowed"
                                  ? "Viudo/a"
                                  : "Otro"
                          : "—"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-neutral-500 uppercase">
                        Dirección
                      </label>
                      <p className="text-sm mt-1 text-neutral-900">
                        {patient.address || "—"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-500 uppercase">
                        Registrado
                      </label>
                      <p className="text-sm mt-1 text-neutral-900">
                        {formatDateShort(patient.created_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Pagos</CardTitle>
                </CardHeader>
                <CardContent>
                  {appointments.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Sin registros de citas</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {appointments.map((appt) => (
                        <div
                          key={appt.id}
                          className="flex items-center justify-between border border-neutral-200 rounded-lg p-3"
                        >
                          <div>
                            <p className="font-medium text-neutral-900">
                              {formatDateShort(appt.date)}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {appt.time}
                            </p>
                          </div>
                          <Badge
                            variant={
                              appt.payment_status === "paid"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {appt.payment_status === "paid"
                              ? "Pagado"
                              : "Pendiente"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files">
              <Card>
                <CardHeader>
                  <CardTitle>Archivos Adjuntos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-neutral-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Los archivos se mostrarán aquí cuando se agreguen a las fichas</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Clinical Record Modal */}
      {showRecordModal && (
        <ClinicalRecordModal
          patient={patient}
          record={selectedRecord}
          therapistId={therapist.id}
          onClose={() => setShowRecordModal(false)}
          onSave={handleRecordSaved}
        />
      )}
    </div>
  );
}
