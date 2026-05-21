import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/api/", "/auth/", "/login", "/cancelar", "/evaluar"],
      },
    ],
    sitemap: "https://centromargenes.cl/sitemap.xml",
  };
}
