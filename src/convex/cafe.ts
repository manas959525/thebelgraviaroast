import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { products } from "../data/menu";

// ─────────────────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────────────────

async function isAdminCtx(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return false;
  const user = await ctx.db.get(userId);
  return user?.role === "admin";
}

/** Throws unless the caller is signed in with the admin role. */
async function assertAdmin(ctx: QueryCtx | MutationCtx): Promise<void> {
  if (!(await isAdminCtx(ctx))) {
    throw new Error("Admin access required. Sign in with the café's admin account.");
  }
}

// ─────────────────────────────────────────────────────
// Server-side price lookups (never trust client totals)
// ─────────────────────────────────────────────────────

function catalogProduct(productId: string) {
  return products.find((p) => p.id === productId);
}

function clampStr(s: string | undefined, max: number): string | undefined {
  const t = s?.trim();
  return t ? t.slice(0, max) : undefined;
}

// ─────────────────────────────────────────────────────────
// Availability status (available / sold_out / unavailable / limited)
// ─────────────────────────────────────────────────────────

export type AvailabilityStatus =
  | "available"
  | "sold_out"
  | "unavailable"
  | "limited";

type FlagRow = { available: boolean; status?: AvailabilityStatus | null } | null | undefined;

/** Sold out / unavailable block ordering; limited stays orderable. */
function flagAvailable(flag: FlagRow, fallback: boolean): boolean {
  if (!flag) return fallback;
  if (flag.status) return flag.status === "available" || flag.status === "limited";
  return flag.available;
}

/** Effective 4-state status for display. */
function flagStatus(flag: FlagRow, fallback: boolean): AvailabilityStatus {
  if (flag?.status) return flag.status;
  if (flag) return flag.available ? "available" : "sold_out";
  return fallback ? "available" : "sold_out";
}

// ─────────────────────────────────────────────────────────
// Café clock (configured timezone) + offer scheduling
// ─────────────────────────────────────────────────────────

const DEFAULT_TZ = "Asia/Kolkata";

function safeTz(tz?: string): string {
  if (!tz) return DEFAULT_TZ;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TZ;
  }
}

function parseHM(t?: string): number | null {
  if (!t) return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(t.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Minutes since midnight in the café's timezone. */
function cafeMinutes(now: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(now));
  const [h, m] = parts.split(":").map(Number);
  return ((h % 24) || 0) * 60 + (m || 0);
}

/** Day of week in the café's timezone (0 = Sunday … 6 = Saturday). */
function cafeDayOfWeek(now: number, tz: string): number {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(new Date(now));
  return Math.max(0, ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd));
}

/** Café-local calendar day (YYYY-MM-DD) — used for daily rotations. */
function cafeDateKey(now: number, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(now));
}

/** Deterministic non-negative hash — stable daily pick rotation, no randomness. */
function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

interface ScheduleFields {
  active: boolean;
  validFrom: number;
  validUntil: number;
  dailyDays?: number[] | null;
  dailyStart?: string | null;
  dailyEnd?: string | null;
}

/**
 * Automatic activation: an offer only counts while it is active AND inside its
 * start/end window, weekday set, and daily time window (café-local time).
 */
function offerInSchedule(o: ScheduleFields, now: number, tz: string): boolean {
  if (!o.active) return false;
  if (now < o.validFrom || now >= o.validUntil) return false;
  if (o.dailyDays && o.dailyDays.length > 0 && !o.dailyDays.includes(cafeDayOfWeek(now, tz))) {
    return false;
  }
  const start = parseHM(o.dailyStart ?? undefined);
  const end = parseHM(o.dailyEnd ?? undefined);
  if (start != null || end != null) {
    const s = start ?? 0;
    const e = end ?? 1439;
    const cur = cafeMinutes(now, tz);
    if (s <= e) {
      if (cur < s || cur >= e) return false;
    } else if (cur < s && cur >= e) {
      return false; // window wraps midnight
    }
  }
  return true;
}

type CafeOpenState = "open" | "closing_soon" | "closed";

function cafeOpenState(
  now: number,
  tz: string,
  openTime?: string,
  closeTime?: string,
  closingSoonMin = 30,
): CafeOpenState {
  const o = parseHM(openTime);
  const c = parseHM(closeTime);
  if (o == null || c == null) return "open"; // unconfigured hours never block
  const cur = cafeMinutes(now, tz);
  const isOpen = o === c ? true : o < c ? cur >= o && cur < c : cur >= o || cur < c;
  if (!isOpen) return "closed";
  const untilClose = (c - cur + 1440) % 1440;
  return untilClose <= Math.max(0, closingSoonMin) ? "closing_soon" : "open";
}

// ── Server-authoritative discount engine ──────────────────

interface PricedLine {
  productId: string;
  price: number;
  quantity: number;
}

interface OfferDoc extends ScheduleFields {
  _id: string & { __tableName: "offers" };
  description: string;
  discountType: "percentage" | "fixed" | "bogo";
  discountValue: number;
  minOrder: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  scopeProductIds?: string[] | null;
  bogoX?: number | null;
  bogoY?: number | null;
  firstOrderOnly?: boolean | null;
}

function scopedLines(offer: OfferDoc, lines: PricedLine[]): PricedLine[] {
  const scope = offer.scopeProductIds;
  if (!scope || scope.length === 0) return lines;
  return lines.filter((l) => scope.includes(l.productId));
}

/**
 * Computes the discount an offer yields for a cart — the single source of
 * truth used by preview (validateCoupon) and commit (placeOrder), so the
 * client can never negotiate a different number.
 */
