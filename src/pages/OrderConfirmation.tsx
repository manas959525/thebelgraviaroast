import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Home, MapPin, Clock, Phone, RotateCcw, Printer, Receipt, ShieldCheck, Hourglass, Star, MessageSquareHeart } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { products } from "@/data/menu";
import { addToCart } from "@/lib/cart";
import { saveOrder, type OrderLineItem, type OrderStatus } from "@/lib/orders";
import { toast } from "sonner";

// Fallback only for direct visits without order state; computed at module load,
// never during render.
const FALLBACK_ORDER_ID = `TBR-${Date.now().toString(36).toUpperCase()}`;

interface ConfirmationState {
  orderId?: string;
  total?: number;
  subtotal?: number;
  tax?: number;
  discount?: number;
  couponCode?: string;
  orderType?: string;
  tableNumber?: string;
  guestName?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  utr?: string;
  receiptId?: string;
  dbOrderId?: string;
  items?: OrderLineItem[];
}

/**
 * Router state is lost on refresh, which would blank the receipt. The latest
 * receipt is mirrored into sessionStorage so a reload restores it exactly.
 */
function readReceiptState(locationState: ConfirmationState | null): ConfirmationState | null {
  if (locationState && typeof locationState === "object" && locationState.orderId) {
    try {
      window.sessionStorage.setItem("tbr-receipt", JSON.stringify(locationState));
    } catch {
      /* storage blocked — receipt still shows for this visit */
    }
    return locationState;
  }
  try {
    const raw = window.sessionStorage.getItem("tbr-receipt");
    if (raw) return JSON.parse(raw) as ConfirmationState;
  } catch {
    /* fall through */
  }
  return null;
}

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = readReceiptState(location.state as ConfirmationState | null);
  const submitReview = useMutation(api.cafe.submitReview);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSent, setReviewSent] = useState(false);

  const orderId = state?.orderId || FALLBACK_ORDER_ID;
  const total = state?.total || 0;
  const items = state?.items || [];
  // Persist to local order history exactly once (StrictMode-safe).
  const savedRef = useRef(false);
  useEffect(() => {
    if (savedRef.current || !state?.orderId) return;
    savedRef.current = true;
    saveOrder({
      id: state.orderId,
      items: state.items || [],
      subtotal: state.subtotal ?? total,
      tax: state.tax ?? Math.round(total * 0.05),
      discount: state.discount ?? 0,
      total,
      orderType: (state.orderType as "dine-in" | "takeaway" | "delivery") || "dine-in",
      tableNumber: state.tableNumber,
      guestName: state.guestName,
      paymentMethod: state.paymentMethod,
      status: "pending" as OrderStatus,
      placedAt: new Date().getTime(),
      etaMinutes: 12,
    });
  }, [state, total]);

  const handleOrderAgain = () => {
    let added = 0;
    items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product && product.available) {
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
        <div className="mx-auto max-w-lg px-4 sm:px-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="mb-6"
          >
            <CheckCircle className="h-20 w-20 text-sage mx-auto" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="text-3xl font-bold text-foreground mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-8">
              Thank you for ordering from The Belgravia Roast. Your order is being prepared with care.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl border border-border/50 p-6 mb-8 text-left"
          >
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-gold" />
                <div className="text-left">
                  <div className="text-sm text-muted-foreground">Receipt</div>
                  <div className="font-mono font-bold text-foreground">{state?.receiptId ?? `RCPT-${orderId.replace(/^TBR-/, "").slice(0, 8)}`}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Order</div>
                <div className="font-mono font-bold text-foreground">{orderId}</div>
              </div>
            </div>

            {items.length > 0 && (
              <div className="space-y-2 mb-4">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-foreground/80">{item.name} × {item.qty}</span>
                    <span className="font-medium">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 text-sm">
              {state?.discount ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{state.subtotal ?? total}</span>
                  </div>
                  <div className="flex justify-between text-sage">
                    <span>Coupon {state.couponCode ? `(${state.couponCode})` : "discount"}</span>
                    <span className="font-medium">-₹{state.discount}</span>
                  </div>
                </>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> Estimated Time</span>
                <span className="font-medium">10–15 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Order Type</span>
                <span className="font-medium capitalize">{state?.orderType || "Dine In"}</span>
              </div>
              {state?.tableNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Table</span>
                  <span className="font-medium">#{state.tableNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span className="font-medium capitalize">{state?.paymentMethod || "—"}</span>
              </div>
              {state?.utr && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">UTR / Reference</span>
                  <span className="font-mono font-medium text-foreground">{state.utr}</span>
                </div>
              )}
              {state?.paymentStatus && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Status</span>
                  <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                    state.paymentStatus === "paid" ? "bg-sage/10 text-sage" : "bg-amber-100 text-amber-700"
                  }`}>
                    {state.paymentStatus === "paid" ? <ShieldCheck className="h-3 w-3" /> : <Hourglass className="h-3 w-3" />}
                    {state.paymentStatus === "paid" ? "Paid & Verified" : "Awaiting verification"}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-3">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">₹{total}</span>
              </div>
            </div>

            {/* Print receipt */}
            <button
              onClick={() => window.print()}
              className="mt-5 w-full flex items-center justify-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted transition-all"
            >
              <Printer className="h-4 w-4" /> Print Receipt
            </button>
          </motion.div>

          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              <button
                onClick={handleOrderAgain}
                className="w-full flex items-center justify-center gap-2 border border-border text-foreground px-5 py-3 rounded-xl text-sm font-semibold hover:bg-muted transition-all"
              >
                <RotateCcw className="h-4 w-4" /> Order the Same Again
              </button>
            </motion.div>
          )}

          {/* Rate your experience — feeds the landing-page reviews after moderation */}
          {state?.orderId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="bg-white rounded-2xl border border-border/50 p-6 mb-8 text-left"
            >
              <div className="flex items-center gap-2 mb-3">
                <MessageSquareHeart className="h-4 w-4 text-dusty-rose" />
                <h4 className="font-semibold text-sm">How was your experience?</h4>
              </div>
              {reviewSent ? (
                <p className="text-sm text-sage">Thank you! Your review was sent to the team.</p>
              ) : (
                <>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setReviewRating(n)} aria-label={`${n} star${n === 1 ? "" : "s"}`} className="p-0.5">
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            n <= reviewRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Tell us about your coffee..."
                    rows={2}
                    className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 resize-none"
                  />
                  <button
                    onClick={() => {
                      if (!reviewText.trim()) {
                        toast.error("Please add a few words about your visit");
                        return;
                      }
                      void submitReview({
                        name: state?.guestName || "Guest",
                        rating: reviewRating,
                        text: reviewText.trim(),
                        orderNumber: state.orderId,
                      });
                      setReviewSent(true);
                      toast.success("Review submitted for moderation");
                    }}
                    className="mt-3 w-full bg-gold hover:bg-gold/90 text-white py-2.5 rounded-xl text-sm font-semibold transition-all"
                  >
                    Send Review
                  </button>
                </>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gold/5 rounded-2xl border border-gold/20 p-6 mb-8 text-left"
          >
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gold mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Need Help?</h4>
                <p className="text-xs text-muted-foreground">
                  Contact us at <a href="tel:+917728059988" className="font-medium text-foreground hover:text-gold transition-colors">+91 77280 59988</a> or visit the counter for any queries about your order.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              to="/track-order"
              className="inline-flex items-center justify-center gap-2 bg-gold text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gold/90 transition-all"
            >
              Track Order <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 border border-border text-foreground px-6 py-3 rounded-xl text-sm font-semibold hover:bg-muted transition-all"
            >
              <Home className="h-4 w-4" /> Back to Home
            </Link>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}