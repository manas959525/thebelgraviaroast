import { useState } from "react";
import { motion } from "framer-motion";
import { Tag, Percent, Clock, Copy, CheckCircle, Gift, Zap, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const offers = [
  {
    id: "first-order",
    code: "BELGRAVIA10",
    title: "10% Off Your First Order",
    desc: "Welcome to The Belgravia Roast. Use this code on your very first order and enjoy 10% off, up to ₹200.",
    discount: "10% Off",
    validTill: "31 Dec 2026",
    minOrder: "₹300",
    icon: Gift,
    color: "from-gold/20 to-gold/5",
    borderColor: "border-gold/30",
    tag: "New Guests",
  },
  {
    id: "combo-deal",
    code: "COMBO49",
    title: "Combos Starting at ₹499",
    desc: "Pair your favourite coffee with a meal and save. Our curated combos include a main, a side, and a beverage.",
    discount: "Save ₹100+",
    validTill: "30 Sep 2026",
    minOrder: "₹499",
    icon: Zap,
    color: "from-sage/20 to-sage/5",
    borderColor: "border-sage/30",
    tag: "Popular",
  },
  {
    id: "happy-hours",
    code: "HAPPY3PM",
    title: "Happy Hours — 3 PM to 6 PM",
    desc: "All cold coffees and smoothies at 20% off during afternoon happy hours. Because afternoons deserve a treat.",
    discount: "20% Off",
    validTill: "30 Sep 2026",
    minOrder: "No minimum",
    icon: Clock,
    color: "from-blue-500/10 to-blue-500/5",
    borderColor: "border-blue-200",
    tag: "Afternoon",
  },
  {
    id: "loyalty-bonus",
    code: "LOYAL2X",
    title: "Double Loyalty Points",
    desc: "Earn 2× loyalty points on every order this weekend. Stack them up and redeem for free drinks and merch.",
    discount: "2× Points",
    validTill: "This Weekend",
    minOrder: "No minimum",
    icon: Star,
    color: "from-amber-500/10 to-amber-500/5",
    borderColor: "border-amber-200",
    tag: "Weekend",
  },
  {
    id: "student-discount",
    code: "STUDENT15",
    title: "15% Student Discount",
    desc: "Show your student ID at the counter or enter this code online. Valid on all orders above ₹200.",
    discount: "15% Off",
    validTill: "Ongoing",
    minOrder: "₹200",
    icon: Tag,
    color: "from-purple-500/10 to-purple-500/5",
    borderColor: "border-purple-200",
    tag: "Students",
  },
  {
    id: "free-dessert",
    code: "SWEET100",
    title: "Free Dessert on ₹1000+",
    desc: "Order above ₹1,000 and add any dessert to your cart for free. The sweetest way to end a great meal.",
    discount: "Free Dessert",
    validTill: "31 Oct 2026",
    minOrder: "₹1,000",
    icon: Percent,
    color: "from-pink-500/10 to-pink-500/5",
    borderColor: "border-pink-200",
    tag: "Special",
  },
];

export default function OffersPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 pb-6 bg-warm-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-bold text-foreground"
          >
            Offers & Promotions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-2"
          >
            Exclusive deals to make your Belgravia experience even better
          </motion.p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer, i) => {
            const Icon = offer.icon;
            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`bg-gradient-to-br ${offer.color} rounded-2xl border ${offer.borderColor} p-6 hover:shadow-lg transition-all`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-gold">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/80 text-foreground/70 px-2.5 py-1 rounded-full">
                    {offer.tag}
                  </span>
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">{offer.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{offer.desc}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span>Min: {offer.minOrder}</span>
                  <span>Valid: {offer.validTill}</span>
                </div>
                <button
                  onClick={() => handleCopy(offer.code)}
                  className="w-full flex items-center justify-center gap-2 bg-white/80 hover:bg-white border border-border/50 py-2.5 rounded-xl text-sm font-mono font-bold text-foreground transition-all"
                >
                  {copied === offer.code ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-sage" />
                      Copied!
                    </>
                  ) : (
                    <>
                      {offer.code}
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}
