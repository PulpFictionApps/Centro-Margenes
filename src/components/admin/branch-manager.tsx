"use client";

import { useState } from "react";
import type { Branch } from "@/lib/types";
import { Plus, Pencil, Trash2, Loader2, Monitor, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BranchManagerProps {
  initialBranches: Branch[];
}

const TYPE_LABEL: Record<string, string> = {
  online: "Online",
  in_person: "Presencial",
};

export function BranchManager({ initialBranches }: BranchManagerProps) {
  const [branches, setBranches] = useState(initialBranches);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<"online" | "in_person">("in_person");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    const res = await fetch("/api/admin/branches");
    if (res.ok) {
      const data = await res.json();
      setBranches(data);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setName("");
    setType("in_person");
    setAddress("");
    setError("");
    setFormOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setName(branch.name);
    setType(branch.type);
    setAddress(branch.address ?? "");
    setError("");
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        id: editing?.id,
        name: name.trim(),
        type,
        address: address.trim() || null,
      };

      const res = await fetch("/api/admin/branches", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Error al guardar");
      }

      await refresh();
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (branchId: string) => {
    if (!confirm("¿Eliminar esta sede? Esta acción no se puede deshacer.")) return;

    setDeleting(branchId);
    try {
      await fetch(`/api/admin/branches?id=${branchId}`, { method: "DELETE" });
      await refresh();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-normal text-brand">Sedes</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {branches.length} sede{branches.length !== 1 ? "s" : ""} configurada
            {branches.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-fill btn-fill-tan flex items-center gap-2 border-y border-[#5b2525] px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-[#5b2525] transition-all duration-300"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva sede</span>
        </button>
      </div>

      {/* Branch cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {branches.map((branch) => {
          const Icon = branch.type === "online" ? Monitor : Building2;
          return (
            <div
              key={branch.id}
              className="border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-[#EDE6CA] text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-playfair text-lg text-brand">{branch.name}</h3>
                    <span className="mt-1 inline-block text-[10px] uppercase tracking-[0.15em] text-neutral-400">
                      {TYPE_LABEL[branch.type]}
                    </span>
                    {branch.address && (
                      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                        {branch.address}
                      </p>
                    )}
                    {!branch.address && branch.type === "in_person" && (
                      <p className="mt-2 text-sm italic text-neutral-300">Sin dirección</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => openEdit(branch)}
                    title="Editar"
                    className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:text-brand"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(branch.id)}
                    disabled={deleting === branch.id}
                    title="Eliminar"
                    className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:text-red-600 disabled:opacity-50"
                  >
                    {deleting === branch.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {branches.length === 0 && (
          <div className="col-span-2 border border-neutral-200 bg-white px-8 py-16 text-center text-sm text-neutral-400">
            No hay sedes configuradas. Crea la primera.
          </div>
        )}
      </div>

      {/* Form modal */}
      <Dialog open={formOpen} onOpenChange={(v) => !v && setFormOpen(false)}>
        <DialogContent className="max-w-md bg-[#EDE6CA] border-neutral-300/40">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl font-normal text-brand">
              {editing ? "Editar sede" : "Nueva sede"}
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
                placeholder="Ej: Sede Providencia"
                className="mt-1.5 w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-brand outline-none transition-colors focus:border-brand"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                Tipo
              </label>
              <select
                required
                value={type}
                onChange={(e) => setType(e.target.value as "online" | "in_person")}
                className="mt-1.5 w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-brand outline-none transition-colors focus:border-brand"
              >
                <option value="in_person">Presencial</option>
                <option value="online">Online</option>
              </select>
            </div>

            {type === "in_person" && (
              <div>
                <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                  Dirección — opcional
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: Av. Providencia 1234, Santiago"
                  className="mt-1.5 w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-brand outline-none transition-colors focus:border-brand"
                />
              </div>
            )}

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
                className="btn-fill btn-fill-tan flex items-center gap-2 border-y border-[#5b2525] px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-[#5b2525] transition-all duration-300 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editing ? "Guardar cambios" : "Crear sede"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
