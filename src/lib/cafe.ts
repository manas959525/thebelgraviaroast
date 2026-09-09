import { products, type Product } from "@/data/menu";

export type Daypart = "morning" | "afternoon" | "evening" | "night";

export function getDaypart(date = new Date()): Daypart {
  const h = date.getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 16) return "afternoon";
  if (h >= 16 && h < 21) return "evening";
  return "night";
}

export function daypartGreeting(date = new Date()): string {
  switch (getDaypart(date)) {
    case "morning":
      return "Good morning ☀️";
    case "afternoon":
      return "Afternoon cravings?";
    case "evening":
      return "Good evening ✨";
    default:
      return "Late night treat?";
  }
}

const byId = (ids: string[]) =>
  ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

export function getDaypartPicks(date = new Date()): Product[] {
  switch (getDaypart(date)) {
    case "morning":
      return byId(["cappuccino", "grilled-veg", "sig-roast"]);
    case "afternoon":
      return byId(["caramel-frappe", "brownie", "peri-peri-fries"]);
    case "evening":
      return byId(["mocha", "choc-shake", "loaded-fries"]);
    default:
      return byId(["mocha", "chocolate-waffle", "peach-iced-tea"]);
  }
}

export function daypartHint(date = new Date()): string {
  switch (getDaypart(date)) {
    case "morning":
      return "Start your day with a handcrafted brew";
    case "afternoon":
      return "Something cold and sweet to power through";
    case "evening":
      return "Wind down with a warm favourite";
    default:
      return "The night owls' shortlist";
  }
}

/** Random available item — used by "Surprise Me". */
export function getSurprise(excludeId?: string): Product {
  const pool = products.filter((p) => p.available && p.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Two items that pair naturally with the given product (different category). */
export function getComplements(product: Product, count = 2): Product[] {
  const pool = products.filter(
    (p) =>
      p.available &&
      p.id !== product.id &&
      p.category !== product.category &&
      (p.badge === "bestseller" || p.rating >= 4.6),
  );
  const sorted = [...pool].sort((a, b) => b.rating - a.rating);
  return sorted.slice(0, count);
}

/** Trending items with a playful weekly-change indicator. */
export function getTrending(): { product: Product; delta: string; rank: number }[] {
  return [...products]
    .filter((p) => p.available)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5)
    .map((product, i) => ({
      product,
      rank: i + 1,
      delta: ["↑ 24%", "↑ 18%", "↑ 12%", "↑ 9%", "↑ 6%"][i],
    }));
}

/** Today's special — a limited-quantity featured item with a daily price. */
export function getTodaySpecial() {
  const product =
    products.find((p) => p.id === "hazelnut-latte") ??
    products.find((p) => p.badge === "bestseller") ??
    products[0];
  const discountPrice = product.discountPrice ?? Math.round(product.price * 0.83);
  const remaining = 23; // simulated daily allocation
  return { product, discountPrice, remaining };
}

/** Quick-order craving chips shown on the landing + menu pages. */
export const cravingChips = [
  { emoji: "☕", label: "Coffee", cat: "coffee" },
  { emoji: "🥪", label: "Something Savory", cat: "sandwiches" },
  { emoji: "🍰", label: "Something Sweet", cat: "desserts" },
  { emoji: "🥤", label: "Something Cold", cat: "cold-coffee" },
] as const;