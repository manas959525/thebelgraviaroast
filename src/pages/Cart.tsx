import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart, updateQuantity, removeFromCart, clearCart, addToCart } from "@/lib/cart";
import { getComplements } from "@/lib/cafe";
import { getComboFor } from "@/lib/combos";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useProductsWithFlags } from "@/lib/use-live-catalog";
import { toast } from "sonner";

export default function CartPage() {
  const { items, total, count } = useCart();
  const suggestions = items.length ? getComplements(items[0].product, 2) : [];
  const recordUpsell = useMutation(api.cafe.recordUpsellEvent);
  const settings = useQuery(api.cafe.listSettings);
  const { allProducts } = useProductsWithFlags();

  const combo = items.length > 0 ? getComboFor(items[0].product) : null;
  const comboMissingPair =
    combo && !items.some((i) => i.product.id === combo.pair.id);

  // Tax mirrors the café's configured rate (same source the server uses).
  const taxRatePct = Number(settings?.taxRate ?? "5") || 5;
  const tax = Math.round((total * taxRatePct) / 100);
  // Live availability: warn if anything in the cart has been marked sold out.
  const soldOutInCart = items.filter((i) => !allProducts.find((p) => p.id === i.product.id)?.available);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-32 lg:pb-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Cart</h1>
            <p className="text-muted-foreground mb-8">{count} {count === 1 ? "item" : "items"} in your cart</p>
          </motion.div>

          {items.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
              <p className="text-sm text-muted-foreground mb-6">Add something delicious to get started</p>
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 bg-gold text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gold/90 transition-all"
              >
                Browse Menu <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Order Items</span>
                  <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700 transition-colors">
                    Clear Cart
                  </button>
                </div>

                {/* Perfect-with suggestions */}
                {suggestions.length > 0 && (
                  <div className="glass-elevated rounded-2xl border-0 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-4 w-4 text-dusty-rose" />
                      <h3 className="text-sm font-bold text-foreground">Perfect with your {items[0]?.product.name}</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {suggestions.map((item) => (
                        <div key={item.id} className="glass-chip rounded-xl p-3 flex items-center gap-3">
                          <img src={item.image} alt={item.name} loading="lazy" decoding="async" className="h-14 w-14 rounded-lg object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <Link to={`/menu/${item.slug}`} className="font-semibold text-sm text-foreground hover:text-dusty-rose transition-colors truncate block">
                              {item.name}
                            </Link>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>
                            <div className="font-bold text-foreground mt-1 text-sm">₹{item.discountPrice ?? item.price}</div>
                          </div>
                          <button
                            onClick={() => { addToCart(item, 1); toast.success(`${item.name} added to cart`); }}
                            className="h-8 w-8 rounded-lg bg-gold text-white flex items-center justify-center text-lg font-bold hover:bg-gold/90 transition-all shrink-0"
                          >
                            +
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3">Tip: pair your drink with a bite — combos save you up to ₹100.</p>
                  </div>
                )}
                {/* Combo upsell banner */}
                {combo && comboMissingPair && (
                  <div className="bg-cafe-gradient text-white rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-36 h-36 bg-gold/20 rounded-full blur-2xl" />
                    <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <img
                          src={combo.pair.image}
                          alt={combo.pair.name}
                          loading="lazy"
                          decoding="async"
                          className="h-14 w-14 rounded-xl object-cover border-2 border-white/30 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold uppercase tracking-widest text-gold">Complete your order</div>
                          <div className="font-semibold text-sm mt-0.5 truncate">
                            Add {combo.pair.name} and save ₹{combo.savings}
                          </div>
                          <div className="text-white/60 text-xs mt-0.5">
                            <span className="line-through mr-1.5">₹{combo.original}</span>
                            <span className="text-white font-bold">₹{combo.comboPrice}</span> combo price
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          addToCart(combo.pair, 1);
                          recordUpsell({
                            comboId: combo.id,
                            mainId: combo.main.id,
                            pairId: combo.pair.id,
                            value: combo.comboPrice,
                            savings: combo.savings,
                            accepted: true,
                          }).catch(() => {});
                          toast.success(`Combo added — you saved ₹${combo.savings}`);
                        }}
                        className="shrink-0 bg-gold hover:bg-gold/90 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                      >
                        ADD COMBO — ₹{combo.comboPrice}
                      </button>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {items.map((item, index) => {
                    const price = item.product.discountPrice ?? item.product.price;
                    return (
                      <motion.div
                        key={`${item.product.id}-${index}`}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        className="glass-elevated liquid-sheen-slow rounded-2xl border-0 p-4 flex gap-4"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          loading="lazy"
                          decoding="async"
                          className="h-20 w-20 rounded-xl object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-foreground truncate">{item.product.name}</h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.selectedSize && (
                              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{item.selectedSize}</span>
                            )}
                            {item.selectedMilk && (
                              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{item.selectedMilk}</span>
                            )}
                            {(item.addOns ?? []).map((a) => (
                              <span key={a} className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded-full">+ {a}</span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="font-bold text-foreground">₹{price * item.quantity}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => removeFromCart(index)}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors ml-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="glass-elevated rounded-2xl border-0 p-6 sticky top-24">
                  <h3 className="font-semibold text-foreground mb-4">Order Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal ({count} items)</span>
                      <span className="font-medium">₹{total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax ({taxRatePct}%)</span>
                      <span className="font-medium">₹{tax}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="font-bold text-lg text-foreground">₹{total + tax}</span>
                    </div>
                  </div>
                  {soldOutInCart.length > 0 && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                      <p className="text-[11px] text-amber-700">
                        {soldOutInCart.map((i) => i.product.name).join(", ")} {soldOutInCart.length === 1 ? "has" : "have"} sold out — remove {soldOutInCart.length === 1 ? "it" : "them"} before checkout.
                      </p>
                    </div>
                  )}
                  <Link
                    to="/checkout"
                    className="mt-6 w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold/90 text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
                  >
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/menu"
                    className="mt-3 w-full flex items-center justify-center text-sm text-gold font-medium hover:underline"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
