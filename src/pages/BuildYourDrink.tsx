import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Coffee, CupSoda, Milk, Palette, ShoppingCart, Sparkles, RotateCcw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { products, type Product } from "@/data/menu";
import { addToCart } from "@/lib/cart";
import { SteamWisp } from "@/components/CoffeeSpillScene";
import { toast } from "sonner";

const BASE_IDS = ["espresso", "americano", "cappuccino", "latte", "flat-white", "mocha"];

const SIZES = [
  { name: "Regular", price: 0, desc: "200 ml" },
  { name: "Medium", price: 20, desc: "300 ml" },
  { name: "Large", price: 40, desc: "400 ml" },
];

const MILKS = [
  { name: "Regular", price: 0, desc: "Whole milk" },
  { name: "Oat Milk", price: 30, desc: "Creamy & vegan" },
  { name: "Almond Milk", price: 30, desc: "Light & nutty" },
];

const EXTRAS = [
  { name: "Caramel Syrup", price: 20, emoji: "🍯" },
  { name: "Vanilla Syrup", price: 20, emoji: "🌼" },
  { name: "Hazelnut Syrup", price: 20, emoji: "🌰" },
  { name: "Chocolate Sauce", price: 20, emoji: "🍫" },
  { name: "Extra Shot", price: 40, emoji: "⚡" },
  { name: "Whipped Cream", price: 15, emoji: "🍦" },
];

const STEP_META = [
  { label: "Base", icon: Coffee },
  { label: "Size", icon: CupSoda },
  { label: "Milk", icon: Milk },
  { label: "Extras", icon: Palette },
];

function optionCard(active: boolean) {
  return `rounded-xl border-2 p-3 text-center transition-all cursor-pointer ${
    active ? "border-gold bg-gold/5 shadow-md shadow-gold/10" : "border-border hover:border-gold/40 hover:bg-muted/40"
  }`;
}

