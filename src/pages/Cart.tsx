import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart, updateQuantity, removeFromCart, clearCart } from "@/lib/cart";

export default function CartPage() {
  const { items, total, count } = useCart();

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
                        className="bg-white rounded-2xl border border-border/50 p-4 flex gap-4"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
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
                <div className="bg-white rounded-2xl border border-border/50 p-6 sticky top-24">
                  <h3 className="font-semibold text-foreground mb-4">Order Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal ({count} items)</span>
                      <span className="font-medium">₹{total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (5%)</span>
                      <span className="font-medium">₹{Math.round(total * 0.05)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="font-bold text-lg text-foreground">₹{total + Math.round(total * 0.05)}</span>
                    </div>
                  </div>
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
