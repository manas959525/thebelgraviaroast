import { useSyncExternalStore } from "react";
import type { Product } from "@/data/menu";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedMilk?: string;
  customizations?: string[];
  addOns?: string[];
  specialInstructions?: string;
}

/**
 * Event-based cart store, persisted to localStorage.
 * - Survives page refreshes (write-through on every mutation).
 * - Every mutation replaces `_items` with a NEW array so
 *   `useSyncExternalStore` sees a fresh snapshot and re-renders
 *   (a mutated-in-place array would silently never update).
 */
const CART_KEY = "tbr-cart-v1";

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function readStored(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Guard against corrupted/partial storage entries.
    return (parsed as CartItem[]).filter(
      (i) => i && typeof i === "object" && i.product && typeof i.product.id === "string" && typeof i.quantity === "number",
    );
  } catch {
    return [];
  }
}

let _items: CartItem[] = readStored();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(_items));
  } catch {
    /* storage full or blocked — in-memory state still works for this session */
  }
}

function notify() {
  persist();
  listeners.forEach((l) => l());
}

export function subscribeCart(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCartItems() {
  return _items;
}

export function addToCart(
  product: Product,
  quantity = 1,
  opts?: Partial<Pick<CartItem, "selectedSize" | "selectedMilk" | "customizations" | "addOns" | "specialInstructions">>,
) {
  const existing = _items.find(
    (i) =>
      i.product.id === product.id &&
      i.selectedSize === opts?.selectedSize &&
      i.selectedMilk === opts?.selectedMilk &&
      JSON.stringify(i.customizations) === JSON.stringify(opts?.customizations) &&
      JSON.stringify(i.addOns) === JSON.stringify(opts?.addOns),
  );
  _items = existing
    ? _items.map((i) => (i === existing ? { ...i, quantity: i.quantity + quantity } : i))
    : [..._items, { product, quantity, ...opts }];
  notify();
}

export function updateQuantity(index: number, quantity: number) {
  _items =
    quantity <= 0
      ? _items.filter((_, i) => i !== index)
      : _items.map((i, idx) => (idx === index ? { ...i, quantity } : i));
  notify();
}

export function removeFromCart(index: number) {
  _items = _items.filter((_, i) => i !== index);
  notify();
}

export function clearCart() {
  _items = [];
  notify();
}

export function getCartTotal() {
  return _items.reduce((sum, item) => {
    const basePrice = item.product.discountPrice ?? item.product.price;
    let extra = 0;
    if (item.selectedSize === "Medium") extra += 20;
    if (item.selectedSize === "Large") extra += 40;
    if (item.selectedMilk === "Oat Milk" || item.selectedMilk === "Almond Milk") extra += 30;
    // Customization option extras (e.g. oat/almond milk defined on the product)
    const chosenCustomizations = item.customizations ?? [];
    item.product.customizations?.forEach((group) =>
      group.options.forEach((opt) => {
        if (chosenCustomizations.includes(opt.name)) extra += opt.price;
      }),
    );
    // Add-on extras (e.g. syrups, extra shot, whipped cream)
    (item.addOns ?? []).forEach((name) => {
      const addOn = item.product.addOns?.find((a) => a.name === name);
      if (addOn) extra += addOn.price;
    });
    return sum + (basePrice + extra) * item.quantity;
  }, 0);
}

export function getCartCount() {
  return _items.reduce((sum, item) => sum + item.quantity, 0);
}

// React hook
export function useCart() {
  const items = useSyncExternalStore(subscribeCart, getCartItems);
  const total = getCartTotal();
  const count = getCartCount();
  return { items, total, count };
}
