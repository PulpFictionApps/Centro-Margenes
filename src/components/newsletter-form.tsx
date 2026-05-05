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
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-0 sm:flex-nowrap">
        <input
          type="email"
          placeholder="Tu correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="min-w-0 flex-1 border border-white/20 bg-transparent px-5 py-4 text-xs uppercase tracking-[0.15em] text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none sm:border-y sm:border-l sm:border-r-0"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-fill btn-fill-white w-full border border-white/20 px-6 py-4 text-xs uppercase tracking-[0.15em] text-white transition-all duration-300 hover:bg-white/10 disabled:opacity-50 sm:w-auto sm:border-y sm:border-r sm:border-l-0"
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
