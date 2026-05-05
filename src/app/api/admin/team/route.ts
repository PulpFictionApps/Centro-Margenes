import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

// GET /api/admin/team - List team members (therapists)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: currentUser } = await supabase
      .from("therapists")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Only super_admin can access team management
    if (currentUser.role !== "super_admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get("include_inactive") === "true";
    const role = searchParams.get("role");

    let query = supabase
      .from("therapists")
      .select(`
        *,
        appointments:appointments (id, status)
      `)
      .order("name");

    if (!includeInactive) {
      query = query.eq("active", true);
    }

    if (role) {
      query = query.eq("role", role);
    }

    const { data: team, error } = await query;

    if (error) {
      console.error("Error fetching team:", error);
      return NextResponse.json({ error: "Error al obtener equipo" }, { status: 500 });
    }

    // Calculate stats for each team member
    const teamWithStats = team?.map(member => ({
      ...member,
      total_appointments: member.appointments?.length || 0,
      completed_appointments: member.appointments?.filter(
        (a: { status: string }) => a.status === "completed"
      ).length || 0,
      appointments: undefined, // Remove raw appointments array
    }));

    return NextResponse.json({ team: teamWithStats });
  } catch (error) {
    console.error("Team API error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/admin/team - Create new team member
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: currentUser } = await supabase
      .from("therapists")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (!currentUser || currentUser.role !== "super_admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      password,
      role = "therapist",
      bio = "",
      specialties = [],
      salary,
      hire_date,
      offers_online = true,
      offers_in_person = true,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from("therapists")
      .select("id")
      .eq("email", email.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 409 }
      );
    }

    // Create Supabase auth user using admin API (requires service role key)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "Configuración del servidor incompleta" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name.trim(),
      },
    });

    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError);
      return NextResponse.json(
        { error: "Error al crear cuenta de usuario" },
        { status: 500 }
      );
    }

    // Create therapist profile
    const { data: therapist, error } = await supabaseAdmin
      .from("therapists")
      .insert({
        user_id: authData.user.id,
        name: name.trim(),
        email: email.trim(),
        bio,
        specialties,
        role,
        salary: salary || null,
        hire_date: hire_date || null,
        offers_online,
        offers_in_person,
        active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating therapist profile:", error);
      // Try to clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Error al crear perfil de terapeuta" },
        { status: 500 }
      );
    }

    return NextResponse.json({ therapist }, { status: 201 });
  } catch (error) {
    console.error("Create team member error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