function computeOfferDiscount(
  offer: OfferDoc,
  lines: PricedLine[],
  subtotal: number,
): number {
  const inScope = scopedLines(offer, lines);
  const scopeSubtotal =
    inScope.length === lines.length
      ? subtotal
      : inScope.reduce((s, l) => s + l.price * l.quantity, 0);

  if (offer.discountType === "bogo") {
    const x = Math.min(Math.max(Math.round(offer.bogoX ?? 1), 1), 20);
    const y = Math.min(Math.max(Math.round(offer.bogoY ?? 1), 1), 20);
    const units: number[] = [];
    inScope.forEach((l) => {
      for (let i = 0; i < l.quantity; i++) units.push(l.price);
    });
    if (units.length === 0) return 0;
    units.sort((a, b) => a - b); // free units are the cheapest ones
    const freeUnits = Math.floor(units.length / (x + y)) * y;
    if (freeUnits === 0) return 0;
    const pct = Math.min(Math.max(offer.discountValue, 0), 100);
    const raw = (units.slice(0, freeUnits).reduce((s, p) => s + p, 0) * pct) / 100;
    return Math.min(Math.round(raw), scopeSubtotal, subtotal);
  }

  const raw =
    offer.discountType === "percentage"
      ? Math.round((scopeSubtotal * offer.discountValue) / 100)
      : offer.discountValue;
  return Math.min(raw, offer.maxDiscount ?? raw, scopeSubtotal, subtotal);
}

/** True when this guest has no prior order (by account, else by phone). */
async function isFirstOrder(
  ctx: QueryCtx | MutationCtx,
  userId: string | null,
  guestPhone?: string,
): Promise<boolean> {
  if (userId) {
    const prior = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId as never))
      .first();
    if (prior) return false;
  }
  const phone = guestPhone ? normalizePhone(guestPhone) : "";
  if (phone.length >= 8) {
    const recent = await ctx.db.query("orders").order("desc").take(500);
    if (recent.some((o) => o.guestPhone && normalizePhone(o.guestPhone) === phone)) {
      return false;
    }
  }
  return true;
}

interface OrderableItem {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  available: boolean;
  customizations?: { name: string; options: { name: string; price: number }[] }[];
  addOns?: { name: string; price: number }[];
}

/**
 * Server-authoritative item resolution used when pricing orders:
 * static catalog + admin price/name edits (productOverrides) + live
 * availability flags + admin-added custom items. Returns null when the
 * item was removed / hidden by an admin.
 */
async function resolveOrderItem(
  ctx: QueryCtx | MutationCtx,
  productId: string,
): Promise<OrderableItem | null> {
  const flag = await ctx.db
    .query("productFlags")
    .withIndex("by_product", (q) => q.eq("productId", productId))
    .first();

  const staticProduct = catalogProduct(productId);
  if (staticProduct) {
    const override = await ctx.db
      .query("productOverrides")
      .withIndex("by_product", (q) => q.eq("productId", productId))
      .first();
    if (override?.hidden) return null;
    const priceEdited = typeof override?.price === "number" && override.price > 0;
    return {
      id: staticProduct.id,
      name: clampStr(override?.name, 120) ?? staticProduct.name,
      price: priceEdited ? (override!.price as number) : staticProduct.price,
      // An admin price edit replaces any static sale price entirely.
      discountPrice: priceEdited ? undefined : staticProduct.discountPrice,
      available: flagAvailable(flag, staticProduct.available),
      customizations: staticProduct.customizations,
      addOns: staticProduct.addOns,
    };
  }

  const custom = await ctx.db
    .query("customProducts")
    .withIndex("by_productId", (q) => q.eq("productId", productId))
    .first();
  if (!custom) return null;
  return {
    id: custom.productId,
    name: custom.name,
    price: custom.price,
    available: flagAvailable(flag, custom.available),
  };
}

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

    // ── 1. Re-price every line from the server-side catalog ──
    // The client's prices/totals are NEVER trusted: only catalog prices plus
    // catalog-priced customizations/add-ons are used for the stored totals.
    if (args.items.length === 0) throw new Error("Your cart is empty.");
    if (args.items.length > 50) throw new Error("Too many items in a single order.");

    const lines = await Promise.all(
      args.items.map(async (item) => {
        const product = await resolveOrderItem(ctx, item.productId);
        if (!product) {
          throw new Error("One of the items is no longer on the menu. Please refresh and try again.");
        }
        if (!product.available) {
          throw new Error(`${product.name} has just sold out. Please remove it and review your order.`);
        }
        const qty = Math.floor(item.quantity);
        if (!Number.isFinite(qty) || qty < 1 || qty > 20) {
          throw new Error(`Invalid quantity for ${product.name}.`);
        }
        const customizations = (item.customizations ?? []).slice(0, 10);
        const addOnNames = (item.addOns ?? []).slice(0, 10);

        // Extras are priced from the catalog only — unknown option names add nothing.
        let extras = 0;
        product.customizations?.forEach((group) =>
          group.options.forEach((opt) => {
            if (customizations.includes(opt.name)) extras += opt.price;
          }),
        );
        addOnNames.forEach((name) => {
          const addOn = product.addOns?.find((a) => a.name === name);
          if (addOn) extras += addOn.price;
        });

        const unit = (product.discountPrice ?? product.price) + extras;
        return {
          productId: product.id,
          name: product.name,
          price: unit,
          quantity: qty,
          customizations: customizations.length ? customizations : undefined,
          addOns: addOnNames.length ? addOnNames : undefined,
        };
      }),
    );

    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

    // ── 2. Café settings (server-authoritative): tax, clock, order policy ──
    const settingsRows = await ctx.db.query("settings").collect();
    const settingsMap: Record<string, string> = {};
    settingsRows.forEach((r) => (settingsMap[r.key] = r.value));

    const taxPct = Math.min(Math.max(Number(settingsMap.taxRate ?? "5") || 5, 0), 30);
    const tax = Math.round((subtotal * taxPct) / 100);

    // Closed-café policy: the admin chooses whether orders are blocked or
    // accepted as pre-orders while the café is shut (`ordersWhenClosed`).
    const tz = safeTz(settingsMap.timezone);
    const openState = cafeOpenState(
      now,
      tz,
      settingsMap.openTime,
      settingsMap.closeTime,
      Number(settingsMap.closingSoonMinutes ?? "30") || 30,
    );
    if (openState === "closed" && settingsMap.ordersWhenClosed === "block") {
      throw new Error(
        `We're closed right now — orders reopen at ${settingsMap.openTime ?? "our opening time"}. You can still browse the menu and book a table.`,
      );
    }

    const userId = await getAuthUserId(ctx);

    // ── 3. Re-validate + atomically redeem the coupon (schedule-safe) ──
    let discount = 0;
    let couponCode: string | undefined = undefined;
    if (args.couponCode) {
      const code = args.couponCode.trim().toUpperCase().slice(0, 40);
      const offer = (await ctx.db
        .query("offers")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first()) as OfferDoc | null;
      let valid =
        !!offer &&
        offerInSchedule(offer, now, tz) &&
        subtotal >= offer.minOrder &&
        (offer.usageLimit == null || offer.usedCount < offer.usageLimit);

      if (valid && offer!.firstOrderOnly) {
        valid = await isFirstOrder(ctx, userId, args.guestPhone);
      }

      if (offer && valid) {
        discount = computeOfferDiscount(offer, lines, subtotal);
        if (discount > 0) {
          couponCode = code;
          await ctx.db.patch(offer!._id, { usedCount: offer!.usedCount + 1 });
        }
      } else if (offer) {
        throw new Error(
          "That coupon is no longer valid (schedule, minimum order, or usage limit). Please remove it and review your order.",
        );
      }
    }

    const total = Math.max(0, subtotal + tax - discount);
    if (Math.abs(total - args.total) > 1) {
      throw new Error(
        "Your total changed (the menu or offers were updated). Please go back and review your order.",
      );
    }

    // ── 4. Dedupe: an order number can only ever create one order row ──
    const orderNumber = args.orderNumber.trim().slice(0, 40);
    const existing = await ctx.db
      .query("orders")
      .withIndex("by_orderNumber", (q) => q.eq("orderNumber", orderNumber))
      .first();
    if (existing) {
      const payment = await ctx.db
        .query("payments")
        .withIndex("by_order", (q) => q.eq("orderId", existing._id))
        .first();
      return {
        orderId: existing._id,
        paymentId: payment?._id,
        receiptId: payment?.receiptId ?? `RCPT-${orderNumber.replace(/^TBR-/, "").slice(0, 8)}`,
      };
    }

    const tableNumber = args.tableNumber ? Math.floor(Number(args.tableNumber)) : undefined;
    if (tableNumber !== undefined && (!Number.isFinite(tableNumber) || tableNumber < 1 || tableNumber > 999)) {
      throw new Error("That table number doesn't look right.");
    }

    const orderId = await ctx.db.insert("orders", {
      userId: userId ?? undefined,
      orderNumber,
      items: lines,
      subtotal,
      tax,
      discount,
      couponCode,
      total,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: args.paymentMethod,
      tableNumber,
      guestName: clampStr(args.guestName, 120),
      guestPhone: clampStr(args.guestPhone, 24),
      notes: clampStr(args.notes, 500),
      orderType: args.orderType,
    });

    const paymentId = await ctx.db.insert("payments", {
      orderId,
      orderNumber,
      amount: total,
      method: args.paymentMethod,
      status: args.utr ? "pending_verification" : "pending",
      utr: clampStr(args.utr, 40),
      receiptId: `RCPT-${orderNumber.replace(/^TBR-/, "").slice(0, 8)}`,
      paidAt: now,
    });

    return {
      orderId,
      paymentId,
      receiptId: `RCPT-${orderNumber.replace(/^TBR-/, "").slice(0, 8)}`,
    };
  },
});

