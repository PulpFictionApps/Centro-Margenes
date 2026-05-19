"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, BookOpen, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichTextEditor } from "./rich-text-editor";

export type BlogPostRow = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  paragraphs: string[];
  content: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

interface BlogManagerProps {
  initialPosts: BlogPostRow[];
}

export function BlogManager({ initialPosts }: BlogManagerProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPostRow | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [image, setImage] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    const res = await fetch("/api/admin/blog");
    if (res.ok) {
      const data = await res.json();
      setPosts(data);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setSubtitle("");
    setImage("");
    setContent("");
    setPublished(true);
    setSortOrder(posts.length);
    setError("");
    setFormOpen(true);
  };

  const openEdit = (post: BlogPostRow) => {
    setEditing(post);
    setTitle(post.title);
    setSubtitle(post.subtitle ?? "");
    setImage(post.image ?? "");
    // Prefer rich content; fall back to joining paragraphs as <p> tags
    setContent(
      post.content ??
        (post.paragraphs.length > 0
          ? post.paragraphs.map((p) => `<p>${p}</p>`).join("")
          : "")
    );
    setPublished(post.published);
    setSortOrder(post.sort_order);
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
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        image: image.trim() || null,
        content: content || null,
        paragraphs: [],
        published,
        sort_order: sortOrder,
      };

      const res = await fetch("/api/admin/blog", {
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

  const handleDelete = async (postId: string) => {
    if (!confirm("¿Eliminar esta entrada? Esta acción no se puede deshacer.")) return;

    setDeleting(postId);
    try {
      await fetch(`/api/admin/blog?id=${postId}`, { method: "DELETE" });
      await refresh();
    } finally {
      setDeleting(null);
    }
  };

  const togglePublished = async (post: BlogPostRow) => {
    await fetch("/api/admin/blog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...post, published: !post.published }),
    });
    await refresh();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-normal text-brand">Blog</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {posts.length} entrada{posts.length !== 1 ? "s" : ""} ·{" "}
            {posts.filter((p) => p.published).length} publicada
            {posts.filter((p) => p.published).length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-fill btn-fill-tan flex items-center gap-2 border-y border-[#5b2525] px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-[#5b2525] transition-all duration-300"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva entrada</span>
        </button>
      </div>

      {/* Post list */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-300"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {post.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-16 w-16 flex-shrink-0 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center bg-[#EDE6CA] text-brand">
                    <BookOpen className="h-6 w-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-playfair text-lg text-brand">{post.title}</h3>
                    <span
                      className={`text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 ${
                        post.published
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-neutral-100 text-neutral-400 border border-neutral-200"
                      }`}
                    >
                      {post.published ? "Publicado" : "Borrador"}
                    </span>
                  </div>
                  {post.subtitle && (
                    <p className="mt-0.5 font-playfair text-sm italic text-brand/60">
                      {post.subtitle}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-neutral-400">
                    Orden: {post.sort_order}
                  </p>
                  {(post.content || post.paragraphs[0]) && (
                    <p
                      className="mt-1 text-sm leading-relaxed text-neutral-500 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: post.content
                          ? post.content.replace(/<[^>]+>/g, " ").trim()
                          : post.paragraphs[0],
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => togglePublished(post)}
                  title={post.published ? "Despublicar" : "Publicar"}
                  className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:text-brand"
                >
                  {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => openEdit(post)}
                  title="Editar"
                  className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:text-brand"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={deleting === post.id}
                  title="Eliminar"
                  className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:text-red-600 disabled:opacity-50"
                >
                  {deleting === post.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <div className="border border-neutral-200 bg-white px-8 py-16 text-center text-sm text-neutral-400">
            No hay entradas de blog. Crea la primera.
          </div>
        )}
      </div>

      {/* Form modal */}
      <Dialog open={formOpen} onOpenChange={(v) => !v && setFormOpen(false)}>
        <DialogContent className="max-h-[95vh] w-[95vw] !max-w-6xl overflow-y-auto bg-[#EDE6CA] border-neutral-300/40">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl font-normal text-brand">
              {editing ? "Editar entrada" : "Nueva entrada"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* Title */}
            <div>
              <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                Título *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-brand outline-none transition-colors focus:border-brand"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                Subtítulo — opcional
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="mt-1.5 w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-brand outline-none transition-colors focus:border-brand"
              />
            </div>

            {/* Cover image URL */}
            <div>
              <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                Imagen de portada — URL opcional
              </label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://... o /images/mi-imagen.jpg"
                className="mt-1.5 w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-brand outline-none transition-colors focus:border-brand"
              />
              <p className="mt-1 text-[10px] text-neutral-400">
                También puedes insertar imágenes dentro del contenido con el botón{" "}
                <span className="font-medium">🖼</span> del editor.
              </p>
            </div>

            {/* Rich text content */}
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                Contenido *
              </label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Escribe el contenido de la entrada aquí..."
              />
            </div>

            {/* Controls row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                  Orden de visualización
                </label>
                <input
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="mt-1.5 w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-brand outline-none transition-colors focus:border-brand"
                />
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="h-4 w-4 accent-brand"
                  />
                  <span className="text-sm text-brand">Publicado</span>
                </label>
              </div>
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
                className="btn-fill btn-fill-tan flex items-center gap-2 border-y border-[#5b2525] px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-[#5b2525] transition-all duration-300 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editing ? "Guardar cambios" : "Crear entrada"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
