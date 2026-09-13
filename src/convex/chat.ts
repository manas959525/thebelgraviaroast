import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─────────────────────────────────────────────────────
// Chatbot analytics (anonymous, aggregated, no PII)
// ─────────────────────────────────────────────────────

export const logChatEvent = mutation({
  args: {
    kind: v.string(),
    payload: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("chatEvents", {
      kind: args.kind,
      payload: args.payload,
      createdAt: Date.now(),
    });
  },
});

export const listChatEvents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("chatEvents").withIndex("by_createdAt").order("desc").take(500);
  },
});

export const clearChatEvents = mutation({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("chatEvents").collect();
    for (const e of events) {
      await ctx.db.delete(e._id);
    }
  },
});
