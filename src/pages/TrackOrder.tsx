import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChefHat, Clock, Package, MapPin, ArrowRight, RotateCcw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { addToCart } from "@/lib/cart";
import { products } from "@/data/menu";
import { getOrderById, ORDER_STATUS_ORDER, type OrderStatus } from "@/lib/orders";
import { toast } from "sonner";

const stepMeta: { label: string; icon: typeof Check; desc: string }[] = [
  { label: "Order Received", icon: Check, desc: "We've received your order" },
  { label: "Confirmed", icon: Check, desc: "Payment confirmed" },
  { label: "Preparing", icon: ChefHat, desc: "Our chefs are crafting it" },
  { label: "Ready", icon: Package, desc: "Ready for pickup" },
  { label: "Served", icon: MapPin, desc: "Enjoy your meal!" },
];

export default function TrackOrder() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    orderId?: string;
    tableNumber?: string;
    items?: { name: string; qty: number; price?: number }[];
    total?: number;
  } | null;

  const storedOrder = state?.orderId ? getOrderById(state.orderId) : null;
  const orderId = state?.orderId || storedOrder?.id || "TBR-DEMO-001";
  const items = state?.items || storedOrder?.items || [];
  const tableNumber = state?.tableNumber || storedOrder?.tableNumber;
  const total = state?.total ?? storedOrder?.total ?? 0;

  // Live simulation: starts mid-progress and advances every few seconds.
  const [stepIndex, setStepIndex] = useState(2);

  useEffect(() => {
    const t = setInterval(() => {
      setStepIndex((s) => Math.min(s + 1, stepMeta.length - 1));
    }, 12000);
    return () => clearInterval(t);
  }, []);

  const statusLabel = stepMeta[stepIndex].label;
  const progress = (stepIndex / (stepMeta.length - 1)) * 100;
  const currentStatus: OrderStatus = ORDER_STATUS_ORDER[stepIndex] ?? "ready";

  const handleRepeat = () => {
    let added = 0;
    items.forEach((item) => {
      const product = products.find((p) => p.name === item.name);
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-32 lg:pb-10">
        <div className="mx-auto max-w-lg px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-foreground mb-1">Track Your Order</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Order <span className="font-mono font-medium text-foreground">{orderId}</span>
              {tableNumber ? ` · Table #${tableNumber}` : ""}
            </p>
          </motion.div>

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
                      {currentStatus === "preparing" && <span className="text-base">☕</span>}
                    </motion.span>
                  </AnimatePresence>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stepIndex >= stepMeta.length - 1 ? "It's on its way to you" : `Estimated time: ${Math.max(2, 12 - stepIndex * 3)}–${Math.max(5, 15 - stepIndex * 3)} minutes`}
                </p>
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
                        animate={active ? { scale: [1, 1.15, 1] } : {}}
                        transition={active ? { duration: 1.2, repeat: Infinity } : {}}
                        className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                          done
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

          {/* Actions */}
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
        </div>
      </div>
      <Footer />
    </div>
  );
}