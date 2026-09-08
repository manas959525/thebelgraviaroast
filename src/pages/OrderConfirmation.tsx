import { Link, useLocation } from "react-router";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Home, MapPin, Clock, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function OrderConfirmation() {
  const location = useLocation();
  const state = location.state as { orderId?: string; total?: number; orderType?: string; tableNumber?: string } | null;

  const orderId = state?.orderId || `TBR-${Date.now().toString(36).toUpperCase()}`;
  const total = state?.total || 0;

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
              <span className="text-sm text-muted-foreground">Order ID</span>
              <span className="font-mono font-bold text-foreground">{orderId}</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> Estimated Time</span>
                <span className="font-medium">15–20 minutes</span>
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
              <div className="flex justify-between border-t pt-3">
                <span className="font-semibold">Total Paid</span>
                <span className="font-bold text-lg">₹{total}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-caramel/5 rounded-2xl border border-caramel/20 p-6 mb-8 text-left"
          >
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-caramel mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Need Help?</h4>
                <p className="text-xs text-muted-foreground">
                  Contact us at <span className="font-medium text-foreground">+91 98765 43210</span> or visit the counter for any queries about your order.
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
              className="inline-flex items-center justify-center gap-2 bg-caramel text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-caramel/90 transition-all"
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
