import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type PermissionState = NotificationPermission | "unsupported";

/** Announcements are notified at most once per browser, ever (no repeat spam). */
const SEEN_KEY = "tbr-notified-v1";

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Order Received",
  confirmed: "Order Confirmed",
  preparing: "Preparing",
  ready: "Ready for pickup",
  delivered: "Completed",
  cancelled: "Cancelled",
};

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

function currentPermission(): PermissionState {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

/** Fire a platform notification. Never throws (some browsers need the SW path). */
function fire(title: string, body: string, tag?: string) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  const opts: NotificationOptions = { body, tag };
  try {
    new Notification(title, opts);
  } catch {
    // Android Chrome requires a service-worker registration instead.
    try {
      void navigator.serviceWorker
        ?.getRegistration()
        .then((reg) => reg?.showNotification(title, opts))
        .catch(() => {});
    } catch {
      /* unsupported — silently skip */
    }
  }
}

function readSeen(): Set<string> {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    return new Set();
  }
}

function remember(id: string) {
  try {
    const seen = readSeen();
    seen.add(id);
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-100)));
  } catch {
    /* storage blocked — worst case an announcement can re-notify next session */
  }
}

/**
 * Opt-in permission state. Permission is only ever requested from an explicit
 * user gesture (the navbar bell button) — never automatically on page load.
 */
export function useNotificationPermission() {
  const [permission, setPermission] = useState<PermissionState>(currentPermission);

  const enable = useCallback(async (): Promise<PermissionState> => {
    if (!notificationsSupported()) return "unsupported";
    if (Notification.permission === "granted") {
      setPermission("granted");
      return "granted";
    }
    let result: NotificationPermission = "denied";
    try {
      result = await Notification.requestPermission();
    } catch {
      /* user dismissed the prompt — stays "default" */
    }
    setPermission(result);
    return result;
  }, []);

  return { supported: permission !== "unsupported", permission, enable };
}

/**
 * Watches the customer's live orders, bookings and active announcements and
 * raises a browser notification when something changes.
 *
 * Anti-spam rules:
 *  - order/booking: only on an actual status transition after the first load
 *  - announcements: at most once per announcement, per browser, ever
 *  - everything: only when permission is already granted
 *
 * Returns nothing — it is a side-effect-only hook (mounted once in Navbar).
 */
export function useLiveNotifications() {
  const myOrders = useQuery(api.cafe.listMyOrders);
  const myReservations = useQuery(api.cafe.listMyReservations);
  const announcements = useQuery(api.cafe.listActiveAnnouncements);

  const orderStatuses = useRef<Record<string, string>>({});
  const reservationStatuses = useRef<Record<string, string>>({});

  // Order status changes (pending → confirmed → preparing → ready → delivered).
  useEffect(() => {
    if (!myOrders) return;
    myOrders.forEach((o) => {
      const key = o._id as string;
      const prev = orderStatuses.current[key];
      orderStatuses.current[key] = o.status;
      if (prev === undefined || prev === o.status) return; // first load just seeds
      const label = ORDER_STATUS_LABELS[o.status] ?? "updated";
      const ref = o.orderNumber ?? key.slice(-6);
      fire("The Belgravia Roast", `Order ${ref} — ${label}`, `order-${key}`);
    });
  }, [myOrders]);

  // Booking status changes (pending → confirmed / cancelled / completed).
  useEffect(() => {
    if (!myReservations) return;
    myReservations.forEach((r) => {
      const key = r._id as string;
      const prev = reservationStatuses.current[key];
      reservationStatuses.current[key] = r.status;
      if (prev === undefined || prev === r.status) return;
      const body =
        r.status === "confirmed"
          ? `Table for ${r.guests} confirmed on ${r.date} at ${r.time}.`
          : r.status === "cancelled"
            ? `Your booking on ${r.date} was cancelled.`
            : `Your booking on ${r.date} is ${r.status}.`;
      fire("The Belgravia Roast", body, `res-${key}`);
    });
  }, [myReservations]);

  // New live announcements — once per announcement per browser, ever.
  useEffect(() => {
    if (!announcements) return;
    const seen = readSeen();
    announcements.forEach((a) => {
      const id = `ann-${a._id as string}`;
      if (seen.has(id)) return;
      remember(id); // remember even if permission is off, so enabling later doesn't spam
      fire("The Belgravia Roast · Announcement", a.message, id);
    });
  }, [announcements]);
}
