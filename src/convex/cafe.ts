import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
      total: args.total,
      status: "pending",
      paymentStatus: args.utr ? "pending" : "pending",
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

    return { orderId, paymentId, receiptId: `RCPT-${args.orderNumber.replace(/^TBR-/, "").slice(0, 8)}` };
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