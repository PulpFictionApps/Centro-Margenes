"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Service } from "@/lib/types";
import { Plus, Pencil, Trash2, Loader2, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ServiceManagerProps {
  initialServices: Service[];
}

export function ServiceManager({ initialServices }: ServiceManagerProps) {
  const [services, setServices] = useState(initialServices);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(50);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("services")
      .select("*")
      .order("name");
    if (data) setServices(data);
  };

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setDuration(50);
    setError("");
    setFormOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    setName(service.name);
    setDescription(service.description);
    setDuration(service.duration_minutes);
    setError("");
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const supabase = createClient();

      if (editing) {
        const { error: err } = await supabase
          .from("services")
          .update({
            name: name.trim(),
            description: description.trim(),
            duration_minutes: duration,
          })
          .eq("id", editing.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from("services").insert({
          name: name.trim(),
          description: description.trim(),
          duration_minutes: duration,
        });
        if (err) throw err;
      }

      await refresh();
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("¿Eliminar este servicio? Esta acción no se puede deshacer."))
      return;

    setDeleting(serviceId);
    try {
      const supabase = createClient();
      await supabase.from("services").delete().eq("id", serviceId);
      await refresh();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-3xl font-normal text-brand">
            Servicios
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {services.length} servicio{services.length !== 1 ? "s" : ""}{" "}
            configurado{services.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-fill btn-fill-tan flex items-center gap-2 border-y border-[#5b2525] px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-[#5b2525] transition-all duration-300"
        >
          <Plus className="h-4 w-4" />
          Nuevo servicio
        </button>
      </div>

      {/* Service cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((service) => (
          <div
            key={service.id}
            className="border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-playfair text-lg text-brand">
                  {service.name}
                </h3>
                {service.description && (
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    {service.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-400">
                  <Clock className="h-3.5 w-3.5" />
                  {service.duration_minutes} minutos
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4">
                <button
                  onClick={() => openEdit(service)}
                  title="Editar"
                  className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:text-brand"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  disabled={deleting === service.id}
                  title="Eliminar"
                  className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <div className="col-span-2 border border-neutral-200 bg-white px-8 py-16 text-center text-sm text-neutral-400">
            No hay servicios configurados. Crea el primero.
          </div>
        )}
      </div>

      {/* Form modal */}
      <Dialog open={formOpen} onOpenChange={(v) => !v && setFormOpen(false)}>
        <DialogContent className="max-w-md bg-[#EDE6CA] border-neutral-300/40">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl font-normal text-brand">
              {editing ? "Editar servicio" : "Nuevo servicio"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div>
              <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                Nombre
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-brand outline-none transition-colors focus:border-brand"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1.5 w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-brand outline-none transition-colors focus:border-brand resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                Duración (minutos)
              </label>
              <input
                type="number"
                required
                min={10}
                max={240}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-1.5 w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-brand outline-none transition-colors focus:border-brand"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-neutral-500 transition-colors hover:text-brand"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-fill btn-fill-tan flex items-center gap-2 border-y border-[#5b2525] px-8 py-3 text-[11px] uppercase tracking-[0.2em] text-[#5b2525] transition-all duration-300 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Guardar" : "Crear"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
