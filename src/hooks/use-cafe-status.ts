import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export type CafeState = "open" | "closing_soon" | "closed";

interface CafeStatusConfig {
  state: CafeState;
  openTime: string;
  closeTime: string;
  timezone: string;
  closingSoonMin: number;
  minutesToClose: number | null;
  minutesToOpen: number | null;
  preOrdersAllowed: boolean;
  acceptOrders: boolean;
}

export interface LiveCafeStatus extends CafeStatusConfig {
  /** Recomputed state using this browser's clock against café-local config. */
  state: CafeState;
  label: string;
}

function parseHM(t?: string): number | null {
  if (!t) return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(t.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function minutesInTz(now: number, tz: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(now));
    const [h, m] = parts.split(":").map(Number);
    return ((h % 24) || 0) * 60 + (m || 0);
  } catch {
    const d = new Date(now);
    return d.getHours() * 60 + d.getMinutes();
  }
}

function computeState(
  openTime: string,
  closeTime: string,
  timezone: string,
  closingSoonMin: number,
  now: number,
): CafeState {
  const o = parseHM(openTime);
  const c = parseHM(closeTime);
  if (o == null || c == null) return "open";
  const cur = minutesInTz(now, timezone);
  const isOpen = o === c ? true : o < c ? cur >= o && cur < c : cur >= o || cur < c;
  if (!isOpen) return "closed";
  return (c - cur + 1440) % 1440 <= closingSoonMin ? "closing_soon" : "open";
}

/**
 * Live café open/closed indicator. The server returns admin-configured hours
 * (reactive to Settings edits); the state itself is a pure function of those
 * hours + the clock, so a 30-second tick keeps it fresh without a refresh.
 */
export function useCafeStatus(): LiveCafeStatus | null {
  const status = useQuery(api.cafe.getCafeStatus);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  if (!status) return null;

  const state = computeState(
    status.openTime,
    status.closeTime,
    status.timezone,
    status.closingSoonMin,
    now,
  );

  const label =
    state === "open"
      ? "Open now"
      : state === "closing_soon"
        ? "Closing soon"
        : "Closed";

  return { ...status, state, label };
}