// Admin-only: full order feed for the dashboard / kitchen display.
export const listOrders = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdminCtx(ctx))) return [];
    return await ctx.db.query("orders").order("desc").take(100);
  },
});

// Signed-in customer: only their own orders (never anyone else's).
export const listMyOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
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
    await assertAdmin(ctx);
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const listPayments = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdminCtx(ctx))) return [];
    return await ctx.db.query("payments").order("desc").take(100);
  },
});

export const verifyPayment = mutation({
  args: {
    id: v.id("payments"),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
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
    await assertAdmin(ctx);
    await ctx.db.patch(args.id, { resolved: true });
  },
});

// ─────────────────────────────────────────────────────
// Smart upselling events
// ─────────────────────────────────────────────────────

export const recordUpsellEvent = mutation({
  args: {
    comboId: v.string(),
    mainId: v.string(),
    pairId: v.string(),
    value: v.number(),
    savings: v.number(),
    accepted: v.boolean(),
    orderNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("upsellEvents", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const listUpsellEvents = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdminCtx(ctx))) return [];
    return await ctx.db.query("upsellEvents").order("desc").take(500);
  },
});

export const listServiceRequests = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdminCtx(ctx))) return [];
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
  discountType: v.union(
    v.literal("percentage"),
    v.literal("fixed"),
    v.literal("bogo"),
  ),
  discountValue: v.number(),
  minOrder: v.number(),
  maxDiscount: v.optional(v.number()),
  validFrom: v.optional(v.number()),
  validUntil: v.number(),
  active: v.boolean(),
  usageLimit: v.optional(v.number()),
  // Scheduling (auto activate/deactivate)
  dailyDays: v.optional(v.array(v.number())),
  dailyStart: v.optional(v.string()),
  dailyEnd: v.optional(v.string()),
  firstOrderOnly: v.optional(v.boolean()),
  scopeProductIds: v.optional(v.array(v.string())),
  bogoX: v.optional(v.number()),
  bogoY: v.optional(v.number()),
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
    const rows = await ctx.db.query("settings").collect();
    const map: Record<string, string> = {};
    rows.forEach((r) => (map[r.key] = r.value));
    const tz = safeTz(map.timezone);
    const all = await ctx.db.query("offers").collect();
    // Schedule-aware: offers appear/disappear automatically as their
    // start/end dates, weekdays, and daily windows elapse.
    return all.filter((o) => offerInSchedule(o, now, tz));
  },
});

export const saveOffer = mutation({
  args: offerPatch,
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const code = args.code.trim().toUpperCase().slice(0, 40);
    if (!code) throw new Error("An offer code is required.");
    if (!Number.isFinite(args.discountValue) || args.discountValue < 0) {
      throw new Error("Discount value must be zero or greater.");
    }
    if (args.discountType === "percentage" && args.discountValue > 100) {
      throw new Error("Percentage discounts cannot exceed 100%.");
    }
    if (args.validFrom !== undefined && args.validFrom >= args.validUntil) {
      throw new Error("The start time must be before the end time.");
    }
    if (args.dailyStart && !parseHM(args.dailyStart)) {
      throw new Error("Daily start must be a valid HH:MM time.");
    }
    if (args.dailyEnd && !parseHM(args.dailyEnd)) {
      throw new Error("Daily end must be a valid HH:MM time.");
    }
    const existing = await ctx.db
      .query("offers")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    const clean = { ...args, code, description: args.description ?? existing?.description ?? "" };
    if (existing) {
      await ctx.db.patch(existing._id, clean);
      return existing._id;
    }
    return await ctx.db.insert("offers", {
      ...clean,
      validFrom: args.validFrom ?? Date.now(),
      usedCount: 0,
    });
  },
});

