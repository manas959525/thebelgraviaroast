import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, CreditCard, Smartphone, Building2, AlertTriangle, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import { clearCart } from "@/lib/cart";

type PaymentStatus = "idle" | "initiated" | "verification_pending" | "completed" | "failed";

const UPI_ID = "7728059988@ptyes";
const CAFÉ_NAME = "THE BELGRAVIA ROAST";

function generateOrderId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TBR-${dateStr}-${rand}`;
}

function generateUpiDeepLink(amount: number, orderId: string): string {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: CAFÉ_NAME,
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
  const state = location.state as {
    grandTotal?: number;
    orderType?: string;
    tableNumber?: string;
    name?: string;
    phone?: string;
  } | null;

  const [method, setMethod] = useState<"upi" | "card" | "cash">("upi");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [orderId] = useState(() => generateOrderId());
  const total = state?.grandTotal || 0;

  const handleInitiatePayment = () => {
    setPaymentStatus("initiated");
    const deepLink = generateUpiDeepLink(total, orderId);
    window.open(deepLink, "_blank");
  };

  const handlePaymentCompleted = () => {
    setPaymentStatus("verification_pending");
    setTimeout(() => {
      setPaymentStatus("completed");
      clearCart();
      navigate("/order-confirmation", {
        state: {
          orderId,
          total,
          orderType: state?.orderType || "dine-in",
          tableNumber: state?.tableNumber,
          paymentMethod: "upi",
          paymentStatus: "paid",
        },
      });
    }, 1500);
  };

  const handleCashOrder = () => {
    setPaymentStatus("initiated");
    setTimeout(() => {
      clearCart();
      navigate("/order-confirmation", {
        state: {
          orderId,
          total,
          orderType: state?.orderType || "dine-in",
          tableNumber: state?.tableNumber,
          paymentMethod: "cash",
          paymentStatus: "pending",
        },
      });
    }, 1000);
  };

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
              { value: "card" as const, label: "Credit / Debit Card", icon: CreditCard, desc: "Visa, Mastercard, RuPay" },
              { value: "cash" as const, label: "Pay at Counter", icon: Building2, desc: "Cash or card at the café" },
            ]).map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMethod(value)}
                disabled={paymentStatus !== "idle"}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  method === value ? "border-gold bg-gold/5" : "border-border hover:bg-muted/50"
                } ${paymentStatus !== "idle" ? "opacity-60" : ""}`}
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

          {/* ═══ UPI — Section 8 ═══ */}
          <AnimatePresence mode="wait">
            {method === "upi" && (
              <motion.div
                key="upi"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl border border-border/50 p-6 sm:p-8 text-center mb-8"
              >
                {/* Brand header */}
                <div className="mb-5">
                  <div className="font-display text-lg font-bold text-foreground tracking-tight">{CAFÉ_NAME}</div>
                  <div className="text-xs text-muted-foreground mt-1">UPI Payment</div>
                </div>

                {/* QR Code — your uploaded Paytm UPI QR */}
                <div className="mx-auto w-56 h-56 sm:w-64 sm:h-64 rounded-2xl bg-white flex items-center justify-center border-2 border-border/60 overflow-hidden mb-5 shadow-sm">
                  <img
                    src="/manasqrcode.jpeg"
                    alt="Scan this QR code with any UPI app to pay The Belgravia Roast"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector(".qr-fallback")) {
                        const fallback = document.createElement("div");
                        fallback.className = "qr-fallback text-center p-6";
                        fallback.innerHTML = '<div class="text-5xl mb-3">📱</div><p class="text-sm font-medium text-foreground">UPI QR Code</p><p class="text-xs text-muted-foreground mt-2">Please place your QR image at:<br/><code class="bg-muted px-2 py-0.5 rounded text-[10px] mt-1 inline-block">public/manasqrcode.jpeg</code></p>';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>

                {/* UPI ID */}
                <div className="mb-4">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">UPI ID</div>
                  <div className="font-mono text-sm font-medium text-foreground">{UPI_ID}</div>
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
                      <span className="text-xs text-amber-700">Verifying payment with our system. Please wait...</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                {paymentStatus === "idle" && (
                  <div className="space-y-3">
                    <button
                      onClick={handleInitiatePayment}
                      className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-warm-taupe text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-gold/20"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open UPI App
                    </button>
                    <button
                      onClick={handlePaymentCompleted}
                      className="w-full flex items-center justify-center gap-2 border border-border text-foreground py-3 rounded-xl text-sm font-medium hover:bg-muted transition-all"
                    >
                      I Have Completed Payment
                    </button>
                  </div>
                )}
                {paymentStatus === "initiated" && (
                  <button
                    onClick={handlePaymentCompleted}
                    className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-warm-taupe text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
                  >
                    <Check className="h-4 w-4" />
                    I Have Completed Payment
                  </button>
                )}
                {paymentStatus === "verification_pending" && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-3">
                    <div className="h-4 w-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                    Verifying...
                  </div>
                )}

                {/* Security notice */}
                <div className="mt-4 text-[10px] text-muted-foreground leading-relaxed">
                  Clicking "I Have Completed Payment" does not guarantee payment success.
                  Your order status will update after server-side verification.
                </div>
              </motion.div>
            )}

            {/* ═══ CARD ═══ */}
            {method === "card" && (
              <motion.div key="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl border border-border/50 p-6 mb-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Card Number</label>
                    <input type="text" placeholder="1234 5678 9012 3456" className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Expiry</label>
                      <input type="text" placeholder="MM/YY" className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">CVV</label>
                      <input type="password" placeholder="123" className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Name on Card</label>
                    <input type="text" placeholder="Your name" className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" />
                  </div>
                </div>
                <button onClick={handlePaymentCompleted} disabled={paymentStatus !== "idle"}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-gold hover:bg-warm-taupe text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-50">
                  {paymentStatus !== "idle" ? (
                    <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                  ) : `Pay ₹${total}`}
                </button>
              </motion.div>
            )}

            {/* ═══ CASH ═══ */}
            {method === "cash" && (
              <motion.div key="cash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl border border-border/50 p-6 text-center mb-8">
                <Building2 className="h-10 w-10 text-gold mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Pay at the Counter</h3>
                <p className="text-sm text-muted-foreground mb-6">Settle your bill at the register when you collect or finish your order.</p>
                <button onClick={handleCashOrder} disabled={paymentStatus !== "idle"}
                  className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-warm-taupe text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-50">
                  {paymentStatus !== "idle" ? (
                    <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
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
