import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * GET /api/push/test
 * Sends a test push notification to the currently logged-in therapist.
 * Useful for verifying that VAPID keys, the table, and the subscription are correct.
 */
export async function GET() {
  // 1. Check env vars
  const missingVars: string[] = [];
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) missingVars.push("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  if (!process.env.VAPID_PRIVATE_KEY) missingVars.push("VAPID_PRIVATE_KEY");
  if (!process.env.VAPID_SUBJECT) missingVars.push("VAPID_SUBJECT");
  if (missingVars.length > 0) {
    return NextResponse.json(
      { error: `Faltan variables de entorno: ${missingVars.join(", ")}` },
      { status: 500 }
    );
  }

  // 2. Get logged-in user
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado — inicia sesión primero" }, { status: 401 });
  }

  // 3. Check subscriptions exist
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: subs, error: subsError } = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (subsError) {
    return NextResponse.json(
      { error: `Error leyendo suscripciones: ${subsError.message} — ¿creaste la tabla push_subscriptions en Supabase?` },
      { status: 500 }
    );
  }

  if (!subs || subs.length === 0) {
    return NextResponse.json(
      { error: "No hay suscripciones guardadas para tu usuario. Activa las notificaciones en Mi perfil primero." },
      { status: 404 }
    );
  }

  // 4. Send test notification
  try {
    await sendPushToUser(supabaseAdmin, user.id, {
      title: "✅ Notificaciones funcionando",
      body: "Si ves esto, las notificaciones push están configuradas correctamente.",
      url: "/dashboard/profile",
      tag: "test",
    });
    return NextResponse.json({
      ok: true,
      subscriptions: subs.length,
      userId: user.id,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Error al enviar: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
