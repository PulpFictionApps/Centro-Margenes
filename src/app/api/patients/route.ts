import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

// GET /api/patients - List patients
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get current therapist
    const { data: therapist } = await supabase
      .from("therapists")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (!therapist) {
      return NextResponse.json({ error: "Terapeuta no encontrado" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("patients")
      .select("*", { count: "exact" });

    const isAdmin = therapist.role === "admin" || therapist.role === "super_admin";

    if (!isAdmin) {
      const [{ data: ownedLinks }, { data: appointments }] = await Promise.all([
        supabase
          .from("therapist_patients")
          .select("patient_id")
          .eq("therapist_id", therapist.id),
        supabase
          .from("appointments")
          .select("patient_id")
          .eq("therapist_id", therapist.id),
      ]);

      const patientIds = Array.from(
        new Set([
          ...(ownedLinks ?? []).map((row) => row.patient_id),
          ...(appointments ?? []).map((row) => row.patient_id),
        ])
      );

      if (patientIds.length === 0) {
        return NextResponse.json({
          patients: [],
          total: 0,
          page,
          limit,
        });
      }

      query = query.in("id", patientIds);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,document.ilike.%${search}%`);
    }

    const { data: patients, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching patients:", error);
      return NextResponse.json({ error: "Error al obtener pacientes" }, { status: 500 });
    }

    return NextResponse.json({
      patients: patients ?? [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Patients API error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/patients - Create patient
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, birthdate, document } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Nombre, email y teléfono son obligatorios" },
        { status: 400 }
      );
    }

    const { data: therapist } = await supabase
      .from("therapists")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!therapist) {
      return NextResponse.json({ error: "Terapeuta no encontrado" }, { status: 404 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let existingQuery = supabase
      .from("patients")
      .select("id")
      .eq("email", normalizedEmail);

    if (document) {
      existingQuery = existingQuery.or(`document.eq.${document.trim()}`);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      const { error: linkError } = await supabase
        .from("therapist_patients")
        .upsert(
          {
            therapist_id: therapist.id,
            patient_id: existing.id,
            source: "manual",
          },
          { onConflict: "therapist_id,patient_id" }
        );

      if (linkError) {
        console.error("Error linking existing patient:", linkError);
        return NextResponse.json({ error: "Error al vincular paciente" }, { status: 500 });
      }

      return NextResponse.json({
        patient: existing,
        linked: true,
        message: "Paciente existente vinculado a tu cartera",
      });
    }

    const { data: patient, error } = await supabase
      .from("patients")
      .insert({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        birthdate: birthdate || null,
        document: document?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating patient:", error);
      return NextResponse.json({ error: "Error al crear paciente" }, { status: 500 });
    }

    const { error: linkError } = await supabase
      .from("therapist_patients")
      .insert({
        therapist_id: therapist.id,
        patient_id: patient.id,
        source: "manual",
      });

    if (linkError) {
      console.error("Error linking patient:", linkError);
      return NextResponse.json({ error: "Paciente creado pero no vinculado" }, { status: 500 });
    }

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    console.error("Create patient error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
