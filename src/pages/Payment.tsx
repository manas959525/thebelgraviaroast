import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, CreditCard, Smartphone, Building2, AlertTriangle, ExternalLink, Receipt } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import { UpiQrCode } from "@/components/UpiQrCode";
import { clearCart, getCartItems } from "@/lib/cart";
import { toast } from "sonner";

type PaymentStatus = "idle" | "initiated" | "verification_pending";

/*
 * ── PAYMENT GATEWAY CONFIGURATION (intentionally not activated) ──
 * No online payment gateway is configured for this deployment, so nothing on
 * this page ever reports a false "Payment Successful" state:
 *  - UPI   → customer pays the café's real UPI ID (manual UTR + admin verify),
 *  - Card  → clearly marked unavailable online; recorded as pay-at-counter,
 *  - Cash  → settled at the café.
 * To activate a real gateway later (Razorpay, Cashfree, Stripe, …):
 *  1. Add the publishable key to the project's Keys/API keys tab
 *     (e.g. VITE_RAZORPAY_KEY_ID) and the secret to the Convex environment
 *     (dashboard → Settings → Environment Variables) — never hard-code them.
 *  2. Create a Convex action that creates the gateway order/checkout session
 *     and a webhook/verify action that flips payments.status to "verified"
 *     ONLY after the gateway confirms the signature (see cafe.ts
 *     verifyPayment, which the admin uses for manual UTR verification today).
 *  3. Swap the card option below from "pay at counter" to that flow.
 * Until those steps are done, keep the online-card option disabled.
 */

const DEFAULT_UPI_ID = "7728059988@ptyes";
const DEFAULT_CAFÉ_NAME = "THE BELGRAVIA ROAST";

interface CheckoutState {
  grandTotal?: number;
  subtotal?: number;
  tax?: number;
  discount?: number;
  couponCode?: string;
  orderType?: string;
  tableNumber?: string;
  name?: string;
  phone?: string;
  notes?: string;
}

/**
 * Checkout details are passed from Checkout via router state, which is lost on
 * refresh. Persisting them in sessionStorage lets the Payment page (and the
 * receipt) survive a reload instead of showing ₹0.
 */
function readCheckoutState(locationState: unknown): CheckoutState {
  if (locationState && typeof locationState === "object" && "grandTotal" in (locationState as object)) {
    try {
      window.sessionStorage.setItem("tbr-checkout", JSON.stringify(locationState));
    } catch {
      /* storage blocked — state still lives in memory for this visit */
    }
    return locationState as CheckoutState;
  }
  try {
    const raw = window.sessionStorage.getItem("tbr-checkout");
    if (raw) return JSON.parse(raw) as CheckoutState;
  } catch {
    /* fall through */
  }
  return {};
}

/** Crypto-random order id: unpredictable (not enumerable) and collision-safe. */
function generateOrderId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const rand = Array.from(bytes, (b) => (b % 36).toString(36)).join("").toUpperCase();
  return `TBR-${dateStr}-${rand}`;
}

