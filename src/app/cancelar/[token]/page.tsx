"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";

export default function CancelarCitaPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleCancel = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/cancel-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "No se pudo cancelar la cita.");
        setStatus("error");
      }
    } catch {
      setErrorMessage("Error de conexión. Intenta de nuevo.");
      setStatus("error");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EDE6CA] px-4">
      <div className="w-full max-w-md border border-neutral-300/60 bg-white p-10 text-center">
        {status === "idle" && (
          <>
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
            <h1 className="font-playfair text-2xl font-normal text-brand">
              Cancelar cita
            </h1>
            <p className="mt-4 text-sm text-neutral-600 leading-relaxed">
              ¿Estás seguro de que deseas cancelar tu cita? Esta acción liberará
              el horario y no se puede deshacer.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={handleCancel}
                className="w-full border-y border-red-500 px-8 py-3 text-[11px] uppercase tracking-[0.2em] text-red-600 transition-colors hover:bg-red-500 hover:text-white"
              >
                Sí, cancelar mi cita
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full text-[11px] uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:text-neutral-600"
              >
                Volver al inicio
              </button>
            </div>
          </>
        )}

        {status === "loading" && (
          <>
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-brand" />
            <p className="text-sm text-neutral-500">Cancelando tu cita...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
            <h1 className="font-playfair text-2xl font-normal text-brand">
              Cita cancelada
            </h1>
            <p className="mt-4 text-sm text-neutral-600 leading-relaxed">
              Tu cita ha sido cancelada exitosamente. El horario ha sido
              liberado. Si deseas agendar una nueva cita, visita nuestra página.
            </p>
            <button
              onClick={() => router.push("/reservar")}
              className="mt-8 w-full border-y border-brand px-8 py-3 text-[11px] uppercase tracking-[0.2em] text-brand transition-colors hover:bg-brand hover:text-white"
            >
              Agendar nueva cita
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <h1 className="font-playfair text-2xl font-normal text-brand">
              No se pudo cancelar
            </h1>
            <p className="mt-4 text-sm text-neutral-600 leading-relaxed">
              {errorMessage}
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => setStatus("idle")}
                className="w-full border-y border-brand px-8 py-3 text-[11px] uppercase tracking-[0.2em] text-brand transition-colors hover:bg-brand hover:text-white"
              >
                Intentar de nuevo
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full text-[11px] uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:text-neutral-600"
              >
                Volver al inicio
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
