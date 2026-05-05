import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

// POST /api/clinical-records/[id]/attachments - Upload attachment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check record exists and permission
    const { data: record } = await supabase
      .from("clinical_records")
      .select("id, therapist_id")
      .eq("id", params.id)
      .single();

    if (!record) {
      return NextResponse.json({ error: "Ficha clínica no encontrada" }, { status: 404 });
    }

    const isAdmin = therapist.role === "admin" || therapist.role === "super_admin";
    if (!isAdmin && record.therapist_id !== therapist.id) {
      return NextResponse.json({ error: "No tienes acceso a esta ficha" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const description = formData.get("description") as string;

    if (!file) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Solo PDF e imágenes." },
        { status: 400 }
      );
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El archivo no puede superar 10MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split(".").pop();
    const filename = `${params.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("clinical-attachments")
      .upload(filename, file, {
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Error al subir archivo" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("clinical-attachments")
      .getPublicUrl(filename);

    // Create attachment record
    const { data: attachment, error: dbError } = await supabase
      .from("clinical_attachments")
      .insert({
        clinical_record_id: params.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: urlData.publicUrl,
        description: description || null,
        uploaded_by: therapist.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      // Try to clean up uploaded file
      await supabase.storage.from("clinical-attachments").remove([filename]);
      return NextResponse.json(
        { error: "Error al guardar registro de archivo" },
        { status: 500 }
      );
    }

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    console.error("Upload attachment error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// GET /api/clinical-records/[id]/attachments - List attachments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check record exists and permission
    const { data: record } = await supabase
      .from("clinical_records")
      .select("id, therapist_id")
      .eq("id", params.id)
      .single();

    if (!record) {
      return NextResponse.json({ error: "Ficha clínica no encontrada" }, { status: 404 });
    }

    const isAdmin = therapist.role === "admin" || therapist.role === "super_admin";
    if (!isAdmin && record.therapist_id !== therapist.id) {
      return NextResponse.json({ error: "No tienes acceso a esta ficha" }, { status: 403 });
    }

    const { data: attachments, error } = await supabase
      .from("clinical_attachments")
      .select("*")
      .eq("clinical_record_id", params.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching attachments:", error);
      return NextResponse.json({ error: "Error al obtener archivos" }, { status: 500 });
    }

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error("Get attachments error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
