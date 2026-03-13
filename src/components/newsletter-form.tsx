"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Error al suscribirse.");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "¡Suscrito correctamente!");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Error al suscribirse. Inténtalo más tarde.");
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="flex gap-0">
        <input
          type="email"
          placeholder="Tu correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 border-y border-l border-white/20 bg-transparent px-5 py-4 text-xs uppercase tracking-[0.15em] text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-fill btn-fill-white border-y border-r border-white/20 px-6 py-4 text-xs uppercase tracking-[0.15em] text-white transition-all duration-300 hover:bg-white/10 disabled:opacity-50"
        >
          {status === "loading" ? "Enviando..." : "Suscribirse"}
        </button>
      </form>
      {status === "success" && (
        <p className="mt-3 text-xs text-white/70">{message}</p>
      )}
      {status === "error" && (
        <p className="mt-3 text-xs text-red-300">{message}</p>
      )}
    </div>
  );
}
