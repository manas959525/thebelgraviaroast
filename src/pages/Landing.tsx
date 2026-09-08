import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowRight, Star, Award, Leaf, Coffee, Heart,
  ChevronRight, Sparkles, Users, ShieldCheck, Zap, Quote, ChevronDown,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getBestSellers, getSignature, getPopular } from "@/data/menu";
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

// ── Steam Effect ────────────────────────────────────
function SteamWisp({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ opacity: 0, y: 0, scale: 0.8 }}
      animate={{ opacity: [0, 0.5, 0], y: [0, -25, -55], scale: [0.8, 1.2, 0.5], x: [0, 6, -3] }}
      transition={{ duration: 2.5, delay, repeat: Infinity, ease: "easeOut" as const }}
    >
      <svg width="16" height="36" viewBox="0 0 16 36" fill="none">
        <path d="M8 36C8 36 1 26 1 16C1 8 15 8 15 16C15 26 8 36 8 36Z" fill="url(#sg)" opacity="0.5" />
        <defs>
          <linearGradient id="sg" x1="8" y1="36" x2="8" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="1" stopColor="white" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

// ── Floating Coffee Bean ────────────────────────────
function FloatingBean({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute pointer-events-none select-none ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, y: [0, -10, 0], rotate: [0, 5, -3, 0] }}
      transition={{ duration: 7, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="14" cy="14" rx="10" ry="13" fill="#5C3A1E" opacity="0.6" transform="rotate(-20 14 14)" />
        <path d="M14 2C14 2 11 10 11 14C11 18 14 26 14 26" stroke="#3C1A0B" strokeWidth="1.2" opacity="0.4" fill="none" />
      </svg>
    </motion.div>
  );
}