export const deleteOffer = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const offer = await ctx.db
      .query("offers")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (offer) await ctx.db.delete(offer._id);
  },
});

/**
 * Validate a coupon at checkout. Returns the computed discount or an error.
 * Runs the exact same schedule + discount engine as placeOrder, so what the
 * customer previews is what the server commits.
 */
export const validateCoupon = query({
  args: {
    code: v.string(),
    subtotal: v.number(),
    lines: v.optional(
      v.array(
        v.object({ productId: v.string(), price: v.number(), quantity: v.number() }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const code = args.code.trim().toUpperCase().slice(0, 40);
    const offer = (await ctx.db
      .query("offers")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first()) as OfferDoc | null;

    if (!offer) return { ok: false as const, error: "That code isn't valid." };

    const now = Date.now();
    const rows = await ctx.db.query("settings").collect();
    const map: Record<string, string> = {};
    rows.forEach((r) => (map[r.key] = r.value));
    const tz = safeTz(map.timezone);

    if (!offer.active) return { ok: false as const, error: "This coupon is paused." };
    if (now < offer.validFrom)
      return { ok: false as const, error: "This coupon isn't active yet — check its start time." };
    if (now >= offer.validUntil)
      return { ok: false as const, error: "This coupon has expired." };
    if (!offerInSchedule(offer, now, tz)) {
      return {
        ok: false as const,
        error:
          offer.dailyDays?.length || offer.dailyStart || offer.dailyEnd
            ? "This coupon isn't valid today or at this time of day."
            : "This coupon isn't available right now.",
      };
    }
    if (offer.usageLimit != null && offer.usedCount >= offer.usageLimit)
      return { ok: false as const, error: "This coupon has reached its usage limit." };
    if (args.subtotal < offer.minOrder)
      return { ok: false as const, error: `Minimum order ₹${offer.minOrder} required.` };
    if (offer.firstOrderOnly) {
      const userId = await getAuthUserId(ctx);
      const guestPhone = undefined; // preview has no phone yet; account check only
      if (!(await isFirstOrder(ctx, userId, guestPhone))) {
        return { ok: false as const, error: "This coupon is for first-time guests only." };
      }
    }

    const lines = args.lines ?? [];
    const discount = computeOfferDiscount(offer, lines, args.subtotal);
    if (offer.discountType === "bogo" && discount === 0) {
      return {
        ok: false as const,
        error: `Add more items — this is a Buy ${offer.bogoX ?? 1} Get ${offer.bogoY ?? 1} offer.`,
      };
    }
    if (discount <= 0)
      return { ok: false as const, error: "This coupon doesn't apply to the items in your cart." };
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
    // Richer 4-state availability; falls back to the boolean when omitted.
    status: v.optional(
      v.union(
        v.literal("available"),
        v.literal("sold_out"),
        v.literal("unavailable"),
        v.literal("limited"),
      ),
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const status: AvailabilityStatus =
      args.status ?? (args.available ? "available" : "sold_out");
    // Keep the legacy boolean in lockstep so older readers stay correct.
    const available = status === "available" || status === "limited";
    const patch = { available, status, note: args.note };
    const existing = await ctx.db
      .query("productFlags")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("productFlags", { productId: args.productId, ...patch });
    }
  },
});

// ─────────────────────────────────────────────────────
// Catalog edits: admin price/name edits + admin-added items
// ─────────────────────────────────────────────────────

/** Public: the storefront merges these edits onto the static catalog. */
export const listProductOverrides = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("productOverrides").collect();
  },
});

/** Public: items the admin added on top of the static catalog. */
export const listCustomProducts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("customProducts").collect();
  },
});

/** Admin: edit a static catalog item (or soft-remove it via hidden). */
export const saveProductOverride = mutation({
  args: {
    productId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    image: v.optional(v.string()),
    isVeg: v.optional(v.boolean()),
    hidden: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    if (!catalogProduct(args.productId)) {
      throw new Error("Unknown catalog item.");
    }
    if (args.price !== undefined && (!Number.isFinite(args.price) || args.price <= 0)) {
      throw new Error("Price must be greater than zero.");
    }
    const patch: {
      name?: string;
      description?: string;
      price?: number;
      image?: string;
      isVeg?: boolean;
      hidden?: boolean;
      updatedAt: number;
    } = { updatedAt: Date.now() };
    // Only touch the fields that were actually provided so a price-only edit
    // never wipes a previously saved name/description override.
    if (args.name !== undefined) patch.name = clampStr(args.name, 120);
    if (args.description !== undefined) patch.description = clampStr(args.description, 600);
    if (args.price !== undefined) patch.price = args.price;
    if (args.image !== undefined) patch.image = clampStr(args.image, 500);
    if (args.isVeg !== undefined) patch.isVeg = args.isVeg;
    if (args.hidden !== undefined) patch.hidden = args.hidden;
    const existing = await ctx.db
      .query("productOverrides")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("productOverrides", { productId: args.productId, ...patch });
  },
});

