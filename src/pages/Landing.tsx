import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowRight, Star, Award, Leaf, Coffee,
  ChevronRight, Sparkles, ShieldCheck, Quote, ChevronDown,
  Store, MapPin, Truck, Flame, QrCode, Check,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CoffeeSpillScene, SteamWisp, FloatingBean } from "@/components/CoffeeSpillScene";
import { getBestSellers, getSignature, getPopular, type Product } from "@/data/menu";
import { useProductsWithFlags } from "@/lib/use-live-catalog";
import { addToCart } from "@/lib/cart";
import { cravingChips, daypartGreeting, daypartHint, getDaypartPicks, getSurprise, getTodaySpecial, getTrending } from "@/lib/cafe";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

// ── Order-mode helpers (shared with Checkout) ───────
export const ORDER_MODE_KEY = "tbr-order-mode";

export function chooseOrderMode(mode: "dine-in" | "takeaway" | "delivery") {
  try {
    window.localStorage.setItem(ORDER_MODE_KEY, mode);
  } catch {
    /* storage blocked — mode just won't be pre-selected at checkout */
  }
}

function parseTime(t?: string): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function formatClock(t?: string): string {
  if (!t) return "";
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return t;
  let h = Number(m[1]);
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h} ${suffix}`;
}

function isCafeOpen(openTime?: string, closeTime?: string): boolean {
  if (!openTime || !closeTime) return true; // unset — assume open
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const open = parseTime(openTime) ?? 0;
  const close = parseTime(closeTime) ?? 24 * 60;
  if (close <= open) {
    // Overnight hours (e.g. 22:00 → 02:00)
    return mins >= open || mins < close;
  }
  return mins >= open && mins < close;
}

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
              item.badge === "signature" ? "bg-dusty-rose text-white" :
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
          <h3 className="font-semibold text-sm text-foreground group-hover:text-dusty-rose transition-colors">{item.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 mb-3">{item.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">₹{item.price}</span>
            <button
              onClick={handleAdd}
              className="h-8 w-8 rounded-xl bg-dusty-rose text-white flex items-center justify-center text-lg font-bold hover:bg-burgundy transition-all hover:shadow-md hover:shadow-dusty-rose/20"
            >
              +
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── How do you want to order? ─────────────────────
function HowToOrder() {
  const navigate = useNavigate();
  const options = [
    {
      mode: "dine-in" as const,
      title: "Dine In",
      desc: "Order directly from your table",
      icon: Store,
      chip: "Scan & order",
      iconBg: "bg-sage/10 text-sage group-hover:bg-sage group-hover:text-white",
      ring: "hover:border-sage/50",
    },
    {
      mode: "takeaway" as const,
      title: "Takeaway",
      desc: "Skip the queue, pick up in minutes",
      icon: MapPin,
      chip: "Ready when you are",
      iconBg: "bg-gold/10 text-gold group-hover:bg-gold group-hover:text-white",
      ring: "hover:border-gold/50",
    },
    {
      mode: "delivery" as const,
      title: "Delivery",
      desc: "Enjoy the roast at home",
      icon: Truck,
      chip: "Brought to your door",
      iconBg: "bg-dusty-rose/10 text-dusty-rose group-hover:bg-dusty-rose group-hover:text-white",
      ring: "hover:border-dusty-rose/50",
    },
  ];

  const handle = (mode: "dine-in" | "takeaway" | "delivery") => {
    chooseOrderMode(mode);
    navigate(mode === "dine-in" ? "/table-ordering" : "/menu");
  };

  return (
    <section className="py-14 sm:py-16 bg-warm-gradient border-y border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center mb-8"
        >
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-sage/10 rounded-full px-4 py-1.5 mb-3">
            <Coffee className="h-3.5 w-3.5 text-sage" />
            <span className="text-xs font-semibold text-sage uppercase tracking-wider">How do you want to order?</span>
          </motion.div>
          <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl font-bold text-foreground">
            Pick your experience
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {options.map((opt, i) => {
            const Icon = opt.icon;
            return (
              <motion.button
                key={opt.mode}
                variants={fadeUp}
                custom={i}
                onClick={() => handle(opt.mode)}
                className={`group relative flex items-center gap-4 sm:flex-col sm:items-start sm:gap-3 glass-liquid liquid-sheen-slow rounded-2xl p-5 sm:p-6 text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${opt.ring}`}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 ${opt.iconBg}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{opt.title}</span>
                    <span className="hidden sm:inline-flex text-[9px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {opt.chip}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0" />
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ── Find Your Table ────────────────────────────────
function FindYourTable() {
  const qrUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/table-ordering`
      : "https://thebelgraviaroast.in/table-ordering";
  const perks = [
    "Order straight from your seat — no app, no sign-up",
    "Watch your order progress live on your phone",
    "Call staff, request water or the bill in one tap",
  ];
  return (
    <section className="py-16 sm:py-20 bg-cafe-gradient text-white relative overflow-hidden">
      <div className="liquid-blob w-96 h-96 -top-32 -right-24 bg-dusty-rose/20" />
      <div className="liquid-blob liquid-blob-slow w-96 h-96 -bottom-40 -left-24 bg-gold/15" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 bg-sage/15 rounded-full px-4 py-1.5 mb-4">
              <QrCode className="h-3.5 w-3.5 text-white/90" />
              <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">Order from your table</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Your table, your phone.</h2>
            <p className="text-white/60 leading-relaxed mb-6 max-w-md">
              Every table at The Belgravia Roast carries its own QR code. Scan it, browse the full menu,
              and order in a few taps — the kitchen gets it instantly, and your table's bill stays in sync.
            </p>
            <ul className="space-y-3 mb-8">
              {perks.map((perk, i) => (
                <motion.li
                  key={perk}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 * i }}
                  className="flex items-center gap-3 text-sm text-white/70"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage/20 text-sage border border-sage/30">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {perk}
                </motion.li>
              ))}
            </ul>
            <Link to="/table-ordering" className="btn-brand liquid-sheen inline-flex items-center gap-2">
              Try Table Ordering <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="justify-self-center"
          >
            <div className="glass-liquid-dark rounded-3xl p-8 sm:p-10 text-center">
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-5">Scan to start</div>
              <QRCodeSVG value={qrUrl} size={190} bgColor="transparent" fgColor="#FAF7F2" level="M" className="mx-auto rounded-2xl" />
              <div className="mt-5 font-display text-lg font-bold">THE BELGRAVIA ROAST</div>
              <div className="text-xs text-white/40 mt-1">/table-ordering</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Today's Special ────────────────────────────────
