import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

// GET /api/evaluations - List evaluations
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: therapist } = await supabase
      .from("therapists")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (!therapist) {
      return NextResponse.json({ error: "Terapeuta no encontrado" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const therapistId = searchParams.get("therapist_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("evaluations")
      .select(`
        *,
        appointment:appointments (id, date, time),
        therapist:therapists (id, name),
        patient:patients (id, name)
      `, { count: "exact" });

    // Filter by therapist
    // Admin viewing a specific therapist (admin panel) → filter by that therapistId.
    // Everyone else — including an admin on their own dashboard — sees only their own.
    const isAdmin = therapist.role === "admin" || therapist.role === "super_admin";
    const targetTherapistId =
      isAdmin && therapistId ? therapistId : therapist.id;

    query = query.eq("therapist_id", targetTherapistId);

    const { data: evaluations, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching evaluations:", error);
      return NextResponse.json({ error: "Error al obtener evaluaciones" }, { status: 500 });
    }

    // Calculate average rating (scoped to the same therapist)
    let avgQuery = supabase
      .from("evaluations")
      .select("rating")
      .eq("therapist_id", targetTherapistId);

    const { data: allRatings } = await avgQuery;
    const averageRating = allRatings && allRatings.length > 0
      ? allRatings.reduce((acc, e) => acc + e.rating, 0) / allRatings.length
      : null;

    return NextResponse.json({
      evaluations,
      total: count || 0,
      page,
      limit,
      averageRating: averageRating ? Math.round(averageRating * 100) / 100 : null,
    });
  } catch (error) {
    console.error("Evaluations API error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/evaluations - Create evaluation (public, for patients)
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    // Use service role to bypass RLS — this is a public endpoint for patients
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = serviceRoleKey
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )
      : supabase;
    const body = await request.json();
    const { appointment_id, rating, comment, is_anonymous } = body;

    if (!appointment_id || !rating) {
      return NextResponse.json(
        { error: "La cita y la calificación son obligatorias" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "La calificación debe ser entre 1 y 5" },
        { status: 400 }
      );
    }

    // Verify appointment exists and is completed.
    // Use the admin client so unauthenticated patients can submit evaluations
    // without being blocked by RLS (the appointment is validated by ID, not by auth).
    const { data: appointment } = await supabaseAdmin
      .from("appointments")
      .select("id, therapist_id, patient_id, status")
      .eq("id", appointment_id)
      .single();

    if (!appointment) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    if (appointment.status !== "completed") {
      return NextResponse.json(
        { error: "Solo se pueden evaluar citas completadas" },
        { status: 400 }
      );
    }

    // Check if already evaluated
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("evaluations")
      .select("id")
      .eq("appointment_id", appointment_id)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing evaluation:", existingError);
      return NextResponse.json(
        { error: "Error al validar evaluación existente" },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: "Esta cita ya ha sido evaluada" },
        { status: 409 }
      );
    }

    const { data: evaluation, error } = await supabaseAdmin
      .from("evaluations")
      .insert({
        appointment_id,
        therapist_id: appointment.therapist_id,
        patient_id: appointment.patient_id,
        rating,
        comment: comment || null,
        is_anonymous: is_anonymous || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating evaluation:", error);
      return NextResponse.json({ error: "Error al crear evaluación" }, { status: 500 });
    }

    return NextResponse.json({ evaluation }, { status: 201 });
  } catch (error) {
    console.error("Create evaluation error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
