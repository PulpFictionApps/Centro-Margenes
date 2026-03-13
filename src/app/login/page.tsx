"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Credenciales incorrectas. Inténtalo de nuevo.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error al iniciar sesión. Inténtalo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-[85vh] items-center justify-center bg-[#EDE6CA] px-6">
      <div className="w-full max-w-[420px]">
        <div className="text-center">
          <span className="text-sm font-medium uppercase tracking-[3px] text-brand">
            Centro Márgenes
          </span>
          <h1 className="mt-6 font-playfair text-3xl font-normal text-brand">
            Acceso terapeutas
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-neutral-500">
            Ingresa con tu cuenta para acceder al panel de administración.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-10 space-y-6">
          <div>
            <label
              htmlFor="email"
              className="text-[11px] uppercase tracking-[0.2em] text-neutral-500"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 block w-full border-b border-neutral-300 bg-transparent px-0 py-3 text-sm text-brand placeholder:text-neutral-400 focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-[11px] uppercase tracking-[0.2em] text-neutral-500"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2 block w-full border-b border-neutral-300 bg-transparent px-0 py-3 text-sm text-brand placeholder:text-neutral-400 focus:border-brand focus:outline-none"
            />
          </div>
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-fill btn-fill-tan mt-4 w-full border-y border-[#5b2525] px-8 py-4 text-xs uppercase tracking-[0.25em] text-[#5b2525] transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </section>
  );
}
