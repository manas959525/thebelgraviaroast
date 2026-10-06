import { useMemo, useState } from "react";
import {
  CalendarCheck,
  CheckCheck,
  Clock,
  Phone,
  Users,
  XCircle,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type Status = "pending" | "confirmed" | "completed" | "cancelled";

const statusBadge: Record<Status, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

type Tab = "upcoming" | "today" | "completed" | "cancelled";

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return t;
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ReservationsView() {
  const reservations = useQuery(api.cafe.listReservations);
  const updateStatus = useMutation(api.cafe.updateReservationStatus);
  const [tab, setTab] = useState<Tab>("upcoming");

  const today = todayISO();

  const buckets = useMemo(() => {
    const all = reservations ?? [];
    const sortedAsc = [...all].sort((a, b) =>
      a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date),
    );
    return {
      upcoming: sortedAsc.filter(
        (r) =>
          (r.status === "pending" || r.status === "confirmed") && r.date >= today,
      ),
      today: sortedAsc.filter((r) => r.date === today),
      completed: [...all]
        .filter((r) => r.status === "completed")
        .sort((a, b) =>
          a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date),
        ),
      cancelled: [...all]
        .filter((r) => r.status === "cancelled")
        .sort((a, b) =>
          a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date),
        ),
    };
  }, [reservations, today]);

  const rows = buckets[tab];

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "upcoming", label: "Upcoming", count: buckets.upcoming.length },
    { id: "today", label: "Today", count: buckets.today.length },
    { id: "completed", label: "Completed", count: buckets.completed.length },
    { id: "cancelled", label: "Cancelled", count: buckets.cancelled.length },
  ];

  const setStatus = (id: Id<"reservations">, status: Status, label: string) => {
    void updateStatus({ id, status })
      .then(() => toast.success(label))
      .catch((err: unknown) =>
        toast.error(err instanceof Error ? err.message : "Could not update reservation"),
      );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reservations</h2>
          <p className="text-sm text-muted-foreground">
            Table bookings from the public Reservations page — confirm, complete or cancel
            them here.
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === t.id ? "bg-gold text-white" : "glass-chip text-muted-foreground"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {reservations === undefined ? (
        <div className="glass-elevated rounded-2xl border-0 p-10 text-center">
          <div className="h-5 w-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-elevated rounded-2xl border-0 p-10 text-center">
          <CalendarCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {tab === "upcoming"
              ? "No upcoming reservations — new bookings appear here instantly."
              : tab === "today"
                ? "No reservations for today yet."
                : tab === "completed"
                  ? "Completed reservations will be listed here."
                  : "Cancelled reservations will be listed here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div
              key={r._id}
              className="glass-elevated rounded-xl border-0 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-foreground">{r.name}</span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusBadge[r.status]}`}
                  >
                    {r.status}
                  </span>
                  {r.date === today && (
                    <span className="text-[10px] font-bold text-dusty-rose bg-dusty-rose/10 px-2 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatDate(r.date)} · {formatTime(r.time)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {r.guests}{" "}
                    {r.guests === 1 ? "guest" : "guests"}
                  </span>
                  <a
                    href={`tel:${r.phone.replace(/[^+0-9]/g, "")}`}
                    className="flex items-center gap-1 hover:text-gold transition-colors"
                  >
                    <Phone className="h-3 w-3" /> {r.phone}
                  </a>
                  {r.email && <span className="truncate">{r.email}</span>}
                </div>
                {r.notes && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    “{r.notes}”
                  </p>
                )}
              </div>

              <div className="flex gap-1.5 shrink-0 flex-wrap">
                {r.status === "pending" && (
                  <button
                    onClick={() =>
                      setStatus(r._id, "confirmed", `Confirmed — ${r.name}, ${r.date}`)
                    }
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-all"
                  >
                    <CheckCheck className="h-3 w-3" /> Confirm
                  </button>
                )}
                {(r.status === "pending" || r.status === "confirmed") && (
                  <>
                    <button
                      onClick={() =>
                        setStatus(r._id, "completed", `Marked completed — ${r.name}`)
                      }
                      className="flex items-center gap-1 text-[10px] font-bold text-sage bg-sage/10 px-2.5 py-1.5 rounded-lg hover:bg-sage/20 transition-all"
                    >
                      <CheckCheck className="h-3 w-3" /> Complete
                    </button>
                    <button
                      onClick={() =>
                        setStatus(r._id, "cancelled", `Cancelled — ${r.name}`)
                      }
                      className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-all"
                    >
                      <XCircle className="h-3 w-3" /> Cancel
                    </button>
                  </>
                )}
                {(r.status === "completed" || r.status === "cancelled") && (
                  <button
                    onClick={() =>
                      setStatus(
                        r._id,
                        "confirmed",
                        `Reopened — ${r.name}, ${r.date}`,
                      )
                    }
                    className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground border px-2.5 py-1.5 rounded-lg hover:bg-muted transition-all"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