function TodaySpecial({ settings }: { settings?: Record<string, string> | null }) {
  const { product, discountPrice, remaining } = getTodaySpecial();
  const openNow = isCafeOpen(settings?.openTime, settings?.closeTime);
  const prepMin = Number(settings?.avgPrepMinutes ?? "12") || 12;
  const openLabel = openNow ? `${formatClock(settings?.openTime ?? "08:00")} – ${formatClock(settings?.closeTime ?? "23:00")}` : `Opens ${formatClock(settings?.openTime ?? "08:00")}`;
  const handleOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`${product.name} added to cart`);
  };
  return (
    <section className="py-16 sm:py-20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="relative rounded-3xl overflow-hidden bg-cafe-gradient text-white"
        >
          <div className="liquid-blob w-80 h-80 -top-24 -right-24 bg-dusty-rose/25" />
          <div className="liquid-blob liquid-blob-slow w-96 h-96 -bottom-32 -left-16 bg-gold/25" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch">
            <div className="p-8 sm:p-12">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-300/30 rounded-full px-4 py-1.5 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider">Today's Special</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="font-display text-3xl sm:text-4xl font-bold mb-3">
                {product.name}
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-white/60 leading-relaxed mb-4 max-w-md">
                {product.description} Aromatic, warm, and only available at this price today.
              </motion.p>

              {/* Live café status — driven by admin settings */}
              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap items-center gap-2 mb-6">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${openNow ? "bg-sage/20 text-white/90" : "bg-white/10 text-white/50"}`}>
                  <span className={`relative flex h-1.5 w-1.5 ${openNow ? "" : "hidden"}`}>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sage" />
                  </span>
                  {openNow ? `Open now · ${openLabel}` : `Closed · ${openLabel}`}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white/60">
                  <Coffee className="h-3 w-3" /> Avg. prep {prepMin} min
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white/60">
                  <Flame className="h-3 w-3 text-amber-300" /> Trending today
                </span>
              </motion.div>
              <motion.div variants={fadeUp} custom={4} className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-amber-300">₹{discountPrice}</span>
                <span className="text-lg text-white/40 line-through">₹{product.price}</span>
                <span className="text-xs font-semibold bg-amber-400/15 text-amber-200 px-2.5 py-1 rounded-full">
                  {Math.round(((product.price - discountPrice) / product.price) * 100)}% OFF
                </span>
              </motion.div>
              <motion.div variants={fadeUp} custom={5} className="flex flex-wrap items-center gap-4">
                <button onClick={handleOrder} className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-navy px-7 py-3.5 rounded-xl text-sm font-bold transition-all hover:shadow-xl hover:shadow-amber-400/20 hover:-translate-y-0.5">
                  Order Now <ArrowRight className="h-4 w-4" />
                </button>
                <Link to={`/menu/${product.slug}`} className="text-sm font-medium text-white/60 hover:text-white transition-colors underline underline-offset-4">
                  View details
                </Link>
              </motion.div>
            </div>
            <div className="relative min-h-[260px] lg:min-h-0">
              <motion.img
                src={product.image}
                alt={product.name}
                variants={fadeUp}
                custom={2}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1B2A3D] via-[#1B2A3D]/50 to-transparent" />
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-5 right-5 glass-liquid-dark rounded-2xl px-4 py-3"
              >
                <div className="text-[10px] uppercase tracking-wider text-white/50 mb-0.5">Only {remaining} left today</div>
                <div className="h-1.5 w-36 bg-white/15 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "78%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.6 }}
                    className="h-full bg-amber-300 rounded-full"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Daypart picks ───────────────────────────────────
