"use client";

import { useState, useRef } from "react";
import { Patient, ClinicalRecordWithRelations, ClinicalAttachment } from "@/lib/types";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Paperclip,
  Save,
  AlertCircle 
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const recordSchema = z.object({
  session_date: z.string().min(1, "La fecha es obligatoria"),
  chief_complaint: z.string().optional(),
  notes: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment_plan: z.string().optional(),
  observations: z.string().optional(),
  mood_state: z.string().optional(),
  progress_notes: z.string().optional(),
  next_session_goals: z.string().optional(),
});

type RecordFormData = z.infer<typeof recordSchema>;

interface ClinicalRecordModalProps {
  patient: Patient;
  record: ClinicalRecordWithRelations | null;
  therapistId: string;
  onClose: () => void;
  onSave: () => void;
}

export function ClinicalRecordModal({
  patient,
  record,
  onClose,
  onSave,
}: ClinicalRecordModalProps) {
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<ClinicalAttachment[]>(
    record?.attachments || []
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecordFormData>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      session_date: record?.session_date || new Date().toISOString().split("T")[0],
      chief_complaint: record?.chief_complaint || "",
      notes: record?.notes || "",
      diagnosis: record?.diagnosis || "",
      treatment_plan: record?.treatment_plan || "",
      observations: record?.observations || "",
      mood_state: record?.mood_state || "",
      progress_notes: record?.progress_notes || "",
      next_session_goals: record?.next_session_goals || "",
    },
  });

  const onSubmit = async (data: RecordFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = record
        ? `/api/clinical-records/${record.id}`
        : `/api/clinical-records`;
      const method = record ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          patient_id: patient.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar");
      }

      onSave();
    } catch (error) {
      console.error("Error saving record:", error);
      setError(error instanceof Error ? error.message : "Error al guardar la ficha");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !record) return;

    const file = e.target.files[0];
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/clinical-records/${record.id}/attachments`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al subir archivo");
      }

      const { attachment } = await response.json();
      setAttachments((prev) => [attachment, ...prev]);
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(error instanceof Error ? error.message : "Error al subir archivo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!record) return;
    
    try {
      const response = await fetch(
        `/api/clinical-records/${record.id}/attachments/${attachmentId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90dvh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {record ? `Ficha Clínica - Sesión #${record.session_number}` : "Nueva Ficha Clínica"}
          </DialogTitle>
          <p className="text-sm text-neutral-500">
            Paciente: {patient.name}
          </p>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="session" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="session">Sesión</TabsTrigger>
              <TabsTrigger value="clinical">Clínico</TabsTrigger>
              <TabsTrigger value="attachments" disabled={!record}>
                Archivos {attachments.length > 0 && `(${attachments.length})`}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4 pr-2">
              <TabsContent value="session" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="session_date">Fecha de sesión *</Label>
                    <Input
                      id="session_date"
                      type="date"
                      {...register("session_date")}
                      className={errors.session_date ? "border-red-500" : ""}
                    />
                    {errors.session_date && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.session_date.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="mood_state">Estado de ánimo</Label>
                    <Input
                      id="mood_state"
                      {...register("mood_state")}
                      placeholder="Ej: Ansioso, Tranquilo, Triste..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="chief_complaint">Motivo de consulta</Label>
                  <Textarea
                    id="chief_complaint"
                    {...register("chief_complaint")}
                    rows={3}
                    placeholder="Describe el motivo principal de la consulta..."
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notas de la sesión</Label>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    rows={5}
                    placeholder="Registra las notas de la sesión..."
                  />
                </div>

                <div>
                  <Label htmlFor="observations">Observaciones</Label>
                  <Textarea
                    id="observations"
                    {...register("observations")}
                    rows={3}
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="clinical" className="space-y-4 mt-0">
                <div>
                  <Label htmlFor="diagnosis">Diagnóstico</Label>
                  <Textarea
                    id="diagnosis"
                    {...register("diagnosis")}
                    rows={3}
                    placeholder="Diagnóstico clínico..."
                  />
                </div>

                <div>
                  <Label htmlFor="treatment_plan">Plan de tratamiento</Label>
                  <Textarea
                    id="treatment_plan"
                    {...register("treatment_plan")}
                    rows={4}
                    placeholder="Describe el plan de tratamiento..."
                  />
                </div>

                <div>
                  <Label htmlFor="progress_notes">Notas de progreso</Label>
                  <Textarea
                    id="progress_notes"
                    {...register("progress_notes")}
                    rows={3}
                    placeholder="Registra el progreso del paciente..."
                  />
                </div>

                <div>
                  <Label htmlFor="next_session_goals">Objetivos próxima sesión</Label>
                  <Textarea
                    id="next_session_goals"
                    {...register("next_session_goals")}
                    rows={3}
                    placeholder="Objetivos para trabajar en la próxima sesión..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="mt-0">
                {record ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-neutral-500">
                        Sube archivos PDF o imágenes relacionados con la ficha
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          "Subiendo..."
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-1" />
                            Subir archivo
                          </>
                        )}
                      </Button>
                    </div>

                    {attachments.length === 0 ? (
                      <div className="text-center py-8 text-neutral-500 border-2 border-dashed rounded-lg">
                        <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No hay archivos adjuntos</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-brand/10 flex items-center justify-center">
                                {attachment.file_type.startsWith("image/") ? (
                                  <img
                                    src={attachment.file_url}
                                    alt=""
                                    className="w-8 h-8 object-cover rounded"
                                  />
                                ) : (
                                  <FileText className="h-5 w-5 text-brand" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-neutral-800">
                                  {attachment.file_name}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  {formatFileSize(attachment.file_size)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <a
                                href={attachment.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-neutral-500 hover:text-brand rounded"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDeleteAttachment(attachment.id)}
                                className="p-2 text-neutral-500 hover:text-red-500 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <p>Guarda la ficha primero para poder adjuntar archivos</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                "Guardando..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  {record ? "Guardar cambios" : "Crear ficha"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
