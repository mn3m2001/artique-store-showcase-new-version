import React from "react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { AtelierHome } from "@/components/home/AtelierHome";
import { db, isDemoMode } from "@/lib/db";
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_SETTINGS } from "@/lib/db/initial-seed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let isDemo = true;
  let settings = INITIAL_SETTINGS;
  let categories = INITIAL_CATEGORIES;
  let featuredProducts = INITIAL_PRODUCTS.filter((p) => p.is_featured && p.status === "published");

  try {
    isDemo = isDemoMode();
    settings = await db.getSettings();
    categories = await db.getCategories();
    featuredProducts = await db.getProducts({ featuredOnly: true, status: "published" });
  } catch (err) {
    console.warn("HomePage render fallback to seed:", err);
  }

  return (
    <div className="storefront-shell flex-1 flex flex-col min-h-screen bg-[#FAF7F2]">
      <Header
        immersive
        isDemo={isDemo}
        announcement={{
          enabled: settings.announcement_bar_enabled,
          textAr: settings.announcement_bar_ar,
          textEn: settings.announcement_bar_en,
        }}
      />

      <AtelierHome
        settings={settings}
        categories={categories}
        featuredProducts={featuredProducts}
        isDemo={isDemo}
      />

      <Footer />
    </div>
  );
}
