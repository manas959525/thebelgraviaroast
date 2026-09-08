import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router";
import {
  ArrowRight, Star, Clock, Award, Leaf, Coffee, Heart,
  ChevronRight, Sparkles, Users, ShieldCheck, Zap, Quote, Gift,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getBestSellers, getPopular } from "@/data/menu";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

function SteamWisp({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ opacity: 0, y: 0, scale: 0.8 }}
      animate={{
        opacity: [0, 0.6, 0],
        y: [0, -30, -60],
        scale: [0.8, 1.1, 0.6],
        x: [0, 8, -4],
      }}
      transition={{ duration: 3, delay, repeat: Infinity, ease: "easeOut" }}
    >
      <svg width="20" height="40" viewBox="0 0 20 40" fill="none">
        <path
          d="M10 40C10 40 2 30 2 20C2 10 18 10 18 20C18 30 10 40 10 40Z"
          fill="url(#steam-grad)"
          opacity="0.5"
        />
        <defs>
          <linearGradient id="steam-grad" x1="10" y1="40" x2="10" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="1" stopColor="white" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

function FloatingBean({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute text-2xl sm:text-4xl pointer-events-none select-none ${className}`}
      animate={{
        y: [0, -12, 0],
        rotate: [0, 8, -4, 0],
      }}
      transition={{ duration: 6, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      ☕
    </motion.div>
  );
}

function ProductCard({ item, index }: { item: ReturnType<typeof getBestSellers>[0]; index: number }) {
  const handleAdd = () => {
    addToCart(item, 1);
    toast.success(`${item.name} added to cart`);
  };
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border/50"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {item.discountPrice && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            {Math.round(((item.price - item.discountPrice) / item.price) * 100)}% OFF
          </div>
        )}
        {item.isVeg ? (
          <div className="absolute top-3 right-3 w-5 h-5 rounded border-2 border-green-500 flex items-center justify-center bg-white/90">
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
        ) : (
          <div className="absolute top-3 right-3 w-5 h-5 rounded border-2 border-red-500 flex items-center justify-center bg-white/90">
            <div className="w-2 h-2 rounded-full bg-red-500" />
          </div>
        )}
        <button
          onClick={handleAdd}
          className="absolute bottom-3 right-3 h-9 w-9 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-caramel hover:text-white text-foreground shadow-lg"
        >
          <span className="text-lg font-bold leading-none">+</span>
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          {item.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[10px] font-medium uppercase tracking-wider text-caramel bg-caramel/10 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-caramel transition-colors">
          {item.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {item.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-foreground">
              ₹{item.discountPrice ?? item.price}
            </span>
            {item.discountPrice && (
              <span className="text-xs text-muted-foreground line-through">₹{item.price}</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {item.prepTime} min
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const bestSellers = getBestSellers().slice(0, 6);
  const popular = getPopular().slice(0, 4);

  const features = [
    { icon: Award, title: "Specialty Grade Beans", desc: "Single-origin beans sourced from the world's finest estates" },
    { icon: Leaf, title: "Ethically Sourced", desc: "Direct-trade partnerships that support farming communities" },
    { icon: Clock, title: "Prepared Fresh", desc: "Every dish and drink made to order with care" },
    { icon: ShieldCheck, title: "Quality Guarantee", desc: "If it isn't perfect, we'll remake it — no questions asked" },
  ];

  const reviews = [
    { name: "Priya Sharma", rating: 5, text: "The best café experience I've had in the city. The cappuccino was flawless, and the ambience is absolutely beautiful.", avatar: "P" },
    { name: "Arjun Mehta", rating: 5, text: "I come here every morning for the flat white. Consistent, premium, and the staff genuinely care about every cup.", avatar: "A" },
    { name: "Sophia Chen", rating: 5, text: "Came for the coffee, stayed for the tiramisu. This place is a hidden gem that deserves all the praise it gets.", avatar: "S" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* === HERO === */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden bg-hero-gradient">
        {/* Background elements */}
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(196,106,43,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(92,58,30,0.2),transparent_50%)]" />

          {/* Coffee cup image area */}
          <div className="absolute right-0 top-0 w-full h-full opacity-10">
            <img
              src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=800&fit=crop"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>

        {/* Floating beans */}
        <FloatingBean className="top-32 left-[10%] opacity-20" delay={0} />
        <FloatingBean className="top-48 right-[15%] opacity-15" delay={1} />
        <FloatingBean className="bottom-40 left-[20%] opacity-10" delay={2} />

        {/* Steam wisps */}
        <div className="absolute right-[20%] top-[25%] hidden lg:block">
          <SteamWisp className="left-0" delay={0} />
          <SteamWisp className="left-4" delay={0.8} />
          <SteamWisp className="left-8" delay={1.6} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="max-w-3xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 mb-6"
            >
              <Sparkles className="h-3.5 w-3.5 text-caramel" />
              <span className="text-xs font-medium text-white/80">
                Premium Coffee & Artisanal Dining
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6"
            >
              Good Coffee.
              <br />
              <span className="text-gradient-cafe" style={{ WebkitTextFillColor: "transparent", background: "linear-gradient(135deg, #C46A2B, #D4A574)", WebkitBackgroundClip: "text", backgroundClip: "text" }}>
                Great Moments.
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg sm:text-xl text-white/60 max-w-xl mb-10 leading-relaxed"
            >
              Freshly brewed coffee, delicious bites, and everything you need for the
              perfect café experience — crafted with care at The Belgravia Roast.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 bg-caramel hover:bg-caramel/90 text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-xl hover:shadow-caramel/30 hover:-translate-y-0.5"
              >
                Order Now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/15"
              >
                Explore Menu
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center gap-8 mt-14"
            >
              {[
                { num: "15K+", label: "Happy Customers" },
                { num: "4.9", label: "Average Rating" },
                { num: "200+", label: "Menu Items" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-white">{stat.num}</div>
                  <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* === BEST SELLERS === */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-caramel/10 rounded-full px-4 py-1.5 mb-4">
              <Star className="h-3.5 w-3.5 text-caramel fill-caramel" />
              <span className="text-xs font-semibold text-caramel uppercase tracking-wider">Fan Favourites</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-foreground">
              Our Best Sellers
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground mt-3 max-w-md mx-auto">
              The dishes and drinks our guests can't stop ordering. Tried, tested, and truly loved.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {bestSellers.map((item, i) => (
              <Link key={item.id} to={`/menu/${item.slug}`}>
                <ProductCard item={item} index={i} />
              </Link>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 text-sm font-semibold text-caramel hover:text-caramel/80 transition-colors"
            >
              View Full Menu
              <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* === POPULAR COFFEE === */}
      <section className="py-20 bg-warm-gradient relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-4">
              <Coffee className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Crowd Favourites</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-foreground">
              Popular Coffee
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {popular.map((item, i) => (
              <Link key={item.id} to={`/menu/${item.slug}`}>
                <ProductCard item={item} index={i} />
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* === WHY CHOOSE US === */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-sage/10 rounded-full px-4 py-1.5 mb-4">
              <Heart className="h-3.5 w-3.5 text-sage" />
              <span className="text-xs font-semibold text-sage uppercase tracking-wider">Why The Belgravia</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-foreground">
              Why Choose Us
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  custom={i}
                  className="bg-white rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 text-center group"
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-caramel/10 text-caramel group-hover:bg-caramel group-hover:text-white transition-colors duration-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* === REVIEWS === */}
      <section className="py-20 bg-cafe-gradient text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-caramel/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold">
              What Our Guests Say
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-white/50 mt-3">
              Real experiences from our beloved community
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {reviews.map((r, i) => (
              <motion.div
                key={r.name}
                variants={fadeUp}
                custom={i}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors"
              >
                <Quote className="h-8 w-8 text-caramel/40 mb-4" />
                <p className="text-white/70 text-sm leading-relaxed mb-6">{r.text}</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-caramel/20 flex items-center justify-center text-caramel font-bold text-sm">
                    {r.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{r.name}</div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: r.rating }).map((_, j) => (
                        <Star key={j} className="h-3 w-3 fill-caramel text-caramel" />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* === LOYALTY / CTA === */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-white rounded-3xl border border-border/50 shadow-lg overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 sm:p-12 lg:p-14">
                <div className="inline-flex items-center gap-2 bg-caramel/10 rounded-full px-4 py-1.5 mb-6">
                  <Zap className="h-3.5 w-3.5 text-caramel" />
                  <span className="text-xs font-semibold text-caramel uppercase tracking-wider">Loyalty Programme</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Earn Rewards with Every Sip
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  Join The Belgravia Circle and earn points on every order. Redeem for free drinks, 
                  exclusive tasting events, and early access to seasonal specials.
                </p>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { icon: Coffee, label: "Earn Points", desc: "On every order" },
                    { icon: Award, label: "Tier Up", desc: "Unlock perks" },
                    { icon: Gift, label: "Redeem", desc: "Free drinks & more" },
                  ].map((perk) => {
                    const PerkIcon = perk.icon;
                    return (
                      <div key={perk.label} className="text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <PerkIcon className="h-5 w-5" />
                        </div>
                        <div className="text-xs font-semibold text-foreground">{perk.label}</div>
                        <div className="text-[10px] text-muted-foreground">{perk.desc}</div>
                      </div>
                    );
                  })}
                </div>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 bg-caramel hover:bg-caramel/90 text-white px-7 py-3 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
                >
                  Join Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="hidden lg:block relative bg-gradient-to-br from-caramel/20 to-primary/10">
                <img
                  src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=600&fit=crop"
                  alt="Coffee being poured"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-transparent" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* === FIND YOUR TABLE === */}
      <section className="py-16 bg-warm-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl border border-border/50 p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-8"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-caramel" />
                <span className="text-sm font-semibold text-caramel uppercase tracking-wider">Table Ordering</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Order from Your Table</h3>
              <p className="text-sm text-muted-foreground">
                Scan the QR code at your table to browse the full menu, customise your order, 
                and pay seamlessly — all without leaving your seat.
              </p>
            </div>
            <Link
              to="/table-ordering"
              className="shrink-0 inline-flex items-center gap-2 bg-caramel hover:bg-caramel/90 text-white px-7 py-3 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
            >
              Start Table Order
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
