import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://artique-store.vercel.app";

  // Static core routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/checkout`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  try {
    const products = await db.getProducts({ status: "published" });
    for (const product of products) {
      routes.push({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: new Date(product.updated_at || product.created_at || new Date()),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // If DB read fails during build, core routes are still returned
  }

  return routes;
}
