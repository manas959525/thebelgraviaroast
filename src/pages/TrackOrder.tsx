import { Link } from "react-router";
import { motion } from "framer-motion";
import { Check, ChefHat, Clock, Package, MapPin, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const steps = [
  { label: "Order Placed", icon: Check, desc: "We've received your order", done: true },
  { label: "Confirmed", icon: Check, desc: "Your order is confirmed", done: true },
  { label: "Preparing", icon: ChefHat, desc: "Our chefs are crafting your order", active: true, done: false },
  { label: "Ready", icon: Package, desc: "Ready for pickup", done: false },
  { label: "Served", icon: MapPin, desc: "Enjoy your meal!", done: false },
];

export default function TrackOrder() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-32 lg:pb-10">
        <div className="mx-auto max-w-lg px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-foreground mb-2">Track Your Order</h1>
            <p className="text-muted-foreground text-sm mb-8">We'll keep you updated every step of the way.</p>
          </motion.div>

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-border/50 p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Preparing Your Order</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Estimated time: 8–12 minutes</p>
              </div>
              <div className="flex items-center gap-1.5 bg-caramel/10 px-3 py-1.5 rounded-full">
                <Clock className="h-3.5 w-3.5 text-caramel" />
                <span className="text-xs font-semibold text-caramel">In Progress</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-muted rounded-full mb-8 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "55%" }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-caramel rounded-full"
              />
            </div>

            {/* Steps */}
            <div className="space-y-0">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex gap-3"
                  >
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                        step.done
                          ? "bg-sage text-white"
                          : step.active
                          ? "bg-caramel text-white"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`w-0.5 h-8 ${step.done ? "bg-sage" : "bg-muted"}`} />
                      )}
                    </div>
                    <div className="pb-6">
                      <h4 className={`text-sm font-medium ${step.active ? "text-caramel" : step.done ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.label}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center gap-2 border border-border text-foreground px-5 py-3 rounded-xl text-sm font-semibold hover:bg-muted transition-all"
            >
              Back to Home
            </Link>
            <Link
              to="/menu"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-caramel text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-caramel/90 transition-all"
            >
              Order More <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
