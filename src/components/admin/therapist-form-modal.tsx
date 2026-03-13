"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Therapist } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface TherapistFormModalProps {
  open: boolean;
  onClose: (saved: boolean) => void;
  therapist: Therapist | null;
}

export function TherapistFormModal({
  open,
  onClose,
  therapist,
}: TherapistFormModalProps) {
  const isEdit = !!therapist;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [specialtiesText, setSpecialtiesText] = useState("");
  const [offersOnline, setOffersOnline] = useState(false);
  const [offersInPerson, setOffersInPerson] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset form when therapist changes
  const resetForm = () => {
    if (therapist) {
      setName(therapist.name);
      setEmail(therapist.email);
      setPassword("");
      setBio(therapist.bio);
      setSpecialtiesText(therapist.specialties.join(", "));
      setOffersOnline(therapist.offers_online);
      setOffersInPerson(therapist.offers_in_person);
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setBio("");
      setSpecialtiesText("");
      setOffersOnline(false);
      setOffersInPerson(true);
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const specialties = specialtiesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (isEdit) {
        // Update existing therapist
        const supabase = createClient();
        const { error: updateErr } = await supabase
          .from("therapists")
          .update({
            name: name.trim(),
            email: email.trim(),
            bio: bio.trim(),
            specialties,
            offers_online: offersOnline,
            offers_in_person: offersInPerson,
          })
          .eq("id", therapist.id);

        if (updateErr) throw updateErr;
        onClose(true);
      } else {
        // Create new therapist via admin API
        const res = await fetch("/api/admin/therapists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
            bio: bio.trim(),
            specialties,
            offers_online: offersOnline,
            offers_in_person: offersInPerson,
          }),
        });

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Error al crear terapeuta");
        }

        onClose(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose(false);
      }}
    >
      <DialogContent
        className="max-w-lg bg-[#EDE6CA] border-neutral-300/40"
        onOpenAutoFocus={resetForm}
      >
        <DialogHeader>
          <DialogTitle className="font-playfair text-2xl font-normal text-brand">
            {isEdit ? "Editar terapeuta" : "Nuevo terapeuta"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Name */}
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
              Nombre completo
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-brand outline-none transition-colors focus:border-brand"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isEdit}
              className="mt-1.5 w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-brand outline-none transition-colors focus:border-brand disabled:opacity-50"
            />
          </div>

          {/* Password (only for create) */}
          {!isEdit && (
            <div>
              <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                Contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-brand outline-none transition-colors focus:border-brand"
                autoComplete="new-password"
              />
            </div>
          )}

          {/* Bio */}
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
              Biografía
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="mt-1.5 w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-brand outline-none transition-colors focus:border-brand resize-none"
            />
          </div>

          {/* Specialties */}
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
              Especialidades{" "}
              <span className="normal-case tracking-normal text-neutral-400">
                (separadas por coma)
              </span>
            </label>
            <input
              type="text"
              value={specialtiesText}
              onChange={(e) => setSpecialtiesText(e.target.value)}
              placeholder="Ansiedad, Depresión, Parejas"
              className="mt-1.5 w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-brand outline-none transition-colors focus:border-brand"
            />
          </div>

          {/* Modalities */}
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
              Modalidad
            </label>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={offersOnline}
                  onChange={(e) => setOffersOnline(e.target.checked)}
                  className="accent-brand"
                />
                Online
              </label>
              <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={offersInPerson}
                  onChange={(e) => setOffersInPerson(e.target.checked)}
                  className="accent-brand"
                />
                Presencial
              </label>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onClose(false)}
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
              {isEdit ? "Guardar cambios" : "Crear terapeuta"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