// ── Product Card ────────────────────────────────────
function ProductCard({ item, index }: { item: ReturnType<typeof getBestSellers>[0]; index: number }) {
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      <Link to={`/menu/${item.slug}`}>
        <div className="relative h-48 overflow-hidden">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {item.badge && (
            <div className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
              item.badge === "signature" ? "bg-coral text-white" :
              item.badge === "bestseller" ? "bg-amber-500 text-white" :
              item.badge === "spicy" ? "bg-red-500 text-white" :
              item.badge === "new" ? "bg-sage text-white" :
              "bg-mocha text-white"
            }`}>
              {item.badge === "chef's pick" ? "Chef's Pick" : item.badge === "signature" ? "Signature" : item.badge}
            </div>
          )}
          <div className="absolute top-3 right-3">
            {item.isVeg ? (
              <div className="w-5 h-5 rounded border-2 border-green-500 flex items-center justify-center bg-white/90">
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded border-2 border-red-500 flex items-center justify-center bg-white/90">
                <div className="w-2 h-2 rounded-full bg-red-500" />
              </div>
            )}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-1 mb-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium text-muted-foreground">{item.rating}</span>
          </div>
          <h3 className="font-semibold text-sm text-foreground group-hover:text-coral transition-colors">{item.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 mb-3">{item.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">₹{item.price}</span>
            <button
              onClick={handleAdd}
              className="h-8 w-8 rounded-xl bg-coral text-white flex items-center justify-center text-lg font-bold hover:bg-ember transition-all hover:shadow-md hover:shadow-coral/20"
            >
              +
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── MAIN LANDING ────────────────────────────────────
export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [introComplete, setIntroComplete] = useState(false);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    const timer = setTimeout(() => setIntroComplete(true), 3200);
    return () => clearTimeout(timer);
  }, []);

  const bestSellers = getBestSellers().slice(0, 6);
  const signature = getSignature();
  const popular = getPopular().slice(0, 6);

  const features = [
    { icon: Award, title: "Specialty Grade Beans", desc: "Single-origin beans sourced from the world's finest estates" },
    { icon: Leaf, title: "Ethically Sourced", desc: "Direct-trade partnerships that support farming communities" },
    { icon: Coffee, title: "Freshly Prepared", desc: "Every drink made to order with precision and care" },
    { icon: ShieldCheck, title: "Quality Promise", desc: "If it isn't perfect, we'll remake it — no questions asked" },
  ];

  const reviews = [
    { name: "Demo Review", text: "A premium café experience with beautifully crafted coffee and a warm, inviting atmosphere. The Belgravia Signature Roast is a must-try.", rating: 5 },
    { name: "Demo Review", text: "Every visit feels special. From the perfectly pulled espresso to the attentive staff, this place sets the standard for specialty coffee.", rating: 5 },
    { name: "Demo Review", text: "Came for the coffee, stayed for the ambience. The tiramisu and cappuccino combination is absolutely worth the trip.", rating: 5 },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ══════════ HERO ══════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden bg-hero-dark noise-overlay">
        {/* Background layers */}
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_50%,rgba(200,90,28,0.12),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_20%,rgba(212,88,58,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1400&h=900&fit=crop')] bg-cover bg-center opacity-[0.07]" />
        </motion.div>

        {/* Floating beans */}
        <FloatingBean className="top-28 left-[8%] opacity-20" delay={0} />
        <FloatingBean className="top-44 right-[12%] opacity-15" delay={1.5} />
        <FloatingBean className="bottom-36 left-[18%] opacity-10" delay={3} />
        <FloatingBean className="bottom-52 right-[25%] opacity-[0.08]" delay={4} />

        {/* Cinematic Intro Sequence */}
        <AnimatePresence>
          {!introComplete && (
            <motion.div
              className="absolute inset-0 z-20 flex items-center justify-center bg-hero-dark"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Coffee cup SVG */}
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" as const }}
              >
                <motion.div
                  animate={{ rotate: [0, 0, -20, -20, 0] }}
                  transition={{ duration: 1.6, delay: 0.8, times: [0, 0.3, 0.5, 0.7, 1] }}
                >
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 40h70v45c0 11-9 20-20 20H40c-11 0-20-9-20-20V40z" fill="#C85A1C" opacity="0.9" />
                    <ellipse cx="55" cy="40" rx="35" ry="6" fill="#E8733A" />
                    <path d="M90 50h10c8 0 15 7 15 15s-7 15-15 15H90" stroke="#C85A1C" strokeWidth="4" fill="none" />
                  </svg>
                  {/* Steam wisps from cup */}
                  <div className="absolute -top-8 left-8">
                    <SteamWisp delay={0} />
                    <SteamWisp className="left-3" delay={0.4} />
                    <SteamWisp className="left-6" delay={0.8} />
                  </div>
                </motion.div>
              </motion.div>

              {/* Splash effect */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 2], opacity: [0, 0.6, 0] }}
                transition={{ duration: 1.2, delay: 1.6, ease: "easeOut" as const }}
                className="absolute"
              >
                <div className="w-64 h-64 rounded-full bg-coral/30 blur-2xl" />
              </motion.div>

              {/* Brand reveal */}
              <motion.div
                className="absolute text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.2, duration: 0.6 }}
              >
                <div className="text-white/40 text-sm tracking-[0.3em] uppercase mb-2">Welcome to</div>
                <div className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  <div className="text-white/80 text-2xl sm:text-3xl tracking-[0.4em] uppercase mb-1">The</div>
                  <div>BELGRAVIA</div>
                  <div className="text-gradient-brand" style={{ WebkitTextFillColor: "transparent", background: "linear-gradient(135deg, #C85A1C, #E8733A)", WebkitBackgroundClip: "text", backgroundClip: "text" }}>ROAST</div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main hero content (after intro) */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-20">
          <div className="max-w-3xl">
            {/* Brand name — dominant */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.3, duration: 0.6 }}
              className="mb-6"
            >
              <div className="text-white/40 text-xs sm:text-sm tracking-[0.4em] uppercase font-medium mb-2">Premium Specialty Café</div>
              <h1 className="font-display leading-[0.95] mb-4">
                <span className="block text-white/70 text-3xl sm:text-4xl lg:text-5xl tracking-[0.2em] uppercase">The</span>
                <span className="block text-white text-5xl sm:text-6xl lg:text-[5.5rem] font-bold tracking-tight">BELGRAVIA</span>
                <span className="block text-5xl sm:text-6xl lg:text-[5.5rem] font-bold tracking-tight" style={{ background: "linear-gradient(135deg, #C85A1C, #E8733A, #D4583A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>ROAST</span>
              </h1>
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.6, duration: 0.5 }}
              className="text-xl sm:text-2xl text-white/50 font-display italic max-w-xl mb-3"
            >
              Where Every Roast Tells a Story.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.8, duration: 0.5 }}
              className="text-base text-white/40 max-w-lg mb-10 leading-relaxed"
            >
              Freshly brewed coffee, delicious bites, and an experience designed to turn an ordinary break into something worth remembering.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 4, duration: 0.5 }}
              className="flex flex-wrap gap-4 mb-16"
            >
              <Link to="/menu" className="btn-brand inline-flex items-center gap-2">
                Order Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 border border-white/20 text-white px-7 py-3.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/10"
              >
                Explore Menu
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.2, duration: 0.6 }}
              className="flex items-center gap-8"
            >
              {[
                { num: "4.8★", label: "Average Rating" },
                { num: "80+", label: "Menu Items" },
                { num: "7 AM–11 PM", label: "Open Daily" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-lg font-bold text-white">{stat.num}</div>
                  <div className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30"
        >
          <span className="text-[10px] uppercase tracking-widest">Scroll to Discover</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ══════════ SIGNATURE DRINKS ══════════ */}
      {signature.length > 0 && (
        <section className="py-16 sm:py-20 bg-gradient-to-b from-background via-champagne/30 to-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-10">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-coral/10 rounded-full px-4 py-1.5 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-coral" />
                <span className="text-xs font-semibold text-coral uppercase tracking-wider">Only at Belgravia</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-foreground">Signature Creations</motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-muted-foreground mt-2">Drinks you won't find anywhere else</motion.p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {signature.map((item, i) => (
                <Link key={item.id} to={`/menu/${item.slug}`}>
                  <ProductCard item={item} index={i} />
                </Link>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════ BEST SELLERS (swipeable) ══════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-10">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-amber-500/10 rounded-full px-4 py-1.5 mb-3">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Guest Favourites</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-foreground">Belgravia Best Sellers</motion.h2>
          </motion.div>
          {/* Horizontal scroll on mobile */}
          <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:snap-none">
            {bestSellers.map((item, i) => (
              <div key={item.id} className="min-w-[280px] sm:min-w-0 snap-center">
                <Link to={`/menu/${item.slug}`}>
                  <ProductCard item={item} index={i} />
                </Link>
              </div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mt-8">
            <Link to="/menu" className="inline-flex items-center gap-2 text-sm font-semibold text-coral hover:text-ember transition-colors">
              View Full Menu <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════ POPULAR ══════════ */}
      <section className="py-16 sm:py-20 bg-warm-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-10">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-coral/10 rounded-full px-4 py-1.5 mb-3">
              <Coffee className="h-3.5 w-3.5 text-coral" />
              <span className="text-xs font-semibold text-coral uppercase tracking-wider">Trending Now</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-foreground">Most Loved This Week</motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popular.map((item, i) => (
              <Link key={item.id} to={`/menu/${item.slug}`}>
                <ProductCard item={item} index={i} />
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ WHY CHOOSE US ══════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold text-foreground">Why The Belgravia Roast</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mt-2">What makes us different</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} variants={fadeUp} custom={i} className="bg-white rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 text-center group">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-coral/10 text-coral group-hover:bg-coral group-hover:text-white transition-colors duration-300">
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

      {/* ══════════ ABOUT / STORY ══════════ */}
      <section className="py-16 sm:py-20 bg-warm-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 bg-coral/10 rounded-full px-4 py-1.5 mb-4">
                <span className="text-xs font-semibold text-coral uppercase tracking-wider">Our Story</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">A Better Cup.<br />A Better Moment.</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                At The Belgravia Roast, coffee is more than a drink. From carefully brewed coffee to comforting café favourites, every order is made to turn an ordinary break into something worth remembering.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                We source single-origin beans from ethical farms, roast them to highlight each origin's unique character, and serve them with genuine care. It's a simple philosophy executed with precision.
              </p>
              <Link to="/about" className="inline-flex items-center gap-2 text-sm font-semibold text-coral hover:text-ember transition-colors">
                Read Our Full Story <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative rounded-3xl overflow-hidden h-80 lg:h-96">
              <img src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=600&fit=crop" alt="Coffee preparation" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ REVIEWS ══════════ */}
      <section className="py-16 sm:py-20 bg-cafe-gradient text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-coral/10 rounded-full blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold">What Our Guests Say</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-white/40 mt-2">Demo testimonials — genuine reviews coming soon</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <Quote className="h-8 w-8 text-coral/40 mb-4" />
                <p className="text-white/60 text-sm leading-relaxed mb-6">{r.text}</p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.rating }).map((_, j) => (
                      <Star key={j} className="h-3 w-3 fill-coral text-coral" />
                    ))}
                  </div>
                  <span className="text-xs text-white/40">{r.name}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Ready to Order?</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">Browse the full menu, customise your order, and pay seamlessly — all from your phone.</p>
            <Link to="/menu" className="btn-brand inline-flex items-center gap-2">
              Explore Our Menu <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
