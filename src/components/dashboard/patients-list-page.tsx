"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Therapist, Patient } from "@/lib/types";
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
      </div>

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
