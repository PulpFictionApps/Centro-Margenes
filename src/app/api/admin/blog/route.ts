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

async function verifyAdmin() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("therapists")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!data || (data.role !== "admin" && data.role !== "super_admin")) return null;
  return user;
}

// GET /api/admin/blog — all posts (admin view, includes unpublished)
export async function GET() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const supabaseAdmin = getAdminClient();
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/blog — create
export async function POST(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json();
  const { title, subtitle, image, paragraphs, published, sort_order } = body;

  if (!title) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
  }
  if (!Array.isArray(paragraphs)) {
    return NextResponse.json({ error: "Los párrafos deben ser un array" }, { status: 400 });
  }

  const supabaseAdmin = getAdminClient();
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .insert({
      title: String(title).trim(),
      subtitle: subtitle ? String(subtitle).trim() || null : null,
      image: image ? String(image).trim() || null : null,
      paragraphs: paragraphs.map((p: string) => String(p).trim()).filter(Boolean),
      published: published !== false,
      sort_order: sort_order ? Number(sort_order) : 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PUT /api/admin/blog — update
export async function PUT(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json();
  const { id, title, subtitle, image, paragraphs, published, sort_order } = body;

  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
  if (!Array.isArray(paragraphs)) {
    return NextResponse.json({ error: "Los párrafos deben ser un array" }, { status: 400 });
  }

  const supabaseAdmin = getAdminClient();
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .update({
      title: String(title).trim(),
      subtitle: subtitle ? String(subtitle).trim() || null : null,
      image: image ? String(image).trim() || null : null,
      paragraphs: paragraphs.map((p: string) => String(p).trim()).filter(Boolean),
      published: published !== false,
      sort_order: sort_order ? Number(sort_order) : 0,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/admin/blog?id=...
export async function DELETE(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const supabaseAdmin = getAdminClient();
  const { error } = await supabaseAdmin
    .from("blog_posts")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
