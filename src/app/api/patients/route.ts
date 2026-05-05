import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
      .select(`
        *,
        appointments!inner (
          id,
          therapist_id,
          date,
          status
        )
      `, { count: "exact" });

    // Filter by therapist unless admin
    if (therapist.role !== "admin" && therapist.role !== "super_admin") {
      query = query.eq("appointments.therapist_id", therapist.id);
    }

    // Search by name, email, or document
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

    // Remove duplicate patients and get unique list
    const uniquePatients = Array.from(
      new Map(patients?.map(p => [p.id, p]) || []).values()
    );

    return NextResponse.json({
      patients: uniquePatients,
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

    // Check if patient with same email or document exists
    let existingQuery = supabase
      .from("patients")
      .select("id")
      .eq("email", email.trim());

    if (document) {
      existingQuery = existingQuery.or(`document.eq.${document.trim()}`);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un paciente con este email o documento", patient: existing },
        { status: 409 }
      );
    }

    const { data: patient, error } = await supabase
      .from("patients")
      .insert({
        name: name.trim(),
        email: email.trim(),
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

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    console.error("Create patient error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