/** Admin: revert an edited/hidden item back to the static catalog entry. */
export const clearProductOverride = mutation({
  args: { productId: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const existing = await ctx.db
      .query("productOverrides")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

/** Admin: add a brand-new menu item. */
export const addCustomProduct = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    image: v.string(),
    category: v.string(),
    isVeg: v.boolean(),
    calories: v.optional(v.number()),
    prepTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const name = clampStr(args.name, 120);
    const description = clampStr(args.description, 600);
    const image = clampStr(args.image, 500);
    if (!name || !description) throw new Error("Name and description are required.");
    if (!Number.isFinite(args.price) || args.price <= 0) {
      throw new Error("Price must be greater than zero.");
    }
    if (!image) throw new Error("An image URL is required.");
    const slugBase =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "item";
    const slug = `${slugBase}-${Date.now().toString(36).slice(-4)}`;
    const productId = `db-${slug}`;
    const duplicate = await ctx.db
      .query("customProducts")
      .withIndex("by_productId", (q) => q.eq("productId", productId))
      .first();
    if (duplicate) throw new Error("That item already exists.");
    return await ctx.db.insert("customProducts", {
      productId,
      slug,
      name,
      description,
      price: Math.round(args.price),
      image,
      category: args.category,
      isVeg: args.isVeg,
      rating: 4.5,
      prepTime: Math.min(Math.max(Math.round(args.prepTime ?? 5), 1), 120),
      calories: args.calories,
      tags: [],
      available: true,
      updatedAt: Date.now(),
    });
  },
});

/** Admin: edit an admin-added item (price, name, availability, …). */
export const updateCustomProduct = mutation({
  args: {
    productId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    image: v.optional(v.string()),
    category: v.optional(v.string()),
    isVeg: v.optional(v.boolean()),
    available: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const existing = await ctx.db
      .query("customProducts")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .first();
    if (!existing) throw new Error("Item not found.");
    if (args.price !== undefined && (!Number.isFinite(args.price) || args.price <= 0)) {
      throw new Error("Price must be greater than zero.");
    }
    const patch: {
      name?: string;
      description?: string;
      price?: number;
      image?: string;
      category?: string;
      isVeg?: boolean;
      available?: boolean;
      updatedAt: number;
    } = { updatedAt: Date.now() };
    if (args.name !== undefined) patch.name = clampStr(args.name, 120) ?? existing.name;
    if (args.description !== undefined)
      patch.description = clampStr(args.description, 600) ?? existing.description;
    if (args.price !== undefined) patch.price = args.price;
    if (args.image !== undefined) patch.image = clampStr(args.image, 500) ?? existing.image;
    if (args.category !== undefined) patch.category = args.category;
    if (args.isVeg !== undefined) patch.isVeg = args.isVeg;
    if (args.available !== undefined) patch.available = args.available;
    await ctx.db.patch(existing._id, patch);
  },
});

/** Admin: permanently remove an admin-added item. */
export const deleteCustomProduct = mutation({
  args: { productId: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const existing = await ctx.db
      .query("customProducts")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .first();
    if (existing) await ctx.db.delete(existing._id);
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
    await assertAdmin(ctx);
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
    await assertAdmin(ctx);
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
    await assertAdmin(ctx);
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
// Inventory (admin-only stock tracking)
// ─────────────────────────────────────────────────────

export const listInventory = query({
  args: {},
  handler: async (ctx) => {
    await assertAdmin(ctx);
    return await ctx.db.query("inventory").collect();
  },
});

export const saveInventoryItem = mutation({
  args: {
    id: v.optional(v.id("inventory")),
    name: v.string(),
    unit: v.string(),
    quantity: v.number(),
    lowStockAt: v.number(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const name = args.name.trim();
    if (name.length < 2 || name.length > 80) {
      throw new Error("Item name must be 2–80 characters.");
    }
    if (!Number.isFinite(args.quantity) || args.quantity < 0) {
      throw new Error("Stock cannot be negative.");
    }
    if (!Number.isFinite(args.lowStockAt) || args.lowStockAt < 0) {
      throw new Error("Low-stock threshold cannot be negative.");
    }
    const unit = args.unit.trim() || "units";
    const now = Date.now();
    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing) throw new Error("Inventory item not found.");
      await ctx.db.patch(args.id, {
        name,
        unit,
        quantity: args.quantity,
        lowStockAt: args.lowStockAt,
        updatedAt: now,
      });
      return args.id;
    }
    const duplicate = await ctx.db
      .query("inventory")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
    if (duplicate) {
      throw new Error(`"${name}" is already in your inventory — edit it instead.`);
    }
    return await ctx.db.insert("inventory", {
      name,
      unit,
      quantity: args.quantity,
      lowStockAt: args.lowStockAt,
      updatedAt: now,
    });
  },
});

/** Quick +/- stock adjustment from the inventory table. */
export const adjustInventoryStock = mutation({
  args: { id: v.id("inventory"), delta: v.number() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Inventory item not found.");
    const next = Math.max(0, (item.quantity ?? 0) + args.delta);
    await ctx.db.patch(args.id, { quantity: next, updatedAt: Date.now() });
    return next;
  },
});

export const deleteInventoryItem = mutation({
  args: { id: v.id("inventory") },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const item = await ctx.db.get(args.id);
    if (item) await ctx.db.delete(args.id);
  },
});

// ─────────────────────────────────────────────────────
// Reservations
// ─────────────────────────────────────────────────────

const reservationStatusValidator = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("completed"),
  v.literal("cancelled"),
);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const PHONE_RE = /^[+0-9][0-9 +()-]{6,19}$/;

/** Normalised phone for duplicate comparisons (spaces/dashes ignored). */
function normalizePhone(p: string) {
  return p.replace(/[\s()-]/g, "");
}

/**
 * Public booking endpoint. Validates every field server-side and blocks
 * obvious duplicate/conflicting bookings: the same phone cannot hold the
 * same slot twice, and a slot rejects bookings that would exceed the café's
 * seating capacity.
 */
