import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronRight, Clock, CheckCircle, ChefHat, Heart, RotateCcw, Gift, Star, Coffee, Sparkles } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { products as staticProducts } from "@/data/menu";
import { useProductsWithFlags } from "@/lib/use-live-catalog";
import { addToCart } from "@/lib/cart";
import { useOrders, timeAgo } from "@/lib/orders";
import { useFavorites, toggleFavorite } from "@/lib/favorites";
import { toast } from "sonner";

type Tab = "orders" | "favourites" | "rewards";

const statusConfig = {
  pending: { icon: Clock, label: "Pending", color: "text-yellow-600 bg-yellow-50" },
  confirmed: { icon: CheckCircle, label: "Confirmed", color: "text-blue-600 bg-blue-50" },
  preparing: { icon: ChefHat, label: "Preparing", color: "text-orange-600 bg-orange-50" },
  ready: { icon: CheckCircle, label: "Ready", color: "text-green-600 bg-green-50" },
  delivered: { icon: CheckCircle, label: "Delivered", color: "text-emerald-600 bg-emerald-50" },
  cancelled: { icon: CheckCircle, label: "Cancelled", color: "text-red-600 bg-red-50" },
};

const rewardTiers = [
  { points: 100, label: "Free Coffee", emoji: "☕" },
  { points: 250, label: "₹100 Off", emoji: "🎁" },
  { points: 400, label: "Free Dessert", emoji: "🍰" },
];

