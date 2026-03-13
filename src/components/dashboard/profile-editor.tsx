"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import type { Therapist } from "@/lib/types";

interface ProfileEditorProps {
  therapist: Therapist | null;
}

export function ProfileEditor({ therapist }: ProfileEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: therapist?.name ?? "",
    bio: therapist?.bio ?? "",
    specialties: therapist?.specialties ?? [],
    photo_url: therapist?.photo_url ?? null,
    offers_online: therapist?.offers_online ?? false,
    offers_in_person: therapist?.offers_in_person ?? false,
  });
  const [newSpecialty, setNewSpecialty] = useState("");

  if (!therapist) {
    return (
      <div className="border-t border-neutral-200 bg-white px-8 py-16 text-center text-sm text-neutral-500">
        No se encontró tu perfil. Contacta al administrador para crear tu perfil de terapeuta.
      </div>
    );
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const fileName = `${therapist.id}.${ext}`;

    const { error } = await supabase.storage
      .from("therapist-photos")
      .upload(fileName, file, { upsert: true });

    if (!error) {
      const { data: urlData } = supabase.storage
        .from("therapist-photos")
        .getPublicUrl(fileName);

      setForm({ ...form, photo_url: urlData.publicUrl });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("therapists")
        .update({
          name: form.name,
          bio: form.bio,
          specialties: form.specialties,
          photo_url: form.photo_url,
          offers_online: form.offers_online,
          offers_in_person: form.offers_in_person,
          updated_at: new Date().toISOString(),
        })
        .eq("id", therapist.id);

      if (error) throw error;
      setMessage("Perfil actualizado correctamente.");
    } catch {
      setMessage("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const addSpecialty = () => {
    if (!newSpecialty.trim()) return;
    setForm({ ...form, specialties: [...form.specialties, newSpecialty.trim()] });
    setNewSpecialty("");
  };

  const removeSpecialty = (index: number) => {
    setForm({ ...form, specialties: form.specialties.filter((_, i) => i !== index) });
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-8">
      {/* Photo */}
      <div className="border-t border-neutral-200 bg-white px-6 py-6">
        <p className="mb-4 text-[11px] uppercase tracking-[0.25em] text-neutral-400">
          Foto de perfil
        </p>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden bg-neutral-100">
              {form.photo_url ? (
                <Image
                  src={form.photo_url}
                  alt={form.name}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-playfair text-lg text-neutral-400">
                  {getInitials(form.name)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center bg-brand text-white text-xs"
            >
              +
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
          <div className="text-sm text-neutral-400">
            <p>Sube una foto profesional.</p>
            <p>Formatos: JPG, PNG. Máximo 2MB.</p>
          </div>
        </div>
      </div>

      {/* Basic info */}
      <div className="border-t border-neutral-200 bg-white px-6 py-6">
        <p className="mb-5 text-[11px] uppercase tracking-[0.25em] text-neutral-400">
          Información básica
        </p>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="text-[10px] uppercase tracking-[0.2em] text-neutral-400"
            >
              Nombre completo
            </label>
            <input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="block w-full border-b border-neutral-300 bg-transparent pb-2 text-sm text-brand outline-none focus:border-brand"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="bio"
              className="text-[10px] uppercase tracking-[0.2em] text-neutral-400"
            >
              Biografía
            </label>
            <textarea
              id="bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={4}
              placeholder="Cuéntale a tus pacientes sobre ti..."
              className="block w-full border border-neutral-200 bg-transparent p-3 text-sm text-brand outline-none focus:border-brand placeholder:text-neutral-300 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Specialties */}
      <div className="border-t border-neutral-200 bg-white px-6 py-6">
        <p className="mb-4 text-[11px] uppercase tracking-[0.25em] text-neutral-400">
          Especialidades
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {form.specialties.map((s, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 border border-neutral-200 px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-neutral-600"
            >
              {s}
              <button
                type="button"
                onClick={() => removeSpecialty(i)}
                className="text-neutral-400 hover:text-brand"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-3">
          <input
            value={newSpecialty}
            onChange={(e) => setNewSpecialty(e.target.value)}
            placeholder="Nueva especialidad"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSpecialty();
              }
            }}
            className="flex-1 border-b border-neutral-300 bg-transparent pb-2 text-sm text-brand outline-none focus:border-brand placeholder:text-neutral-300"
          />
          <button
            type="button"
            onClick={addSpecialty}
            className="border-y border-neutral-300 px-5 py-2 text-[11px] uppercase tracking-[0.2em] text-neutral-500 transition-colors hover:border-brand hover:text-brand"
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Modality */}
      <div className="border-t border-neutral-200 bg-white px-6 py-6">
        <p className="mb-4 text-[11px] uppercase tracking-[0.25em] text-neutral-400">
          Modalidad de atención
        </p>
        <div className="space-y-4">
          {/* Online toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand">Atención online</p>
              <p className="text-xs text-neutral-400">Sesiones por videollamada</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm({ ...form, offers_online: !form.offers_online })
              }
              className={`relative h-6 w-11 rounded-full transition-colors ${
                form.offers_online ? "bg-brand" : "bg-neutral-200"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  form.offers_online ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          {/* In person toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand">Atención presencial</p>
              <p className="text-xs text-neutral-400">Sesiones en consulta</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm({ ...form, offers_in_person: !form.offers_in_person })
              }
              className={`relative h-6 w-11 rounded-full transition-colors ${
                form.offers_in_person ? "bg-brand" : "bg-neutral-200"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  form.offers_in_person ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="border-y border-brand px-8 py-3 text-[11px] uppercase tracking-[0.2em] text-brand transition-colors hover:bg-brand hover:text-white disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
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