export const createReservation = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    date: v.string(),
    time: v.string(),
    guests: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const phone = args.phone.trim();
    const email = args.email?.trim() || undefined;
    const notes = args.notes?.trim() || undefined;

    if (name.length < 2 || name.length > 80) {
      throw new Error("Please enter your name (2–80 characters).");
    }
    if (!PHONE_RE.test(phone)) {
      throw new Error("Please enter a valid phone number.");
    }
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }
    if (!DATE_RE.test(args.date)) {
      throw new Error("Please choose a valid date.");
    }
    const day = new Date(`${args.date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(day.getTime())) {
      throw new Error("Please choose a valid date.");
    }
    // Allow same-day bookings (guests often reserve for the evening).
    if (day.getTime() < today.getTime()) {
      throw new Error("Please choose today or a future date.");
    }
    if (!TIME_RE.test(args.time)) {
      throw new Error("Please choose a valid time.");
    }
    if (!Number.isFinite(args.guests) || args.guests < 1 || args.guests > 20) {
      throw new Error("Party size must be between 1 and 20 guests.");
    }

    // Existing active bookings for that day.
    const dayBookings = await ctx.db
      .query("reservations")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    const active = dayBookings.filter(
      (r) => r.status === "pending" || r.status === "confirmed",
    );

    // Obvious duplicate: same phone, same date, same slot.
    const normalized = normalizePhone(phone);
    if (
      active.some(
        (r) => normalizePhone(r.phone) === normalized && r.time === args.time,
      )
    ) {
      throw new Error(
        "You already have a reservation for this slot. Call us if you need to change it.",
      );
    }

    // Conflict check: don't overbook a slot beyond seating capacity.
    const tables = await ctx.db.query("tables").collect();
    const capacity = tables.length
      ? tables.reduce((sum, t) => sum + t.capacity, 0)
      : 30;
    const bookedForSlot = active
      .filter((r) => r.time === args.time)
      .reduce((sum, r) => sum + r.guests, 0);
    if (bookedForSlot + args.guests > capacity) {
      throw new Error(
        "That time slot is fully booked — please pick another time or call us.",
      );
    }

    const userId = await getAuthUserId(ctx);
    const now = Date.now();
    return await ctx.db.insert("reservations", {
      name,
      phone,
      email,
      date: args.date,
      time: args.time,
      guests: args.guests,
      notes: notes ? notes.slice(0, 500) : undefined,
      status: "pending",
      userId: userId ?? undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Admin-only list of every reservation (client sorts for its views). */
export const listReservations = query({
  args: {},
  handler: async (ctx) => {
    await assertAdmin(ctx);
    return await ctx.db.query("reservations").collect();
  },
});

/**
 * The signed-in customer's own reservations (latest 20). Powers the live
 * "booking confirmed" notification on the client; guests get [].
 */
export const listMyReservations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("reservations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});

/** Admin-only status change: confirm / complete / cancel a booking. */
export const updateReservationStatus = mutation({
  args: {
    id: v.id("reservations"),
    status: reservationStatusValidator,
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const reservation = await ctx.db.get(args.id);
    if (!reservation) throw new Error("Reservation not found.");
    await ctx.db.patch(args.id, { status: args.status, updatedAt: Date.now() });
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
    await assertAdmin(ctx);
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

/**
 * One-time contact-info migration (Sep 2026): moves the seeded placeholder
 * phone/email/hours to the real, verified business details. Idempotent and
 * conservative — only patches keys whose value still matches a known-old
 * default, so admin-customized values are never overwritten.
 */
export const migrateContactInfo = mutation({
  args: {},
  handler: async (ctx) => {
    const updates: { key: string; value: string; oldValues: string[] }[] = [
      { key: "phone", value: "+91 7728059988", oldValues: ["+91 98765 43210", "+91 77280 59988"] },
      { key: "email", value: "manasshekhawat095@gmail.com", oldValues: ["hello@thebelgraviaroast.in"] },
      { key: "openTime", value: "10:00", oldValues: ["08:00"] },
      { key: "closeTime", value: "22:00", oldValues: ["23:00"] },
    ];
    const patched: string[] = [];
    for (const u of updates) {
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", u.key))
        .first();
      if (!existing || u.oldValues.includes(existing.value)) {
        if (existing) {
          await ctx.db.patch(existing._id, { value: u.value });
        } else {
          await ctx.db.insert("settings", { key: u.key, value: u.value });
        }
        patched.push(u.key);
      }
    }
    const owner = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "owner"))
      .first();
    if (!owner) {
      await ctx.db.insert("settings", { key: "owner", value: "Manas Shekhawat" });
      patched.push("owner");
    }
    return { patched };
  },
});

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
    if (!(await isAdminCtx(ctx))) return [];
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
    await assertAdmin(ctx);
    await ctx.db.patch(args.id, { approved: args.approved });
  },
});

export const deleteReview = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

/** Normalize a free-form phone the way the frontend + backend do: digits + country prefix. */
export function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.startsWith("00") && digits.length >= 10) return `+${digits.slice(2)}`;
  if (digits.length >= 8) return `+${digits}`;
  return digits;
}

/** Parses the `adminPhone` settings value into a set of normalized E.164 numbers. */
export function parseAdminPhoneNumbers(settings: Record<string, string>): Set<string> {
  const raw = settings.adminPhone ?? "";
  if (!raw.trim()) return new Set();
  const numbers = new Set<string>();
  for (const part of raw.split(",")) {
    const s = part.trim();
    if (!s) continue;
    const n = normalizePhoneNumber(s);
    if (n) numbers.add(n);
  }
  return numbers;
}

// ─────────────────────────────────────────────────────
// Admin identity
// ─────────────────────────────────────────────────────

/**
 * Returns the caller's role. Signed-in phone users are recognized as admin
 * when their phone is listed in the admin config (Settings → `adminPhone`).
 * Silently admin-migrates phone-OTP users whose number matches `adminPhone`,
 * so the admin login experience is the same as any other sign-in.
 */
export const myRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const role = user.role;
    // Email/email-otp users may already have an explicit role from first-run
    // bootstrap. For everyone else, recognize admins by their phone number.
    const adminSettingsRows = await ctx.db.query("settings").collect();
    const adminMap: Record<string, string> = {};
    adminSettingsRows.forEach((r) => (adminMap[r.key] = r.value));
    const adminPhoneNumbers = parseAdminPhoneNumbers(adminMap);
    if (role === "admin") return "admin";
    if (role === "user" || role === "member") return role;
    if (user.phone && adminPhoneNumbers.has(user.phone)) {
      // Phone-OTP accounts read as admin. We intentionally do not write `role`
      // here — that keeps the config point (adminPhone setting) as the single
      // source of truth and avoids stringly admin roles on every phone lookup.
      return "admin";
    }
    return null;
  },
});

/**
 * First-run bootstrap for email/email-otp and anonymous sign-ins: the very
 * first non-phone account may claim the admin role, but only while no admin
 * exists. After that, admin access is controlled by the `adminPhone` setting
 * (and the Convex dashboard for role edits).
 */
export const claimAdminRole = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first, then claim the admin role.");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Signed-in user not found in the database.");
    // Phone-OTP users are handled entirely by myRole + adminPhone config;
    // do not let them self-claim here.
    if (user.isAnonymous) {
      throw new Error("Guest accounts cannot become admin. Sign in with a named account.");
    }
    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();
    if (admins.length > 0) {
      return {
        claimed: false,
        reason:
          "An admin account already exists. Use the phone-number admin login (or ask the owner to grant you access from the Convex dashboard).",
      };
    }
    // Email/email-otp users without an explicit role can become the first admin.
    if (!user.role) {
      await ctx.db.patch(userId, { role: "admin" });
      return { claimed: true };
    }
    return { claimed: false, reason: "This account already has a role assigned." };
  },
});

/** Public: the current admin phone config without revealing anything else. Used by
 * the Auth page to surface the admin phone numbers and caption. */
export const adminPhoneConfig = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("settings").collect();
    const map: Record<string, string> = {};
    rows.forEach((r) => (map[r.key] = r.value));
    return {
      adminPhone: map.adminPhone ?? "",
      caption: map.adminCaption ?? "",
    };
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
  owner: "Manas Shekhawat",
  tagline: "Where Every Roast Tells a Story.",
  phone: "+91 7728059988",
  email: "manasshekhawat095@gmail.com",
  address: "42 Belgravia Lane, New Delhi 110001",
  upiId: "7728059988@ptyes",
  taxRate: "5",
  openTime: "10:00",
  closeTime: "22:00",
  avgPrepMinutes: "12",
};

// ─────────────────────────────────────────────────────
// Scheduled announcements (automatic homepage banner)
// ─────────────────────────────────────────────────────

/** Public: only announcements inside their start/expiry window. */
export const listActiveAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // Deliberately includes active rows whose startAt is still in the future:
    // Convex re-runs queries on data changes, not on the clock, so a banner
    // scheduled to go live while a page is open would otherwise never appear.
    // The client drops rows outside their [startAt, endAt) window on a 30s tick.
    const rows = await ctx.db
      .query("announcements")
      .withIndex("by_active", (q) => q.eq("active", true))
      .take(50);
    return rows
      .filter((a) => a.endAt > now)
      .sort((a, b) => b.startAt - a.startAt)
      .slice(0, 8);
  },
});

/** Admin: every announcement (including scheduled/expired ones). */
export const listAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdminCtx(ctx))) return [];
    return await ctx.db.query("announcements").order("desc").take(100);
  },
});

export const saveAnnouncement = mutation({
  args: {
    id: v.optional(v.id("announcements")),
    message: v.string(),
    tone: v.union(v.literal("info"), v.literal("promo"), v.literal("alert")),
    startAt: v.number(),
    endAt: v.number(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const message = clampStr(args.message, 200);
    if (!message) throw new Error("Announcement text is required (max 200 characters).");
    if (!(args.endAt > args.startAt)) {
      throw new Error("The expiry time must be after the start time.");
    }
    const patch = {
      message,
      tone: args.tone,
      startAt: args.startAt,
      endAt: args.endAt,
      active: args.active,
    };
    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing) throw new Error("Announcement not found.");
      await ctx.db.patch(args.id, patch);
      return args.id;
    }
    return await ctx.db.insert("announcements", {
      ...patch,
      createdAt: Date.now(),
    });
  },
});

export const deleteAnnouncement = mutation({
  args: { id: v.id("announcements") },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const existing = await ctx.db.get(args.id);
    if (existing) await ctx.db.delete(args.id);
  },
});

// ─────────────────────────────────────────────────────
// Live café open/closed status
// ─────────────────────────────────────────────────────

/** Public: live open/closed/closing-soon state from admin-configured hours. */
export const getCafeStatus = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const rows = await ctx.db.query("settings").collect();
    const map: Record<string, string> = {};
    rows.forEach((r) => (map[r.key] = r.value));
    const tz = safeTz(map.timezone);
    const openTime = map.openTime || "10:00";
    const closeTime = map.closeTime || "22:00";
    const closingSoonMin = Number(map.closingSoonMinutes ?? "30") || 30;
    const state = cafeOpenState(now, tz, openTime, closeTime, closingSoonMin);

    const o = parseHM(openTime);
    const c = parseHM(closeTime);
    const cur = cafeMinutes(now, tz);
    const minutesToClose =
      o != null && c != null ? (c - cur + 1440) % 1440 : null;
    const minutesToOpen =
      o != null && c != null ? (o - cur + 1440) % 1440 : null;

    return {
      state,
      openTime,
      closeTime,
      timezone: tz,
      closingSoonMin,
      minutesToClose: state === "closed" ? null : minutesToClose,
      minutesToOpen: state === "closed" ? minutesToOpen : null,
      // Admin policy: block = reject orders while closed; allow = accept
      // orders as pre-orders (the default, preserving current behaviour).
      preOrdersAllowed: map.ordersWhenClosed !== "block",
      acceptOrders: state !== "closed" || map.ordersWhenClosed !== "block",
    };
  },
});

// ─────────────────────────────────────────────────────
// Daily highlights: today's special, picks, new arrivals
// ─────────────────────────────────────────────────────

interface HighlightProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  category: string;
  rating: number;
  price: number;
  dealPrice: number;
  badge?: string;
  status: AvailabilityStatus;
  addedAt: number | null;
  isCustom: boolean;
}

const DAYPART_CATS: Record<string, string[]> = {
  morning: ["cat-coffee", "cat-sandwiches"],
  afternoon: ["cat-cold-coffee", "cat-sides", "cat-pizza"],
  evening: ["cat-shakes", "cat-desserts", "cat-coffee"],
  night: ["cat-desserts", "cat-shakes", "cat-pasta"],
};

function daypartOfMinutes(mins: number): string {
  if (mins >= 5 * 60 && mins < 11 * 60) return "morning";
  if (mins >= 11 * 60 && mins < 16 * 60) return "afternoon";
  if (mins >= 16 * 60 && mins < 21 * 60) return "evening";
  return "night";
}

/**
 * Deterministic, admin-overridable daily content. No AI APIs, no randomness:
 * popularity from real orders + time-of-day affinity + a stable daily rotation.
 */
export const getDailyHighlights = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const [settingsRows, flags, overrides, customRows] = await Promise.all([
      ctx.db.query("settings").collect(),
      ctx.db.query("productFlags").collect(),
      ctx.db.query("productOverrides").collect(),
      ctx.db.query("customProducts").collect(),
    ]);
    const map: Record<string, string> = {};
    settingsRows.forEach((r) => (map[r.key] = r.value));
    const tz = safeTz(map.timezone);
    const daypart = daypartOfMinutes(cafeMinutes(now, tz));

    const flagMap = new Map(flags.map((f) => [f.productId, f]));
    const overrideMap = new Map(overrides.map((o) => [o.productId, o]));

    const pool: HighlightProduct[] = [
      ...products
        .filter((p) => !overrideMap.get(p.id)?.hidden)
        .map((p) => {
          const o = overrideMap.get(p.id);
          const priceEdited = typeof o?.price === "number" && o.price > 0;
          const price = priceEdited ? (o!.price as number) : p.price;
          const flag = flagMap.get(p.id);
          return {
            id: p.id,
            name: o?.name?.trim() || p.name,
            slug: p.slug,
            image: o?.image?.trim() || p.image,
            category: p.category,
            rating: p.rating,
            price,
            dealPrice: priceEdited
              ? price
              : (p.discountPrice ?? Math.round(price * 0.83)),
            badge: p.badge,
            status: flagStatus(flag, p.available),
            addedAt: null,
            isCustom: false,
          };
        }),
      ...customRows
        .filter((c) => !overrideMap.get(c.productId)?.hidden)
        .map((c) => {
          const flag = flagMap.get(c.productId);
          return {
            id: c.productId,
            name: c.name,
            slug: c.slug,
            image: c.image,
            category: c.category,
            rating: c.rating,
            price: c.price,
            dealPrice: c.price,
            badge: undefined as string | undefined,
            status: flagStatus(flag, c.available),
            addedAt: c.updatedAt,
            isCustom: true,
          };
        }),
    ];

    const orderable = (p: HighlightProduct) =>
      p.status === "available" || p.status === "limited";

    // ── Real popularity from recent orders (no PII leaves this query) ──
    const recentOrders = await ctx.db.query("orders").order("desc").take(300);
    const qty = new Map<string, number>();
    recentOrders.forEach((o) => {
      if (o.status === "cancelled") return;
      o.items.forEach((it) => qty.set(it.productId, (qty.get(it.productId) ?? 0) + it.quantity));
    });

    // ── NEW arrivals: admin-added items inside the badge window ──
    const badgeDays = Math.min(Math.max(Number(map.newBadgeDays ?? "14") || 14, 1), 365);
    const badgeCutoff = now - badgeDays * 86400000;
    const newIds = pool
      .filter(
        (p) =>
          orderable(p) &&
          ((p.isCustom && p.addedAt != null && p.addedAt > badgeCutoff) ||
            p.badge === "new"),
      )
      .map((p) => p.id);

    // ── Popular items (real sales, orderable only) ──
    const popularIds = pool
      .filter(orderable)
      .map((p) => ({ id: p.id, score: qty.get(p.id) ?? 0, rating: p.rating }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.rating - a.rating)
      .slice(0, 6)
      .map((x) => x.id);

    // ── Today's special: manual admin pick wins, else deterministic auto ──
    const overrideId = map.specialOverride?.trim();
    let special = pool.find((p) => p.id === overrideId && orderable(p)) ?? null;
    let specialSource: "manual" | "auto" = "manual";
    if (!special) {
      specialSource = "auto";
      const affinity = DAYPART_CATS[daypart] ?? [];
      const candidates = pool.filter((p) => orderable(p) && affinity.includes(p.category));
      const fallback = pool.filter(orderable);
      const ranked = (candidates.length >= 3 ? candidates : fallback)
        .map((p) => ({ p, score: (qty.get(p.id) ?? 0) * 4 + p.rating }))
        .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name))
        .map((x) => x.p);
      if (ranked.length > 0) {
        // Stable within the café's day; rotates automatically each day.
        const rotation = hashString(`${cafeDateKey(now, tz)}:special`) % Math.min(ranked.length, 8);
        special = ranked[rotation];
      }
    }

    // ── Time-aware recommendations (designated dynamic section only) ──
    const affinity = DAYPART_CATS[daypart] ?? [];
    const recommendedIds = pool
      .filter((p) => orderable(p) && p.id !== special?.id)
      .map((p) => ({
        id: p.id,
        score:
          (qty.get(p.id) ?? 0) * 3 +
          p.rating +
          (affinity.includes(p.category) ? 2 : 0) +
          (p.badge === "new" ? 0.5 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((x) => x.id);

    return {
      generatedFor: cafeDateKey(now, tz),
      daypart,
      special: special
        ? {
            productId: special.id,
            name: special.name,
            slug: special.slug,
            image: special.image,
            price: special.price,
            dealPrice: special.dealPrice,
            status: special.status,
            source: specialSource,
          }
        : null,
      recommendedIds,
      popularIds,
      newIds,
      sampledOrders: recentOrders.length,
    };
  },
});

// ─────────────────────────────────────────────────────
// "Customers also ordered" — co-occurrence from real orders
// ─────────────────────────────────────────────────────

export const getRecommendations = query({
  args: { productId: v.string() },
  handler: async (ctx, args) => {
    const orders = await ctx.db.query("orders").order("desc").take(300);
    const counts = new Map<string, number>();
    orders.forEach((o) => {
      if (o.status === "cancelled") return;
      const ids = [...new Set(o.items.map((i) => i.productId))];
      if (!ids.includes(args.productId)) return;
      ids.forEach((other) => {
        if (other !== args.productId) counts.set(other, (counts.get(other) ?? 0) + 1);
      });
    });
    const items = [...counts.entries()]
      .filter(([, c]) => c >= 2) // only meaningful patterns — no noise
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([productId, together]) => ({ productId, together }));
    return { items, sampledOrders: orders.length };
  },
});

// ─────────────────────────────────────────────────────
// One-time seed: default offers, tables, and settings
// ─────────────────────────────────────────────────────

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