export default function BuildYourDrink() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [base, setBase] = useState<Product | null>(null);
  const [size, setSize] = useState(SIZES[0]);
  const [milk, setMilk] = useState(MILKS[0]);
  const [extras, setExtras] = useState<string[]>([]);

  const bases = useMemo(
    () => BASE_IDS.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => Boolean(p)),
    [],
  );

  const extrasPrice = extras.reduce((sum, name) => {
    const ex = EXTRAS.find((e) => e.name === name);
    return sum + (ex?.price ?? 0);
  }, 0);

  const total = (base?.discountPrice ?? base?.price ?? 0) + size.price + milk.price + extrasPrice;

  const toggleExtra = (name: string) => {
    setExtras((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };

  const handleAdd = () => {
    if (!base) return;
    // Clone the base product and merge builder extras into its add-ons so the
    // cart prices them correctly from product data.
    const existingAddOns = base.addOns ?? [];
    const mergedAddOns = [...existingAddOns];
    extras.forEach((name) => {
      const ex = EXTRAS.find((e) => e.name === name);
      if (ex && !mergedAddOns.some((a) => a.name === ex.name)) {
        mergedAddOns.push({ name: ex.name, price: ex.price });
      }
    });
    const built: Product = { ...base, id: `${base.id}-built`, addOns: mergedAddOns };
    addToCart(built, 1, {
      selectedSize: size.name,
      selectedMilk: milk.name,
      addOns: extras.length ? extras : undefined,
    });
    toast.success(`Your ${base.name} is in the cart ☕`);
    navigate("/cart");
  };

  const reset = () => {
    setBase(null);
    setSize(SIZES[0]);
    setMilk(MILKS[0]);
    setExtras([]);
    setStep(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="pt-24 pb-10 bg-warm-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link to="/menu" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Menu
            </Link>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-dusty-rose" />
              <span className="text-xs font-semibold text-dusty-rose uppercase tracking-wider">Build Your Drink</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Your Coffee, Your Way</h1>
            <p className="text-muted-foreground mt-2">Four quick steps — we'll handle the rest.</p>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Wizard */}
          <div className="lg:col-span-3">
            {/* Stepper */}
            <div className="flex items-center gap-2 mb-8">
              {STEP_META.map((meta, i) => {
                const Icon = meta.icon;
                const done = i < step;
                const active = i === step;
                return (
                  <div key={meta.label} className="flex items-center gap-2 flex-1 last:flex-none">
                    <button
                      onClick={() => i < step && setStep(i)}
                      disabled={i > step}
                      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                        active ? "bg-gold text-white shadow-md shadow-gold/20" : done ? "bg-sage text-white" : "glass-chip text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{meta.label}</span>
                    </button>
                    {i < STEP_META.length - 1 && <div className={`h-0.5 flex-1 rounded-full ${done ? "bg-sage" : "bg-muted"}`} />}
                  </div>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1: Base */}
              {step === 0 && (
                <motion.div key="base" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-lg font-bold text-foreground mb-1">Choose your coffee</h2>
                  <p className="text-sm text-muted-foreground mb-5">Start with a base we pull fresh to order.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {bases.map((b) => (
                      <button key={b.id} onClick={() => { setBase(b); setStep(1); }} className={optionCard(base?.id === b.id)}>
                        <div className="h-24 overflow-hidden rounded-lg mb-2">
                          <img src={b.image} alt={b.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        </div>
                        <div className="font-semibold text-sm text-foreground">{b.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">₹{b.discountPrice ?? b.price}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Size */}
              {step === 1 && (
                <motion.div key="size" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-lg font-bold text-foreground mb-1">Choose your size</h2>
                  <p className="text-sm text-muted-foreground mb-5">Bigger cup, bigger smile.</p>
                  <div className="grid grid-cols-3 gap-3">
                    {SIZES.map((s) => (
                      <button key={s.name} onClick={() => { setSize(s); setStep(2); }} className={optionCard(size.name === s.name)}>
                        <div className={`text-2xl font-bold ${size.name === s.name ? "text-gold" : "text-foreground/70"}`}>
                          {s.name === "Regular" ? "S" : s.name === "Medium" ? "M" : "L"}
                        </div>
                        <div className="text-sm font-medium mt-1">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</div>
                        <div className="text-xs font-semibold mt-1">{s.price > 0 ? `+₹${s.price}` : "Included"}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Milk */}
              {step === 2 && (
                <motion.div key="milk" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-lg font-bold text-foreground mb-1">Choose your milk</h2>
                  <p className="text-sm text-muted-foreground mb-5">Regular, oat, or almond — your call.</p>
                  <div className="grid grid-cols-3 gap-3">
                    {MILKS.map((m) => (
                      <button key={m.name} onClick={() => { setMilk(m); setStep(3); }} className={optionCard(milk.name === m.name)}>
                        <div className={`text-2xl ${milk.name === m.name ? "text-gold" : "text-foreground/70"}`}>{m.name === "Regular" ? "🥛" : m.name === "Oat Milk" ? "🌾" : "🌰"}</div>
                        <div className="text-sm font-medium mt-1">{m.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{m.desc}</div>
                        <div className="text-xs font-semibold mt-1">{m.price > 0 ? `+₹${m.price}` : "Included"}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Extras */}
              {step === 3 && (
                <motion.div key="extras" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-lg font-bold text-foreground mb-1">Customise it</h2>
                  <p className="text-sm text-muted-foreground mb-5">Add a flavour or two — on us to decide what's best.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {EXTRAS.map((ex) => {
                      const active = extras.includes(ex.name);
                      return (
                        <button key={ex.name} onClick={() => toggleExtra(ex.name)} className={optionCard(active)}>
                          <div className="text-2xl">{ex.emoji}</div>
                          <div className="text-sm font-medium mt-1">{ex.name}</div>
                          <div className="text-xs font-semibold mt-1">+₹{ex.price}</div>
                          {active && <Check className="h-4 w-4 text-gold mx-auto mt-1.5" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-8">
                    <button onClick={() => setStep(2)} className="border border-border px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted transition-all">
                      Back
                    </button>
                    <button
                      onClick={handleAdd}
                      className="inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
                    >
                      <ShoppingCart className="h-4 w-4" /> Add to Cart — ₹{total}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step navigation for 0-2 */}
            {step < 3 && (
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(Math.max(0, step - 1))}
                  disabled={step === 0}
                  className="border border-border px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted transition-all disabled:opacity-40"
                >
                  Back
                </button>
                {step < 2 && (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={step === 0 ? !base : step === 1 ? !size : false}
                    className="inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-40"
                  >
                    Continue <ArrowLeft className="h-4 w-4 rotate-180" />
                  </button>
                )}
                {step === 2 && (
                  <button
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
                  >
                    Continue <ArrowLeft className="h-4 w-4 rotate-180" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Live preview */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 bg-cafe-gradient text-white rounded-3xl overflow-hidden p-8 text-center relative">
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-dusty-rose/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-10 w-64 h-64 bg-gold/20 rounded-full blur-3xl" />

              <div className="relative">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Your Creation</div>

                {/* Cup with steam */}
                <div className="relative mx-auto w-44 h-48 mb-4">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex">
                    <SteamWisp delay={0} />
                    <SteamWisp className="left-4" delay={0.5} />
                    <SteamWisp className="left-8" delay={1} />
                  </div>
                  <div className="absolute inset-x-4 bottom-0 top-6 rounded-t-full rounded-b-2xl border-2 border-white/20 overflow-hidden bg-white/5 backdrop-blur-sm">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={base?.id ?? "empty"}
                        src={base?.image}
                        alt={base?.name ?? "coffee"}
                        initial={{ opacity: 0, scale: 1.15 }}
                        animate={{ opacity: base ? 1 : 0.15, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="w-full h-full object-cover"
                      />
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E1620]/70 to-transparent" />
                  </div>
                  <div className="absolute -right-1 top-14 w-10 h-16 rounded-r-full border-2 border-white/20 border-l-0" />
                </div>

                <h3 className="font-display text-xl font-bold mb-3">
                  {base ? `${size.name} ${base.name}` : "Pick a base to start"}
                </h3>

                {/* Options summary */}
                <div className="space-y-1.5 text-sm text-white/60 mb-5 min-h-[72px]">
                  <div className="flex justify-between"><span>Size</span><span className="text-white/90 font-medium">{size.name}{size.price > 0 ? ` (+₹${size.price})` : ""}</span></div>
                  <div className="flex justify-between"><span>Milk</span><span className="text-white/90 font-medium">{milk.name}{milk.price > 0 ? ` (+₹${milk.price})` : ""}</span></div>
                  <div className="flex justify-between">
                    <span>Extras</span>
                    <span className="text-white/90 font-medium">{extras.length ? extras.map((e) => e.replace(" Syrup", "")).join(", ") : "—"}{extrasPrice > 0 ? ` (+₹${extrasPrice})` : ""}</span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 mb-5">
                  <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Total</div>
                  <div className="text-4xl font-bold text-amber-300">₹{total}</div>
                </div>

                {step === 3 ? (
                  <button
                    onClick={handleAdd}
                    className="w-full inline-flex items-center justify-center gap-2 bg-amber-300 hover:bg-amber-200 text-navy py-3 rounded-xl text-sm font-bold transition-all hover:shadow-xl hover:shadow-amber-300/20"
                  >
                    <ShoppingCart className="h-4 w-4" /> Add to Cart — ₹{total}
                  </button>
                ) : (
                  <button
                    onClick={reset}
                    className="w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 py-3 rounded-xl text-sm font-semibold transition-all"
                  >
                    <RotateCcw className="h-4 w-4" /> Start Over
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}