import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { QrCode, ShoppingCart, Coffee, Check, Bell, Droplets, Utensils, Receipt, Brush, Sparkles } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { categories, type Product } from "@/data/menu";
import { useProductsWithFlags } from "@/lib/use-live-catalog";
import { addToCart, useCart } from "@/lib/cart";
import { addServiceRequest, type ServiceRequest } from "@/lib/orders";
import { toast } from "sonner";

const serviceActions: { type: ServiceRequest["type"]; label: string; icon: typeof Bell; desc: string }[] = [
  { type: "call-staff", label: "Call Staff", icon: Bell, desc: "We'll be right over" },
  { type: "water", label: "Request Water", icon: Droplets, desc: "A glass of water" },
  { type: "cutlery", label: "Request Cutlery", icon: Utensils, desc: "Extra cutlery" },
  { type: "bill", label: "Request Bill", icon: Receipt, desc: "Get your bill" },
  { type: "clear", label: "Clear Table", icon: Brush, desc: "Ready for clearing" },
];

export default function TableOrdering() {
  const [searchParams] = useSearchParams();
  const recordRequest = useMutation(api.cafe.recordServiceRequest);
  const qrTable = searchParams.get("table") || "";

  const [step, setStep] = useState<"scan" | "menu" | "cart">(qrTable ? "menu" : "scan");
  const [tableNum, setTableNum] = useState(qrTable);

  // QR-scan guests are dining in by definition — carry the table number and
  // order mode into checkout so nothing needs to be retyped.
  useEffect(() => {
    if (!qrTable.trim()) return;
    try {
      window.sessionStorage.setItem("tbr-table", qrTable.trim());
      window.localStorage.setItem("tbr-order-mode", "dine-in");
    } catch {
      /* storage blocked — checkout just won't pre-fill */
    }
  }, [qrTable]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const { allProducts } = useProductsWithFlags();
  // The global cart is the single source of truth — the same items flow into
  // checkout and the navbar badge, and survive a refresh.
  const { items: cartItems } = useCart();

  const filtered = selectedCat
    ? allProducts.filter((p) => p.category === selectedCat)
    : allProducts;

  const handleStart = () => {
    if (tableNum.trim()) setStep("menu");
  };

  const handleService = (type: ServiceRequest["type"], label: string) => {
    if (!tableNum.trim()) {
      toast.error("Enter your table number first");
      return;
    }
    addServiceRequest(tableNum.trim(), type); // local copy for resilience
    void recordRequest({ table: tableNum.trim(), type }); // live copy for the staff console
    toast.success(`${label} — our team has been notified`);
  };

  const handleAdd = (product: Product) => {
    addToCart(product, 1);
    toast.success(`${product.name} added`);
  };

  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cartItems.reduce((sum, i) => sum + (i.product.discountPrice ?? i.product.price) * i.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-32 lg:pb-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

          {/* Step: Scan / Enter Table */}
          {step === "scan" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto text-center py-16">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gold/10 text-gold">
                <QrCode className="h-10 w-10" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to The Belgravia Roast</h1>
              <p className="text-muted-foreground mb-8">
                Enter your table number and order straight from your seat — no app, no sign-up.
              </p>
              <div className="bg-white rounded-2xl border border-border/50 p-6 mb-6">
                <label className="text-sm font-medium text-foreground block mb-2">Table Number</label>
                <input
                  type="number"
                  value={tableNum}
                  onChange={(e) => setTableNum(e.target.value)}
                  placeholder="e.g. 7"
                  className="w-full rounded-xl border border-border px-4 py-3 text-center text-2xl font-bold outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
              </div>

              {/* Quick category jumps */}
              <div className="mb-8">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">What are you in the mood for?</div>
                <div className="grid grid-cols-2 gap-2">
                  {categories.slice(0, 6).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        if (!tableNum.trim()) {
                          toast.error("Enter your table number first");
                          return;
                        }
                        setSelectedCat(cat.id);
                        setStep("menu");
                      }}
                      className="flex items-center gap-2 bg-white border border-border/50 rounded-xl px-3 py-2.5 text-sm font-medium hover:border-gold/50 hover:shadow-sm transition-all"
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStart}
                disabled={!tableNum.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold/90 text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-50"
              >
                <Coffee className="h-4 w-4" />
                Start Ordering
              </button>

              {/* Service requests */}
              <div className="mt-10">
                <div className="flex items-center gap-2 mb-3 justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-dusty-rose" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Need something?</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {serviceActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.type}
                        onClick={() => handleService(action.type, action.label)}
                        className="flex flex-col items-center gap-1.5 bg-white border border-border/50 rounded-xl px-2 py-3 hover:border-dusty-rose/50 hover:shadow-sm transition-all"
                      >
                        <Icon className="h-5 w-5 text-dusty-rose" />
                        <span className="text-[11px] font-medium text-foreground/80">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-3">
                  Requests appear instantly on the staff console at the counter.
                </p>
              </div>
            </motion.div>
          )}

          {/* Step: Menu */}
          {step === "menu" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Table #{tableNum}</h1>
                  <p className="text-sm text-muted-foreground">Browse and tap to add items</p>
                </div>
                {totalItems > 0 && (
                  <button
                    onClick={() => setStep("cart")}
                    className="flex items-center gap-2 bg-gold text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {totalItems} items · ₹{totalPrice}
                  </button>
                )}
              </div>

              {/* Service bar */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
                {serviceActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.type}
                      onClick={() => handleService(action.type, action.label)}
                      className="shrink-0 inline-flex items-center gap-1.5 bg-white border border-border/60 rounded-xl px-3 py-2 text-xs font-medium text-foreground/80 hover:border-dusty-rose/50 hover:shadow-sm transition-all"
                    >
                      <Icon className="h-3.5 w-3.5 text-dusty-rose" />
                      {action.label}
                    </button>
                  );
                })}
              </div>

              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                <button
                  onClick={() => setSelectedCat(null)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    !selectedCat ? "bg-gold text-white" : "bg-white border border-border text-foreground/70 hover:bg-muted"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1 ${
                      selectedCat === cat.id ? "bg-gold text-white" : "bg-white border border-border text-foreground/70 hover:bg-muted"
                    }`}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
                {filtered.map((product) => (
                  <div key={product.id} className={`bg-white rounded-2xl border overflow-hidden ${product.available ? "border-border/50" : "border-border/40 opacity-70"}`}>
                    <div className="relative">
                      <img src={product.image} alt={product.name} loading="lazy" decoding="async" className="h-36 w-full object-cover" />
                      {!product.available && (
                        <div className="absolute inset-0 bg-navy/70 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Sold Out Today</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-1 mb-1">
                        {product.isVeg ? (
                          <div className="w-3 h-3 rounded border-[1.5px] border-green-500 flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-green-500" />
                          </div>
                        ) : (
                          <div className="w-3 h-3 rounded border-[1.5px] border-red-500 flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-red-500" />
                          </div>
                        )}
                        <h3 className="font-semibold text-sm text-foreground truncate">{product.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">₹{product.discountPrice ?? product.price}</span>
                        <button
                          onClick={() => handleAdd(product)}
                          disabled={!product.available}
                          className="h-8 w-8 rounded-xl bg-gold text-white flex items-center justify-center text-lg font-bold hover:bg-gold/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step: Cart Summary */}
          {step === "cart" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl font-bold text-foreground mb-6">Your Order — Table #{tableNum}</h1>
              <div className="space-y-3 mb-6">
                {cartItems.map((item, idx) => (
                  <div key={`${item.product.id}-${idx}`} className="flex items-center gap-4 bg-white rounded-xl border border-border/50 p-3">
                    <img src={item.product.image} alt={item.product.name} loading="lazy" decoding="async" className="h-14 w-14 rounded-lg object-cover" />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{item.product.name}</h3>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-sm">₹{(item.product.discountPrice ?? item.product.price) * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-border/50 p-4 mb-6">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{totalPrice}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("menu")}
                  className="flex-1 border border-border py-3 rounded-xl text-sm font-semibold hover:bg-muted transition-all"
                >
                  Add More
                </button>
                <Link
                  to="/checkout"
                  className="flex-1 flex items-center justify-center gap-2 bg-gold text-white py-3 rounded-xl text-sm font-semibold hover:bg-gold/90 transition-all"
                >
                  <Check className="h-4 w-4" /> Place Order
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating cart bar (menu step, mobile-first) */}
      {step === "menu" && totalItems > 0 && (
        <div className="fixed bottom-16 lg:bottom-6 left-4 right-4 z-30 lg:left-auto lg:right-6 lg:w-80">
          <Link
            to="/checkout"
            className="flex items-center justify-between bg-gold text-white rounded-2xl px-5 py-3.5 shadow-xl hover:bg-gold/90 transition-all"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingCart className="h-4 w-4" />
              {totalItems} item{totalItems === 1 ? "" : "s"} · ₹{totalPrice}
            </span>
            <span className="text-sm font-bold">View Cart →</span>
          </Link>
        </div>
      )}

      <Footer />
    </div>
  );
}