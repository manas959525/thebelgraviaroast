import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
    }).index("email", ["email"]),

    categories: defineTable({
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      image: v.optional(v.string()),
      order: v.number(),
      active: v.boolean(),
    }).index("by_slug", ["slug"]),

    products: defineTable({
      name: v.string(),
      slug: v.string(),
      description: v.string(),
      price: v.number(),
      discountPrice: v.optional(v.number()),
      image: v.string(),
      categoryId: v.id("categories"),
      isVeg: v.boolean(),
      calories: v.number(),
      prepTime: v.number(),
      ingredients: v.array(v.string()),
      allergens: v.array(v.string()),
      available: v.boolean(),
      customizations: v.optional(
        v.array(
          v.object({
            name: v.string(),
            options: v.array(
              v.object({ name: v.string(), price: v.number() }),
            ),
          }),
        ),
      ),
      addOns: v.optional(
        v.array(v.object({ name: v.string(), price: v.number() })),
      ),
      tags: v.array(v.string()),
    }).index("by_category", ["categoryId"]).index("by_slug", ["slug"]),

    orders: defineTable({
      userId: v.optional(v.id("users")),
      orderNumber: v.optional(v.string()),
      items: v.array(
        v.object({
          // Catalog product key (slug/id from the static menu), not a Convex row id.
          productId: v.string(),
          name: v.string(),
          price: v.number(),
          quantity: v.number(),
          customizations: v.optional(v.array(v.string())),
          addOns: v.optional(v.array(v.string())),
        }),
      ),
      subtotal: v.optional(v.number()),
      tax: v.optional(v.number()),
      discount: v.optional(v.number()),
      couponCode: v.optional(v.string()),
      total: v.number(),
      status: v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("preparing"),
        v.literal("ready"),
        v.literal("delivered"),
        v.literal("cancelled"),
      ),
      paymentStatus: v.union(
        v.literal("pending"),
        v.literal("paid"),
        v.literal("failed"),
      ),
      paymentMethod: v.optional(v.string()),
      tableNumber: v.optional(v.number()),
      tableId: v.optional(v.id("tables")),
      guestName: v.optional(v.string()),
      guestPhone: v.optional(v.string()),
      notes: v.optional(v.string()),
      orderType: v.union(
        v.literal("dine-in"),
        v.literal("takeaway"),
        v.literal("delivery"),
      ),
    }).index("by_user", ["userId"]).index("by_status", ["status"]).index("by_orderNumber", ["orderNumber"]),

    payments: defineTable({
      orderId: v.id("orders"),
      orderNumber: v.optional(v.string()),
      amount: v.number(),
      method: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("pending_verification"),
        v.literal("verified"),
        v.literal("failed"),
      ),
      utr: v.optional(v.string()),
      receiptId: v.string(),
      paidAt: v.number(),
      verifiedAt: v.optional(v.number()),
    }).index("by_order", ["orderId"]).index("by_status", ["status"]),

    serviceRequests: defineTable({
      table: v.string(),
      type: v.string(),
      note: v.optional(v.string()),
      resolved: v.boolean(),
      createdAt: v.number(),
    }).index("by_resolved", ["resolved"]),

    tables: defineTable({
      number: v.number(),
      capacity: v.number(),
      status: v.union(
        v.literal("available"),
        v.literal("occupied"),
        v.literal("reserved"),
        v.literal("bill_requested"),
      ),
      section: v.string(),
      qrCode: v.optional(v.string()),
    }).index("by_number", ["number"]),

    offers: defineTable({
      code: v.string(),
      description: v.string(),
      title: v.optional(v.string()),
      tag: v.optional(v.string()),
      discountType: v.union(v.literal("percentage"), v.literal("fixed")),
      discountValue: v.number(),
      minOrder: v.number(),
      maxDiscount: v.optional(v.number()),
      validFrom: v.number(),
      validUntil: v.number(),
      active: v.boolean(),
      usageLimit: v.optional(v.number()),
      usedCount: v.number(),
    }).index("by_code", ["code"]),

    // Availability overrides for static-catalog products (sold out / low stock).
    productFlags: defineTable({
      productId: v.string(),
      available: v.boolean(),
      note: v.optional(v.string()),
    }).index("by_product", ["productId"]),

    // Simple key/value café settings (name, phone, UPI id, tax rate, hours…).
    settings: defineTable({
      key: v.string(),
      value: v.string(),
    }).index("by_key", ["key"]),

    // Customer reviews; only approved ones show on the landing page.
    reviews: defineTable({
      name: v.string(),
      rating: v.number(),
      text: v.string(),
      orderNumber: v.optional(v.string()),
      approved: v.boolean(),
      createdAt: v.number(),
    }).index("by_approved", ["approved"]),

    userContent: defineTable({
      userId: v.id("users"),
      imageUrl: v.string(),
      caption: v.optional(v.string()),
      rating: v.optional(v.number()),
      approved: v.boolean(),
    }).index("by_user", ["userId"]),

    // Smart-upsell events: which combo was shown / accepted and its value.
    upsellEvents: defineTable({
      comboId: v.string(),
      mainId: v.string(),
      pairId: v.string(),
      value: v.number(),
      savings: v.number(),
      accepted: v.boolean(),
      orderNumber: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_accepted", ["accepted"]).index("by_createdAt", ["createdAt"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
