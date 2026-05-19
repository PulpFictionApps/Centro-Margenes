"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Therapist } from "@/lib/types";
import { TherapistFormModal } from "./therapist-form-modal";
import { TherapistDetailModal } from "./therapist-detail-modal";
import { Plus, Pencil, Eye, Power, Trash2 } from "lucide-react";

interface TherapistListProps {
  initialTherapists: Therapist[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TherapistList({ initialTherapists }: TherapistListProps) {
  const [therapists, setTherapists] = useState(initialTherapists);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTherapist, setEditingTherapist] = useState<Therapist | null>(null);
  const [detailTherapist, setDetailTherapist] = useState<Therapist | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const refresh = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("therapists")
      .select("*")
      .order("name");
    if (data) setTherapists(data);
  };

  const handleToggleActive = async (therapist: Therapist) => {
    setToggling(therapist.id);
    try {
      const supabase = createClient();
      await supabase
        .from("therapists")
        .update({ active: !therapist.active })
        .eq("id", therapist.id);
      await refresh();
    } finally {
      setToggling(null);
    }
  };

  const handleEdit = (therapist: Therapist) => {
    setEditingTherapist(therapist);
    setFormOpen(true);
  };

  const handleDelete = async (therapist: Therapist) => {
    const confirmed = window.confirm(
      `¿Eliminar permanentemente a ${therapist.name}?\n\nEsta acción no se puede deshacer. Se eliminará su cuenta y todos sus datos de acceso.`
    );
    if (!confirmed) return;

    setDeleting(therapist.id);
    try {
      const res = await fetch(`/api/admin/therapists/${therapist.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refresh();
      } else {
        const json = await res.json();
        alert(json.error ?? "Error al eliminar el terapeuta");
      }
    } finally {
      setDeleting(null);
    }
  };

  const handleCreate = () => {
    setEditingTherapist(null);
    setFormOpen(true);
  };

  const handleFormClose = async (saved: boolean) => {
    setFormOpen(false);
    setEditingTherapist(null);
    if (saved) await refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-normal text-brand">
            Terapeutas
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {therapists.length} terapeuta{therapists.length !== 1 ? "s" : ""}{" "}
            registrado{therapists.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-fill btn-fill-tan flex items-center gap-2 border-y border-[#5b2525] px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-[#5b2525] transition-all duration-300"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo terapeuta</span>
        </button>
      </div>

      {/* ── Mobile cards (hidden md+) ── */}
      <div className="space-y-3 md:hidden">
        {therapists.length === 0 ? (
          <div className="border border-neutral-200 bg-white px-5 py-16 text-center text-sm text-neutral-400">
            No hay terapeutas registrados.
          </div>
        ) : (
          therapists.map((t) => (
            <div
              key={t.id}
              className="border border-neutral-200 bg-white p-4"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {t.photo_url ? (
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden">
                      <Image
                        src={t.photo_url}
                        alt={t.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center bg-[#ddd6b3] font-playfair text-sm text-neutral-600">
                      {getInitials(t.name)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-brand">{t.name}</p>
                    <p className="text-xs text-neutral-400">{t.email}</p>
                    <span
                      className={`mt-1 inline-block border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${
                        t.active !== false
                          ? "border-green-300 bg-green-50 text-green-700"
                          : "border-neutral-300 bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {t.active !== false ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
                {/* Action buttons */}
                <div className="flex flex-shrink-0 items-center gap-0.5">
                  <button
                    onClick={() => setDetailTherapist(t)}
                    title="Ver detalle"
                    className="flex h-9 w-9 items-center justify-center text-neutral-400 transition-colors hover:text-brand"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(t)}
                    title="Editar"
                    className="flex h-9 w-9 items-center justify-center text-neutral-400 transition-colors hover:text-brand"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(t)}
                    disabled={toggling === t.id}
                    title={t.active !== false ? "Desactivar" : "Activar"}
                    className={`flex h-9 w-9 items-center justify-center transition-colors disabled:opacity-50 ${
                      t.active !== false
                        ? "text-neutral-400 hover:text-red-600"
                        : "text-neutral-400 hover:text-green-600"
                    }`}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    disabled={deleting === t.id}
                    title="Eliminar permanentemente"
                    className="flex h-9 w-9 items-center justify-center text-neutral-400 transition-colors hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Specialties + modality */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {t.offers_online && (
                  <span className="border border-neutral-200 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-neutral-500">
                    Online
                  </span>
                )}
                {t.offers_in_person && (
                  <span className="border border-neutral-200 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-neutral-500">
                    Presencial
                  </span>
                )}
                {t.specialties.slice(0, 3).map((s) => (
                  <span
                    key={s}
                    className="border border-neutral-200 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-neutral-400"
                  >
                    {s}
                  </span>
                ))}
                {t.specialties.length > 3 && (
                  <span className="text-[10px] text-neutral-400">
                    +{t.specialties.length - 3}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Desktop table (hidden on mobile) ── */}
      <div className="hidden overflow-x-auto border border-neutral-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                Terapeuta
              </th>
              <th className="px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                Especialidades
              </th>
              <th className="px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                Modalidad
              </th>
              <th className="px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                Estado
              </th>
              <th className="px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {therapists.map((t) => (
              <tr
                key={t.id}
                className="border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-cream/30"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {t.photo_url ? (
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden">
                        <Image
                          src={t.photo_url}
                          alt={t.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-[#ddd6b3] font-playfair text-xs text-neutral-600">
                        {getInitials(t.name)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-brand">{t.name}</p>
                      <p className="text-xs text-neutral-400">{t.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1">
                    {t.specialties.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="border border-neutral-200 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-neutral-500"
                      >
                        {s}
                      </span>
                    ))}
                    {t.specialties.length > 3 && (
                      <span className="px-1 text-[10px] text-neutral-400">
                        +{t.specialties.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2 text-xs text-neutral-500">
                    {t.offers_online && (
                      <span className="border border-neutral-200 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em]">
                        Online
                      </span>
                    )}
                    {t.offers_in_person && (
                      <span className="border border-neutral-200 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em]">
                        Presencial
                      </span>
                    )}
                    {!t.offers_online && !t.offers_in_person && (
                      <span className="text-neutral-300">—</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block border px-3 py-1 text-[9px] uppercase tracking-[0.15em] ${
                      t.active !== false
                        ? "border-green-300 bg-green-50 text-green-700"
                        : "border-neutral-300 bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {t.active !== false ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDetailTherapist(t)}
                      title="Ver detalle"
                      className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:text-brand"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(t)}
                      title="Editar"
                      className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:text-brand"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(t)}
                      disabled={toggling === t.id}
                      title={t.active !== false ? "Desactivar" : "Activar"}
                      className={`flex h-8 w-8 items-center justify-center transition-colors disabled:opacity-50 ${
                        t.active !== false
                          ? "text-neutral-400 hover:text-red-600"
                          : "text-neutral-400 hover:text-green-600"
                      }`}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      disabled={deleting === t.id}
                      title="Eliminar permanentemente"
                      className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {therapists.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-16 text-center text-sm text-neutral-400"
                >
                  No hay terapeutas registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TherapistFormModal
        open={formOpen}
        onClose={handleFormClose}
        therapist={editingTherapist}
      />

      <TherapistDetailModal
        open={!!detailTherapist}
        onClose={() => setDetailTherapist(null)}
        therapist={detailTherapist}
      />
    </div>
  );
}
