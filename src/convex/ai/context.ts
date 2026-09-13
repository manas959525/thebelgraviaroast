import { products, categories } from "../../data/menu";

// ─────────────────────────────────────────────────────
// Website knowledge layer — the single source of truth
// the AI assistant reads from. Update data here (or in
// the DB settings table) without touching the chatbot.
// ─────────────────────────────────────────────────────

export const FAQ_SNIPPET = `
Q: Where are you located? A: 42 Belgravia Lane, New Delhi 110001.
Q: What are your opening hours? A: 8:00 AM to 11:00 PM, every day.
Q: Do you take table reservations? A: Yes — walk-ins are welcome and you can reserve via the Contact page or by phone.
Q: Do you have Wi-Fi? A: Yes, complimentary high-speed Wi-Fi for all guests.
Q: Is there parking? A: Yes, free guest parking behind the café.
Q: Are vegan / dairy-free options available? A: Yes — oat and almond milk are available for any coffee at ₹30, and most desserts can be made dairy-free on request.
Q: How do I pay? A: Online orders pay via UPI on the Payment page (scan the QR with any UPI app). Dine-in guests can also pay at the table or counter.
Q: How long does an order take? A: Coffee ~4 min, food 10–15 min depending on the item. The live tracker on the Track Order page shows real-time status.
Q: Do you offer delivery? A: Yes — choose "Delivery" at checkout for orders within 5 km.
Q: How do coupons work? A: Apply a coupon code at checkout. Current public codes are shown on the Offers page.`;

export const BUSINESS_SNIPPET = `
Name: The Belgravia Roast — premium specialty café, New Delhi.
Tagline: "Where Every Roast Tells a Story."
Hours: 8:00 AM – 11:00 PM daily. Phone: +91 98765 43210. Email: hello@thebelgraviaroast.in.
Address: 42 Belgravia Lane, New Delhi 110001.
Signature drinks: Belgravia Signature Roast (₹179) and Belgravia Signature Cold Coffee (₹199).
Loyalty: every ₹100 spent earns 1 bean; 50 beans = a free regular coffee.
Ratings: 4.9★ average from 2,000+ guests. Average preparation time ~12 minutes.`;

export const PAGE_SNIPPET = `Deep-linkable pages:
/menu (full menu with search + filters), /build-your-drink (custom drink builder), /offers (coupons),
/cart, /checkout, /payment (UPI QR), /track-order (live order tracker), /orders (my orders + favourites + rewards),
/table-ordering (dine-in QR ordering), /about, /contact (map, phone, form), /auth (sign in).`;

// Compact menu digest — ~40% of raw catalog size, enough for grounding.
export const MENU_SNIPPET = products
  .filter((p) => p.available)
  .map(
    (p) =>
      `${p.name} ₹${p.discountPrice ?? p.price} | ${categories.find((c) => c.id === p.category)?.name ?? p.category} | ${p.description} | tags: ${p.tags.join(", ")}${p.badge ? ` | badge: ${p.badge}` : ""}`,
  )
  .join("\n");

export const CATEGORY_SNIPPET = categories
  .map((c) => `${c.name} (${c.slug}): ${c.description}`)
  .join("\n");

// ─────────────────────────────────────────────────────
// Input hygiene
// ─────────────────────────────────────────────────────

/** Strip control chars, collapse whitespace, clamp length. */
export function sanitize(raw: string, maxLen = 800): string {
  return raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

/** Basic prompt-injection guard: neutralize role/instruction hijacks. */
export function looksLikeInjection(raw: string): boolean {
  const patterns = [
    /ignore (all|any|the above|previous|prior)/i,
    /disregard (all|any|the|previous)/i,
    /forget (all|your|the) (instructions|prompt|rules)/i,
    /(system|developer) (prompt|message|instructions)/i,
    /you are now/i,
    /reveal|show|print (your|the) (system)? ?(prompt|instructions|rules)/i,
    /repeat (your|the) (system)? ?(prompt|instructions)/i,
  ];
  return patterns.some((p) => p.test(raw));
}

// ─────────────────────────────────────────────────────
// Lightweight language + intent detection (client of the
// LLM, but lets us tune the system prompt + quick replies)
// ─────────────────────────────────────────────────────

export type Lang = "en" | "hi" | "hinglish";

export function detectLanguage(raw: string): Lang {
  const text = raw.toLowerCase();
  if (/[\u0900-\u097F]/.test(raw)) return "hi";
  const hinglish = [
    /\bbhai\b/, /\bkya\b/, /\bmujhe\b/, /\bchahiye\b/, /\bkaro\b/, /\bkardo\b/,
    /\bacha\b/, /\btheek\b/, /\bkitna\b/, /\bhai\b/, /\bnahi\b/, /\bhaan\b/,
    /\bsuggest karo\b/, /\bke andar\b/, /\bkuch\b/, /\bdena\b/, /\bdijiye\b/,
  ];
  if (hinglish.some((p) => p.test(text))) return "hinglish";
  return "en";
}

export type Intent =
  | "recommend"
  | "menu"
  | "price"
  | "order"
  | "cart"
  | "navigate"
  | "hours_location"
  | "offers"
  | "track"
  | "faq"
  | "smalltalk"
  | "other";

export function classifyIntent(raw: string): Intent {
  const t = ` ${raw.toLowerCase()} `;
  const has = (...ws: string[]) => ws.some((w) => t.includes(w));
  if (has("track", "where is my order", "order status", "kahan hai mera order")) return "track";
  if (has("add to cart", "order ", "book", "checkout", "pay", "confirm")) return "order";
  if (has("cart")) return "cart";
  if (has("recommend", "suggest", "what should i", "best", "popular", "craving", "batao", "suggest karo", "pick"))
    return "recommend";
  if (has("offer", "coupon", "discount", "deal", "promo")) return "offers";
  if (has("open", "close", "hours", "timing", "location", "address", "where are you", "phone", "contact"))
    return "hours_location";
  if (has("price", "cost", "rate", "kitna", "how much", "₹")) return "price";
  if (has("menu", "what do you have", "categories", "list", "items")) return "menu";
  if (has("navigate", "page", "take me", "where can i", "how do i", "link")) return "navigate";
  if (has("hi", "hello", "hey", "thanks", "thank you", "good morning", "namaste")) return "smalltalk";
  return "other";
}

// ─────────────────────────────────────────────────────
// Page refs surfaced as clickable chips in the chat UI
// ─────────────────────────────────────────────────────

export interface PageRef {
  label: string;
  path: string;
}

export const PAGE_REFS: PageRef[] = [
  { label: "View Menu", path: "/menu" },
  { label: "Build Your Drink", path: "/build-your-drink" },
  { label: "View Offers", path: "/offers" },
  { label: "Track Order", path: "/track-order" },
  { label: "My Orders", path: "/orders" },
  { label: "Contact Us", path: "/contact" },
  { label: "About Us", path: "/about" },
  { label: "Book a Table", path: "/table-ordering" },
];

export const QUICK_REPLIES: Record<Lang, string[]> = {
  en: ["What do you recommend?", "Bestsellers", "Something under ₹200", "Today's offers", "Where are you located?"],
  hi: ["क्या recommend करेंगे?", "बेस्टसेलर दिखाओ", "₹200 के अंदर कुछ", "आज के ऑफर", "आप कहाँ हो?"],
  hinglish: ["Kuch recommend karo", "Bestsellers dikhao", "₹200 ke andar kuch", "Aaj ke offers", "Aap kahan ho?"],
};
