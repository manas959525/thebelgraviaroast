import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Truck, Store, ChevronRight, Check, Tag, Sparkles, X } from "lucide-react";
import { useQuery, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

const steps = ["Cart", "Details", "Pay", "Track"];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total } = useCart();
  const settings = useQuery(api.cafe.listSettings);
  // Pre-select the mode chosen on the landing page ("How do you want to order?")
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway" | "delivery">(() => {
    try {
      const saved = window.localStorage.getItem("tbr-order-mode");
      if (saved === "dine-in" || saved === "takeaway" || saved === "delivery") return saved;
    } catch {
      /* storage blocked — fall back to dine-in */
    }
    return "dine-in";
  });
  const [tableNumber, setTableNumber] = useState("");
  const [formData, setFormData] = useState({ name: "", phone: "", address: "", notes: "" });
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; label: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const convex = useConvex();

  const taxRate = Number(settings?.taxRate ?? "5") / 100;
  const tax = Math.round(total * taxRate);
  const discount = coupon?.discount ?? 0;
  const grandTotal = total + tax - discount;

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    try {
      const result = await convex.query(api.cafe.validateCoupon, { code, subtotal: total });
      if (result.ok) {
        setCoupon({ code: result.code, label: result.description, discount: result.discount });
        setCouponError("");
        toast.success(`Coupon ${result.code} applied — you save ₹${result.discount}`);
      } else {
        setCoupon(null);
        setCouponError(result.error);
      }
    } catch {
      setCouponError("Couldn't reach the coupon service — try again.");
    }
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/payment", {
      state: {
        grandTotal,
        subtotal: total,
        tax,
        discount,
        couponCode: coupon?.code,
        orderType,
        tableNumber,
        ...formData,
      },
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <Link to="/menu" className="text-gold text-sm font-medium hover:underline">Browse Menu</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-32 lg:pb-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link to="/cart" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Cart
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-6">Checkout</h1>
            {/* Progress steps */}
            <div className="flex items-center gap-2 sm:gap-3">
              {steps.map((step, i) => {
                const done = i < 2;
                const active = i === 2;
                return (
                  <div key={step} className="flex items-center gap-2 sm:gap-3 flex-1 last:flex-none">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        done ? "bg-sage text-white" : active ? "bg-gold text-white shadow-md shadow-gold/20" : "bg-muted text-muted-foreground"
                      }`}>
                        {done ? <Check className="h-4 w-4" /> : i + 1}
                      </div>
                      <span className={`text-xs font-semibold hidden sm:block ${active || done ? "text-foreground" : "text-muted-foreground"}`}>
                        {step}
                      </span>
                    </div>
                    {i < steps.length - 1 && <div className={`h-0.5 flex-1 rounded-full ${done ? "bg-sage" : "bg-muted"}`} />}
                  </div>
                );
              })}
            </div>
          </motion.div>

          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Order Type */}
              <div className="bg-white rounded-2xl border border-border/50 p-6">
                <h3 className="font-semibold text-foreground mb-4">How would you like your order?</h3>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: "dine-in", label: "Dine In", icon: Store, desc: "Enjoy here" },
                    { value: "takeaway", label: "Takeaway", icon: MapPin, desc: "Pick up" },
                    { value: "delivery", label: "Delivery", icon: Truck, desc: "To your door" },
                  ] as const).map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setOrderType(value)}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        orderType === value
                          ? "border-gold bg-gold/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <Icon className={`h-5 w-5 mx-auto mb-2 ${orderType === value ? "text-gold" : "text-muted-foreground"}`} />
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{desc}</div>
                    </button>
                  ))}
                </div>

                {orderType === "dine-in" && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-foreground">Table Number</label>
                    <input
                      type="number"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="Enter your table number"
                      className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                    />
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className="bg-white rounded-2xl border border-border/50 p-6">
                <h3 className="font-semibold text-foreground mb-4">Contact Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      required
                      className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      required
                      className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                    />
                  </div>
                  {orderType === "delivery" && (
                    <div>
                      <label className="text-sm font-medium text-foreground">Delivery Address</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Full delivery address"
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 resize-none"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-foreground">Special Instructions (optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any allergies, preferences, or special requests..."
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-border/50 p-6 sticky top-24">
                <h3 className="font-semibold text-foreground mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate mr-2">{item.product.name} × {item.quantity}</span>
                      <span className="font-medium shrink-0">₹{(item.product.discountPrice ?? item.product.price) * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="mb-4">
                  {coupon ? (
                    <div className="flex items-center justify-between bg-sage/10 border border-sage/30 rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-sage" />
                        <div>
                          <div className="text-xs font-bold text-sage">{coupon.code}</div>
                          <div className="text-[10px] text-muted-foreground">{coupon.label}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setCoupon(null); setCouponInput(""); }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder="Coupon code"
                          className="flex-1 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 uppercase"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="px-3 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-all"
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && <p className="text-[10px] text-red-500 mt-1.5">{couponError}</p>}
                    </div>
                  )}
                </div>

                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{total}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax (5%)</span><span>₹{tax}</span></div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sage">
                      <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Discount</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between"><span className="font-semibold">Total</span><span className="font-bold text-lg">₹{grandTotal}</span></div>
                </div>
                <button
                  type="submit"
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold/90 text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
                >
                  Continue to Payment
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}