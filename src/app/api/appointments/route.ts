import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET /api/appointments - List appointments with filters
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
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("payment_status");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const therapistId = searchParams.get("therapist_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("appointments")
      .select(`
        *,
        patient:patients (id, name, email, phone),
        therapist:therapists (id, name, email),
        treatment:treatments (id, name, duration_minutes),
        branch:branches (id, name, type)
      `, { count: "exact" });

    // Filter by therapist unless admin
    const isAdmin = therapist.role === "admin" || therapist.role === "super_admin";
    
    if (!isAdmin) {
      query = query.eq("therapist_id", therapist.id);
    } else if (therapistId) {
      query = query.eq("therapist_id", therapistId);
    }

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (paymentStatus) {
      query = query.eq("payment_status", paymentStatus);
    }
    if (startDate) {
      query = query.gte("date", startDate);
    }
    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data: appointments, error, count } = await query
      .order("date", { ascending: false })
      .order("time", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching appointments:", error);
      return NextResponse.json({ error: "Error al obtener citas" }, { status: 500 });
    }

    return NextResponse.json({
      appointments,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Appointments API error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
