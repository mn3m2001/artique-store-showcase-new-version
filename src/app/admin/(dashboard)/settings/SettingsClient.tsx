"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { StoreSettings, SettingsHistoryEntry } from "@/types";
import {
  updateStoreSettingsAction,
  rollbackSettingsAction,
  getSettingsHistoryAction,
} from "./actions";
import {
  CreditCard,
  MessageCircle,
  Save,
  CheckCircle,
  AlertCircle,
  Palette,
  Store,
  Mail,
  ShieldCheck,
  Check,
  Sparkles,
  Layers,
  FileText,
  Search,
  Bell,
  Sliders,
  Image as ImageIcon,
  History,
  RotateCcw,
  LayoutGrid,
  ExternalLink,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { InstagramIcon } from "@/components/common/InstagramIcon";

type TabType =
  | "payment"
  | "appearance"
  | "sections"
  | "content"
  | "policies"
  | "seo"
  | "contact"
  | "history";

const CRAFT_IMAGE_PRESETS = [
  {
    "url": "/demo-media/5415cb931ba250dc.webp",
    "name": "طقم سلال كروشيه وردي",
    "category": "سلال وتنظيم"
  },
  {
    "url": "/demo-media/58b0bfad43ad6768.webp",
    "name": "ميدالية كرز كروشيه",
    "category": "ميداليات"
  },
  {
    "url": "/demo-media/58bb70d638680ec1.webp",
    "name": "كوستر كروشيه بقلب",
    "category": "ديكور ومفارش"
  },
  {
    "url": "/demo-media/08b98d35448a4704.webp",
    "name": "ورد كروشيه بألوان ناعمة",
    "category": "ورد"
  },
  {
    "url": "/demo-media/29bf70ef0d4ed153.webp",
    "name": "عروسة أرنب كروشيه",
    "category": "عرائس"
  },
  {
    "url": "/demo-media/logo-67c9bd5fb43debcf.png",
    "name": "لوجو آرتيك",
    "category": "هوية المتجر"
  }
];

export function SettingsClient({
  initialSettings,
}: {
  initialSettings: StoreSettings;
}) {
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [savedSettings, setSavedSettings] = useState<StoreSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState<TabType>("payment");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [history, setHistory] = useState<SettingsHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [rollingBack, setRollingBack] = useState<number | null>(null);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await getSettingsHistoryAction();
      if (res.success && res.history) {
        setHistory(res.history);
      }
    } catch { setErrorMessage("تعذر تحميل سجل النسخ. أعيدي المحاولة بعد التأكد من الاتصال.");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history" && history.length === 0) {
      loadHistory();
    }
  }, [activeTab]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setErrorMessage("");

    try {
      const res = await updateStoreSettingsAction(settings, "حفظ إعدادات المتجر من لوحة التحكم");
      if (res.success && res.settings) {
        setSettings(res.settings);
        setSavedSettings(res.settings);
        setSuccess(true);
        loadHistory();
        setTimeout(() => setSuccess(false), 3500);
      } else {
        setErrorMessage(res.error || "فشل حفظ الإعدادات.");
      }
    } catch (err: unknown) {
      setErrorMessage((err instanceof Error ? err.message : "حدث خطأ غير متوقع") || "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  };

  const handleRollback = async (versionIndex: number) => {
    if (!window.confirm("هل أنت متأكد من استرجاع هذا الإصدار السابق للإعدادات؟")) {
      return;
    }
    setRollingBack(versionIndex);
    setErrorMessage("");
    try {
      const res = await rollbackSettingsAction(versionIndex);
      if (res.success && res.settings) {
        setSettings(res.settings);
        setSavedSettings(res.settings);
        setSuccess(true);
        loadHistory();
        setTimeout(() => setSuccess(false), 3500);
      } else {
        setErrorMessage(res.error || "فشل استرجاع الإصدار.");
      }
    } catch (err: unknown) {
      setErrorMessage((err instanceof Error ? err.message : "حدث خطأ غير متوقع") || "حدث خطأ أثناء الاسترجاع.");
    } finally {
      setRollingBack(null);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#F0EAE1] pb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#291D11]">
            إعدادات المتجر ولوحة التحكم
          </h2>
          <p className="text-xs text-[#8A7968] mt-1">
            التحكم الشامل في طرق الدفع، مشهد الـ 3D والحركة، المحتوى ثنائي اللغة، وسياسات المتجر
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-[#C8692F] hover:bg-[#B35822] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-warm-xs transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>جارٍ الحفظ...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>حفظ جميع التعديلات</span>
            </>
          )}
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>تم حفظ الإعدادات بنجاح وتحديث كافة صفحات المتجر!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E8DED1] pb-3 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("payment")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold cursor-pointer transition-colors ${
            activeTab === "payment"
              ? "bg-[#C8692F] text-white"
              : "bg-white text-[#6E5F50] hover:bg-[#FAF7F2] border border-[#E8DED1]"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>طرق الدفع والتحويل</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("appearance")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold cursor-pointer transition-colors ${
            activeTab === "appearance"
              ? "bg-[#C8692F] text-white"
              : "bg-white text-[#6E5F50] hover:bg-[#FAF7F2] border border-[#E8DED1]"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>المظهر والـ 3D والحركة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sections")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold cursor-pointer transition-colors ${
            activeTab === "sections"
              ? "bg-[#C8692F] text-white"
              : "bg-white text-[#6E5F50] hover:bg-[#FAF7F2] border border-[#E8DED1]"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>أقسام الرئيسية وأزرار التحفيز</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold cursor-pointer transition-colors ${
            activeTab === "content"
              ? "bg-[#C8692F] text-white"
              : "bg-white text-[#6E5F50] hover:bg-[#FAF7F2] border border-[#E8DED1]"
          }`}
        >
          <Store className="w-4 h-4" />
          <span>محتوى الواجهة والوسائط</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("policies")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold cursor-pointer transition-colors ${
            activeTab === "policies"
              ? "bg-[#C8692F] text-white"
              : "bg-white text-[#6E5F50] hover:bg-[#FAF7F2] border border-[#E8DED1]"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>سياسات المتجر والتفصيل</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("seo")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold cursor-pointer transition-colors ${
            activeTab === "seo"
              ? "bg-[#C8692F] text-white"
              : "bg-white text-[#6E5F50] hover:bg-[#FAF7F2] border border-[#E8DED1]"
          }`}
        >
          <Search className="w-4 h-4" />
          <span>محركات البحث (SEO)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("contact")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold cursor-pointer transition-colors ${
            activeTab === "contact"
              ? "bg-[#C8692F] text-white"
              : "bg-white text-[#6E5F50] hover:bg-[#FAF7F2] border border-[#E8DED1]"
          }`}
        >
          <InstagramIcon className="w-4 h-4" />
          <span>قنوات التواصل وشروط الطلب</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold cursor-pointer transition-colors ${
            activeTab === "history"
              ? "bg-[#C8692F] text-white"
              : "bg-white text-[#6E5F50] hover:bg-[#FAF7F2] border border-[#E8DED1]"
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل النسخ والاسترجاع</span>
          {history.length > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "history"
                  ? "bg-white/25 text-white"
                  : "bg-[#C8692F]/15 text-[#C8692F]"
              }`}
            >
              {history.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PAYMENT SETTINGS */}
      {activeTab === "payment" && (
        <div className="space-y-6">
          {/* InstaPay */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8DED1] shadow-warm-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                  IP
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#291D11]">
                    الدفع عبر إنستاباي (InstaPay)
                  </h3>
                  <span className="text-[11px] text-[#8A7968]">
                    تحويل بنكي ولحظي عبر المعرف أو رقم الهاتف
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.instapay_enabled}
                  onChange={(e) =>
                    setSettings({ ...settings, instapay_enabled: e.target.checked })
                  }
                  className="rounded accent-[#C8692F] w-4 h-4"
                />
                <span className="text-xs font-semibold text-[#291D11]">
                  تفعيل إنستاباي
                </span>
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  معرف إنستاباي (IPA Handle) أو رقم الهاتف
                </label>
                <input
                  type="text"
                  placeholder="مثال: artique@instapay أو 01000000000"
                  value={settings.instapay_address || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, instapay_address: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2.5 text-xs text-[#291D11] focus:outline-none focus:border-[#C8692F] font-mono"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#291D11]">
                    تعليمات التحويل للعميل (بالعربية)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="مثال: يرجى تحويل إجمالي المبلغ على الحساب أعلاه ورفع لقطة الشاشة"
                    value={settings.instapay_instructions_ar || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        instapay_instructions_ar: e.target.value,
                      })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2 text-xs text-[#291D11] focus:outline-none focus:border-[#C8692F]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#291D11]">
                    تعليمات التحويل للعميل (بالإنجليزية)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Please transfer the order amount to the InstaPay handle above and upload receipt"
                    value={settings.instapay_instructions_en || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        instapay_instructions_en: e.target.value,
                      })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2 text-xs text-[#291D11] focus:outline-none focus:border-[#C8692F]"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vodafone Cash */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8DED1] shadow-warm-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs">
                  VC
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#291D11]">
                    محفظة فودافون كاش (Vodafone Cash)
                  </h3>
                  <span className="text-[11px] text-[#8A7968]">
                    التحويل المباشر لمحفظة الهاتف الذكي
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.vodafone_cash_enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      vodafone_cash_enabled: e.target.checked,
                    })
                  }
                  className="rounded accent-[#C8692F] w-4 h-4"
                />
                <span className="text-xs font-semibold text-[#291D11]">
                  تفعيل فودافون كاش
                </span>
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  رقم محفظة فودافون كاش
                </label>
                <input
                  type="text"
                  placeholder="010xxxxxxxx"
                  value={settings.vodafone_cash_number || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      vodafone_cash_number: e.target.value,
                    })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2.5 text-xs text-[#291D11] focus:outline-none focus:border-[#C8692F] font-mono"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#291D11]">
                    تعليمات تحويل فودافون كاش (بالعربية)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="مثال: يرجى تحويل المبلغ لرقم المحفظة ورفع لقطة الشاشة"
                    value={settings.vodafone_cash_instructions_ar || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        vodafone_cash_instructions_ar: e.target.value,
                      })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2 text-xs text-[#291D11] focus:outline-none focus:border-[#C8692F]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#291D11]">
                    تعليمات تحويل فودافون كاش (بالإنجليزية)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Please transfer to the Vodafone Cash number above and upload screenshot"
                    value={settings.vodafone_cash_instructions_en || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        vodafone_cash_instructions_en: e.target.value,
                      })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2 text-xs text-[#291D11] focus:outline-none focus:border-[#C8692F]"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cash on Delivery */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8DED1] shadow-warm-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs">
                نقداً
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#291D11]">
                  الدفع نقداً عند الاستلام (COD)
                </h3>
                <span className="text-[11px] text-[#8A7968]">
                  يتم تحصيل المبلغ بمعرفة المندوب عند تسليم المشغولة داخل محافظة دمياط
                </span>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.cod_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, cod_enabled: e.target.checked })
                }
                className="rounded accent-[#C8692F] w-4 h-4"
              />
              <span className="text-xs font-semibold text-[#291D11]">
                تفعيل الدفع عند الاستلام
              </span>
            </label>
          </div>
        </div>
      )}

      {/* TAB 2: APPEARANCE & 3D CONTROLS */}
      {activeTab === "appearance" && (
        <div className="space-y-6">
          {/* Accent Color Palette Selector */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8DED1] shadow-warm-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#291D11]">
              لون الهوية البصرية للمتجر (Accent Theme)
            </h3>
            <p className="text-xs text-[#8A7968]">
              اختاري من لوحة الألوان الدافئة المستوحاة من شعار ومشغولات آرتيك الرسمية:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "terracotta", name: "طين ناري (Terracotta)", color: "#C8692F" },
                { id: "gold", name: "ذهبي أنتيك (Antique Gold)", color: "#B8862B" },
                { id: "olive", name: "زيتوني دافئ (Warm Olive)", color: "#7A7452" },
                { id: "rose", name: "وردي ناعم (Dusty Rose)", color: "#D98A93" },
              ].map((theme) => (
                <button
                  type="button"
                  key={theme.id}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      accent_theme: theme.id as StoreSettings["accent_theme"],
                    })
                  }
                  className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col gap-2 ${
                    settings.accent_theme === theme.id
                      ? "border-[#291D11] ring-2 ring-[#C8692F]/30 bg-[#FAF7F2]"
                      : "border-[#E8DED1] hover:border-[#8A7968] bg-white"
                  }`}
                >
                  <div
                    className="w-full h-8 rounded-xl shadow-2xs"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span className="text-[11px] font-bold text-[#291D11]">
                    {theme.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3D Scene & Motion Intensity Controls */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8DED1] shadow-warm-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#C8692F]" />
                <div>
                  <h3 className="font-serif font-bold text-base text-[#291D11]">
                    مشهد الـ 3D التفاعلي والتأثيرات البصرية
                  </h3>
                  <span className="text-[11px] text-[#8A7968]">
                    التحكم في ظهور مجسم الخيوط ثلاثي الأبعاد وشدة الحركة للزوار
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enable_3d_hero}
                  onChange={(e) =>
                    setSettings({ ...settings, enable_3d_hero: e.target.checked })
                  }
                  className="rounded accent-[#C8692F] w-4 h-4"
                />
                <span className="text-xs font-semibold text-[#291D11]">
                  تفعيل مشهد الـ 3D
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              {/* Motion Intensity */}
              <div className="space-y-2">
                <label className="font-semibold text-[#291D11] flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#C8692F]" />
                  <span>شدة وسرعة حركة الطفو والتفاعل (Motion Intensity)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "low", label: "هادئة (Low)", desc: "طفو بطيء جداً" },
                    { id: "medium", label: "معتدلة (Medium)", desc: "متوازنة وناعمة" },
                    { id: "high", label: "حيوية (High)", desc: "تفاعل وتمايل نشط" },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          hero_motion_intensity: m.id as StoreSettings["hero_motion_intensity"],
                        })
                      }
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        settings.hero_motion_intensity === m.id
                          ? "bg-[#FAF7F2] border-[#C8692F] font-bold text-[#C8692F]"
                          : "bg-white border-[#E8DED1] text-[#6E5F50]"
                      }`}
                    >
                      <div className="text-xs">{m.label}</div>
                      <div className="text-[10px] text-[#8A7968] mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Pattern */}
              <div className="space-y-2">
                <label className="font-semibold text-[#291D11] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#C8692F]" />
                  <span>نمط ملمس الخلفية (Background Pattern)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "yarn_mesh", label: "غرز خيوط", desc: "نسيج دافئ" },
                    { id: "dots", label: "نقاط ناعمة", desc: "تنقيط خفيف" },
                    { id: "clean", label: "سادة", desc: "بدون ملمس" },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          background_pattern: p.id as StoreSettings["background_pattern"],
                        })
                      }
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        settings.background_pattern === p.id
                          ? "bg-[#FAF7F2] border-[#C8692F] font-bold text-[#C8692F]"
                          : "bg-white border-[#E8DED1] text-[#6E5F50]"
                      }`}
                    >
                      <div className="text-xs">{p.label}</div>
                      <div className="text-[10px] text-[#8A7968] mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Announcement Bar */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8DED1] shadow-warm-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-[#C8692F]" />
                <div>
                  <h3 className="font-serif font-bold text-base text-[#291D11]">
                    شريط الإعلانات أعلى الموقع (Announcement Bar)
                  </h3>
                  <span className="text-[11px] text-[#8A7968]">
                    شريط بارز يظهر في أعلى صفحات المتجر لتنبيه الزوار
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.announcement_bar_enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      announcement_bar_enabled: e.target.checked,
                    })
                  }
                  className="rounded accent-[#C8692F] w-4 h-4"
                />
                <span className="text-xs font-semibold text-[#291D11]">
                  تفعيل الشريط
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  نص الإعلان (بالعربية)
                </label>
                <input
                  type="text"
                  placeholder="مثال: شحن مخصص لجميع مدن ومراكز محافظة دمياط فقط | دفع عند الاستلام وإنستاباي"
                  value={settings.announcement_bar_ar || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, announcement_bar_ar: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  نص الإعلان (بالإنجليزية)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Exclusive delivery across Damietta Governorate | Cash on Delivery & InstaPay"
                  value={settings.announcement_bar_en || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, announcement_bar_en: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECTIONS & CTAS */}
      {activeTab === "sections" && (
        <div className="space-y-6">
          {/* Section Visibility Controls */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8DED1] shadow-warm-xs space-y-5">
            <div>
              <h3 className="font-serif font-bold text-base text-[#291D11] flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-[#C8692F]" />
                <span>التحكم في ظهور أقسام الصفحة الرئيسية (Section Toggles)</span>
              </h3>
              <p className="text-xs text-[#8A7968] mt-1">
                يمكنك إخفاء أو إظهار أي قسم من أقسام الواجهة حسب رغبة المتجر والحملات الإعلانية:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[
                {
                  id: "show_hero_section",
                  title: "1. واجهة الهيرو والـ 3D التفاعلي",
                  desc: "الشاشة الافتتاحية مع العنوان الرئيسي، أزرار الطلب، ومجسم كرات الصوف والغرز.",
                  checked: settings.show_hero_section ?? true,
                },
                {
                  id: "show_trust_banner",
                  title: "2. شريط مميزات وثقة آرتيك",
                  desc: "شريط الضمان: هاند ميد أصيل، توصيل سريع لدمياط، عناية بالألوان، وتغليف هدايا.",
                  checked: settings.show_trust_banner ?? true,
                },
                {
                  id: "show_journey_section",
                  title: "3. رحلة الغرزة الحرفية (Craft Journey)",
                  desc: "خطوات الصنع الحقيقي: خيوط قطنية نقية، غرز الكروشيه اليدوية، وتغليف تذكاري أنيق.",
                  checked: settings.show_journey_section ?? true,
                },
                {
                  id: "show_featured_section",
                  title: "4. المشغولات المختارة والأكثر طلباً",
                  desc: "شبكة المنتجات المميزة الموصى بها مع شارات الأكثر طلباً والأسعار الفورية.",
                  checked: settings.show_featured_section ?? true,
                },
                {
                  id: "show_categories_section",
                  title: "5. تصنيفات ومجموعات المشغولات",
                  desc: "بطاقات استعراض التصنيفات (باقات، دمى، محافظ وإكسسوارات) لسهولة التصفح.",
                  checked: settings.show_categories_section ?? true,
                },
                {
                  id: "show_policies_section",
                  title: "6. بطاقات سياسات وضمان المتجر",
                  desc: "ملخص سياسة الشحن في دمياط، شروط التفصيل المخصص، وضمان سلامة القطع.",
                  checked: settings.show_policies_section ?? true,
                },
                {
                  id: "show_story_section",
                  title: "7. حكاية وهوية آرتيك (Brand Story)",
                  desc: "القصة التأسيسية للبراند، فلسفة الغرزة الواحدة، ولمسة الصنع في دمياط.",
                  checked: settings.show_story_section ?? true,
                },
              ].map((sec) => (
                <div
                  key={sec.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    sec.checked
                      ? "bg-[#FAF7F2] border-[#C8692F]/40 shadow-2xs"
                      : "bg-[#F9F7F4]/60 border-[#E8DED1] opacity-75"
                  }`}
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-[#291D11]">{sec.title}</h4>
                    <p className="text-[11px] text-[#8A7968] leading-relaxed">{sec.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={sec.checked}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          [sec.id]: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#DED5CA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C8692F]"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Buttons & CTAs */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8DED1] shadow-warm-xs space-y-6">
            <div>
              <h3 className="font-serif font-bold text-base text-[#291D11] flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-[#C8692F]" />
                <span>أزرار التحفيز والروابط في الهيرو (Hero CTAs)</span>
              </h3>
              <p className="text-xs text-[#8A7968] mt-1">
                تعديل نصوص وروابط الأزرار الرئيسية في شاشة الهيرو للغتين العربية والإنجليزية:
              </p>
            </div>

            {/* Primary Button */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DED1] space-y-3">
              <span className="text-xs font-bold text-[#C8692F] block">
                الزر الرئيسي (Primary CTA - تسوق الآن / استكشف)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-[#291D11]">نص الزر (بالعربية)</label>
                  <input
                    type="text"
                    placeholder="استكشف المشغولات"
                    value={settings.hero_cta_explore_text_ar || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, hero_cta_explore_text_ar: e.target.value })
                    }
                    className="w-full bg-white border border-[#E8DED1] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#291D11]">نص الزر (بالإنجليزية)</label>
                  <input
                    type="text"
                    placeholder="Explore Collection"
                    value={settings.hero_cta_explore_text_en || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, hero_cta_explore_text_en: e.target.value })
                    }
                    className="w-full bg-white border border-[#E8DED1] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#291D11]">رابط التوجيه (URL)</label>
                  <input
                    type="text"
                    placeholder="/products"
                    value={settings.hero_cta_explore_link || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, hero_cta_explore_link: e.target.value })
                    }
                    className="w-full bg-white border border-[#E8DED1] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#C8692F] font-mono"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Secondary Button */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DED1] space-y-3">
              <span className="text-xs font-bold text-[#7A7452] block">
                الزر الثانوي (Secondary CTA - حكايتنا / رحلة الصنع)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-[#291D11]">نص الزر (بالعربية)</label>
                  <input
                    type="text"
                    placeholder="حكاية الغرزة والبراند"
                    value={settings.hero_cta_story_text_ar || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, hero_cta_story_text_ar: e.target.value })
                    }
                    className="w-full bg-white border border-[#E8DED1] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#291D11]">نص الزر (بالإنجليزية)</label>
                  <input
                    type="text"
                    placeholder="Craft Story"
                    value={settings.hero_cta_story_text_en || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, hero_cta_story_text_en: e.target.value })
                    }
                    className="w-full bg-white border border-[#E8DED1] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#291D11]">رابط التوجيه (URL)</label>
                  <input
                    type="text"
                    placeholder="#journey"
                    value={settings.hero_cta_story_link || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, hero_cta_story_link: e.target.value })
                    }
                    className="w-full bg-white border border-[#E8DED1] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#C8692F] font-mono"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONTENT, TEXTS & MEDIA */}
      {activeTab === "content" && (
        <div className="space-y-6">
          {/* Store Name & Tagline in AR & EN */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8DED1] shadow-warm-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#291D11]">
              اسم المتجر والشعار (Store Name & Tagline)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  اسم المتجر (بالعربية)
                </label>
                <input
                  type="text"
                  value={settings.store_name_ar}
                  onChange={(e) =>
                    setSettings({ ...settings, store_name_ar: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  اسم المتجر (بالإنجليزية)
                </label>
                <input
                  type="text"
                  value={settings.store_name_en}
                  onChange={(e) =>
                    setSettings({ ...settings, store_name_en: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  شعار المتجر (بالعربية)
                </label>
                <input
                  type="text"
                  value={settings.tagline_ar}
                  onChange={(e) =>
                    setSettings({ ...settings, tagline_ar: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  شعار المتجر (بالإنجليزية)
                </label>
                <input
                  type="text"
                  value={settings.tagline_en}
                  onChange={(e) =>
                    setSettings({ ...settings, tagline_en: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Hero Section Content in AR & EN */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8DED1] shadow-warm-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#291D11]">
              نصوص الشاشة الرئيسية (Hero Section)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  عنوان الهيرو الرئيسي (بالعربية)
                </label>
                <input
                  type="text"
                  value={settings.hero_title_ar || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, hero_title_ar: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  عنوان الهيرو الرئيسي (بالإنجليزية)
                </label>
                <input
                  type="text"
                  value={settings.hero_title_en || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, hero_title_en: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  العنوان الفرعي (بالعربية)
                </label>
                <textarea
                  rows={2}
                  value={settings.hero_subtitle_ar || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, hero_subtitle_ar: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  العنوان الفرعي (بالإنجليزية)
                </label>
                <textarea
                  rows={2}
                  value={settings.hero_subtitle_en || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, hero_subtitle_en: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Real Craft Hero Image & Alt Texts */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8DED1] shadow-warm-xs space-y-5">
            <div>
              <h3 className="font-serif font-bold text-base text-[#291D11] flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#C8692F]" />
                <span>صورة المنتج الحرفي البارزة في الهيرو (Hero Craft Image)</span>
              </h3>
              <p className="text-xs text-[#8A7968] mt-1">
                تظهر هذه الصورة كعنصر حقيقي أصيل بجوار مشهد الـ 3D التفاعلي، لإبراز ملمس المشغولة الحقيقية:
              </p>
            </div>

            {/* Preview and Selection */}
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Thumbnail Preview */}
              <div className="relative w-36 h-36 rounded-2xl overflow-hidden border border-[#E8DED1] bg-[#FAF7F2] shrink-0 shadow-xs flex items-center justify-center">
                {settings.hero_image_url ? (
                  <img
                    src={settings.hero_image_url}
                    alt={settings.hero_image_alt_ar || "معاينة صورة الهيرو"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-3 text-[11px] text-[#8A7968]">
                    لا توجد صورة محددة
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-xs font-mono">
                  معاينة مباشرة
                </div>
              </div>

              {/* Preset selector */}
              <div className="flex-1 space-y-3 w-full">
                <span className="text-xs font-bold text-[#291D11] block">
                  اختر من الصور الحقيقية المعتمدة لبراند Artique:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CRAFT_IMAGE_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.url}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          hero_image_url: preset.url,
                          hero_image_alt_ar: preset.name,
                          hero_image_alt_en: preset.name,
                        })
                      }
                      className={`p-2 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-2 ${
                        settings.hero_image_url === preset.url
                          ? "border-[#C8692F] bg-[#FAF7F2] ring-1 ring-[#C8692F]"
                          : "border-[#E8DED1] hover:border-[#8A7968] bg-white"
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-[#291D11] truncate">
                          {preset.category}
                        </p>
                        <p className="text-[9px] text-[#8A7968] truncate">
                          {preset.name.split(" ")[0]}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom URL */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-semibold text-[#8A7968]">
                    أو أدخل رابط مخصص لصورة الهيرو:
                  </label>
                  <input
                    type="text"
                    value={settings.hero_image_url || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, hero_image_url: e.target.value })
                    }
                    placeholder="/demo-media/..."
                    className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#C8692F] font-mono"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Alt texts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-[#F0EAE1]">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  النص البديل للصورة (Alt Text بالعربية - لمحركات البحث وذوي الهمم)
                </label>
                <input
                  type="text"
                  placeholder="باقة ورد كروشيه وردية مصنوعة يدوياً من خيوط قطنية"
                  value={settings.hero_image_alt_ar || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, hero_image_alt_ar: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  النص البديل للصورة (Alt Text بالإنجليزية)
                </label>
                <input
                  type="text"
                  placeholder="Handcrafted pink crochet rose bouquet with cotton yarn texture"
                  value={settings.hero_image_alt_en || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, hero_image_alt_en: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Brand Story in AR & EN */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8DED1] shadow-warm-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#291D11]">
              حكاية وقصة آرتيك (Brand Story)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  قصة البراند (بالعربية)
                </label>
                <textarea
                  rows={4}
                  value={settings.brand_story_ar}
                  onChange={(e) =>
                    setSettings({ ...settings, brand_story_ar: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl p-3 text-xs focus:outline-none focus:border-[#C8692F] leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  قصة البراند (بالإنجليزية)
                </label>
                <textarea
                  rows={4}
                  value={settings.brand_story_en || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, brand_story_en: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl p-3 text-xs focus:outline-none focus:border-[#C8692F] leading-relaxed"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Story Image & Alt Texts */}
            <div className="pt-4 border-t border-[#F0EAE1] space-y-4">
              <span className="text-xs font-bold text-[#291D11] block">
                صورة قسم حكاية البراند (Brand Story Image):
              </span>

              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-[#E8DED1] bg-[#FAF7F2] shrink-0 flex items-center justify-center">
                  {settings.brand_story_image_url ? (
                    <img
                      src={settings.brand_story_image_url}
                      alt={settings.brand_story_image_alt_ar || "صورة القصة"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2 text-[10px] text-[#8A7968]">
                      لا توجد صورة
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CRAFT_IMAGE_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.url}
                        onClick={() =>
                          setSettings({
                            ...settings,
                            brand_story_image_url: preset.url,
                            brand_story_image_alt_ar: preset.name,
                            brand_story_image_alt_en: preset.name,
                          })
                        }
                        className={`p-2 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-2 ${
                          settings.brand_story_image_url === preset.url
                            ? "border-[#C8692F] bg-[#FAF7F2] ring-1 ring-[#C8692F]"
                            : "border-[#E8DED1] hover:border-[#8A7968] bg-white"
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-8 h-8 rounded-lg object-cover shrink-0"
                        />
                        <span className="text-[10px] font-bold text-[#291D11] truncate">
                          {preset.category}
                        </span>
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={settings.brand_story_image_url || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, brand_story_image_url: e.target.value })
                    }
                    placeholder="/demo-media/..."
                    className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#C8692F] font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#291D11]">
                    النص البديل لصورة القصة (بالعربية)
                  </label>
                  <input
                    type="text"
                    placeholder="ميدالية وتفاصيل يدوية في ورشة آرتيك بدمياط"
                    value={settings.brand_story_image_alt_ar || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, brand_story_image_alt_ar: e.target.value })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#291D11]">
                    النص البديل لصورة القصة (بالإنجليزية)
                  </label>
                  <input
                    type="text"
                    placeholder="Craft detail and gift packaging from Artique workshop"
                    value={settings.brand_story_image_alt_en || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, brand_story_image_alt_en: e.target.value })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: POLICIES */}
      {activeTab === "policies" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E8DED1] shadow-warm-xs space-y-6">
            <div>
              <h3 className="font-serif font-bold text-base text-[#291D11]">
                سياسات المتجر والضمان والتفصيل
              </h3>
              <p className="text-xs text-[#8A7968] mt-0.5">
                تظهر هذه النصوص في الواجهة الرئيسية وصفحات إتمام الطلب لتوضيح الشروط للعملاء
              </p>
            </div>

            {/* Shipping Policy */}
            <div className="space-y-3 pt-3 border-t border-[#F0EAE1]">
              <h4 className="font-bold text-xs text-[#C8692F]">
                1. سياسة الشحن والتوصيل (Shipping Policy)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-[#291D11]">بالعربية</label>
                  <textarea
                    rows={3}
                    value={settings.shipping_policy_ar || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, shipping_policy_ar: e.target.value })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl p-3 text-xs focus:outline-none focus:border-[#C8692F]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#291D11]">بالإنجليزية</label>
                  <textarea
                    rows={3}
                    value={settings.shipping_policy_en || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, shipping_policy_en: e.target.value })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl p-3 text-xs focus:outline-none focus:border-[#C8692F]"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Custom Orders Policy */}
            <div className="space-y-3 pt-3 border-t border-[#F0EAE1]">
              <h4 className="font-bold text-xs text-[#B8862B]">
                2. سياسة التفصيل الخاص والطلب المخصص (Custom Orders Policy)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-[#291D11]">بالعربية</label>
                  <textarea
                    rows={3}
                    value={settings.custom_orders_policy_ar || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        custom_orders_policy_ar: e.target.value,
                      })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl p-3 text-xs focus:outline-none focus:border-[#C8692F]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#291D11]">بالإنجليزية</label>
                  <textarea
                    rows={3}
                    value={settings.custom_orders_policy_en || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        custom_orders_policy_en: e.target.value,
                      })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl p-3 text-xs focus:outline-none focus:border-[#C8692F]"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Return Policy */}
            <div className="space-y-3 pt-3 border-t border-[#F0EAE1]">
              <h4 className="font-bold text-xs text-[#7A7452]">
                3. سياسة الاسترجاع والاستبدال (Return & Refund Policy)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-[#291D11]">بالعربية</label>
                  <textarea
                    rows={3}
                    value={settings.return_policy_ar || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, return_policy_ar: e.target.value })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl p-3 text-xs focus:outline-none focus:border-[#C8692F]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#291D11]">بالإنجليزية</label>
                  <textarea
                    rows={3}
                    value={settings.return_policy_en || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, return_policy_en: e.target.value })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl p-3 text-xs focus:outline-none focus:border-[#C8692F]"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SEO METADATA */}
      {activeTab === "seo" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E8DED1] shadow-warm-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#291D11]">
              تهيئة محركات البحث (SEO Metadata)
            </h3>
            <p className="text-xs text-[#8A7968]">
              العناوين والوصف الذي يظهر عند البحث في Google أو مشاركة روابط المتجر
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  عنوان المتجر في محركات البحث (بالعربية)
                </label>
                <input
                  type="text"
                  value={settings.seo_meta_title_ar || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, seo_meta_title_ar: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  عنوان المتجر في محركات البحث (بالإنجليزية)
                </label>
                <input
                  type="text"
                  value={settings.seo_meta_title_en || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, seo_meta_title_en: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-[#C8692F]"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  وصف المتجر لمواقع البحث (بالعربية)
                </label>
                <textarea
                  rows={3}
                  value={settings.seo_meta_description_ar || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      seo_meta_description_ar: e.target.value,
                    })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl p-3 text-xs focus:outline-none focus:border-[#C8692F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#291D11]">
                  وصف المتجر لمواقع البحث (بالإنجليزية)
                </label>
                <textarea
                  rows={3}
                  value={settings.seo_meta_description_en || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      seo_meta_description_en: e.target.value,
                    })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl p-3 text-xs focus:outline-none focus:border-[#C8692F]"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CONTACT & CHECKOUT RULES */}
      {activeTab === "contact" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E8DED1] shadow-warm-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#291D11]">
              قنوات التواصل الرسمية
            </h3>

            {/* Instagram */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-[#291D11] flex items-center gap-1.5">
                <InstagramIcon className="w-4 h-4 text-[#FD1D1D]" />
                <span>رابط حساب إنستغرام (القناة الرسمية الأولى)</span>
              </label>
              <input
                type="url"
                value={settings.instagram_url}
                onChange={(e) =>
                  setSettings({ ...settings, instagram_url: e.target.value })
                }
                placeholder="https://www.instagram.com/artique_11/"
                className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2.5 text-xs text-[#291D11] focus:outline-none focus:border-[#C8692F]"
                dir="ltr"
              />
              <span className="text-[11px] text-[#8A7968] block">
                يظهر زر المراسلة على إنستغرام في صفحة إتمام كل طلب لمتابعة التفاصيل مع العميل.
              </span>
            </div>

            {/* WhatsApp */}
            <div className="pt-4 border-t border-[#F0EAE1] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#291D11] flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>تفعيل زر محادثة واتساب (WhatsApp)</span>
                </label>
                <input
                  type="checkbox"
                  checked={settings.whatsapp_enabled}
                  onChange={(e) =>
                    setSettings({ ...settings, whatsapp_enabled: e.target.checked })
                  }
                  className="rounded accent-[#C8692F] w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-[#291D11]">
                  رقم هاتف الواتساب
                </label>
                <input
                  type="text"
                  placeholder="010xxxxxxxx"
                  value={settings.whatsapp_phone}
                  onChange={(e) =>
                    setSettings({ ...settings, whatsapp_phone: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2.5 text-xs text-[#291D11] focus:outline-none focus:border-[#C8692F] font-mono"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Checkout Rules */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8DED1] shadow-warm-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#291D11]">
              قواعد صفحة إتمام الطلب (Checkout)
            </h3>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DED1] flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-[#291D11] block">
                  إلزامية إدخال البريد الإلكتروني للعميل
                </span>
                <span className="text-[11px] text-[#8A7968]">
                  عند التعطيل، يكون البريد اختيارياً ويكتفي العميل برقم الهاتف داخل دمياط.
                </span>
              </div>

              <input
                type="checkbox"
                checked={settings.require_email_at_checkout}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    require_email_at_checkout: e.target.checked,
                  })
                }
                className="rounded accent-[#C8692F] w-5 h-5 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SETTINGS HISTORY & ROLLBACK */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E8DED1] shadow-warm-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#F0EAE1] pb-4">
              <div>
                <h3 className="font-serif font-bold text-base text-[#291D11] flex items-center gap-2">
                  <History className="w-5 h-5 text-[#C8692F]" />
                  <span>سجل النسخ الاحتياطية واسترجاع الإعدادات (Version History)</span>
                </h3>
                <p className="text-xs text-[#8A7968] mt-1">
                  يقوم النظام بحفظ لقطة كاملة من إعدادات المتجر تلقائياً عند كل عملية حفظ لتتمكن من العودة لأي إصدار سابق بضغطة زر:
                </p>
              </div>

              <button
                type="button"
                onClick={loadHistory}
                disabled={loadingHistory}
                className="flex items-center gap-1.5 text-xs text-[#C8692F] hover:text-[#AF5722] font-semibold cursor-pointer self-start sm:self-auto bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E8DED1]"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loadingHistory ? "animate-spin" : ""}`} />
                <span>تحديث السجل</span>
              </button>
            </div>

            {loadingHistory && history.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8A7968] flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-[#C8692F] border-t-transparent rounded-full animate-spin" />
                <span>جارٍ تحميل سجل التعديلات...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#FAF7F2] border border-[#E8DED1] text-center space-y-2">
                <History className="w-8 h-8 text-[#C8692F]/50 mx-auto" />
                <h4 className="text-xs font-bold text-[#291D11]">
                  لا توجد نسخ سابقة محفوظة حتى الآن
                </h4>
                <p className="text-[11px] text-[#8A7968] max-w-md mx-auto">
                  بمجرد إجراء أي تعديل على إعدادات المتجر وحفظها، ستظهر النسخة هنا مع التاريخ والوقت وخيار الاسترجاع الفوري.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <div
                      key={entry.version}
                      className="p-4 rounded-2xl border border-[#E8DED1] bg-[#FAF7F2] hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C8692F]/10 text-[#C8692F] border border-[#C8692F]/20">
                            نسخة #{entry.version}
                          </span>
                          <span className="text-xs font-bold text-[#291D11]">
                            {entry.note || "تعديل إعدادات المتجر"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8A7968]">
                          {new Date(entry.timestamp).toLocaleString("ar-EG", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                        <div className="text-[10px] text-[#7A7452] flex flex-wrap gap-2 pt-1">
                          <span>اسم المتجر: {entry.snapshot.store_name_ar}</span>
                          <span>•</span>
                          <span>لون الهوية: {entry.snapshot.accent_theme}</span>
                          <span>•</span>
                          <span>الـ 3D: {entry.snapshot.enable_3d_hero ? "مفعل" : "معطل"}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={rollingBack === entry.version}
                        onClick={() => handleRollback(entry.version)}
                        className="flex items-center gap-1.5 bg-white hover:bg-[#FAF7F2] text-[#291D11] hover:text-[#C8692F] border border-[#E8DED1] hover:border-[#C8692F] px-4 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
                      >
                        {rollingBack === entry.version ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-[#C8692F] border-t-transparent rounded-full animate-spin" />
                            <span>جارٍ الاسترجاع...</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5 text-[#C8692F]" />
                            <span>استرجاع هذا الإصدار</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIRTY STATE ALERT: STICKY FLOATING FOOTER */}
      {isDirty && (
        <div className="fixed bottom-6 start-4 end-4 md:start-1/2 md:end-auto md:-translate-x-1/2 z-50 bg-[#291D11] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#C8692F]/60 flex items-center justify-between gap-4 animate-slideUp">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#C8692F] shrink-0 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-white">لديك تعديلات غير محفوظة في الإعدادات</p>
              <p className="text-[10px] text-[#D4C3B3]">
                احرص على حفظ التغييرات لتطبيقها على واجهة المتجر والعملاء فوراً.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSettings(savedSettings)}
              className="text-xs px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF7F2] font-semibold transition-colors cursor-pointer"
            >
              إلغاء التعديلات
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-xs px-4 py-1.5 rounded-xl bg-[#C8692F] hover:bg-[#AF5722] text-white font-bold transition-colors shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>حفظ الآن</span>
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
