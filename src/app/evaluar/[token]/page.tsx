import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EvaluationForm } from "@/components/dashboard/evaluation-form";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

interface EvaluatePageProps {
  params: { token: string };
}

export default async function EvaluatePage({ params }: EvaluatePageProps) {
  const supabase = createServerSupabaseClient();

  // Find appointment by cancellation token (used as evaluation token)
  const { data: appointment } = await supabase
    .from("appointments")
    .select(`
      *,
      therapist:therapists (id, name),
      patient:patients (name),
      evaluation:evaluations (id)
    `)
    .eq("cancellation_token", params.token)
    .single();

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDE6CA] p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold">Enlace inválido</h2>
              <p className="text-neutral-600">
                Este enlace de evaluación no es válido o ha expirado.
              </p>
              <Link
                href="/"
                className="inline-block mt-4 text-brand hover:underline"
              >
                Volver al inicio
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (appointment.status !== "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDE6CA] p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold">Cita no completada</h2>
              <p className="text-neutral-600">
                Solo puedes evaluar citas que hayan sido completadas.
              </p>
              <Link
                href="/"
                className="inline-block mt-4 text-brand hover:underline"
              >
                Volver al inicio
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (appointment.evaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDE6CA] p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold">Ya evaluaste esta cita</h2>
              <p className="text-neutral-600">
                Gracias por tu evaluación. Tu opinión nos ayuda a mejorar.
              </p>
              <Link
                href="/"
                className="inline-block mt-4 text-brand hover:underline"
              >
                Volver al inicio
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EDE6CA] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-neutral-800">
            Evalúa tu experiencia
          </h1>
          <p className="text-neutral-600 mt-2">
            Hola {appointment.patient?.name}, cuéntanos cómo fue tu sesión
          </p>
        </div>
        
        <EvaluationForm
          appointmentId={appointment.id}
          therapistName={appointment.therapist?.name || "tu terapeuta"}
        />
      </div>
    </div>
  );
}
