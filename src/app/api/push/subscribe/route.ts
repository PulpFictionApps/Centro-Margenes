import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST /api/push/subscribe — save a new push subscription
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { endpoint, keys } = body as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error) {
    console.error("[push/subscribe] upsert error:", error);
    return NextResponse.json({ error: "Error guardando suscripción" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/push/subscribe — remove a push subscription
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { endpoint } = body as { endpoint: string };

  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint requerido" }, { status: 400 });
  }

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  return NextResponse.json({ success: true });
}