function DaypartPicks() {
  const picks = getDaypartPicks();
  return (
    <section className="py-12 sm:py-16 bg-warm-gradient">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-sage/10 rounded-full px-4 py-1.5 mb-3">
              <Coffee className="h-3.5 w-3.5 text-sage" />
              <span className="text-xs font-semibold text-sage uppercase tracking-wider">Right now</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl font-bold text-foreground">{daypartGreeting()}</motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground mt-1 text-sm">{daypartHint()}</motion.p>
          </div>
          <motion.div variants={fadeUp} custom={3}>
            <Link to="/menu" className="text-sm font-semibold text-dusty-rose hover:text-burgundy transition-colors inline-flex items-center gap-1">
              See the whole menu <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {picks.map((item, i) => (
            <motion.div key={item.id} variants={fadeUp} custom={i} className="bg-white rounded-2xl border border-border/50 overflow-hidden group hover:shadow-lg transition-all duration-300">
              <Link to={`/menu/${item.slug}`}>
                <div className="relative h-40 overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-white/90 text-foreground px-2 py-1 rounded-lg">
                    #{i + 1} pick
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-dusty-rose transition-colors">{item.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{item.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-foreground">₹{item.discountPrice ?? item.price}</span>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(item, 1); toast.success(`${item.name} added to cart`); }}
                      className="h-8 w-8 rounded-xl bg-sage text-white flex items-center justify-center text-lg font-bold hover:bg-sage/90 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Quick order + Surprise me ──────────────────────
function QuickOrder() {
  const [surprise, setSurprise] = useState<Product | null>(null);
  const [rolling, setRolling] = useState(false);

  const rollSurprise = () => {
    setRolling(true);
    setSurprise(null);
    setTimeout(() => {
      setSurprise(getSurprise());
      setRolling(false);
    }, 700);
  };

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-10">
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-dusty-rose/10 rounded-full px-4 py-1.5 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-dusty-rose" />
            <span className="text-xs font-semibold text-dusty-rose uppercase tracking-wider">Quick Order</span>
          </motion.div>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-foreground">What are you craving?</motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground mt-2">One tap takes you straight to the good stuff</motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cravingChips.map((chip, i) => (
            <motion.div key={chip.cat} variants={fadeUp} custom={i}>
              <Link
                to={`/menu?cat=${chip.cat}`}
                className="flex flex-col items-center gap-2 bg-white rounded-2xl border border-border/50 p-6 text-center hover:border-dusty-rose/40 hover:shadow-lg transition-all duration-300 group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{chip.emoji}</span>
                <span className="text-sm font-semibold text-foreground">{chip.label}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Browse →</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Build your drink banner */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
          <Link
            to="/build-your-drink"
            className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-dusty-rose/30 bg-gradient-to-r from-dusty-rose/10 via-champagne to-sage/10 p-5 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-dusty-rose text-white group-hover:scale-105 transition-transform">
              <Coffee className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-foreground">Build Your Drink ☕</div>
              <div className="text-xs text-muted-foreground mt-0.5">Pick a base, size, milk and extras — watch your coffee come together step by step.</div>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-dusty-rose group-hover:text-burgundy transition-colors shrink-0">
              Start building <ChevronRight className="h-4 w-4" />
            </span>
          </Link>
        </motion.div>

        {/* Surprise me */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto">
          <div className="rounded-3xl border border-dashed border-dusty-rose/40 bg-dusty-rose/5 p-8 text-center">
            <div className="text-4xl mb-3">🎲</div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">Don't know what to order?</h3>
            <p className="text-sm text-muted-foreground mb-6">Let us pick something delicious for you.</p>

            <button
              onClick={rollSurprise}
              disabled={rolling}
              className="inline-flex items-center gap-2 bg-dusty-rose hover:bg-burgundy text-white px-7 py-3 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-dusty-rose/20 disabled:opacity-70"
            >
              <Sparkles className={`h-4 w-4 ${rolling ? "animate-spin" : ""}`} />
              {rolling ? "Picking something good..." : "Surprise Me"}
            </button>

            <AnimatePresence mode="wait">
              {surprise && (
                <motion.div
                  key={surprise.id}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", damping: 18, stiffness: 220 }}
                  className="mt-6 bg-white rounded-2xl border border-border/50 overflow-hidden text-left shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row">
                    <img src={surprise.image} alt={surprise.name} className="sm:w-44 h-36 sm:h-auto object-cover" />
                    <div className="p-5 flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-dusty-rose mb-1">Today's pick for you</div>
                      <h4 className="font-bold text-foreground mb-1">{surprise.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{surprise.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg text-foreground">₹{surprise.discountPrice ?? surprise.price}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { addToCart(surprise, 1); toast.success(`${surprise.name} added to cart`); }}
                            className="bg-gold hover:bg-gold/90 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                          >
                            Add to Cart
                          </button>
                          <Link
                            to={`/menu/${surprise.slug}`}
                            className="border border-border text-foreground/70 hover:bg-muted px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Loyalty teaser ──────────────────────────────────
function LoyaltyTeaser() {
  const rewards = [
    { points: 100, label: "Free Coffee", emoji: "☕" },
    { points: 250, label: "₹100 Off", emoji: "🎁" },
    { points: 400, label: "Free Dessert", emoji: "🍰" },
  ];
  return (
    <section className="py-16 sm:py-20 bg-cafe-gradient text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 bg-amber-400/15 rounded-full px-4 py-1.5 mb-4">
              <Star className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
              <span className="text-xs font-semibold text-amber-200 uppercase tracking-wider">Belgravia Rewards</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Every Cup Brings You Closer to a Free One.</h2>
            <p className="text-white/60 leading-relaxed mb-8 max-w-md">
              Earn points on every order, unlock free drinks and desserts, and get first dibs on new menu drops. Loyalty has never tasted this good.
            </p>
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 bg-amber-300 hover:bg-amber-200 text-navy px-7 py-3.5 rounded-xl text-sm font-bold transition-all hover:shadow-xl hover:shadow-amber-300/20"
            >
              View My Rewards <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {rewards.map((r, i) => (
              <motion.div
                key={r.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-liquid-dark rounded-2xl p-6 text-center hover:border-amber-300/30 transition-colors"
              >
                <div className="text-3xl mb-2">{r.emoji}</div>
                <div className="font-bold text-white mb-1">{r.points} pts</div>
                <div className="text-xs text-white/50">{r.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Fallback reviews shown when the database has no approved ones yet.
const fallbackReviews = [
  { name: "Ishita R.", text: "A premium café experience with beautifully crafted coffee and a warm, inviting atmosphere. The Belgravia Signature Roast is a must-try.", rating: 5 },
  { name: "Arjun M.", text: "Every visit feels special. From the perfectly pulled espresso to the attentive staff, this place sets the standard for specialty coffee.", rating: 5 },
  { name: "Sara K.", text: "Came for the coffee, stayed for the ambience. The hazelnut latte and the brownie combination is absolutely worth the trip.", rating: 5 },
];

// ── MAIN LANDING ────────────────────────────────────
export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [introComplete, setIntroComplete] = useState(false);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const settings = useQuery(api.cafe.listSettings);
  const openNow = isCafeOpen(settings?.openTime, settings?.closeTime);
  const prepMin = Number(settings?.avgPrepMinutes ?? "12") || 12;
  const openTimeLabel = formatClock(settings?.openTime ?? "08:00");
  const closeTimeLabel = formatClock(settings?.closeTime ?? "23:00");

  const { allProducts } = useProductsWithFlags();
  const approvedReviews = useQuery(api.cafe.listApprovedReviews) ?? [];
  const dbReviews = approvedReviews.length > 0
    ? approvedReviews.slice(0, 3).map((r) => ({ name: r.name, text: r.text, rating: r.rating }))
    : fallbackReviews;

  useEffect(() => {
    const timer = setTimeout(() => setIntroComplete(true), 3200);
    return () => clearTimeout(timer);
  }, []);

  const bestSellers = allProducts.filter((p) => p.badge === "bestseller").slice(0, 6);
  const signature = allProducts.filter((p) => p.badge === "signature");
  const popular = allProducts.filter((p) => p.rating >= 4.7).slice(0, 6);

  const features = [
    { icon: Award, title: "Specialty Grade Beans", desc: "Single-origin beans sourced from the world's finest estates" },
    { icon: Leaf, title: "Ethically Sourced", desc: "Direct-trade partnerships that support farming communities" },
    { icon: Coffee, title: "Freshly Prepared", desc: "Every drink made to order with precision and care" },
    { icon: ShieldCheck, title: "Quality Promise", desc: "If it isn't perfect, we'll remake it — no questions asked" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ══════════ HERO ══════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden bg-hero-dark noise-overlay">
        {/* Background layers */}
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_50%,rgba(168,132,92,0.14),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_20%,rgba(184,128,138,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1400&h=900&fit=crop')] bg-cover bg-center opacity-[0.07]" />
        </motion.div>

        {/* Liquid glass backdrop — morphing pools of light */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="liquid-blob w-[32rem] h-[32rem] -top-44 -left-32 bg-gold/25" />
          <div className="liquid-blob liquid-blob-slow w-[28rem] h-[28rem] top-1/3 -right-40 bg-dusty-rose/20" />
          <div className="liquid-blob liquid-blob-fast w-80 h-80 bottom-8 left-1/3 bg-sage/15" />
        </div>

        {/* Floating beans — more, varied sizes */}
        <FloatingBean className="top-28 left-[8%] opacity-20" delay={0} />
        <FloatingBean className="top-44 right-[12%] opacity-15" delay={1.5} />
        <FloatingBean className="bottom-36 left-[18%] opacity-10" delay={3} />
        <FloatingBean className="bottom-52 right-[25%] opacity-[0.08]" delay={4} />
        <FloatingBean className="top-60 left-[45%] opacity-[0.06]" delay={2} />
        <FloatingBean className="bottom-24 right-[40%] opacity-[0.05]" delay={5} />

        {/* Animated particle dots */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`p-${i}`}
            className="absolute w-1 h-1 rounded-full bg-gold/20"
            style={{ top: `${15 + (i * 7) % 70}%`, left: `${5 + (i * 13) % 90}%` }}
            animate={{ opacity: [0.1, 0.5, 0.1], scale: [1, 1.5, 1] }}
            transition={{ duration: 4 + (i % 3), delay: i * 0.4, repeat: Infinity, ease: "easeInOut" as const }}
          />
        ))}

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
                    <path d="M20 40h70v45c0 11-9 20-20 20H40c-11 0-20-9-20-20V40z" fill="#A8845C" opacity="0.9" />
                    <ellipse cx="55" cy="40" rx="35" ry="6" fill="#B8808A" />
                    <path d="M90 50h10c8 0 15 7 15 15s-7 15-15 15H90" stroke="#A8845C" strokeWidth="4" fill="none" />
                  </svg>
                  {/* Steam wisps from cup */}
                  <div className="absolute -top-8 left-8">
                    <SteamWisp delay={0} />
                    <SteamWisp className="left-3" delay={0.4} />
                    <SteamWisp className="left-6" delay={0.8} />
                  </div>
                </motion.div>
              </motion.div>

              {/* Splash / ripple ring effect */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1.8, 2.4], opacity: [0, 0.5, 0.3, 0] }}
                transition={{ duration: 1.8, delay: 1.4, ease: "easeOut" as const }}
                className="absolute"
              >
                <div className="w-48 h-48 rounded-full border-2 border-gold/30" />
              </motion.div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1, 1.6, 2.2], opacity: [0, 0.4, 0.2, 0] }}
                transition={{ duration: 2, delay: 1.6, ease: "easeOut" as const }}
                className="absolute"
              >
                <div className="w-48 h-48 rounded-full border border-dusty-rose/20" />
              </motion.div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 2], opacity: [0, 0.6, 0] }}
                transition={{ duration: 1.2, delay: 1.8, ease: "easeOut" as const }}
                className="absolute"
              >
                <div className="w-64 h-64 rounded-full bg-gold/10 blur-3xl" />
              </motion.div>

              {/* Brand reveal with staggered lines */}
              <motion.div
                className="absolute text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.0, duration: 0.8 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.1, duration: 0.4 }}
                  className="text-white/40 text-sm tracking-[0.3em] uppercase mb-2"
                >
                  Welcome to
                </motion.div>
                <div className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.3, duration: 0.5 }}
                    className="text-white/80 text-2xl sm:text-3xl tracking-[0.4em] uppercase mb-1"
                  >
                    The
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2.5, duration: 0.5, type: "spring" }}
                  >
                    BELGRAVIA
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.8, duration: 0.5 }}
                    className="text-gradient-brand"
                    style={{ WebkitTextFillColor: "transparent", background: "linear-gradient(135deg, #FFDDB7, #C4A478, #6F4E37)", WebkitBackgroundClip: "text", backgroundClip: "text" }}
                  >
                    ROAST
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main hero content (after intro) */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-20">
          <div className="grid lg:grid-cols-2 lg:gap-10 lg:items-center">
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
                <span className="block text-5xl sm:text-6xl lg:text-[5.5rem] font-bold tracking-tight relative" style={{ background: "linear-gradient(135deg, #FFDDB7, #C4A478, #6F4E37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  ROAST
                  {/* Shimmer line across ROAST */}
                  <motion.span
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.15) 45%, transparent 55%)", backgroundSize: "200% 100%" }}
                    animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                    transition={{ duration: 4, delay: 4.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" as const }}
                  />
                </span>
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
              <motion.div animate={{ boxShadow: ["0 4px 15px rgba(168,132,92,0.25)", "0 4px 25px rgba(168,132,92,0.4)", "0 4px 15px rgba(168,132,92,0.25)"] }} transition={{ duration: 3, repeat: Infinity }} className="inline-flex rounded-xl">
                <Link to="/menu" className="btn-brand liquid-sheen inline-flex items-center gap-2">
                  Explore the Menu <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
              <Link
                to="/menu"
                className="glass-liquid-dark liquid-sheen-slow inline-flex items-center gap-2 border border-white/15 text-white px-7 py-3.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/10"
              >
                Order Now
              </Link>
            </motion.div>

            {/* Live status strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.2, duration: 0.6 }}
              className="flex flex-wrap items-center gap-x-6 sm:gap-x-8 gap-y-4 glass-liquid-dark rounded-2xl px-5 sm:px-6 py-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 4.4, duration: 0.4 }}
                className="flex items-center gap-2.5"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sage" />
                </span>
                <div>
                  <div className="text-lg font-bold text-white">{openNow ? "Open Now" : "Closed Now"}</div>
                  <div className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">
                    {openNow ? `${openTimeLabel} – ${closeTimeLabel} Daily` : `Opens ${openTimeLabel}`}
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 4.5, duration: 0.4 }}
              >
                <div className="text-lg font-bold text-white">{prepMin} min</div>
                <div className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">Avg. Prep Time</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 4.6, duration: 0.4 }}
              >
                <div className="text-lg font-bold text-white">4.9 ★</div>
                <div className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">Guest Rating</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 4.7, duration: 0.4 }}
                className="flex items-center gap-2.5"
              >
                <motion.div
                  className="flex -space-x-2"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  {["#C4A478", "#B8808A", "#6B7F6B"].map((c, i) => (
                    <span key={i} className="h-6 w-6 rounded-full border-2 border-white/10 bg-white/10" style={{ backgroundColor: `${c}55` }} />
                  ))}
                </motion.div>
                <div>
                  <div className="text-lg font-bold text-white">14 orders</div>
                  <div className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">Being served now</div>
                </div>
              </motion.div>
            </motion.div>
            </div>

            {/* Cinematic coffee scene — choreography starts as the intro fades */}
            {introComplete && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" as const }}
                className="justify-self-center mt-12 lg:mt-0"
              >
                <CoffeeSpillScene />
              </motion.div>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30"
        >
          <motion.span
            className="text-[10px] uppercase tracking-widest"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            Scroll to Discover
          </motion.span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ══════════ HOW DO YOU WANT TO ORDER? ══════════ */}
      <HowToOrder />

      {/* ══════════ FIND YOUR TABLE ══════════ */}
      <FindYourTable />

      {/* ══════════ TODAY'S SPECIAL ══════════ */}
      <TodaySpecial settings={settings} />

      {/* ══════════ DAYPART PICKS ══════════ */}
      <DaypartPicks />

      {/* ══════════ SIGNATURE DRINKS ══════════ */}
      {signature.length > 0 && (
        <section className="py-16 sm:py-20 bg-gradient-to-b from-background via-champagne/30 to-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-10">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-dusty-rose/10 rounded-full px-4 py-1.5 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-dusty-rose" />
                <span className="text-xs font-semibold text-dusty-rose uppercase tracking-wider">Only at Belgravia</span>
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
            <Link to="/menu" className="inline-flex items-center gap-2 text-sm font-semibold text-dusty-rose hover:text-burgundy transition-colors">
              View Full Menu <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════ QUICK ORDER + SURPRISE ME ══════════ */}
      <QuickOrder />

      {/* ══════════ POPULAR ══════════ */}
      <section className="py-16 sm:py-20 bg-warm-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-10">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-dusty-rose/10 rounded-full px-4 py-1.5 mb-3">
              <Coffee className="h-3.5 w-3.5 text-dusty-rose" />
              <span className="text-xs font-semibold text-dusty-rose uppercase tracking-wider">Trending Now</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-foreground">Most Loved This Week</motion.h2>
            <motion.div variants={fadeUp} custom={2} className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {getTrending().map(({ product, delta, rank }) => (
                <Link
                  key={product.id}
                  to={`/menu/${product.slug}`}
                  className="inline-flex items-center gap-1.5 bg-white border border-border/60 rounded-full px-3 py-1.5 text-xs font-medium text-foreground/70 hover:border-dusty-rose/40 hover:text-dusty-rose transition-all"
                >
                  <span className="font-bold text-dusty-rose">#{rank}</span>
                  {product.name}
                  <span className="text-[10px] font-bold text-sage">{delta}</span>
                </Link>
              ))}
            </motion.div>
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
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-dusty-rose/10 text-dusty-rose group-hover:bg-dusty-rose group-hover:text-white transition-colors duration-300">
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
              <div className="inline-flex items-center gap-2 bg-dusty-rose/10 rounded-full px-4 py-1.5 mb-4">
                <span className="text-xs font-semibold text-dusty-rose uppercase tracking-wider">Our Story</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">A Better Cup.<br />A Better Moment.</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                At The Belgravia Roast, coffee is more than a drink. From carefully brewed coffee to comforting café favourites, every order is made to turn an ordinary break into something worth remembering.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                We source single-origin beans from ethical farms, roast them to highlight each origin's unique character, and serve them with genuine care. It's a simple philosophy executed with precision.
              </p>
              <Link to="/about" className="inline-flex items-center gap-2 text-sm font-semibold text-dusty-rose hover:text-burgundy transition-colors">
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
        <div className="absolute top-0 left-0 w-96 h-96 bg-dusty-rose/10 rounded-full blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold">What Our Guests Say</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-white/40 mt-2">Loved by regulars and first-timers alike</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dbReviews.map((r, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <Quote className="h-8 w-8 text-dusty-rose/40 mb-4" />
                <p className="text-white/60 text-sm leading-relaxed mb-6">{r.text}</p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.rating }).map((_, j) => (
                      <Star key={j} className="h-3 w-3 fill-dusty-rose text-dusty-rose" />
                    ))}
                  </div>
                  <span className="text-xs text-white/40">{r.name}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ LOYALTY ══════════ */}
      <LoyaltyTeaser />

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
