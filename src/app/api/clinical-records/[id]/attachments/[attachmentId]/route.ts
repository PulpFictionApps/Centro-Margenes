import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// DELETE /api/clinical-records/[id]/attachments/[attachmentId] - Delete attachment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
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

    // Get attachment with record info
    const { data: attachment } = await supabase
      .from("clinical_attachments")
      .select(`
        *,
        clinical_record:clinical_records (therapist_id)
      `)
      .eq("id", params.attachmentId)
      .eq("clinical_record_id", params.id)
      .single();

    if (!attachment) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }

    // Check permission
    const isAdmin = therapist.role === "admin" || therapist.role === "super_admin";
    const isOwner = attachment.uploaded_by === therapist.id;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar este archivo" },
        { status: 403 }
      );
    }

    // Extract storage path from URL
    const url = new URL(attachment.file_url);
    const pathParts = url.pathname.split("/");
    const bucketIndex = pathParts.indexOf("clinical-attachments");
    const storagePath = pathParts.slice(bucketIndex + 1).join("/");

    // Delete from storage
    if (storagePath) {
      await supabase.storage
        .from("clinical-attachments")
        .remove([storagePath]);
    }

    // Delete record
    const { error } = await supabase
      .from("clinical_attachments")
      .delete()
      .eq("id", params.attachmentId);

    if (error) {
      console.error("Error deleting attachment:", error);
      return NextResponse.json({ error: "Error al eliminar archivo" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete attachment error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
