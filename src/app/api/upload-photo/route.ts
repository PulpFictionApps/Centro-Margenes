import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  // Verify the user is authenticated
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const bucket = (formData.get("bucket") as string) || "therapist-photos";
  const fileName = formData.get("fileName") as string | null;

  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
  if (!fileName) return NextResponse.json({ error: "Nombre de archivo requerido" }, { status: 400 });

  // Validate file type
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido. Use JPG, PNG o WebP." }, { status: 400 });
  }

  // Validate file size (5 MB max)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "El archivo supera el máximo de 5 MB." }, { status: 400 });
  }

  const adminClient = getAdminClient();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Ensure the bucket exists (creates it if missing)
  const { data: buckets } = await adminClient.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === bucket);
  if (!bucketExists) {
    const { error: createErr } = await adminClient.storage.createBucket(bucket, { public: true });
    if (createErr) {
      console.error("[upload-photo] Could not create bucket:", createErr);
      return NextResponse.json({ error: `No se pudo crear el bucket: ${createErr.message}` }, { status: 500 });
    }
  }

  const { error } = await adminClient.storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    console.error("[upload-photo] Storage error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = adminClient.storage.from(bucket).getPublicUrl(fileName);

  return NextResponse.json({ url: urlData.publicUrl });
}
