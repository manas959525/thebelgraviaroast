import { Product } from "@/data/menu";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedMilk?: string;
  customizations?: string[];
  addOns?: string[];
  specialInstructions?: string;
}

// Simple event-based cart (no external state lib needed)
type Listener = () => void;
const listeners: Set<Listener> = new Set();
let _items: CartItem[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeCart(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getCartItems() {
  return _items;
}

export function addToCart(product: Product, quantity = 1, opts?: Partial<Pick<CartItem, "selectedSize" | "selectedMilk" | "customizations" | "addOns" | "specialInstructions">>) {
  const existing = _items.find(
    (i) =>
      i.product.id === product.id &&
      i.selectedSize === opts?.selectedSize &&
      i.selectedMilk === opts?.selectedMilk &&
      JSON.stringify(i.customizations) === JSON.stringify(opts?.customizations) &&
      JSON.stringify(i.addOns) === JSON.stringify(opts?.addOns),
  );
  if (existing) {
    existing.quantity += quantity;
  } else {
    _items.push({ product, quantity, ...opts });
  }
  notify();
}

export function updateQuantity(index: number, quantity: number) {
  if (quantity <= 0) {
    _items.splice(index, 1);
  } else {
    _items[index].quantity = quantity;
  }
  notify();
}

export function removeFromCart(index: number) {
  _items.splice(index, 1);
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
    return (sum + basePrice + extra) * item.quantity;
  }, 0);
}

export function getCartCount() {
  return _items.reduce((sum, item) => sum + item.quantity, 0);
}

// React hook
import { useSyncExternalStore } from "react";

export function useCart() {
  const items = useSyncExternalStore(subscribeCart, getCartItems);
  const total = getCartTotal();
  const count = getCartCount();
  return { items, total, count };
}
