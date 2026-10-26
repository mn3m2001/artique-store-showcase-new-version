"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Product, Category } from "@/types";
import { toggleProductStatusAction, deleteProductAction } from "./actions";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  EyeOff,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export function ProductsTableClient({
  initialProducts,
  categories,
}: {
  initialProducts: Product[];
  categories: Category[];
}) {
  const products = initialProducts;
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name_en.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ? true : p.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" ? true : p.category_id === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleToggleStatus = async (product: Product) => {
    setErrorMessage("");
    setLoadingId(product.id);

    try {
    const res = await toggleProductStatusAction(
      product.id,
      product.status as "published" | "draft"
    );

    if (res.success && res.newStatus) {
      startRefresh(() => router.refresh());
    } else {
      setErrorMessage(res.error || "فشل تغيير حالة المنتج.");
    }
    } catch { setErrorMessage("تعذر الاتصال. أعيدي المحاولة أو حدّثي الصفحة."); }
    finally { setLoadingId(null); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`هل أنتِ متأكدة من رغبتكِ في حذف المشغولة اليدوية "${name}"؟`)) {
      return;
    }

    setLoadingId(id);
    setErrorMessage("");
    try {
    const res = await deleteProductAction(id);
    if (res.success) {
      startRefresh(() => router.refresh());
    } else {
      setErrorMessage(res.error || "فشل حذف المنتج.");
    }
    } catch { setErrorMessage("تعذر الاتصال. أعيدي المحاولة أو حدّثي الصفحة."); }
    finally { setLoadingId(null); }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#291D11]">
            إدارة كتالوج المشغولات ({products.length})
          </h2>
          <p className="text-xs text-[#8A7968] mt-1">
            إضافة وتعديل القطع، تحديد الأسعار، وإدارة النشر أو الحفظ كمسودة
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-[#C8692F] hover:bg-[#B35822] text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-warm-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مشغولة جديدة</span>
        </Link>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-[#E8DED1] shadow-warm-xs flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="البحث باسم القطعة بالعربية أو الإنجليزية..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-4 py-2 text-xs text-[#291D11] pl-9 focus:outline-none focus:border-[#C8692F]"
          />
          <Search className="w-4 h-4 text-[#8A7968] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-2xl border border-[#E8DED1] shrink-0 text-xs">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-colors ${
              statusFilter === "all"
                ? "bg-white text-[#291D11] shadow-2xs font-bold"
                : "text-[#8A7968] hover:text-[#291D11]"
            }`}
          >
            الكل ({products.length})
          </button>
          <button
            onClick={() => setStatusFilter("published")}
            className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-colors ${
              statusFilter === "published"
                ? "bg-emerald-50 text-emerald-800 shadow-2xs font-bold"
                : "text-[#8A7968] hover:text-[#291D11]"
            }`}
          >
            المنشورة ({products.filter((p) => p.status === "published").length})
          </button>
          <button
            onClick={() => setStatusFilter("draft")}
            className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-colors ${
              statusFilter === "draft"
                ? "bg-amber-50 text-amber-800 shadow-2xs font-bold"
                : "text-[#8A7968] hover:text-[#291D11]"
            }`}
          >
            المسودات ({products.filter((p) => p.status === "draft").length})
          </button>
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#FAF7F2] border border-[#E8DED1] rounded-2xl px-3 py-2 text-xs text-[#291D11] focus:outline-none focus:border-[#C8692F]"
        >
          <option value="all">جميع الأقسام ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_ar}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table Container */}
      <div className="bg-white rounded-3xl border border-[#E8DED1] shadow-warm-xs overflow-hidden">
        {/* Mobile Cards View (< md) */}
        <div className="md:hidden divide-y divide-[#F0EAE1]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[#8A7968] text-xs">
              لا توجد منتجات تطابق الفلاتر المحددة.
            </div>
          ) : (
            filtered.map((product) => {
              const cover =
                product.images?.find((img) => img.is_cover)?.url ||
                product.images?.[0]?.url ||
                "/demo-media/5415cb931ba250dc.webp";
              const category = categories.find((c) => c.id === product.category_id);
              const isDraft = product.status === "draft";
              const hasPrice = product.base_price > 0;

              return (
                <div key={product.id} className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#E8DED1] shrink-0">
                      <Image
                        src={cover}
                        alt={product.name_ar}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-xs text-[#291D11] line-clamp-2">
                        {product.name_ar}
                      </h3>
                      <span className="text-[10px] text-[#8A7968] block mt-0.5">
                        {category?.name_ar || "عام"}
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        {hasPrice ? (
                          <span className="font-mono font-bold text-xs text-[#291D11]">
                            {product.base_price} ج.م
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                            غير مسعر
                          </span>
                        )}
                        <span className="text-[10px] text-[#7A7452] bg-[#FAF7F2] px-2 py-0.5 rounded-lg border border-[#E8DED1]">
                          {product.is_made_to_order ? "بالطلب" : "جاهز"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#F0EAE1]">
                    <button
                      onClick={() => handleToggleStatus(product)}
                      disabled={refreshing || loadingId !== null}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all border ${
                        isDraft
                          ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                      }`}
                    >
                      {isDraft ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                          <span>مسودة</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>منشور</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <Link
                        href={`/products/${product.slug}`}
                        target="_blank"
                        className="p-2 text-[#8A7968] hover:text-[#C8692F] hover:bg-[#FAF7F2] rounded-xl transition-colors"
                        title="معاينة"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="p-2 text-[#8A7968] hover:text-[#291D11] hover:bg-[#FAF7F2] rounded-xl transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name_ar)}
                        disabled={refreshing || loadingId !== null}
                        className="p-2 text-[#8A7968] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E8DED1] text-[#8A7968]">
                <th className="py-3.5 px-4 font-semibold">الصورة</th>
                <th className="py-3.5 px-4 font-semibold">اسم المشغولة</th>
                <th className="py-3.5 px-4 font-semibold">القسم</th>
                <th className="py-3.5 px-4 font-semibold">السعر</th>
                <th className="py-3.5 px-4 font-semibold">طبيعة العمل والتنفيذ</th>
                <th className="py-3.5 px-4 font-semibold">حالة النشر</th>
                <th className="py-3.5 px-4 font-semibold text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8A7968]">
                    لا توجد منتجات تطابق الفلاتر المحددة.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const cover =
                    product.images?.find((img) => img.is_cover)?.url ||
                    product.images?.[0]?.url ||
                    "/demo-media/5415cb931ba250dc.webp";
                  const category = categories.find((c) => c.id === product.category_id);
                  const isDraft = product.status === "draft";
                  const hasPrice = product.base_price > 0;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-[#FAF7F2]/60 transition-colors"
                    >
                      {/* Image Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#E8DED1]">
                          <Image
                            src={cover}
                            alt={product.name_ar}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      </td>

                      {/* Product Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#291D11]">
                          {product.name_ar}
                        </div>
                        <div className="text-[11px] text-[#8A7968]">
                          {product.name_en}
                        </div>
                        {product.images && product.images.length > 1 && (
                          <span className="text-[10px] text-[#7A7452] bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#E8DED1] mt-1 inline-block">
                            {product.images.length} صور
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-[#6E5F50]">
                        {category ? category.name_ar : "—"}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4">
                        {hasPrice ? (
                          <span className="font-mono font-bold text-sm text-[#291D11]">
                            {product.base_price} ج.م
                          </span>
                        ) : (
                          <span className="inline-block bg-amber-50 text-amber-800 border border-amber-200 text-[11px] px-2 py-0.5 rounded-lg font-medium">
                            مسودة تحتاج تسعير
                          </span>
                        )}
                      </td>

                      {/* Production details */}
                      <td className="py-3 px-4 text-[#6E5F50]">
                        {product.is_made_to_order ? (
                          <span className="inline-flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3 text-[#B8862B]" />
                            <span>تنفيذ بالطلب ({product.preparation_days} أيام)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>جاهز للشحن ({product.stock_quantity ?? 1} قطعة)</span>
                          </span>
                        )}
                      </td>

                      {/* Status & Quick Toggle */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(product)}
                          disabled={refreshing || loadingId !== null}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all border ${
                            isDraft
                              ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                          }`}
                          title={
                            isDraft
                              ? "اضغطي للنشر على المتجر"
                              : "اضغطي لإلغاء النشر والتحويل لمسودة"
                          }
                        >
                          {isDraft ? (
                            <>
                              <EyeOff className="w-3 h-3 text-amber-600" />
                              <span>مسودة</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>منشور</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-left">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="p-2 text-[#8A7968] hover:text-[#C8692F] hover:bg-[#FAF7F2] rounded-xl transition-colors"
                            title="معاينة في المتجر"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="p-2 text-[#8A7968] hover:text-[#291D11] hover:bg-[#FAF7F2] rounded-xl transition-colors"
                            title="تعديل المشغولة"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id, product.name_ar)}
                            disabled={refreshing || loadingId !== null}
                            className="p-2 text-[#8A7968] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
