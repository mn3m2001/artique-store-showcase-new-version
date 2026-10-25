import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { dataDirectory } from "@/lib/data-path";
import { usesCloudStorage } from "@/lib/cloud";
import { readCloudState, writeCloudState, cloudTransaction } from "./cloud-state";
import {
  Category,
  CustomerSummary,
  FulfillmentStatus,
  Order,
  OrderItemSnapshot,
  OrderStatusHistoryItem,
  PaymentProof,
  PaymentStatus,
  Product,
  ProductStatus,
  RefundDetails,
  ShippingArea,
  StoreSettings,
  SettingsHistoryEntry,
} from "@/types";
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_SHIPPING_AREAS,
} from "./initial-seed";

interface StoreData {
  version: number;
  settings: StoreSettings;
  settingsHistory?: SettingsHistoryEntry[];
  categories: Category[];
  products: Product[];
  shippingAreas: ShippingArea[];
  orders: Order[];
}

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  shippingAreaId: string;
  shippingAddressDetailed: string;
  customerNotes?: string | null;
  paymentMethod: "instapay" | "vodafone_cash" | "cod";
  idempotencyKey?: string;
  items: {
    productId: string;
    variantId?: string | null;
    quantity: number;
    customNote?: string | null;
  }[];
}

const DATA_DIR = path.resolve(/* turbopackIgnore: true */ dataDirectory());
const DATA_FILE = path.join(DATA_DIR, "store.json");

let memoryCache: StoreData | null = null;
let fileLock = Promise.resolve();

async function readStore(): Promise<StoreData> {
  if (usesCloudStorage()) {
    try {
      const data = await readCloudState<StoreData>({ version: 1, settings: INITIAL_SETTINGS, categories: INITIAL_CATEGORIES, products: INITIAL_PRODUCTS, shippingAreas: INITIAL_SHIPPING_AREAS, orders: [] });
      if (data && data.products) {
        data.settings = { ...INITIAL_SETTINGS, ...(data.settings || {}) };
        memoryCache = data;
        return data;
      }
    } catch (err) {
      console.warn("Cloud store read failed, falling back to local/memory:", err);
    }
  }

  if (memoryCache) {
    return memoryCache;
  }

  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed: StoreData = JSON.parse(raw);
    parsed.settings = { ...INITIAL_SETTINGS, ...(parsed.settings || {}) };
    memoryCache = parsed;
    return memoryCache!;
  } catch (error) {
    const initial: StoreData = {
      version: 1,
      settings: INITIAL_SETTINGS,
      categories: INITIAL_CATEGORIES,
      products: INITIAL_PRODUCTS,
      shippingAreas: INITIAL_SHIPPING_AREAS,
      orders: [],
    };
    memoryCache = initial;
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2), "utf8");
    } catch {
      // Ignored if read-only filesystem
    }
    return initial;
  }
}

