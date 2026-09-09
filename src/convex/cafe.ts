import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─────────────────────────────────────────────────────
// Orders + Payments
// ─────────────────────────────────────────────────────

export const placeOrder = mutation({
  args: {
    orderNumber: v.string(),
    items: v.array(
      v.object({
        productId: v.string(),
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
        customizations: v.optional(v.array(v.string())),
        addOns: v.optional(v.array(v.string())),
      }),
    ),
    subtotal: v.number(),
    tax: v.number(),
    discount: v.number(),
    couponCode: v.optional(v.string()),
    total: v.number(),
    orderType: v.union(
      v.literal("dine-in"),
      v.literal("takeaway"),
      v.literal("delivery"),
    ),
    tableNumber: v.optional(v.string()),
    guestName: v.optional(v.string()),
    guestPhone: v.optional(v.string()),
    notes: v.optional(v.string()),
    paymentMethod: v.string(),
    utr: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const orderId = await ctx.db.insert("orders", {
      orderNumber: args.orderNumber,
      items: args.items,
      subtotal: args.subtotal,
      tax: args.tax,
      discount: args.discount,
      couponCode: args.couponCode,
      total: args.total,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: args.paymentMethod,
      tableNumber: args.tableNumber ? Number(args.tableNumber) : undefined,
      guestName: args.guestName,
      guestPhone: args.guestPhone,
      notes: args.notes,
      orderType: args.orderType,
    });

    const paymentId = await ctx.db.insert("payments", {
      orderId,
      orderNumber: args.orderNumber,
      amount: args.total,
      method: args.paymentMethod,
      status: args.utr ? "pending_verification" : "pending",
      utr: args.utr,
      receiptId: `RCPT-${args.orderNumber.replace(/^TBR-/, "").slice(0, 8)}`,
      paidAt: now,
    });

    // Redeem the coupon exactly once, when the order is placed.
    if (args.couponCode) {
      const offer = await ctx.db
        .query("offers")
        .withIndex("by_code", (q) => q.eq("code", args.couponCode!))
        .first();
      if (offer) {
        await ctx.db.patch(offer._id, { usedCount: offer.usedCount + 1 });
      }
    }

    return {
      orderId,
      paymentId,
      receiptId: `RCPT-${args.orderNumber.replace(/^TBR-/, "").slice(0, 8)}`,
    };
  },
});

export const listOrders = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("orders").order("desc").take(100);
  },
});

export const getOrderByNumber = query({
  args: { orderNumber: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderNumber", (q) => q.eq("orderNumber", args.orderNumber))
      .first();
    if (!order) return null;
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_order", (q) => q.eq("orderId", order._id))
      .first();
    return { order, payment };
  },
});

export const updateOrderStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("delivered"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const listPayments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("payments").order("desc").take(100);
  },
});

export const verifyPayment = mutation({
  args: {
    id: v.id("payments"),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.id);
    if (!payment) return;
    await ctx.db.patch(args.id, {
      status: args.verified ? "verified" : "failed",
      verifiedAt: args.verified ? Date.now() : undefined,
    });
    await ctx.db.patch(payment.orderId, {
      paymentStatus: args.verified ? "paid" : "failed",
    });
  },
});

// ─────────────────────────────────────────────────────
// Service requests (table-side taps)
// ─────────────────────────────────────────────────────

export const recordServiceRequest = mutation({
  args: {
    table: v.string(),
    type: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("serviceRequests", {
      table: args.table,
      type: args.type,
      note: args.note,
      resolved: false,
      createdAt: Date.now(),
    });
  },
});

export const resolveServiceRequest = mutation({
  args: { id: v.id("serviceRequests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { resolved: true });
  },
});

export const listServiceRequests = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("serviceRequests").order("desc").take(100);
  },
});

// ─────────────────────────────────────────────────────
// Offers / coupons
// ─────────────────────────────────────────────────────

