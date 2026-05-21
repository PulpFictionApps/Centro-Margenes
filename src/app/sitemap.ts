import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://centromargenes.cl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/terapeutas`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/reservar`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/convenios`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/nuestro-trabajo`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/formacion`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/preguntas-frecuentes`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const { data: therapists } = await supabase
    .from("therapists")
    .select("id, updated_at")
    .eq("active", true);

  const therapistEntries: MetadataRoute.Sitemap = (therapists ?? []).map((t) => ({
    url: `${BASE_URL}/terapeutas/${t.id}`,
    lastModified: new Date(t.updated_at ?? new Date()),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const { data: blogPosts } = await supabase
    .from("blog_posts")
    .select("id, updated_at")
    .eq("published", true)
    .order("updated_at", { ascending: false });

  const blogEntries: MetadataRoute.Sitemap = (blogPosts ?? []).map((post) => ({
    url: `${BASE_URL}/blog/${post.id}`,
    lastModified: new Date(post.updated_at ?? new Date()),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...therapistEntries, ...blogEntries];
}