export default function CustomerOrders() {
  const navigate = useNavigate();
  const localOrders = useOrders();
  const favs = useFavorites();
  const [tab, setTab] = useState<Tab>("orders");
  const { allProducts } = useProductsWithFlags();
  const { isAuthenticated } = useAuth();

  // Signed-in guests see their own order history from the café database
  // (server-scoped); guests fall back to orders placed on this device.
  const dbOrders = useQuery(api.cafe.listMyOrders, isAuthenticated ? {} : "skip");
  const orders = useMemo(() => {
    if (!isAuthenticated) return localOrders;
    const mine = dbOrders ?? [];
    return mine.map((o) => ({
      id: o.orderNumber ?? o._id,
      items: o.items.map((it) => ({ productId: it.productId, name: it.name, qty: it.quantity, price: it.price })),
      subtotal: o.subtotal ?? o.total,
      tax: o.tax ?? 0,
      discount: o.discount ?? 0,
      total: o.total,
      orderType: o.orderType,
      tableNumber: o.tableNumber != null ? String(o.tableNumber) : undefined,
      guestName: o.guestName,
      paymentMethod: o.paymentMethod,
      status: o.status,
      placedAt: o._creationTime,
      etaMinutes: 12,
    }));
  }, [isAuthenticated, dbOrders, localOrders]);

  const favouriteProducts = useMemo(() => allProducts.filter((p) => favs.includes(p.id)), [favs, allProducts]);
  const totalSpent = useMemo(
    () => orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0),
    [orders],
  );
  const points = Math.floor(totalSpent / 10);
  const nextTier = rewardTiers.find((t) => points < t.points);
  const progress = nextTier ? Math.min(100, Math.round((points / nextTier.points) * 100)) : 100;

  const handleOrderAgain = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    let added = 0;
    order.items.forEach((item) => {
      const product = staticProducts.find((p) => p.id === item.productId);
      if (product && allProducts.find((p) => p.id === product.id)?.available) {
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
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Café</h1>
            <p className="text-muted-foreground mb-6">Orders, favourites, and rewards — all in one place</p>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            {(["orders", "favourites", "rewards"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                  tab === t ? "bg-gold text-white shadow-md shadow-gold/20 chip-sheen" : "glass-chip text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── ORDERS ── */}
            {tab === "orders" && (
              <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {orders.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
                    <p className="text-sm text-muted-foreground mb-6">Place your first order to see it here.</p>
                    <Link to="/menu" className="inline-flex items-center gap-2 bg-gold text-white px-6 py-3 rounded-xl text-sm font-semibold">
                      Browse Menu
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isAuthenticated && (
                      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                        <Sparkles className="h-3 w-3 text-gold" /> Showing your full order history, synced live from the café
                      </div>
                    )}
                    {orders.map((order, i) => {
                      const config = statusConfig[order.status] ?? statusConfig.pending;
                      const StatusIcon = config.icon;
                      return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="glass-elevated rounded-2xl border-0 p-5 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <span className="font-mono font-bold text-sm text-foreground">{order.id}</span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {timeAgo(order.placedAt)}{order.tableNumber ? ` · Table #${order.tableNumber}` : ""}
                              </p>
                            </div>
                            <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${config.color}`}>
                              <StatusIcon className="h-3 w-3" /> {config.label}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {order.items.map((it) => `${it.name} × ${it.qty}`).join(", ")}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">₹{order.total}</span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleOrderAgain(order.id)}
                                className="flex items-center gap-1 text-xs text-gold font-medium hover:underline"
                              >
                                <RotateCcw className="h-3 w-3" /> Order Again
                              </button>
                              <Link
                                to="/track-order"
                                state={{ orderId: order.id, tableNumber: order.tableNumber, items: order.items, total: order.total }}
                                className="flex items-center gap-1 text-xs text-gold font-medium hover:underline"
                              >
                                Track <ChevronRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── FAVOURITES ── */}
            {tab === "favourites" && (
              <motion.div key="favourites" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {favouriteProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No favourites yet</h2>
                    <p className="text-sm text-muted-foreground mb-6">Tap the ♥ on any dish to keep it here for next time.</p>
                    <Link to="/menu" className="inline-flex items-center gap-2 bg-gold text-white px-6 py-3 rounded-xl text-sm font-semibold">
                      Explore the Menu
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {favouriteProducts.map((product) => (
                      <div key={product.id} className="glass-elevated rounded-2xl border-0 p-4 flex gap-4 items-center hover:shadow-md transition-all">
                        <img src={product.image} alt={product.name} className="h-16 w-16 rounded-xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <Link to={`/menu/${product.slug}`} className="font-semibold text-sm text-foreground hover:text-dusty-rose transition-colors truncate block">
                            {product.name}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5">₹{product.discountPrice ?? product.price}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => { addToCart(product, 1); toast.success(`${product.name} added to cart`); }}
                              className="bg-gold hover:bg-gold/90 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            >
                              Add to Cart
                            </button>
                            <button
                              onClick={() => { toggleFavorite(product.id); toast.success("Removed from favourites"); }}
                              className="text-dusty-rose hover:text-burgundy transition-colors"
                            >
                              <Heart className="h-4 w-4 fill-current" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── REWARDS ── */}
            {tab === "rewards" && (
              <motion.div key="rewards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-cafe-gradient text-white rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold/20 rounded-full blur-3xl" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-amber-300 fill-amber-300" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-200">Belgravia Rewards</span>
                    </div>
                    <div className="text-4xl font-bold mb-1">{points} <span className="text-lg font-medium text-white/50">points</span></div>
                    <div className="text-xs text-white/50 mb-4">{totalSpent > 0 ? `Earned from ₹${totalSpent.toLocaleString("en-IN")} of orders` : "Earn 1 point for every ₹10 you spend"}</div>
                    <div className="h-2 bg-white/15 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-amber-300 rounded-full"
                      />
                    </div>
                    <div className="text-xs text-white/60 mt-2">
                      {nextTier ? `${nextTier.points - points} points until your ${nextTier.label.toLowerCase()}` : "All rewards unlocked — enjoy!"}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-4">Redeem Rewards</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {rewardTiers.map((tier) => {
                      const unlocked = points >= tier.points;
                      return (
                        <div key={tier.points} className={`glass-elevated rounded-2xl border p-6 text-center transition-all ${unlocked ? "border-gold/40 shadow-md" : "opacity-60"}`}>
                          <div className="text-3xl mb-2">{tier.emoji}</div>
                          <div className="font-bold text-foreground mb-1">{tier.label}</div>
                          <div className="text-xs text-muted-foreground mb-3">{tier.points} points</div>
                          <button
                            disabled={!unlocked}
                            onClick={() => toast.success(unlocked ? `${tier.label} added to your cart as a freebie!` : "Keep earning points to unlock this")}
                            className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${unlocked ? "bg-gold text-white hover:bg-gold/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
                          >
                            {unlocked ? "Redeem" : "Locked"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-gold/5 border border-gold/20 rounded-2xl p-5">
                  <Gift className="h-5 w-5 text-gold mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Rewards are applied automatically at the counter. Ask your barista to redeem your points, or check out with <Coffee className="h-3 w-3 inline text-gold" /> My Café each visit to watch them grow.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </div>
  );
}
