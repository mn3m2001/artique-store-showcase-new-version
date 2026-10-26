"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import type { StoreSettings } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

interface PhotoTourIntroProps {
  settings?: StoreSettings;
}

export function PhotoTourIntro({ settings }: PhotoTourIntroProps) {
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;

  const [isTouchDevice, setIsTouchDevice] = useState<boolean | null>(null);

  useEffect(() => {
    // Detect touch / tablet / mobile devices safely on the client
    const hasTouch =
      typeof window !== "undefined" &&
      ("ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth <= 1024);
    setIsTouchDevice(Boolean(hasTouch));
  }, []);

  // Before hydration, render desktop placeholder or null to avoid layout shift
  if (isTouchDevice === null) {
    return (
      <section className="atelier-photo-tour relative min-h-[580px] bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C8692F] border-t-transparent animate-spin" />
      </section>
    );
  }

  // 1. Tablet & Mobile Version: Clean, Native, High Performance (No WebGL, Natural Scroll, True Colors)
  if (isTouchDevice) {
    return (
      <section
        className="relative overflow-hidden bg-gradient-to-b from-[#FAF7F2] via-[#F4ECE1] to-[#FAF7F2] py-12 px-5 sm:py-20 sm:px-8 border-b border-[#E8DED1]"
        aria-label={ar ? "واجهة متجر آرتيك" : "Artique Store Hero"}
      >
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          {/* Subtle Damietta Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-[#E8DED1] shadow-warm-xs mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-[#C8692F]" />
            <span className="text-xs font-semibold text-[#8A7968]">
              {ar ? "من دمياط، بكل حب وإتقان" : "From Damietta, with love"}
            </span>
          </div>

          {/* Main Hero Title */}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-[#291D11] leading-tight mb-4 tracking-tight">
            {ar ? (
              <>
                وراء كل غرزة، <br className="sm:hidden" />
                <span className="text-[#C8692F]">يدٌ وقلب</span>
              </>
            ) : (
              <>
                Behind every stitch, <br className="sm:hidden" />
                <span className="text-[#C8692F]">a hand and a heart</span>
              </>
            )}
          </h1>

          {/* Subtitle / Description */}
          <p className="text-sm sm:text-base text-[#8A7968] max-w-xl mx-auto leading-relaxed mb-8">
            {ar
              ? "مشغولات كروشيه وتفاصيل يدوية ننسجها على مهل، لتبقى ذكرى دافئة ترافق يومك وبيتك."
              : "Handcrafted crochet pieces woven with care, made to be a warm memory in your everyday life."}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 w-full sm:w-auto mb-10">
            <Link
              href="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#291D11] hover:bg-[#C8692F] text-white font-semibold px-7 py-3.5 rounded-full text-sm transition-all duration-300 shadow-warm-md"
            >
              <span>{ar ? "تصفح جميع المنتجات" : "Explore shop"}</span>
              <Arrow size={16} />
            </Link>
            <a
              href="#categories"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/80 hover:bg-white text-[#291D11] font-semibold px-6 py-3.5 rounded-full text-sm border border-[#E8DED1] transition-all duration-300"
            >
              <span>{ar ? "استكشف المجموعات" : "View collections"}</span>
              <ChevronDown size={16} />
            </a>
          </div>

          {/* Featured Visual Preview Card */}
          <div className="relative w-full max-w-lg aspect-[16/10] rounded-3xl overflow-hidden shadow-warm-lg border-2 border-white/80 bg-white">
            <Image
              src={settings?.hero_image_url || "/demo-media/5415cb931ba250dc.webp"}
              alt={ar ? "مشغولات آرتيك اليدوية" : "Artique Handcrafted Creations"}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end p-5">
              <span className="text-white text-xs font-semibold backdrop-blur-md bg-black/30 px-3.5 py-1 rounded-full border border-white/20">
                {ar ? "قطع كروشيه حصرية مصممة بالطلب" : "Custom made to order"}
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 2. Desktop Version: Full 3D Interactive WebGL Experience with Mouse Controls
  return (
    <section className="atelier-photo-tour" aria-label="جولة آرتيك التفاعلية">
      <iframe
        className="atelier-photo-tour-frame"
        src="/photo-tour.html"
        title="جولة ثلاثية الأبعاد بمنتجات آرتيك وأسعارها الحالية"
        loading="eager"
      />
    </section>
  );
}
