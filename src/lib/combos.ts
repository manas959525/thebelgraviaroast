import { products, type Product } from "@/data/menu";

/**
 * Smart upsell engine — builds a "MAKE IT A COMBO" offer for a product by
 * pairing it with a complementary bestseller at ~15% off (rounded to ₹5).
 * Prices are derived from the catalog, never hardcoded.
 */

const DRINK_CATS = ["cat-coffee", "cat-cold-coffee", "cat-shakes"];
const SAVORY_CATS = ["cat-pizza", "cat-burgers", "cat-sandwiches", "cat-pasta", "cat-sides"];

function roundTo5(n: number) {
  return Math.round(n / 5) * 5;
}

export interface ComboOffer {
  id: string;
  main: Product;
  pair: Product;
  /** Combined price at full price. */
  original: number;
  /** Combo price after discount. */
  comboPrice: number;
  savings: number;
  /** Contextual label, e.g. "Perfect with your coffee". */
  label: string;
}

const labels: Record<string, string> = {
  drink: "Perfect with your coffee",
  meal: "Complete your meal",
  sweet: "The sweet ending",
};

export function getComboFor(product: Product, pool: Product[] = products): ComboOffer | null {
  if (!product.available) return null;

  const candidates = pool.filter((p) => p.available && p.id !== product.id && p.badge === "bestseller");

  let pair: Product | undefined;
  let label = labels.drink;

  if (DRINK_CATS.includes(product.category)) {
    // A drink pairs with the best dessert or side.
    pair = candidates
      .filter((p) => ["cat-desserts", "cat-sides"].includes(p.category))
      .sort((a, b) => b.rating - a.rating)[0];
    label = labels.drink;
  } else if (SAVORY_CATS.includes(product.category)) {
    // A meal pairs with a cold drink or shake.
    pair = candidates
      .filter((p) => ["cat-cold-coffee", "cat-shakes"].includes(p.category))
      .sort((a, b) => b.rating - a.rating)[0];
    label = labels.meal;
  } else if (product.category === "cat-desserts") {
    pair = candidates
      .filter((p) => DRINK_CATS.includes(p.category))
      .sort((a, b) => b.rating - a.rating)[0];
    label = labels.sweet;
  }

  if (!pair) return null;

  const mainPrice = product.discountPrice ?? product.price;
  const pairPrice = pair.discountPrice ?? pair.price;
  const original = mainPrice + pairPrice;
  const comboPrice = Math.max(roundTo5(original * 0.85), mainPrice);

  return {
    id: `${product.id}__${pair.id}`,
    main: product,
    pair,
    original,
    comboPrice,
    savings: original - comboPrice,
    label,
  };
}