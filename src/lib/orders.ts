import { useSyncExternalStore } from "react";

export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";

export const ORDER_STATUS_ORDER: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "delivered"];

export interface OrderLineItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

export interface PlacedOrder {
  id: string;
  items: OrderLineItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  orderType: "dine-in" | "takeaway" | "delivery";
  tableNumber?: string;
  guestName?: string;
  paymentMethod?: string;
  status: OrderStatus;
  placedAt: number;
  etaMinutes: number;
}

export interface ServiceRequest {
  id: string;
  table: string;
  type: "call-staff" | "water" | "cutlery" | "bill" | "clear";
  note?: string;
  createdAt: number;
  resolved: boolean;
}

const ORDERS_KEY = "tbr-orders";
const SERVICE_KEY = "tbr-service-requests";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — keep in-memory state */
  }
}

// ── Orders ────────────────────────────────────────────
let _orders: PlacedOrder[] = read<PlacedOrder[]>(ORDERS_KEY, []);
const orderListeners = new Set<() => void>();

function notifyOrders() {
  write(ORDERS_KEY, _orders);
  orderListeners.forEach((l) => l());
}

export function getOrders() {
  return _orders;
}

export function getLastOrder() {
  return _orders.length ? _orders[_orders.length - 1] : null;
}

export function getOrderById(id: string) {
  return _orders.find((o) => o.id === id) ?? null;
}

export function saveOrder(order: PlacedOrder) {
  if (_orders.some((o) => o.id === order.id)) return;
  _orders = [order, ..._orders];
  notifyOrders();
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  _orders = _orders.map((o) => (o.id === id ? { ...o, status } : o));
  notifyOrders();
}

export function subscribeOrders(listener: () => void) {
  orderListeners.add(listener);
  return () => {
    orderListeners.delete(listener);
  };
}

export function useOrders() {
  return useSyncExternalStore(subscribeOrders, getOrders);
}

// ── Service requests (table-side) ─────────────────────
let _requests: ServiceRequest[] = read<ServiceRequest[]>(SERVICE_KEY, []);
const requestListeners = new Set<() => void>();

function notifyRequests() {
  write(SERVICE_KEY, _requests);
  requestListeners.forEach((l) => l());
}

export function getServiceRequests() {
  return _requests;
}

export const SERVICE_REQUEST_LABELS: Record<ServiceRequest["type"], string> = {
  "call-staff": "Staff called",
  water: "Water requested",
  cutlery: "Cutlery requested",
  bill: "Bill requested",
  clear: "Table clear requested",
};

export function addServiceRequest(table: string, type: ServiceRequest["type"]) {
  const request: ServiceRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    table,
    type,
    createdAt: Date.now(),
    resolved: false,
  };
  _requests = [request, ..._requests];
  notifyRequests();
  return request;
}

export function resolveServiceRequest(id: string) {
  _requests = _requests.map((r) => (r.id === id ? { ...r, resolved: true } : r));
  notifyRequests();
}

export function subscribeRequests(listener: () => void) {
  requestListeners.add(listener);
  return () => {
    requestListeners.delete(listener);
  };
}

export function useServiceRequests() {
  return useSyncExternalStore(subscribeRequests, getServiceRequests);
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hr ago";
  return `${hours} hrs ago`;
}