import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/cancel-appointment
 * Body: { token: string }
 *
 * Allows patients to cancel their appointment using the cancellation token
 * sent in the confirmation email.
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token inválido." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Find appointment by cancellation token
    const { data: appointment } = await supabase
      .from("appointments")
      .select("id, status, date, time")
      .eq("cancellation_token", token)
      .single();

    if (!appointment) {
      return NextResponse.json(
        { error: "No se encontró la cita. El enlace puede ser inválido o haber expirado." },
        { status: 404 }
      );
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { error: "Esta cita ya fue cancelada." },
        { status: 400 }
      );
    }

    if (appointment.status === "completed" || appointment.status === "no_show") {
      return NextResponse.json(
        { error: "Esta cita ya fue finalizada y no puede cancelarse." },
        { status: 400 }
      );
    }

    // Cancel the appointment — this frees the slot via the partial unique index
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointment.id);

    if (error) {
      return NextResponse.json(
        { error: "No se pudo cancelar la cita." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
