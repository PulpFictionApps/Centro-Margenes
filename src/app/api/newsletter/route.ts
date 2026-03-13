import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud inválido" },
      { status: 400 }
    );
  }

  const { email } = body as { email?: string };

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "El correo es obligatorio" },
      { status: 400 }
    );
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return NextResponse.json(
      { error: "Ingresa un correo electrónico válido" },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();

  // Check for existing subscription
  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("id")
    .eq("email", trimmedEmail)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { message: "Ya estás suscrito a nuestro newsletter" },
      { status: 200 }
    );
  }

  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email: trimmedEmail });

  if (error) {
    // Handle race condition duplicate
    if (error.code === "23505") {
      return NextResponse.json(
        { message: "Ya estás suscrito a nuestro newsletter" },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { error: "Error al suscribirse. Inténtalo más tarde." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "¡Suscrito correctamente!" },
    { status: 201 }
  );
}
