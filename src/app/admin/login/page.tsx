"use client";

import React, { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAdminAction } from "../actions";
import { Lock, User, ArrowLeft, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("from", from);

    try {
      const res = await loginAdminAction(formData);
      if (res.success && res.redirectUrl) {
        router.push(res.redirectUrl);
        router.refresh();
      } else {
        setError(res.error || "بيانات الدخول غير صحيحة");
        setLoading(false);
      }
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "حدث خطأ غير متوقع") || "حدث خطأ غير متوقع");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center items-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-[#E8DED1] shadow-warm-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="relative w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-[#C8692F]/20 shadow-warm-xs bg-[#FAF7F2]">
            <Image
              src="/demo-media/5415cb931ba250dc.webp"
              alt="Artique Logo"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#291D11]">
              لوحة تحكم آرتيك
            </h1>
            <p className="text-xs text-[#8A7968] mt-1">
              إدارة المتجر والطلبات والمشغولات اليدوية
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#291D11]">
              اسم المستخدم
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#291D11] focus:outline-none focus:border-[#C8692F] focus:ring-1 focus:ring-[#C8692F] transition-all pl-10"
              />
              <User className="w-4 h-4 text-[#8A7968] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#291D11]">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#291D11] focus:outline-none focus:border-[#C8692F] focus:ring-1 focus:ring-[#C8692F] transition-all pl-10"
              />
              <Lock className="w-4 h-4 text-[#8A7968] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C8692F] hover:bg-[#B35822] text-white font-semibold py-3 px-6 rounded-2xl text-xs sm:text-sm transition-all shadow-warm-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جارٍ التحقق...</span>
              </>
            ) : (
              <span>تسجيل الدخول إلى لوحة الإدارة</span>
            )}
          </button>
        </form>

        {/* Development Helper Hint (Hidden in Production) */}
        {process.env.NODE_ENV !== "production" && (
          <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DED1] text-[11px] text-[#8A7968] space-y-1">
            <p className="font-semibold text-[#291D11] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#B8862B]" />
              بيانات الدخول الافتراضية للتطوير المحلي:
            </p>
            <p>
              اسم المستخدم: <code className="bg-white px-1.5 py-0.5 rounded border border-[#E8DED1] font-mono text-[#291D11]">admin</code>
            </p>
            <p>
              كلمة المرور: <code className="bg-white px-1.5 py-0.5 rounded border border-[#E8DED1] font-mono text-[#291D11]">artique2026</code>
            </p>
          </div>
        )}

        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#8A7968] hover:text-[#C8692F] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>العودة إلى متجر آرتيك</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2]" />}>
      <AdminLoginContent />
    </Suspense>
  );
}