const offerPatch = {
  code: v.string(),
  description: v.optional(v.string()),
  title: v.optional(v.string()),
  tag: v.optional(v.string()),
  discountType: v.union(v.literal("percentage"), v.literal("fixed")),
  discountValue: v.number(),
  minOrder: v.number(),
  maxDiscount: v.optional(v.number()),
  validUntil: v.number(),
  active: v.boolean(),
};

export const listOffers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("offers").order("desc").take(100);
  },
});

export const listActiveOffers = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const all = await ctx.db.query("offers").collect();
    return all.filter((o) => o.active && o.validUntil > now);
  },
});

export const saveOffer = mutation({
  args: offerPatch,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("offers")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, description: args.description ?? existing.description });
      return existing._id;
    }
    return await ctx.db.insert("offers", {
      ...args,
      description: args.description ?? "",
      validFrom: Date.now(),
      usedCount: 0,
    });
  },
});

export const deleteOffer = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const offer = await ctx.db
      .query("offers")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (offer) await ctx.db.delete(offer._id);
  },
});

/** Validate a coupon at checkout. Returns the computed discount or an error. */
export const validateCoupon = query({
  args: { code: v.string(), subtotal: v.number() },
  handler: async (ctx, args) => {
    const code = args.code.trim().toUpperCase();
    const offer = await ctx.db
      .query("offers")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (!offer) return { ok: false as const, error: "That code isn't valid." };
    if (!offer.active) return { ok: false as const, error: "This coupon is no longer active." };
    if (offer.validUntil < Date.now()) return { ok: false as const, error: "This coupon has expired." };
    if (offer.usageLimit != null && offer.usedCount >= offer.usageLimit)
      return { ok: false as const, error: "This coupon has reached its usage limit." };
    if (args.subtotal < offer.minOrder)
      return { ok: false as const, error: `Minimum order ₹${offer.minOrder} required.` };

    const raw =
      offer.discountType === "percentage"
        ? Math.round((args.subtotal * offer.discountValue) / 100)
        : offer.discountValue;
    const discount = Math.min(raw, offer.maxDiscount ?? raw, args.subtotal);
    return { ok: true as const, code, discount, description: offer.description };
  },
});

// ─────────────────────────────────────────────────────
// Product availability flags (sold out / low stock)
// ─────────────────────────────────────────────────────

export const listProductFlags = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("productFlags").collect();
  },
});

export const setProductAvailability = mutation({
  args: {
    productId: v.string(),
    available: v.boolean(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("productFlags")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { available: args.available, note: args.note });
    } else {
      await ctx.db.insert("productFlags", args);
    }
  },
});

// ─────────────────────────────────────────────────────
// Tables
// ─────────────────────────────────────────────────────

export const listTables = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tables").withIndex("by_number").collect();
  },
});

export const saveTable = mutation({
  args: {
    number: v.number(),
    capacity: v.number(),
    section: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tables")
      .withIndex("by_number", (q) => q.eq("number", args.number))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { capacity: args.capacity, section: args.section });
      return existing._id;
    }
    return await ctx.db.insert("tables", { ...args, status: "available" });
  },
});

export const deleteTable = mutation({
  args: { number: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tables")
      .withIndex("by_number", (q) => q.eq("number", args.number))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const setTableStatus = mutation({
  args: {
    number: v.number(),
    status: v.union(
      v.literal("available"),
      v.literal("occupied"),
      v.literal("reserved"),
      v.literal("bill_requested"),
    ),
  },
  handler: async (ctx, args) => {
    const table = await ctx.db
      .query("tables")
      .withIndex("by_number", (q) => q.eq("number", args.number))
      .first();
    if (!table) {
      await ctx.db.insert("tables", { number: args.number, capacity: 4, section: "Indoor", status: args.status });
      return;
    }
    await ctx.db.patch(table._id, { status: args.status });
  },
});

// ─────────────────────────────────────────────────────
// Settings (key/value café config)
// ─────────────────────────────────────────────────────

export const listSettings = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("settings").collect();
    const map: Record<string, string> = {};
    rows.forEach((r) => (map[r.key] = r.value));
    return map;
  },
});

