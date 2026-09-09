import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tag, Percent, Clock, Copy, CheckCircle, Gift, Zap, Star, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

// Fallback styling per tag so DB-driven offers still look branded.
const TAG_STYLES: Record<string, { icon: typeof Gift; color: string; borderColor: string }> = {
  "New Guests": { icon: Gift, color: "from-gold/20 to-gold/5", borderColor: "border-gold/30" },
  Popular: { icon: Zap, color: "from-sage/20 to-sage/5", borderColor: "border-sage/30" },
  Afternoon: { icon: Clock, color: "from-blue-500/10 to-blue-500/5", borderColor: "border-blue-200" },
  Weekend: { icon: Star, color: "from-amber-500/10 to-amber-500/5", borderColor: "border-amber-200" },
  Students: { icon: Tag, color: "from-purple-500/10 to-purple-500/5", borderColor: "border-purple-200" },
  Special: { icon: Percent, color: "from-pink-500/10 to-pink-500/5", borderColor: "border-pink-200" },
};
const DEFAULT_STYLE = { icon: Sparkles, color: "from-gold/20 to-gold/5", borderColor: "border-gold/30" };

const fmtValidUntil = (ts: number) =>
  new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const fmtDiscount = (o: { discountType: "percentage" | "fixed"; discountValue: number }) =>
  o.discountType === "percentage" ? `${o.discountValue}% Off` : `₹${o.discountValue} Off`;

export default function OffersPage() {
  const [copied, setCopied] = useState<string | null>(null);
  // Live offers from the database; the admin manages these in Offers & Coupons.
  const offersQuery = useQuery(api.cafe.listActiveOffers);
  const offers = (offersQuery ?? []).map((o) => ({
    id: o.code,
    code: o.code,
    title: o.title ?? o.description,
    desc: o.description,
    discount: fmtDiscount(o),
    validTill: fmtValidUntil(o.validUntil),
    minOrder: o.minOrder > 0 ? `₹${o.minOrder}` : "No minimum",
    tag: o.tag ?? "Special",
    style: TAG_STYLES[o.tag ?? ""] ?? DEFAULT_STYLE,
  }));

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    toast.success(`Code ${code} copied — apply it at checkout`);
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
        {offersQuery === undefined ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="text-lg font-semibold text-foreground">No active offers right now</h3>
            <p className="text-sm text-muted-foreground mt-1">Check back soon — new deals are always brewing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer, i) => {
              const Icon = offer.style.icon;
              return (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-gradient-to-br ${offer.style.color} rounded-2xl border ${offer.style.borderColor} p-6 hover:shadow-lg transition-all`}
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
                    <span>Valid till: {offer.validTill}</span>
                    <span className="font-bold text-gold">{offer.discount}</span>
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
        )}
      </div>

      <Footer />
    </div>
  );
}
