"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Service } from "@/lib/types";

interface ServicesEditorProps {
  therapistId?: string;
}

export function ServicesEditor({ therapistId }: ServicesEditorProps) {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!therapistId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const supabase = createClient();
        const [servicesRes, selectedRes] = await Promise.all([
          supabase.from("services").select("*").order("name"),
          supabase
            .from("therapist_services")
            .select("service_id")
            .eq("therapist_id", therapistId),
        ]);

        setAllServices((servicesRes.data as Service[]) ?? []);
        setSelectedIds(
          new Set(
            (selectedRes.data ?? []).map(
              (s: { service_id: string }) => s.service_id
            )
          )
        );
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [therapistId]);

  const toggleService = (serviceId: string) => {
    const next = new Set(selectedIds);
    if (next.has(serviceId)) {
      next.delete(serviceId);
    } else {
      next.add(serviceId);
    }
    setSelectedIds(next);
  };

  const handleSave = async () => {
    if (!therapistId) return;
    setSaving(true);
    setMessage("");

    try {
      const supabase = createClient();

      // Remove all existing
      await supabase
        .from("therapist_services")
        .delete()
        .eq("therapist_id", therapistId);

      // Insert selected
      if (selectedIds.size > 0) {
        const { error } = await supabase.from("therapist_services").insert(
          Array.from(selectedIds).map((service_id) => ({
            therapist_id: therapistId,
            service_id,
          }))
        );
        if (error) throw error;
      }

      setMessage("Servicios actualizados correctamente.");
    } catch {
      setMessage("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (!therapistId) {
    return (
      <div className="border-t border-neutral-200 bg-white px-8 py-16 text-center text-sm text-neutral-500">
        No se encontró tu perfil. Contacta al administrador.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-neutral-400">
        Cargando servicios...
      </div>
    );
  }

  if (allServices.length === 0) {
    return (
      <div className="border-t border-neutral-200 bg-white px-8 py-16 text-center text-sm text-neutral-400">
        No hay servicios configurados aún.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {allServices.map((service) => {
          const isSelected = selectedIds.has(service.id);
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => toggleService(service.id)}
              className={`group border p-5 text-left transition-colors ${
                isSelected
                  ? "border-brand bg-brand text-white"
                  : "border-neutral-200 bg-white text-brand hover:border-neutral-400"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <p className="font-playfair text-base">{service.name}</p>
                  {service.description && (
                    <p
                      className={`text-sm ${
                        isSelected ? "text-white/70" : "text-neutral-400"
                      }`}
                    >
                      {service.description}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 pt-0.5">
                  <div
                    className={`flex h-5 w-5 items-center justify-center border ${
                      isSelected
                        ? "border-white bg-white"
                        : "border-neutral-300"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="h-3 w-3 text-brand"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
              <p
                className={`mt-3 text-[10px] uppercase tracking-[0.2em] ${
                  isSelected ? "text-white/50" : "text-neutral-400"
                }`}
              >
                {service.duration_minutes} min por sesión
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="border-y border-brand px-8 py-3 text-[11px] uppercase tracking-[0.2em] text-brand transition-colors hover:bg-brand hover:text-white disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar servicios"}
        </button>
        {message && (
          <p
            className={`text-sm ${
              message.includes("Error") ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