export const saveSettings = mutation({
  args: { values: v.array(v.object({ key: v.string(), value: v.string() })) },
  handler: async (ctx, args) => {
    for (const { key, value } of args.values) {
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { value });
      } else {
        await ctx.db.insert("settings", { key, value });
      }
    }
  },
});

// ─────────────────────────────────────────────────────
// Reviews
// ─────────────────────────────────────────────────────

export const listApprovedReviews = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_approved", (q) => q.eq("approved", true))
      .order("desc")
      .take(24);
  },
});

export const listAllReviews = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("reviews").order("desc").take(100);
  },
});

export const submitReview = mutation({
  args: {
    name: v.string(),
    rating: v.number(),
    text: v.string(),
    orderNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("reviews", {
      ...args,
      approved: false,
      createdAt: Date.now(),
    });
  },
});

export const setReviewApproval = mutation({
  args: { id: v.id("reviews"), approved: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { approved: args.approved });
  },
});

export const deleteReview = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ─────────────────────────────────────────────────────
// One-time seed: default offers, tables, and settings
// ─────────────────────────────────────────────────────

const DEFAULT_OFFERS = [
  { code: "BELGRAVIA10", description: "10% off your first order, up to ₹200.", title: "10% Off Your First Order", tag: "New Guests", discountType: "percentage" as const, discountValue: 10, minOrder: 300, maxDiscount: 200 },
  { code: "STUDENT15", description: "15% student discount on orders above ₹200.", title: "15% Student Discount", tag: "Students", discountType: "percentage" as const, discountValue: 15, minOrder: 200, maxDiscount: 150 },
  { code: "HAPPY3PM", description: "Happy hours — 20% off between 3 and 6 PM.", title: "Happy Hours — 20% Off", tag: "Afternoon", discountType: "percentage" as const, discountValue: 20, minOrder: 0, maxDiscount: 100 },
  { code: "SWEET100", description: "₹100 off orders above ₹1,000.", title: "₹100 Off ₹1,000+", tag: "Special", discountType: "fixed" as const, discountValue: 100, minOrder: 1000 },
];

const DEFAULT_TABLES: { number: number; capacity: number; section: string }[] = [
  ...Array.from({ length: 5 }, (_, i) => ({ number: i + 1, capacity: [2, 2, 4, 4, 4][i], section: "Indoor" })),
  ...Array.from({ length: 5 }, (_, i) => ({ number: i + 6, capacity: [4, 4, 6, 6, 8][i], section: "Terrace" })),
  ...Array.from({ length: 2 }, (_, i) => ({ number: i + 11, capacity: [6, 8][i], section: "Private" })),
];

const DEFAULT_SETTINGS: Record<string, string> = {
  cafeName: "The Belgravia Roast",
  tagline: "Where Every Roast Tells a Story.",
  phone: "+91 98765 43210",
  email: "hello@thebelgraviaroast.in",
  address: "42 Belgravia Lane, New Delhi 110001",
  upiId: "7728059988@ptyes",
  taxRate: "5",
  openTime: "08:00",
  closeTime: "23:00",
  avgPrepMinutes: "12",
};

export const seedCafeData = mutation({
  args: {},
  handler: async (ctx) => {
    const seeded: string[] = [];

    for (const offer of DEFAULT_OFFERS) {
      const existing = await ctx.db
        .query("offers")
        .withIndex("by_code", (q) => q.eq("code", offer.code))
        .first();
      if (!existing) {
        await ctx.db.insert("offers", {
          ...offer,
          validFrom: Date.now(),
          validUntil: Date.now() + 180 * 86400000,
          active: true,
          usedCount: 0,
        });
        seeded.push(`offer:${offer.code}`);
      }
    }

    for (const t of DEFAULT_TABLES) {
      const existing = await ctx.db
        .query("tables")
        .withIndex("by_number", (q) => q.eq("number", t.number))
        .first();
      if (!existing) {
        await ctx.db.insert("tables", { ...t, status: "available" });
        seeded.push(`table:${t.number}`);
      }
    }

    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();
      if (!existing) {
        await ctx.db.insert("settings", { key, value });
        seeded.push(`setting:${key}`);
      }
    }

    return { seeded };
  },
});
