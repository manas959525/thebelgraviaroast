import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-4"
        >
          <div className="text-7xl mb-4">☕</div>
          <h1 className="text-5xl font-bold text-foreground mb-3">404</h1>
          <p className="text-lg text-muted-foreground mb-2">This page seems to have wandered off.</p>
          <p className="text-sm text-muted-foreground mb-8">
            Perhaps it's out grabbing a coffee. Let's get you back on track.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
