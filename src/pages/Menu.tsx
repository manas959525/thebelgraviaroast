import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, Star, Leaf, Heart, Flame, Sparkles, ChevronRight, Coffee } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { categories, type Product } from "@/data/menu";
import { useProductsWithFlags } from "@/lib/use-live-catalog";
import { addToCart } from "@/lib/cart";
import { cravingChips, daypartGreeting, daypartHint, getDaypartPicks } from "@/lib/cafe";
import { isFavorite, toggleFavorite, useFavorites } from "@/lib/favorites";
import VoiceOrder from "@/components/VoiceOrder";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.05, ease: "easeOut" as const },
  }),
};

function FavoriteButton({ product }: { product: Product }) {
  const favs = useFavorites();
  const active = favs.includes(product.id);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(product.id);
        toast.success(active ? "Removed from favourites" : "Added to favourites");
      }}
      aria-label={active ? "Remove from favourites" : "Add to favourites"}
      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all shadow-sm ${
        active ? "bg-dusty-rose text-white" : "bg-white/95 text-muted-foreground hover:text-dusty-rose"
      }`}
    >
      <Heart className={`h-4 w-4 ${active ? "fill-current" : ""}`} />
    </button>
  );
}

function MenuCard({ product, index }: { product: Product; index: number }) {
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.available) return;
    addToCart(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
      className="relative"
    >
      <Link
        to={`/menu/${product.slug}`}
        className={`group flex gap-4 bg-white rounded-2xl p-4 border transition-all duration-300 ${
          product.available
            ? "border-border/50 shadow-sm hover:shadow-lg"
            : "border-border/40 opacity-70"
        }`}
      >
        <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-xl overflow-hidden shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {product.discountPrice && (
            <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
              {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
            </div>
          )}
          {!product.available && (
            <div className="absolute inset-0 bg-navy/70 flex items-center justify-center">
              <div className="text-center px-2">
                <div className="text-[10px] font-bold text-white uppercase tracking-wider">Sold Out</div>
                <div className="text-[9px] text-white/60 mt-0.5">Back tomorrow</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                {product.isVeg ? (
                  <div className="w-3.5 h-3.5 rounded border-[1.5px] border-green-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  </div>
                ) : (
                  <div className="w-3.5 h-3.5 rounded border-[1.5px] border-red-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  </div>
                )}
                <h3 className="font-semibold text-sm text-foreground group-hover:text-gold transition-colors truncate">
                  {product.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="flex items-center gap-0.5 text-[10px] font-medium text-foreground/70">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {product.rating}
                </span>
                {product.rating >= 4.8 && (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-dusty-rose uppercase tracking-wide">
                    <Flame className="h-2.5 w-2.5" /> Trending
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {product.description}
              </p>
            </div>
            {(product.badge === "bestseller" || product.bestSeller) && (
              <span className="shrink-0 flex items-center gap-1 bg-dusty-rose/10 text-dusty-rose text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Star className="h-2.5 w-2.5 fill-current" />
                Best Seller
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-foreground">₹{product.discountPrice ?? product.price}</span>
              {product.discountPrice && (
                <span className="text-xs text-muted-foreground line-through">₹{product.price}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" /> {product.prepTime} min
              </span>
              <FavoriteButton product={product} />
              <button
                onClick={handleAdd}
                disabled={!product.available}
                className="h-8 w-8 rounded-xl bg-gold text-white flex items-center justify-center text-lg font-bold hover:bg-gold/90 transition-all hover:shadow-md shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get("cat"));
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showBestSellers, setShowBestSellers] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"popular" | "price-asc" | "price-desc" | "rating">("popular");
  const [surprise, setSurprise] = useState<Product | null>(null);
  const [rolling, setRolling] = useState(false);
  const { allProducts } = useProductsWithFlags();

  const daypartPicks = useMemo(() => getDaypartPicks(), []);

  const filtered = useMemo(() => {
    let result = allProducts;
    if (selectedCategory) {
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (cat) result = result.filter((p) => p.category === cat.id);
    }
    if (showVegOnly) result = result.filter((p) => p.isVeg);
    if (showAvailableOnly) result = result.filter((p) => p.available);
    if (showBestSellers) result = result.filter((p) => p.badge === "bestseller" || p.bestSeller);
    if (showNew) result = result.filter((p) => p.badge === "new");
    if (maxPrice !== null) result = result.filter((p) => (p.discountPrice ?? p.price) <= maxPrice);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q)),
      );
    }
    if (sortBy === "price-asc") result = [...result].sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
    if (sortBy === "price-desc") result = [...result].sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
    if (sortBy === "rating") result = [...result].sort((a, b) => b.rating - a.rating);
    if (sortBy === "popular") {
      result = [...result].sort((a, b) =>
        Number(b.badge === "bestseller" || b.bestSeller) - Number(a.badge === "bestseller" || a.bestSeller) ||
        b.rating - a.rating,
      );
    }
    return result;
  }, [allProducts, selectedCategory, showVegOnly, showAvailableOnly, showBestSellers, showNew, maxPrice, search, sortBy]);

  const handleCategoryClick = (slug: string | null) => {
    setSelectedCategory(slug);
    if (slug) {
      setSearchParams({ cat: slug });
    } else {
      setSearchParams({});
    }
  };

  const rollSurprise = () => {
    setRolling(true);
    setSurprise(null);
    setTimeout(() => {
      const availablePool = allProducts.filter((p) => p.available);
      setSurprise(availablePool[Math.floor(Math.random() * availablePool.length)] ?? null);
      setRolling(false);
    }, 650);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="pt-24 pb-6 bg-warm-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-bold text-foreground"
          >
            Our Menu
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-2"
          >
            Crafted with care, served with warmth
          </motion.p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Daypart banner */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-cafe-gradient text-white rounded-2xl p-5 sm:p-6 mb-6 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-dusty-rose/20 rounded-full blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="font-semibold text-sm sm:text-base mb-0.5">{daypartGreeting()}</div>
              <div className="text-xs text-white/50">{daypartHint()}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {daypartPicks.map((p) => (
                <Link
                  key={p.id}
                  to={`/menu/${p.slug}`}
                  className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                >
                  {p.name} <ChevronRight className="h-3 w-3 opacity-50" />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Craving chips */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            What are you craving?
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {cravingChips.map((chip) => (
              <button
                key={chip.cat}
                onClick={() => handleCategoryClick(selectedCategory === chip.cat ? null : chip.cat)}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === chip.cat
                    ? "bg-gold text-white shadow-md shadow-gold/20"
                    : "bg-white border border-border text-foreground/70 hover:bg-muted"
                }`}
              >
                <span className="text-base">{chip.emoji}</span>
                {chip.label}
              </button>
            ))}
            <button
              onClick={rollSurprise}
              disabled={rolling}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-dusty-rose/10 text-dusty-rose border border-dusty-rose/30 hover:bg-dusty-rose/20 transition-all"
            >
              <Sparkles className={`h-4 w-4 ${rolling ? "animate-spin" : ""}`} />
              {rolling ? "Picking..." : "Surprise Me"}
            </button>
            <Link
              to="/build-your-drink"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 transition-all"
            >
              <Coffee className="h-4 w-4" /> Build Your Drink
            </Link>
            <VoiceOrder />
          </div>

          {/* Surprise reveal */}
          <AnimatePresence>
            {surprise && (
              <motion.div
                key={surprise.id}
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="overflow-hidden mt-3"
              >
                <div className="bg-white rounded-2xl border border-dusty-rose/30 shadow-md overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <img src={surprise.image} alt={surprise.name} className="sm:w-32 h-28 sm:h-auto object-cover" />
                    <div className="p-4 flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-dusty-rose mb-0.5">
                          Today's pick for you
                        </div>
                        <h4 className="font-bold text-foreground">{surprise.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{surprise.description}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-lg text-foreground">₹{surprise.discountPrice ?? surprise.price}</span>
                        <button
                          onClick={() => { addToCart(surprise, 1); toast.success(`${surprise.name} added to cart`); }}
                          className="bg-gold hover:bg-gold/90 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                        >
                          Add to Cart
                        </button>
                        <Link
                          to={`/menu/${surprise.slug}`}
                          className="border border-border text-foreground/70 hover:bg-muted px-3 py-2 rounded-xl text-xs font-semibold transition-all"
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
        </motion.div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes, ingredients..."
                className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={maxPrice === null ? "any" : String(maxPrice)}
                onChange={(e) => setMaxPrice(e.target.value === "any" ? null : Number(e.target.value))}
                className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-gold"
                aria-label="Price range"
              >
                <option value="any">Any price</option>
                <option value="120">Under ₹120</option>
                <option value="150">Under ₹150</option>
                <option value="200">Under ₹200</option>
                <option value="250">Under ₹250</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-gold"
                aria-label="Sort by"
              >
                <option value="popular">Most popular</option>
                <option value="rating">Highest rated</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setShowVegOnly(!showVegOnly)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                showVegOnly
                  ? "bg-green-50 border-green-300 text-green-700"
                  : "bg-white border-border text-foreground/70 hover:bg-muted"
              }`}
            >
              <Leaf className="h-3.5 w-3.5" />
              Veg Only
            </button>
            <button
              onClick={() => setShowAvailableOnly(!showAvailableOnly)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                showAvailableOnly
                  ? "bg-sage/15 border-sage/40 text-sage"
                  : "bg-white border-border text-foreground/70 hover:bg-muted"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Available now
            </button>
            <button
              onClick={() => setShowBestSellers(!showBestSellers)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                showBestSellers
                  ? "bg-dusty-rose/15 border-dusty-rose/40 text-dusty-rose"
                  : "bg-white border-border text-foreground/70 hover:bg-muted"
              }`}
            >
              <Star className="h-3.5 w-3.5 fill-current" />
              Best Sellers
            </button>
            <button
              onClick={() => setShowNew(!showNew)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                showNew
                  ? "bg-gold/15 border-gold/40 text-gold"
                  : "bg-white border-border text-foreground/70 hover:bg-muted"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              New arrivals
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          <button
            onClick={() => handleCategoryClick(null)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              !selectedCategory ? "bg-gold text-white shadow-md shadow-gold/20" : "bg-white border border-border text-foreground/70 hover:bg-muted"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.slug
                  ? "bg-gold text-white shadow-md shadow-gold/20"
                  : "bg-white border border-border text-foreground/70 hover:bg-muted"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-16"
              >
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-lg font-semibold text-foreground">No items found</h3>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
              </motion.div>
            ) : (
              filtered.map((product, i) => (
                <MenuCard key={product.id} product={product} index={i} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="pb-20 lg:pb-0" />
      <Footer />
    </div>
  );
}