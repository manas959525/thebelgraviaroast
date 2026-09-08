import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Check, CreditCard, Smartphone, Building2, QrCode } from "lucide-react";
import Navbar from "@/components/Navbar";
import { clearCart } from "@/lib/cart";

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { grandTotal?: number; orderType?: string; tableNumber?: string; name?: string; phone?: string; address?: string; notes?: string } | null;
  const [method, setMethod] = useState<"upi" | "card" | "cash">("upi");
  const [processing, setProcessing] = useState(false);

  const total = state?.grandTotal || 0;

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      clearCart();
      navigate("/order-confirmation", {
        state: {
          orderId: `TBR-${Date.now().toString(36).toUpperCase()}`,
          total,
          orderType: state?.orderType || "dine-in",
          tableNumber: state?.tableNumber,
        },
      });
    }, 2000);
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
            <h1 className="text-2xl font-bold text-foreground mb-2">Payment</h1>
            <p className="text-muted-foreground text-sm mb-8">Total: <span className="font-bold text-foreground">₹{total}</span></p>
          </motion.div>

          {/* Payment Methods */}
          <div className="space-y-3 mb-8">
            {([
              { value: "upi", label: "UPI Payment", icon: Smartphone, desc: "PhonePe, GPay, Paytm" },
              { value: "card", label: "Credit / Debit Card", icon: CreditCard, desc: "Visa, Mastercard, RuPay" },
              { value: "cash", label: "Pay at Counter", icon: Building2, desc: "Cash or card at the café" },
            ] as const).map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMethod(value)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  method === value ? "border-caramel bg-caramel/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                  method === value ? "bg-caramel text-white" : "bg-muted text-muted-foreground"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
                {method === value && <Check className="h-5 w-5 text-caramel" />}
              </button>
            ))}
          </div>

          {/* UPI QR */}
          {method === "upi" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-border/50 p-8 text-center mb-8"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <QrCode className="h-5 w-5 text-caramel" />
                <h3 className="font-semibold text-foreground">Scan to Pay</h3>
              </div>
              <div className="mx-auto w-56 h-56 rounded-2xl bg-muted flex items-center justify-center border border-border/50 overflow-hidden mb-4">
                <img
                  src="/manasqrcode.jpeg"
                  alt="UPI Payment QR Code"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement("div");
                      fallback.className = "text-center p-6";
                      fallback.innerHTML = '<div class="text-4xl mb-2">📱</div><p class="text-sm text-muted-foreground">UPI QR Code</p><p class="text-xs text-muted-foreground mt-1">Scan with any UPI app</p>';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Open any UPI app and scan this code to pay
              </p>
              <p className="text-lg font-bold text-foreground mt-2">₹{total}</p>
              <button
                onClick={handlePay}
                disabled={processing}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-caramel hover:bg-caramel/90 text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  "I've Completed the Payment"
                )}
              </button>
            </motion.div>
          )}

          {/* Card */}
          {method === "card" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-border/50 p-6 mb-8"
            >
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Card Number</label>
                  <input type="text" placeholder="1234 5678 9012 3456" className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-caramel focus:ring-2 focus:ring-caramel/20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Expiry</label>
                    <input type="text" placeholder="MM/YY" className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-caramel focus:ring-2 focus:ring-caramel/20" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">CVV</label>
                    <input type="password" placeholder="123" className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-caramel focus:ring-2 focus:ring-caramel/20" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Name on Card</label>
                  <input type="text" placeholder="Your name" className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-caramel focus:ring-2 focus:ring-caramel/20" />
                </div>
              </div>
              <button
                onClick={handlePay}
                disabled={processing}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-caramel hover:bg-caramel/90 text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ₹${total}`
                )}
              </button>
            </motion.div>
          )}

          {/* Cash */}
          {method === "cash" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-border/50 p-6 text-center mb-8"
            >
              <Building2 className="h-10 w-10 text-caramel mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Pay at the Counter</h3>
              <p className="text-sm text-muted-foreground mb-6">Settle your bill at the register when you collect or finish your order.</p>
              <button
                onClick={handlePay}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 bg-caramel hover:bg-caramel/90 text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Order"
                )}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
