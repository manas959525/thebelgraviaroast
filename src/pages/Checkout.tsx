import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Truck, Store, CreditCard, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/lib/cart";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, count } = useCart();
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway" | "delivery">("dine-in");
  const [tableNumber, setTableNumber] = useState("");
  const [formData, setFormData] = useState({ name: "", phone: "", address: "", notes: "" });

  const tax = Math.round(total * 0.05);
  const grandTotal = total + tax;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/payment", { state: { grandTotal, orderType, tableNumber, ...formData } });
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

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-foreground mb-8">
            Checkout
          </motion.h1>

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
                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{total}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax (5%)</span><span>₹{tax}</span></div>
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