function generateUpiDeepLink(amount: number, orderId: string, upiId: string, cafeName: string): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: cafeName,
    am: amount.toString(),
    cu: "INR",
    tn: `Order ${orderId}`,
    tr: orderId,
  });
  return `upi://pay?${params.toString()}`;
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const placeOrder = useMutation(api.cafe.placeOrder);
  const settings = useQuery(api.cafe.listSettings);
  const upiId = settings?.upiId?.trim() || DEFAULT_UPI_ID;
  const cafeName = settings?.cafeName?.trim() || DEFAULT_CAFÉ_NAME;

  const state = readCheckoutState(location.state);

  const [method, setMethod] = useState<"upi" | "card" | "cash">("upi");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [qrImageFailed, setQrImageFailed] = useState(false);
  const [utr, setUtr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Stable per visit: a page refresh regenerates it, which keeps a retried
  // submission from colliding with an order that was already recorded.
  const [orderId] = useState(() => generateOrderId());
  const total = state?.grandTotal || 0;
  const submittingRef = useRef(false);
  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  // No checkout data (e.g. direct visit after the receipt was cleared) — back to menu.
  useEffect(() => {
    if (total <= 0) {
      const t = setTimeout(() => navigate("/menu", { replace: true }), 2000);
      toast.warning("Nothing to pay for — returning to the menu.");
      return () => clearTimeout(t);
    }
  }, [total, navigate]);

  // Browser back / tab close mid-payment: keep sessionStorage checkout data
  // (so Back → forward still works); it is cleared only after a recorded order.
  useEffect(() => {
    const onBeforeUnload = () => {};
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const handleInitiatePayment = () => {
    setPaymentStatus("initiated");
    const deepLink = generateUpiDeepLink(total, orderId, upiId, cafeName);
    window.open(deepLink, "_blank");
  };

  /**
   * Record the order + payment on the server. The server re-prices every line
   * from its own catalog — the client total is only used as a sanity check.
   * Idempotent per orderId: a network retry can't create a duplicate order.
   */
  const submitOrder = async (paymentMethod: string, paymentStatus: "pending" | "paid" = "pending") => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setPaymentStatus("verification_pending");

    const cartItems = getCartItems();
    if (cartItems.length === 0) {
      toast.error("Your cart is empty — nothing to order.");
      navigate("/menu", { replace: true });
      return;
    }

    const orderData = {
      orderNumber: orderId,
      items: cartItems.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        price: i.product.discountPrice ?? i.product.price,
        quantity: i.quantity,
        customizations: i.customizations,
        addOns: i.addOns,
      })),
      subtotal: state?.subtotal ?? total,
      tax: state?.tax ?? 0,
      discount: state?.discount ?? 0,
      couponCode: state?.couponCode,
      total,
      orderType: (state?.orderType as "dine-in" | "takeaway" | "delivery") || "dine-in",
      tableNumber: state?.tableNumber,
      guestName: state?.name,
      guestPhone: state?.phone,
      notes: state?.notes,
      paymentMethod,
      utr: utr.trim() || undefined,
    };

    let db: { orderId: string; paymentId?: string; receiptId: string } | null = null;
    try {
      db = await placeOrder(orderData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Server-side validation (re-pricing, stock, hidden items) sends the
      // customer back to review instead of pretending the order went through.
      const serverRejection = [
        "total changed",
        "no longer on the menu",
        "cart is empty",
        "has just sold out",
        "Invalid quantity",
        "Too many items",
      ].some((s) => msg.includes(s));
      if (serverRejection) {
        toast.error(msg);
        navigate("/cart", { replace: true });
        return;
      }
      // Network hiccup: the receipt still works locally; staff verify manually.
      toast.warning("Couldn't reach the café database — your receipt is saved on this device.");
    }

    // Clear stored checkout details now that the order is placed.
    try {
      window.sessionStorage.removeItem("tbr-checkout");
    } catch {
      /* ignore */
    }

    clearCart();
    navigate("/order-confirmation", {
      state: {
        orderId,
        total,
        subtotal: state?.subtotal ?? total,
        tax: state?.tax ?? 0,
        discount: state?.discount ?? 0,
        couponCode: state?.couponCode,
        orderType: state?.orderType || "dine-in",
        tableNumber: state?.tableNumber,
        guestName: state?.name,
        paymentMethod,
        paymentStatus,
        utr: utr.trim() || undefined,
        dbOrderId: db?.orderId,
        paymentId: db?.paymentId,
        receiptId: db?.receiptId ?? `RCPT-${orderId.replace(/^TBR-/, "").slice(0, 8)}`,
        items: cartItems.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          qty: i.quantity,
          price: i.product.discountPrice ?? i.product.price,
        })),
      },
    });
  };

  const handlePaymentCompleted = () => {
    void submitOrder("upi");
  };

  const handleCashOrder = () => {
    void submitOrder("cash");
  };

  const handleCardOrder = () => {
    void submitOrder("card");
  };

  const busy = submitting;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-32 lg:pb-10">
        <div className="mx-auto max-w-lg px-4 sm:px-6">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-foreground mb-1">Payment</h1>
            <p className="text-xs text-muted-foreground mb-1">Order: <span className="font-mono font-medium text-foreground">{orderId}</span></p>
            <p className="text-muted-foreground text-sm mb-6">Amount to Pay: <span className="font-bold text-foreground text-lg">₹{total}</span></p>
          </motion.div>

          {/* Payment Methods */}
          <div className="space-y-3 mb-8">
            {([
              { value: "upi" as const, label: "UPI / Scan & Pay", icon: Smartphone, desc: "Google Pay, PhonePe, Paytm, BHIM" },
              { value: "card" as const, label: "Card at Counter", icon: CreditCard, desc: "Pay by card when you collect" },
              { value: "cash" as const, label: "Pay at Counter", icon: Building2, desc: "Cash or card at the café" },
            ]).map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMethod(value)}
                disabled={busy}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  method === value ? "border-gold bg-gold/5" : "border-border hover:bg-muted/50"
                } ${busy ? "opacity-60" : ""}`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                  method === value ? "bg-gold text-white" : "bg-muted text-muted-foreground"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
                {method === value && <Check className="h-5 w-5 text-gold" />}
              </button>
            ))}
          </div>

          {/* ═══ UPI — the café's real QR image with a generated fallback ═══ */}
          <AnimatePresence mode="wait">
            {method === "upi" && (
              <motion.div
                key="upi"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-elevated rounded-2xl border-0 p-6 sm:p-8 text-center mb-8"
              >
                {/* Brand header */}
                <div className="mb-5">
                  <div className="font-display text-lg font-bold text-foreground tracking-tight">{cafeName}</div>
                  <div className="text-xs text-muted-foreground mt-1">UPI Payment</div>
                </div>

                {/* QR Code */}
                <div className="mx-auto w-56 h-56 sm:w-64 sm:h-64 rounded-2xl bg-white flex items-center justify-center border-2 border-border/60 overflow-hidden mb-5 shadow-sm">
                  {qrImageFailed ? (
                    <UpiQrCode amount={total} orderId={orderId} upiId={upiId} cafeName={cafeName} />
                  ) : (
                    <img
                      src="/manasqrcode.jpeg"
                      alt="Scan this QR code with any UPI app to pay The Belgravia Roast"
                      className="w-full h-full object-contain"
                      onError={() => setQrImageFailed(true)}
                    />
                  )}
                </div>

                {/* UPI ID */}
                <div className="mb-4">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">UPI ID</div>
                  <div className="font-mono text-sm font-medium text-foreground">{upiId}</div>
                </div>

                {/* Amount */}
                <div className="mb-5 py-3 border-t border-b">
                  <div className="text-xs text-muted-foreground mb-1">Amount to Pay</div>
                  <div className="text-2xl font-bold text-foreground">₹{total}</div>
                </div>

                {/* Supported apps */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  {["Paytm", "PhonePe", "GPay", "BHIM"].map((app) => (
                    <span key={app} className="text-[10px] font-medium bg-muted px-2.5 py-1 rounded-full text-muted-foreground">{app}</span>
                  ))}
                </div>

                {/* Status messages */}
                <AnimatePresence>
                  {paymentStatus === "initiated" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center gap-2 overflow-hidden">
                      <Smartphone className="h-4 w-4 text-blue-500 shrink-0" />
                      <span className="text-xs text-blue-700">UPI app opened. Complete the payment in your app.</span>
                    </motion.div>
                  )}
                  {paymentStatus === "verification_pending" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-2 overflow-hidden">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-xs text-amber-700">Recording your payment and generating your receipt...</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                {paymentStatus === "idle" && !busy && (
                  <div className="space-y-3">
                    <button
                      onClick={handleInitiatePayment}
                      className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-warm-taupe text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-gold/20"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open UPI App
                    </button>
                    <button
                      onClick={() => setPaymentStatus("initiated")}
                      className="w-full flex items-center justify-center gap-2 border border-border text-foreground py-3 rounded-xl text-sm font-medium hover:bg-muted transition-all"
                    >
                      I Have Completed Payment
                    </button>
                  </div>
                )}
                {paymentStatus === "initiated" && (
                  <div className="space-y-3 text-left">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1.5 block">
                        UTR / Transaction Reference <span className="text-muted-foreground font-normal">(from your UPI app — speeds up verification)</span>
                      </label>
                      <input
                        type="text"
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                        placeholder="e.g. 415982736401"
                        className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-mono outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                      />
                    </div>
                    <button
                      onClick={handlePaymentCompleted}
                      disabled={busy}
                      className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-warm-taupe text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-60"
                    >
                      <Receipt className="h-4 w-4" />
                      {busy ? "Recording your order..." : "Confirm Payment & Get Receipt"}
                    </button>
                    <button
                      onClick={() => setPaymentStatus("idle")}
                      disabled={busy}
                      className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      Go back
                    </button>
                  </div>
                )}
                {paymentStatus === "verification_pending" && busy && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-3">
                    <div className="h-4 w-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                    Recording your order...
                  </div>
                )}

                {/* Security notice */}
                <div className="mt-4 text-[10px] text-muted-foreground leading-relaxed">
                  Your UTR lets our team verify the payment instantly. The receipt is generated immediately; the payment status is confirmed by the café.
                </div>
              </motion.div>
            )}

            {/* ═══ CARD — recorded as pay-at-counter; no card data is collected or stored ═══ */}
            {method === "card" && (
              <motion.div key="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="glass-elevated rounded-2xl border-0 p-6 mb-8">
                <div className="bg-muted/60 border border-border rounded-xl p-4 mb-5 text-xs text-muted-foreground leading-relaxed">
                  Online card payments aren't available yet. Choose this option to pay by card at the counter — your order is recorded
                  now and settled in person. No card details are entered or stored on this site.
                </div>
                <button onClick={handleCardOrder} disabled={busy}
                  className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-warm-taupe text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-50">
                  {busy ? (
                    <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Recording order...</>
                  ) : `Record Order — Pay ₹${total} at Counter`}
                </button>
              </motion.div>
            )}

            {/* ═══ CASH ═══ */}
            {method === "cash" && (
              <motion.div key="cash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="glass-elevated rounded-2xl border-0 p-6 text-center mb-8">
                <Building2 className="h-10 w-10 text-gold mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Pay at the Counter</h3>
                <p className="text-sm text-muted-foreground mb-6">Settle your bill at the register when you collect or finish your order.</p>
                <button onClick={handleCashOrder} disabled={busy}
                  className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-warm-taupe text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-50">
                  {busy ? (
                    <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Recording order...</>
                  ) : "Confirm Order"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
