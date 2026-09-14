import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChefHat, Clock, Package, MapPin, ArrowRight, RotateCcw, ShieldCheck, Hourglass, Search, WifiOff } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { addToCart } from "@/lib/cart";
import { products } from "@/data/menu";
import { getOrderById, getLastOrder, type OrderStatus } from "@/lib/orders";
import { toast } from "sonner";

const DB_STATUS_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  delivered: 4,
  cancelled: 0,
};

const stepMeta: { label: string; icon: typeof Check; desc: string }[] = [
  { label: "Order Received", icon: Check, desc: "We've received your order" },
  { label: "Confirmed", icon: Check, desc: "Payment confirmed" },
  { label: "Preparing", icon: ChefHat, desc: "Our chefs are crafting it" },
  { label: "Ready", icon: Package, desc: "Ready for pickup" },
  { label: "Served", icon: MapPin, desc: "Enjoy your meal!" },
];

interface TrackState {
  orderId?: string;
  tableNumber?: string;
  items?: { productId?: string; name: string; qty: number; price?: number }[];
  total?: number;
}

export default function TrackOrder() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as TrackState | null;

  // Router state is lost on refresh — fall back to the most recent order placed
  // on this device so the tracker still works after a reload.
  const storedOrder = state?.orderId ? getOrderById(state.orderId) : getLastOrder();
  const [manualId, setManualId] = useState("");
  const [lookupId, setLookupId] = useState<string | null>(null);

  const orderId = state?.orderId || storedOrder?.id || lookupId;
  const hasOrder = Boolean(orderId);

  // Live status from the café database (reactive — updates when the kitchen advances it).
  const live = useQuery(
    api.cafe.getOrderByNumber,
    hasOrder ? { orderNumber: orderId as string } : "skip",
  );
  const dbLoaded = hasOrder && live !== undefined;
  const inDb = Boolean(live?.order);

  // Live database values win; local receipt data fills in for offline orders.
  const liveItems = live?.order?.items;
  const items = liveItems
    ? liveItems.map((it) => ({ name: it.name, qty: it.quantity, price: it.price }))
    : (state?.items ?? storedOrder?.items ?? []).map((it) => ({
        name: it.name,
        qty: "qty" in it ? it.qty : 1,
        price: it.price,
      }));
  const tableNumber = live?.order?.tableNumber ?? state?.tableNumber ?? storedOrder?.tableNumber;
  const total = live?.order?.total ?? state?.total ?? storedOrder?.total ?? 0;

  // True status: database when available, otherwise the locally recorded status.
  const localStatus: OrderStatus = storedOrder?.status ?? "pending";
  const rawStatus = (live?.order?.status as OrderStatus | undefined) ?? localStatus;
  const stepIndex = DB_STATUS_INDEX[rawStatus] ?? 0;
  const cancelled = rawStatus === "cancelled";
  const offlineOnly = dbLoaded && !inDb; // order isn't (yet) in the café database

  const statusLabel = cancelled ? "Cancelled" : stepMeta[stepIndex].label;
  const progress = (stepIndex / (stepMeta.length - 1)) * 100;
  const paymentVerified = live?.payment?.status === "verified";
  const paymentPendingVerification = live?.payment?.status === "pending_verification";

  const handleRepeat = () => {
    const source = state?.items ?? storedOrder?.items ?? [];
    let added = 0;
    source.forEach((item) => {
      const product =
        ("productId" in item && item.productId ? products.find((p) => p.id === item.productId) : undefined) ??
        products.find((p) => p.name === item.name);
      if (product && product.available) {
        addToCart(product, item.qty);
        added += item.qty;
      }
    });
    if (added > 0) {
      toast.success(`${added} item${added === 1 ? "" : "s"} added back to your cart`);
      navigate("/cart");
    } else {
      toast.error("Those items aren't available right now");
    }
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const id = manualId.trim().toUpperCase();
    if (!id) return;
    setLookupId(id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-32 lg:pb-10">
        <div className="mx-auto max-w-lg px-4 sm:px-6">
          {!hasOrder ? (
            /* ── Nothing to track yet: offer an order-number lookup ── */
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-10">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gold/10 text-gold">
                <Search className="h-10 w-10" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Track Your Order</h1>
              <p className="text-muted-foreground text-sm mb-8">
                Enter the order number from your receipt (e.g. TBR-20260914-A1B2C3).
              </p>
              <form onSubmit={handleLookup} className="flex gap-2 max-w-sm mx-auto">
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="Order number"
                  className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-mono uppercase outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
                <button
                  type="submit"
                  className="bg-gold hover:bg-gold/90 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  Track
                </button>
              </form>
              <Link to="/menu" className="inline-block mt-8 text-sm text-gold font-medium hover:underline">
                Browse the menu →
              </Link>
            </motion.div>
          ) : (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-foreground mb-1">Track Your Order</h1>
                <p className="text-muted-foreground text-sm mb-6">
                  Order <span className="font-mono font-medium text-foreground">{orderId}</span>
                  {tableNumber ? ` · Table #${tableNumber}` : ""}
                </p>
              </motion.div>

              {/* Offline notice: order recorded on this device only */}
              {offlineOnly && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2">
                  <WifiOff className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    This order hasn't reached the café's system yet (it was placed while offline).
                    Status will appear here automatically once the connection is restored and the café confirms it.
                  </p>
                </div>
              )}

              {/* Status Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-border/50 p-6 mb-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={statusLabel}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="inline-flex items-center gap-2"
                        >
                          {statusLabel}
                          {rawStatus === "preparing" && <span className="text-base">☕</span>}
                        </motion.span>
                      </AnimatePresence>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cancelled
                        ? "This order was cancelled — please contact the café."
                        : stepIndex >= stepMeta.length - 1
                        ? "It's on its way to you"
                        : `Estimated time: ${Math.max(2, 12 - stepIndex * 3)}–${Math.max(5, 15 - stepIndex * 3)} minutes`}
                    </p>
                    {paymentPendingVerification && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-2">
                        <Hourglass className="h-3 w-3" /> Payment awaiting verification
                      </span>
                    )}
                    {paymentVerified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sage bg-sage/10 px-2 py-0.5 rounded-full mt-2">
                        <ShieldCheck className="h-3 w-3" /> Payment verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 bg-gold/10 px-3 py-1.5 rounded-full">
                    <Clock className="h-3.5 w-3.5 text-gold" />
                    <span className="text-xs font-semibold text-gold">Live</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-muted rounded-full mb-8 overflow-hidden">
                  <motion.div
                    initial={{ width: `${progress}%` }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gold rounded-full"
                  />
                </div>

                {/* Steps */}
                <div className="space-y-0">
                  {stepMeta.map((step, i) => {
                    const Icon = step.icon;
                    const done = i < stepIndex;
                    const active = i === stepIndex;
                    return (
                      <motion.div
                        key={step.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.08 }}
                        className="flex gap-3"
                      >
                        <div className="flex flex-col items-center">
                          <motion.div
                            animate={active && !cancelled ? { scale: [1, 1.15, 1] } : {}}
                            transition={active ? { duration: 1.2, repeat: Infinity } : {}}
                            className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                              cancelled
                                ? "bg-red-100 text-red-500"
                                : done
                                ? "bg-sage text-white"
                                : active
                                ? "bg-gold text-white shadow-md shadow-gold/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </motion.div>
                          {i < stepMeta.length - 1 && (
                            <div className={`w-0.5 h-8 ${done ? "bg-sage" : "bg-muted"}`} />
                          )}
                        </div>
                        <div className="pb-6">
                          <h4 className={`text-sm font-medium ${active ? "text-gold" : done ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Order items */}
              {items.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl border border-border/50 p-6 mb-6"
                >
                  <h4 className="font-semibold text-foreground text-sm mb-3">Your Order</h4>
                  <div className="space-y-2">
                    {items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-foreground/80">{item.name} × {item.qty}</span>
                        {item.price != null && <span className="font-medium">₹{item.price * item.qty}</span>}
                      </div>
                    ))}
                    {total > 0 && (
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold">₹{total}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleRepeat}
                    className="mt-4 w-full flex items-center justify-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-muted transition-all"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Repeat This Order
                  </button>
                </motion.div>
              )}

              {/* Track another order */}
              <form onSubmit={handleLookup} className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="Track another order number"
                  className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-mono uppercase outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
                <button
                  type="submit"
                  className="border border-border text-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted transition-all"
                >
                  Track
                </button>
              </form>
            </>
          )}

          {/* Actions */}
          {hasOrder && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/"
                className="flex-1 inline-flex items-center justify-center gap-2 border border-border text-foreground px-5 py-3 rounded-xl text-sm font-semibold hover:bg-muted transition-all"
              >
                Back to Home
              </Link>
              <Link
                to="/menu"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gold text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-gold/90 transition-all"
              >
                Order More <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
