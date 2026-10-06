import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat, Clock, BellRing, CheckCheck, ArrowLeft,
  Flame, UtensilsCrossed, Receipt, Wallet,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ORDER_STATUS_ORDER } from "@/lib/orders";

type ColumnKey = "new" | "preparing" | "ready";

const columns: { key: ColumnKey; label: string; dot: string; accent: string }[] = [
  { key: "new", label: "New Orders", dot: "bg-amber-400", accent: "text-amber-300" },
  { key: "preparing", label: "Preparing", dot: "bg-orange-400", accent: "text-orange-300" },
  { key: "ready", label: "Ready to Serve", dot: "bg-green-400", accent: "text-green-300" },
];

const ORDER_TYPE_LABEL: Record<string, string> = {
  "dine-in": "Dine In",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

const ORDER_TYPE_STYLE: Record<string, string> = {
  "dine-in": "bg-sage/15 text-green-200 border-sage/30",
  takeaway: "bg-gold/15 text-amber-200 border-gold/30",
  delivery: "bg-dusty-rose/15 text-rose-200 border-dusty-rose/30",
};

function elapsedLabel(start: number, now: number): string {
  const mins = Math.max(0, Math.floor((now - start) / 60000));
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min";
  return `${mins} min`;
}

function columnFor(status: string): ColumnKey {
  if (status === "pending" || status === "confirmed") return "new";
  if (status === "preparing") return "preparing";
  return "ready";
}

export default function Kitchen() {
  const orders = useQuery(api.cafe.listOrders) ?? [];
  const advanceOrder = useMutation(api.cafe.updateOrderStatus);

  // Ticking clock so elapsed times stay live without re-querying.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const active = orders
    .filter((o) => o.status !== "delivered" && o.status !== "cancelled")
    .sort((a, b) => a._creationTime - b._creationTime);

  const counts: Record<ColumnKey, number> = {
    new: 0,
    preparing: 0,
    ready: 0,
  };
  active.forEach((o) => {
    counts[columnFor(o.status)] += 1;
  });

  const advance = (id: string) => {
    const order = orders.find((o) => o._id === id);
    if (!order) return;
    const nextIndex = ORDER_STATUS_ORDER.indexOf(order.status) + 1;
    const next = ORDER_STATUS_ORDER[Math.min(nextIndex, ORDER_STATUS_ORDER.length - 1)];
    void advanceOrder({ id: order._id, status: next });
  };

  const clock = new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="min-h-screen bg-hero-dark text-white relative overflow-hidden">
      {/* Liquid glass backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="liquid-blob w-[36rem] h-[36rem] -top-48 -right-40 bg-gold/15" />
        <div className="liquid-blob liquid-blob-slow w-[30rem] h-[30rem] -bottom-48 -left-32 bg-dusty-rose/10" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 py-6 min-h-screen flex flex-col">
        {/* Header */}
        <header className="glass-liquid-dark rounded-2xl px-5 sm:px-6 py-4 mb-6 flex flex-wrap items-center gap-4">
          <Link
            to="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/15 border border-amber-300/20">
              <ChefHat className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold">Kitchen Display</h1>
              <p className="text-xs text-white/40">The Belgravia Roast · live from the pass</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            {columns.map((col) => (
              <div key={col.key} className="text-right">
                <div className={`text-2xl font-bold ${col.accent}`}>{counts[col.key]}</div>
                <div className="text-[9px] uppercase tracking-widest text-white/40">{col.label}</div>
              </div>
            ))}
            <div className="hidden sm:block h-10 w-px bg-white/10" />
            <div className="flex items-center gap-2 text-sm font-medium text-white/70 tabular-nums">
              <Clock className="h-4 w-4 text-white/40" />
              {clock}
            </div>
          </div>
        </header>

        {/* Board */}
        {active.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-liquid-dark rounded-3xl px-10 py-12 text-center"
            >
              <div className="text-5xl mb-4">☕</div>
              <h2 className="text-xl font-bold mb-1">All clear on the pass</h2>
              <p className="text-sm text-white/40">New orders will pop up here the moment a customer places one.</p>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-start">
            {columns.map((col) => {
              const colOrders = active.filter((o) => columnFor(o.status) === col.key);
              return (
                <div key={col.key} className="space-y-4">
                  <div className="glass-liquid-dark rounded-xl px-4 py-3 flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${col.dot} animate-pulse`} />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/70">{col.label}</span>
                    <span className="ml-auto text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full">{colOrders.length}</span>
                  </div>

                  <AnimatePresence initial={false}>
                    {colOrders.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 text-center text-xs text-white/30 py-8">
                        Nothing here
                      </div>
                    ) : (
                      colOrders.map((order) => {
                        const isReady = col.key === "ready";
                        const urgent = col.key === "new" && now - order._creationTime > 10 * 60000;
                        return (
                          <motion.div
                            key={order._id}
                            layout
                            initial={{ opacity: 0, y: 14, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", damping: 26, stiffness: 300 }}
                            className={`glass-liquid-dark rounded-2xl p-4 sm:p-5 ${
                              urgent ? "border-amber-300/40" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <div className="font-mono font-bold text-base">
                                  {order.orderNumber ?? order._id.slice(0, 8)}
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">
                                  Table {order.tableNumber ? `#${order.tableNumber}` : "Counter"} · {elapsedLabel(order._creationTime, now)}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ORDER_TYPE_STYLE[order.orderType] ?? "bg-white/10 text-white/60 border-white/10"}`}>
                                  {ORDER_TYPE_LABEL[order.orderType] ?? order.orderType}
                                </span>
                                {order.paymentStatus === "paid" ? (
                                  <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-green-300 bg-green-400/10 px-2 py-0.5 rounded-full">
                                    <Wallet className="h-2.5 w-2.5" /> Paid
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full">
                                    <Receipt className="h-2.5 w-2.5" /> {order.paymentMethod ?? "pay"} pending
                                  </span>
                                )}
                              </div>
                            </div>

                            <ul className="space-y-1.5 mb-3">
                              {order.items.map((item, i) => (
                                <li key={i} className="flex items-baseline gap-2 text-sm">
                                  <span className="font-bold text-white/90">{item.quantity}×</span>
                                  <span className="text-white/80">{item.name}</span>
                                  {item.customizations?.length ? (
                                    <span className="text-[10px] text-white/40 truncate">
                                      ({item.customizations.join(", ")})
                                    </span>
                                  ) : null}
                                  {item.addOns?.length ? (
                                    <span className="text-[10px] text-white/40 truncate">
                                      (+{item.addOns.join(", ")})
                                    </span>
                                  ) : null}
                                </li>
                              ))}
                            </ul>

                            {order.notes && (
                              <div className="flex items-start gap-2 bg-amber-400/10 border border-amber-300/20 rounded-xl px-3 py-2 mb-3">
                                <BellRing className="h-3.5 w-3.5 text-amber-300 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-100/80">{order.notes}</p>
                              </div>
                            )}

                            <div className="flex items-center justify-between gap-3">
                              <div className="text-lg font-bold">₹{order.total}</div>
                              <button
                                onClick={() => advance(order._id)}
                                className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${
                                  isReady
                                    ? "bg-green-400 text-navy hover:bg-green-300"
                                    : "bg-amber-400 text-navy hover:bg-amber-300"
                                }`}
                              >
                                <CheckCheck className="h-3.5 w-3.5" />
                                {isReady ? "Mark Served" : col.key === "new" ? "Start Preparing" : "Mark Ready"}
                              </button>
                            </div>

                            {urgent && (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300 mt-2.5">
                                <Flame className="h-3 w-3 animate-pulse" /> Waiting over 10 minutes
                              </div>
                            )}
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        <footer className="mt-6 flex items-center justify-center gap-2 text-xs text-white/30">
          <UtensilsCrossed className="h-3.5 w-3.5" />
          Orders update in real time as customers place them.
        </footer>
      </div>
    </div>
  );
}