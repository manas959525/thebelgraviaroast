import { Link } from "react-router";
import { motion } from "framer-motion";
import { ShoppingBag, ChevronRight, Clock, CheckCircle, ChefHat } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const mockOrders = [
  { id: "TBR-A1B2C", date: "Today, 2:30 PM", items: "2× Cappuccino, 1× Croissant", total: 347, status: "preparing" as const },
  { id: "TBR-X9Y8Z", date: "Yesterday, 7:15 PM", items: "1× Classic Burger, 1× Loaded Fries, 1× Frappé", total: 797, status: "delivered" as const },
  { id: "TBR-M3N4O", date: "3 days ago", items: "1× Margherita, 2× Masala Chai", total: 457, status: "delivered" as const },
];

const statusConfig = {
  pending: { icon: Clock, label: "Pending", color: "text-yellow-600 bg-yellow-50" },
  confirmed: { icon: CheckCircle, label: "Confirmed", color: "text-blue-600 bg-blue-50" },
  preparing: { icon: ChefHat, label: "Preparing", color: "text-orange-600 bg-orange-50" },
  ready: { icon: CheckCircle, label: "Ready", color: "text-green-600 bg-green-50" },
  delivered: { icon: CheckCircle, label: "Delivered", color: "text-emerald-600 bg-emerald-50" },
  cancelled: { icon: CheckCircle, label: "Cancelled", color: "text-red-600 bg-red-50" },
};

export default function CustomerOrders() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-32 lg:pb-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Orders</h1>
            <p className="text-muted-foreground mb-8">Track and review your past orders</p>
          </motion.div>

          {mockOrders.length === 0 ? (
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
              {mockOrders.map((order, i) => {
                const config = statusConfig[order.status];
                const StatusIcon = config.icon;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl border border-border/50 p-5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="font-mono font-bold text-sm text-foreground">{order.id}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{order.date}</p>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${config.color}`}>
                        <StatusIcon className="h-3 w-3" /> {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{order.items}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">₹{order.total}</span>
                      <Link
                        to="/track-order"
                        className="flex items-center gap-1 text-xs text-gold font-medium hover:underline"
                      >
                        Track <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