async function writeStore(data: StoreData): Promise<void> {
  memoryCache = data;
  if (usesCloudStorage()) {
    try {
      await writeCloudState(data);
      return;
    } catch (err) {
      console.warn("Cloud write failed, persisting to memory/disk:", err);
    }
  }
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DATA_FILE}.tmp.${Date.now()}`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmp, DATA_FILE);
  } catch {
    // If filesystem write fails on serverless, memoryCache is already updated
  }
}

export async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  if (usesCloudStorage()) {
    try {
      return await cloudTransaction(fn);
    } catch (err) {
      console.warn("Cloud transaction lock failed, using local lock:", err);
    }
  }
  const next = fileLock.then(fn, fn);
  fileLock = next.then(() => {}, () => {});
  return next;
}

export const DemoStore = {
  async getSettings(): Promise<StoreSettings> {
    const data = await readStore();
    return data.settings;
  },

  async updateSettings(patch: Partial<StoreSettings>, note?: string): Promise<StoreSettings> {
    return withLock(async () => {
      const data = await readStore();
      data.settingsHistory = data.settingsHistory || [];
      // Save current state as historical snapshot before applying patch
      data.settingsHistory.unshift({
        version: Math.max(0, ...data.settingsHistory.map((entry) => entry.version)) + 1,
        timestamp: new Date().toISOString(),
        snapshot: { ...data.settings },
        note: note || "تعديل إعدادات المتجر",
      });
      // Cap at 15 rollback checkpoints
      if (data.settingsHistory.length > 15) {
        data.settingsHistory = data.settingsHistory.slice(0, 15);
      }
      data.settings = { ...data.settings, ...patch };
      await writeStore(data);
      return data.settings;
    });
  },

  async getSettingsHistory(): Promise<SettingsHistoryEntry[]> {
    const data = await readStore();
    return data.settingsHistory || [];
  },

  async rollbackSettings(versionIndex: number): Promise<StoreSettings> {
    return withLock(async () => {
      const data = await readStore();
      if (!data.settingsHistory || !data.settingsHistory[versionIndex]) {
        throw new Error("Invalid history version index");
      }
      const target = data.settingsHistory[versionIndex];
      // Save current state before restoring
      data.settingsHistory.unshift({
        version: Math.max(0, ...data.settingsHistory.map((entry) => entry.version)) + 1,
        timestamp: new Date().toISOString(),
        snapshot: { ...data.settings },
        note: `نقطة استرجاع قبل التراجع للإصدار #${target.version}`,
      });
      data.settings = { ...target.snapshot };
      data.settingsHistory = data.settingsHistory.slice(0, 15);
      await writeStore(data);
      return data.settings;
    });
  },

  async getCategories(): Promise<Category[]> {
    const data = await readStore();
    return [...data.categories].sort((a, b) => a.sort_order - b.sort_order);
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const data = await readStore();
    return data.categories.find((c) => c.slug === slug) || null;
  },

  async getProducts(filters?: {
    categoryId?: string;
    categorySlug?: string;
    status?: ProductStatus;
    search?: string;
    featuredOnly?: boolean;
  }): Promise<Product[]> {
    const data = await readStore();
    let list = [...data.products];

    if (filters?.status) {
      list = list.filter((p) => p.status === filters.status);
    }
    if (filters?.featuredOnly) {
      list = list.filter((p) => p.is_featured);
    }
    if (filters?.categoryId) {
      list = list.filter((p) => p.category_id === filters.categoryId);
    }
    if (filters?.categorySlug) {
      const cat = data.categories.find((c) => c.slug === filters.categorySlug);
      if (cat) {
        list = list.filter((p) => p.category_id === cat.id);
      } else {
        return [];
      }
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name_ar.toLowerCase().includes(q) ||
          p.name_en.toLowerCase().includes(q) ||
          p.description_ar.toLowerCase().includes(q) ||
          p.description_en.toLowerCase().includes(q)
      );
    }

    // Attach category object for each
    return list.map((p) => ({
      ...p,
      category: data.categories.find((c) => c.id === p.category_id),
    }));
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    const data = await readStore();
    const product = data.products.find((p) => p.slug === slug);
    if (!product) return null;
    return {
      ...product,
      category: data.categories.find((c) => c.id === product.category_id),
    };
  },

  async getProductById(id: string): Promise<Product | null> {
    const data = await readStore();
    const product = data.products.find((p) => p.id === id);
    if (!product) return null;
    return {
      ...product,
      category: data.categories.find((c) => c.id === product.category_id),
    };
  },

  async saveProduct(product: Partial<Product> & { id?: string }): Promise<Product> {
    return withLock(async () => {
      const data = await readStore();
      const now = new Date().toISOString();
      const existingIdx = data.products.findIndex((p) => p.id === product.id);

      if (existingIdx >= 0) {
        const updated: Product = {
          ...data.products[existingIdx],
          ...product,
          updated_at: now,
        } as Product;
        data.products[existingIdx] = updated;
        await writeStore(data);
        return updated;
      } else {
        const newProduct: Product = {
          id: product.id || `prod-${Date.now()}`,
          slug: product.slug || `prod-${Date.now()}`,
          category_id: product.category_id || data.categories[0].id,
          name_ar: product.name_ar || "مشغولة جديدة",
          name_en: product.name_en || "New Craft",
          description_ar: product.description_ar || "",
          description_en: product.description_en || "",
          base_price: product.base_price || 0,
          is_made_to_order: product.is_made_to_order ?? true,
          preparation_days: product.preparation_days ?? 3,
          stock_quantity: product.stock_quantity ?? null,
          is_featured: product.is_featured ?? false,
          status: product.status || "draft",
          allow_custom_notes: product.allow_custom_notes ?? true,
          images: product.images || [],
          variants: product.variants || [],
          created_at: now,
          updated_at: now,
        };
        data.products.push(newProduct);
        await writeStore(data);
        return newProduct;
      }
    });
  },

  async deleteProduct(id: string): Promise<boolean> {
    return withLock(async () => {
      const data = await readStore();
      const len = data.products.length;
      data.products = data.products.filter((p) => p.id !== id);
      await writeStore(data);
      return data.products.length < len;
    });
  },

  async getShippingAreas(onlyEnabled = false): Promise<ShippingArea[]> {
    const data = await readStore();
    let areas = [...data.shippingAreas];
    if (onlyEnabled) {
      areas = areas.filter((a) => a.is_enabled);
    }
    return areas.sort((a, b) => a.sort_order - b.sort_order);
  },

  async saveShippingArea(area: Partial<ShippingArea> & { id?: string }): Promise<ShippingArea> {
    return withLock(async () => {
      const data = await readStore();
      const idx = data.shippingAreas.findIndex((a) => a.id === area.id);
      if (idx >= 0) {
        data.shippingAreas[idx] = { ...data.shippingAreas[idx], ...area } as ShippingArea;
        await writeStore(data);
        return data.shippingAreas[idx];
      } else {
        const newArea: ShippingArea = {
          id: area.id || `ship-${Date.now()}`,
          name_ar: area.name_ar || "",
          name_en: area.name_en || "",
          delivery_fee: area.delivery_fee ?? 40,
          estimated_days_min: area.estimated_days_min ?? 1,
          estimated_days_max: area.estimated_days_max ?? 3,
          is_enabled: area.is_enabled ?? true,
          sort_order: area.sort_order ?? data.shippingAreas.length + 1,
        };
        data.shippingAreas.push(newArea);
        await writeStore(data);
        return newArea;
      }
    });
  },

  async deleteShippingArea(id: string): Promise<boolean> {
    return withLock(async () => {
      const data = await readStore();
      data.shippingAreas = data.shippingAreas.filter((a) => a.id !== id);
      await writeStore(data);
      return true;
    });
  },

  // Atomic order creation with server-side recalculation and duplicate checking
  async createOrder(input: CreateOrderInput): Promise<{ order: Order; isDuplicate: boolean }> {
    return withLock(async () => {
      const data = await readStore();

      // Check idempotency duplicate
      if (input.idempotencyKey) {
        const existing = data.orders.find((o) => o.idempotency_key === input.idempotencyKey);
        if (existing) {
          return { order: existing, isDuplicate: true };
        }
      }

      // 1. Verify Shipping Area
      const area = data.shippingAreas.find((a) => a.id === input.shippingAreaId && a.is_enabled);
      if (!area) {
        throw new Error("Invalid or disabled Damietta shipping area.");
      }

      // 2. Server-side validation of products and price calculation
      const itemSnapshots: OrderItemSnapshot[] = [];
      let calculatedSubtotal = 0;

      if (!input.items.length) throw new Error("Cart is empty.");
      const requested = new Map<string, number>();
      for (const reqItem of input.items) {
        const product = data.products.find((p) => p.id === reqItem.productId);
        if (!product || product.status !== "published") {
          throw new Error(`Product ${reqItem.productId} is unavailable.`);
        }

        if (!Number.isInteger(reqItem.quantity) || reqItem.quantity <= 0 || reqItem.quantity > 99) {
          throw new Error("Item quantity must be at least 1.");
        }

        let unitPrice = product.base_price;
        let variantNameAr: string | null = null;
        let variantNameEn: string | null = null;

        if (reqItem.variantId) {
          const variant = product.variants?.find((v) => v.id === reqItem.variantId);
          if (!variant || variant.is_available === false) throw new Error("Selected variant is unavailable.");
          if (variant) {
            if (variant.price_override && variant.price_override > 0) {
              unitPrice = variant.price_override;
            }
            variantNameAr = variant.name_ar;
            variantNameEn = variant.name_en;
          }
        }

        if (!Number.isFinite(unitPrice) || unitPrice <= 0) throw new Error("Product price is unavailable.");
        const stockVariant = product.variants?.find((v) => v.id === reqItem.variantId);
        const stockKey = `${product.id}:${stockVariant?.stock_quantity != null ? stockVariant.id : "default"}`;
        const cumulative = (requested.get(stockKey) || 0) + reqItem.quantity;
        requested.set(stockKey, cumulative);
        const stock = stockVariant?.stock_quantity ?? product.stock_quantity;
        if (!product.is_made_to_order && stock !== null && stock !== undefined && cumulative > stock) throw new Error("Requested quantity exceeds available stock.");

        const coverImage =
          product.images?.find((img) => img.is_cover)?.url ||
          product.images?.[0]?.url ||
          "/demo-media/5415cb931ba250dc.webp";

        itemSnapshots.push({
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          order_id: "",
          product_id: product.id,
          product_name_ar: product.name_ar,
          product_name_en: product.name_en,
          variant_id: reqItem.variantId || null,
          variant_name_ar: variantNameAr,
          variant_name_en: variantNameEn,
          unit_price: unitPrice,
          quantity: reqItem.quantity,
          custom_note: reqItem.customNote || null,
          product_cover_image: coverImage,
        });

        calculatedSubtotal += unitPrice * reqItem.quantity;
      }

      const deliveryFee = area.delivery_fee;
      const totalAmount = calculatedSubtotal + deliveryFee;

      const now = new Date().toISOString();
      const orderId = `ord-${randomUUID()}`;
      const orderNumber = `ARTQ-${randomUUID().slice(0, 8).toUpperCase()}`;

      // Assign order ID to item snapshots
      for (const item of itemSnapshots) {
        item.order_id = orderId;
      }

      const initialHistory: OrderStatusHistoryItem[] = [
        {
          id: `hist-${Date.now()}-1`,
          order_id: orderId,
          type: "fulfillment",
          new_status: "new",
          comment: "تم استلام الطلب من العميل بنجاح",
          created_at: now,
          created_by: "system",
        },
        {
          id: `hist-${Date.now()}-2`,
          order_id: orderId,
          type: "payment",
          new_status: input.paymentMethod === "cod" ? "unpaid" : "awaiting_proof",
          comment:
            input.paymentMethod === "cod"
              ? "الدفع عند الاستلام - مستحق السداد نقداً"
              : "طريقة دفع إلكترونية - بانتظار تحويل المبلغ ورفع إشعار التحويل",
          created_at: now,
          created_by: "system",
        },
      ];

      const newOrder: Order = {
        id: orderId,
        order_number: orderNumber,
        idempotency_key: input.idempotencyKey,
        customer_name: input.customerName.trim(),
        customer_phone: input.customerPhone.trim(),
        customer_email: input.customerEmail?.trim() || null,
        shipping_area_id: area.id,
        shipping_area_name_ar: area.name_ar,
        shipping_area_name_en: area.name_en,
        shipping_address_detailed: input.shippingAddressDetailed.trim(),
        customer_notes: input.customerNotes?.trim() || null,

        subtotal_amount: calculatedSubtotal,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,

        payment_method: input.paymentMethod,
        payment_status: input.paymentMethod === "cod" ? "unpaid" : "awaiting_proof",
        fulfillment_status: "new",

        expected_delivery_date: null,
        actual_delivery_date: null,
        internal_notes: null,
        refund_details: null,

        created_at: now,
        updated_at: now,

        items: itemSnapshots,
        proofs: [],
        history: initialHistory,
      };

      data.orders.unshift(newOrder);
      for (const [key, count] of requested) {
        const [productId, variantId] = key.split(":");
        const product = data.products.find((p) => p.id === productId)!;
        if (product.is_made_to_order) continue;
        const variant = product.variants?.find((v) => v.id === variantId);
        if (variant?.stock_quantity != null) variant.stock_quantity -= count;
        else if (product.stock_quantity != null) product.stock_quantity -= count;
      }
      await writeStore(data);

      return { order: newOrder, isDuplicate: false };
    });
  },

  async getOrderById(id: string): Promise<Order | null> {
    const data = await readStore();
    return data.orders.find((o) => o.id === id) || null;
  },

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const data = await readStore();
    return data.orders.find((o) => o.order_number.toUpperCase() === orderNumber.toUpperCase()) || null;
  },

  async getOrders(filters?: {
    status?: string;
    paymentMethod?: string;
    search?: string;
  }): Promise<Order[]> {
    const data = await readStore();
    let list = [...data.orders];

    if (filters?.status) {
      list = list.filter((o) => o.fulfillment_status === filters.status);
    }
    if (filters?.paymentMethod) {
      list = list.filter((o) => o.payment_method === filters.paymentMethod);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q)
      );
    }
    return list;
  },

  async updateOrderStatus(
    orderId: string,
    input: {
      fulfillmentStatus?: FulfillmentStatus;
      paymentStatus?: PaymentStatus;
      internalNotes?: string;
      expectedDeliveryDate?: string | null;
      actualDeliveryDate?: string | null;
      refundDetails?: RefundDetails | null;
      actor?: string;
      comment?: string;
    }
  ): Promise<Order> {
    return withLock(async () => {
      const data = await readStore();
      const order = data.orders.find((o) => o.id === orderId);
      if (!order) throw new Error("Order not found");

      const now = new Date().toISOString();
      const history = order.history || [];

      if (input.fulfillmentStatus && input.fulfillmentStatus !== order.fulfillment_status) {
        history.push({
          id: `hist-${Date.now()}-f`,
          order_id: orderId,
          type: "fulfillment",
          previous_status: order.fulfillment_status,
          new_status: input.fulfillmentStatus,
          comment: input.comment || `تغيير حالة الشحن إلى: ${input.fulfillmentStatus}`,
          created_at: now,
          created_by: input.actor || "admin",
        });
        order.fulfillment_status = input.fulfillmentStatus;
      }

      if (input.paymentStatus && input.paymentStatus !== order.payment_status) {
        let paymentComment = input.comment || `تغيير حالة الدفع إلى: ${input.paymentStatus}`;
        if (input.paymentStatus === "refunded" && input.refundDetails) {
          paymentComment = `تم تسجيل استرداد المبلغ: ${input.refundDetails.amount} ج.م - السبب: ${input.refundDetails.reason}${input.refundDetails.reference ? ` (المرجع: ${input.refundDetails.reference})` : ""}`;
        }
        history.push({
          id: `hist-${Date.now()}-p`,
          order_id: orderId,
          type: "payment",
          previous_status: order.payment_status,
          new_status: input.paymentStatus,
          comment: paymentComment,
          created_at: now,
          created_by: input.actor || "admin",
        });
        order.payment_status = input.paymentStatus;
      }

      if (input.refundDetails !== undefined) {
        order.refund_details = input.refundDetails;
      }

      if (input.internalNotes !== undefined) {
        order.internal_notes = input.internalNotes;
      }
      if (input.expectedDeliveryDate !== undefined) {
        order.expected_delivery_date = input.expectedDeliveryDate;
      }
      if (input.actualDeliveryDate !== undefined) {
        order.actual_delivery_date = input.actualDeliveryDate;
      }

      order.history = history;
      order.updated_at = now;
      await writeStore(data);
      return order;
    });
  },

  async submitPaymentProof(orderId: string, fileUrl: string): Promise<PaymentProof> {
    return withLock(async () => {
      const data = await readStore();
      const order = data.orders.find((o) => o.id === orderId);
      if (!order) throw new Error("Order not found");

      const now = new Date().toISOString();
      const proof: PaymentProof = {
        id: `proof-${Date.now()}`,
        order_id: orderId,
        file_url: fileUrl,
        uploaded_at: now,
        status: "pending",
      };

      order.proofs = order.proofs || [];
      order.proofs.push(proof);

      // Payment remains awaiting manual review — never automatically verified!
      order.payment_status = "awaiting_review";

      order.history = order.history || [];
      order.history.push({
        id: `hist-${Date.now()}-proof`,
        order_id: orderId,
        type: "payment",
        comment: "تم رفع إشعار تحويل جديد بواسطة العميل (قيد المراجعة اليدوية)",
        created_at: now,
        created_by: "customer",
      });

      order.updated_at = now;
      await writeStore(data);
      return proof;
    });
  },

  async reviewPaymentProof(
    orderId: string,
    proofId: string,
    input: { status: "accepted" | "rejected"; note?: string; actor?: string }
  ): Promise<Order> {
    return withLock(async () => {
      const data = await readStore();
      const order = data.orders.find((o) => o.id === orderId);
      if (!order) throw new Error("Order not found");

      const proof = order.proofs?.find((p) => p.id === proofId);
      if (!proof) throw new Error("Proof not found");

      const now = new Date().toISOString();
      proof.status = input.status;
      proof.reviewed_at = now;
      proof.review_note = input.note || "";

      if (input.status === "accepted") {
        order.payment_status = "verified";
      } else {
        order.payment_status = "rejected";
      }

      order.history = order.history || [];
      order.history.push({
        id: `hist-${Date.now()}-rev`,
        order_id: orderId,
        type: "payment",
        comment:
          input.status === "accepted"
            ? `تم قبول إشعار التحويل واعتماد الدفع: ${input.note || ""}`
            : `تم رفض إشعار التحويل: ${input.note || "سبب غير محدد"}`,
        created_at: now,
        created_by: input.actor || "admin",
      });

      order.updated_at = now;
      await writeStore(data);
      return order;
    });
  },

  async getCustomers(): Promise<CustomerSummary[]> {
    const data = await readStore();
    const customerMap = new Map<string, CustomerSummary>();

    for (const order of data.orders) {
      const key = order.customer_phone.trim();
      const existing = customerMap.get(key);
      if (!existing) {
        customerMap.set(key, {
          id: `cust-${key}`,
          name: order.customer_name,
          phone: order.customer_phone,
          email: order.customer_email,
          orders_count: 1,
          total_spent: order.total_amount,
          first_order_at: order.created_at,
          last_order_at: order.created_at,
        });
      } else {
        existing.orders_count += 1;
        existing.total_spent += order.total_amount;
        if (new Date(order.created_at) < new Date(existing.first_order_at)) {
          existing.first_order_at = order.created_at;
        }
        if (new Date(order.created_at) > new Date(existing.last_order_at)) {
          existing.last_order_at = order.created_at;
        }
      }
    }

    return Array.from(customerMap.values()).sort(
      (a, b) => new Date(b.last_order_at).getTime() - new Date(a.last_order_at).getTime()
    );
  },
};
