import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X, Clock, Star, Leaf } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { categories, products, type Product } from "@/data/menu";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.05, ease: "easeOut" as const },
  }),
};

function MenuCard({ product, index }: { product: Product; index: number }) {
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    >
      <Link
        to={`/menu/${product.slug}`}
        className="group flex gap-4 bg-white rounded-2xl p-4 border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300"
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
                <h3 className="font-semibold text-sm text-foreground group-hover:text-caramel transition-colors truncate">
                  {product.name}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {product.description}
              </p>
            </div>
            {product.bestSeller && (
              <span className="shrink-0 flex items-center gap-1 bg-caramel/10 text-caramel text-[10px] font-bold px-2 py-0.5 rounded-full">
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
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" /> {product.prepTime} min
              </span>
              <span className="text-[10px] text-muted-foreground">{product.calories} cal</span>
              <button
                onClick={handleAdd}
                className="h-8 w-8 rounded-xl bg-caramel text-white flex items-center justify-center text-lg font-bold hover:bg-caramel/90 transition-all hover:shadow-md shrink-0"
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

  const filtered = useMemo(() => {
    let result = products;
    if (selectedCategory) {
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (cat) result = result.filter((p) => p.category === cat.id);
    }
    if (showVegOnly) result = result.filter((p) => p.isVeg);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q)),
      );
    }
    return result;
  }, [selectedCategory, showVegOnly, search]);

  const handleCategoryClick = (slug: string | null) => {
    setSelectedCategory(slug);
    if (slug) {
      setSearchParams({ cat: slug });
    } else {
      setSearchParams({});
    }
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
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes, ingredients..."
              className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-caramel focus:ring-2 focus:ring-caramel/20"
            />
          </div>
          <button
            onClick={() => setShowVegOnly(!showVegOnly)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              showVegOnly
                ? "bg-green-50 border-green-300 text-green-700"
                : "bg-white border-border text-foreground/70 hover:border-border"
            }`}
          >
            <Leaf className="h-4 w-4" />
            Veg Only
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          <button
            onClick={() => handleCategoryClick(null)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              !selectedCategory ? "bg-caramel text-white shadow-md shadow-caramel/20" : "bg-white border border-border text-foreground/70 hover:bg-muted"
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
                  ? "bg-caramel text-white shadow-md shadow-caramel/20"
                  : "bg-white border border-border text-foreground/70 hover:bg-muted"
              }`}
            >
              <span>{cat.image}</span>
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
