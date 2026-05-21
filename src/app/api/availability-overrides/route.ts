import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getCurrentTherapistId() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, therapistId: null, error: "No autorizado", status: 401 };
  }

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!therapist) {
    return { supabase, therapistId: null, error: "Terapeuta no encontrado", status: 404 };
  }

  return { supabase, therapistId: therapist.id, error: null, status: 200 };
}

export async function GET() {
  const ctx = await getCurrentTherapistId();
  if (!ctx.therapistId) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { data, error } = await ctx.supabase
    .from("availability_overrides")
    .select("*")
    .eq("therapist_id", ctx.therapistId)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Error al obtener excepciones" }, { status: 500 });
  }

  return NextResponse.json({ overrides: data ?? [] });
}

export async function POST(request: NextRequest) {
  const ctx = await getCurrentTherapistId();
  if (!ctx.therapistId) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const body = await request.json();
  const {
    date,
    start_time,
    end_time,
    slot_duration,
    modality,
    override_type,
    note,
  } = body;

  if (!date || !start_time || !end_time || !override_type) {
    return NextResponse.json(
      { error: "date, start_time, end_time y override_type son obligatorios" },
      { status: 400 }
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  const validTypes = new Set(["add", "block"]);
  if (!validTypes.has(override_type)) {
    return NextResponse.json({ error: "override_type inválido" }, { status: 400 });
  }

  const validModalities = new Set(["online", "in_person", "both"]);
  const normalizedModality = validModalities.has(modality) ? modality : "both";

  const { data, error } = await ctx.supabase
    .from("availability_overrides")
    .insert({
      therapist_id: ctx.therapistId,
      date,
      start_time,
      end_time,
      slot_duration: Number(slot_duration) > 0 ? Number(slot_duration) : 50,
      modality: normalizedModality,
      override_type,
      note: note?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Error al crear excepción" }, { status: 500 });
  }

  return NextResponse.json({ override: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const ctx = await getCurrentTherapistId();
  if (!ctx.therapistId) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id es obligatorio" }, { status: 400 });
  }

  const { error } = await ctx.supabase
    .from("availability_overrides")
    .delete()
    .eq("id", id)
    .eq("therapist_id", ctx.therapistId);

  if (error) {
    return NextResponse.json({ error: "Error al eliminar excepción" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
