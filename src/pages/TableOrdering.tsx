import { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { QrCode, ShoppingCart, Coffee, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { categories, products, type Product } from "@/data/menu";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";

export default function TableOrdering() {
  const [step, setStep] = useState<"scan" | "menu" | "cart">("scan");
  const [tableNum, setTableNum] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<{ product: Product; qty: number }[]>([]);

  const filtered = selectedCat
    ? products.filter((p) => p.category === selectedCat)
    : products;

  const handleStart = () => {
    if (tableNum.trim()) setStep("menu");
  };

  const handleAdd = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
    addToCart(product, 1);
    toast.success(`${product.name} added`);
  };

  const totalItems = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = cartItems.reduce((sum, i) => sum + (i.product.discountPrice ?? i.product.price) * i.qty, 0);

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
              <h1 className="text-3xl font-bold text-foreground mb-3">Table Ordering</h1>
              <p className="text-muted-foreground mb-8">
                Enter your table number to start browsing the full menu and ordering directly from your seat.
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
              <button
                onClick={handleStart}
                disabled={!tableNum.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold/90 text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-50"
              >
                <Coffee className="h-4 w-4" />
                Start Ordering
              </button>
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
                    onClick={() => setSelectedCat(cat.slug)}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1 ${
                      selectedCat === cat.slug ? "bg-gold text-white" : "bg-white border border-border text-foreground/70 hover:bg-muted"
                    }`}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((product) => (
                  <div key={product.id} className="bg-white rounded-2xl border border-border/50 overflow-hidden">
                    <img src={product.image} alt={product.name} className="h-36 w-full object-cover" />
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
                          className="h-8 w-8 rounded-xl bg-gold text-white flex items-center justify-center text-lg font-bold hover:bg-gold/90 transition-all"
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
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-4 bg-white rounded-xl border border-border/50 p-3">
                    <img src={item.product.image} alt={item.product.name} className="h-14 w-14 rounded-lg object-cover" />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{item.product.name}</h3>
                      <p className="text-xs text-muted-foreground">Qty: {item.qty}</p>
                    </div>
                    <span className="font-bold text-sm">₹{(item.product.discountPrice ?? item.product.price) * item.qty}</span>
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

      <Footer />
    </div>
  );
}
