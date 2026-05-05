"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Therapist, Patient, ClinicalRecordWithRelations } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Plus, 
  FileText, 
  User, 
  Calendar,
  ChevronRight,
  Filter 
} from "lucide-react";
import { PatientDetailModal } from "./patient-detail-modal";
import { ClinicalRecordModal } from "./clinical-record-modal";
import { cn } from "@/lib/utils";

interface ClinicalRecordsPageProps {
  therapist: Therapist;
}

export function ClinicalRecordsPage({ therapist }: ClinicalRecordsPageProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<ClinicalRecordWithRelations[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ClinicalRecordWithRelations | null>(null);

  const supabase = createClient();

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/patients?search=${encodeURIComponent(search)}`);
      const data = await response.json();
      if (data.patients) {
        setPatients(data.patients);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchRecords = useCallback(async (patientId: string) => {
    try {
      const response = await fetch(`/api/clinical-records?patient_id=${patientId}`);
      const data = await response.json();
      if (data.records) {
        setRecords(data.records);
      }
    } catch (error) {
      console.error("Error fetching records:", error);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchPatients();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchPatients]);

  useEffect(() => {
    if (selectedPatient) {
      fetchRecords(selectedPatient.id);
    }
  }, [selectedPatient, fetchRecords]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setRecords([]);
  };

  const handleNewRecord = () => {
    if (selectedPatient) {
      setSelectedRecord(null);
      setShowRecordModal(true);
    }
  };

  const handleEditRecord = (record: ClinicalRecordWithRelations) => {
    setSelectedRecord(record);
    setShowRecordModal(true);
  };

  const handleRecordSaved = () => {
    setShowRecordModal(false);
    setSelectedRecord(null);
    if (selectedPatient) {
      fetchRecords(selectedPatient.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">
            Fichas Clínicas
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Gestiona las fichas clínicas de tus pacientes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Pacientes
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Buscar paciente..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-neutral-500">
                Cargando pacientes...
              </div>
            ) : patients.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                {search
                  ? "No se encontraron pacientes"
                  : "No tienes pacientes registrados"}
              </div>
            ) : (
              <div className="space-y-2">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-colors",
                      selectedPatient?.id === patient.id
                        ? "border-brand bg-brand/5"
                        : "border-transparent hover:bg-neutral-100"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-neutral-800">
                          {patient.name}
                        </p>
                        <p className="text-sm text-neutral-500">{patient.email}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-neutral-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Records Section */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedPatient
                  ? `Historial de ${selectedPatient.name}`
                  : "Selecciona un paciente"}
              </CardTitle>
              {selectedPatient && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPatientModal(true)}
                  >
                    Ver perfil
                  </Button>
                  <Button size="sm" onClick={handleNewRecord}>
                    <Plus className="h-4 w-4 mr-1" />
                    Nueva ficha
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            {!selectedPatient ? (
              <div className="text-center py-16 text-neutral-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecciona un paciente para ver su historial clínico</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-16 text-neutral-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Este paciente no tiene fichas clínicas</p>
                <Button className="mt-4" onClick={handleNewRecord}>
                  <Plus className="h-4 w-4 mr-1" />
                  Crear primera ficha
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Timeline */}
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-200" />
                  {records.map((record, index) => (
                    <div
                      key={record.id}
                      className="relative pl-10 pb-6 last:pb-0"
                    >
                      <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-brand border-2 border-white shadow" />
                      <button
                        onClick={() => handleEditRecord(record)}
                        className="w-full text-left p-4 rounded-lg border border-neutral-200 hover:border-brand hover:bg-brand/5 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium bg-brand/10 text-brand px-2 py-0.5 rounded">
                                Sesión #{record.session_number}
                              </span>
                              <span className="text-xs text-neutral-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(record.session_date)}
                              </span>
                            </div>
                            {record.chief_complaint && (
                              <p className="text-sm text-neutral-700 mb-1">
                                <span className="font-medium">Motivo:</span>{" "}
                                {record.chief_complaint.slice(0, 100)}
                                {record.chief_complaint.length > 100 && "..."}
                              </p>
                            )}
                            {record.diagnosis && (
                              <p className="text-sm text-neutral-600">
                                <span className="font-medium">Diagnóstico:</span>{" "}
                                {record.diagnosis.slice(0, 80)}
                                {record.diagnosis.length > 80 && "..."}
                              </p>
                            )}
                            {record.attachments && record.attachments.length > 0 && (
                              <p className="text-xs text-neutral-500 mt-2">
                                📎 {record.attachments.length} archivo(s) adjunto(s)
                              </p>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Patient Detail Modal */}
      {showPatientModal && selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={() => setShowPatientModal(false)}
          onUpdate={(updated) => {
            setSelectedPatient(updated);
            setPatients(prev =>
              prev.map(p => (p.id === updated.id ? updated : p))
            );
          }}
        />
      )}

      {/* Clinical Record Modal */}
      {showRecordModal && selectedPatient && (
        <ClinicalRecordModal
          patient={selectedPatient}
          record={selectedRecord}
          therapistId={therapist.id}
          onClose={() => {
            setShowRecordModal(false);
            setSelectedRecord(null);
          }}
          onSave={handleRecordSaved}
        />
      )}
    </div>
  );
}
