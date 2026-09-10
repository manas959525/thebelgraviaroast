import { useParams, Link } from "react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Flame, Star, Plus, Minus, ShoppingCart, Leaf, Heart, Sparkles, BadgePercent } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getProductBySlug, getProductsByCategory } from "@/data/menu";
import { useProductsWithFlags } from "@/lib/use-live-catalog";
import { addToCart } from "@/lib/cart";
import { getComplements } from "@/lib/cafe";
import { getComboFor } from "@/lib/combos";
import { toggleFavorite, useFavorites } from "@/lib/favorites";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

function FavoriteButton({ product }: { product: { id: string; name: string } }) {
  const favs = useFavorites();
  const active = favs.includes(product.id);
  return (
    <button
      onClick={() => {
        toggleFavorite(product.id);
        toast.success(active ? "Removed from favourites" : "Added to favourites");
      }}
      aria-label={active ? "Remove from favourites" : "Add to favourites"}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all shrink-0 ${
        active ? "bg-dusty-rose border-dusty-rose text-white" : "border-border bg-white text-muted-foreground hover:text-dusty-rose"
      }`}
    >
      <Heart className={`h-5 w-5 ${active ? "fill-current" : ""}`} />
    </button>
  );
}

function PerfectWith({ product }: { product: ReturnType<typeof getProductBySlug> }) {
  const complements = product ? getComplements(product) : [];
  if (complements.length === 0) return null;
  return (
    <div className="mt-16">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-4 w-4 text-dusty-rose" />
        <h2 className="text-xl font-bold text-foreground">Perfect with your {product?.name}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {complements.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-border/50 p-3 flex items-center gap-4 hover:shadow-md transition-all"
          >
            <Link to={`/menu/${item.slug}`} className="shrink-0">
              <img src={item.image} alt={item.name} className="h-16 w-16 rounded-xl object-cover" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/menu/${item.slug}`} className="font-semibold text-sm text-foreground hover:text-dusty-rose transition-colors truncate block">
                {item.name}
              </Link>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>
              <div className="font-bold text-foreground mt-1">₹{item.discountPrice ?? item.price}</div>
            </div>
            <button
              onClick={() => { addToCart(item, 1); toast.success(`${item.name} added to cart`); }}
              className="h-9 w-9 rounded-xl bg-gold text-white flex items-center justify-center text-lg font-bold hover:bg-gold/90 transition-all shrink-0"
            >
              +
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { isAvailable } = useProductsWithFlags();
  const staticProduct = getProductBySlug(slug || "");
  const product = staticProduct
    ? { ...staticProduct, available: isAvailable(staticProduct.id) }
    : null;

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedMilk, setSelectedMilk] = useState<string | undefined>();
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const recordUpsell = useMutation(api.cafe.recordUpsellEvent);

  const combo = product ? getComboFor(product) : null;
  useEffect(() => {
    // Fire-and-forget: log that this combo offer was shown (for admin analytics).
    if (!combo) return;
    recordUpsell({
      comboId: combo.id,
      mainId: combo.main.id,
      pairId: combo.pair.id,
      value: combo.comboPrice,
      savings: combo.savings,
      accepted: false,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combo?.id]);

  if (!product) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-foreground mb-2">Product not found</h2>
            <Link to="/menu" className="text-gold text-sm font-medium hover:underline">
              Back to Menu
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const sizeCustomization = product.customizations?.find((c) => c.name === "Size");
  const milkCustomization = product.customizations?.find((c) => c.name === "Milk");
  const otherCustomizations = product.customizations?.filter((c) => c.name !== "Size" && c.name !== "Milk") || [];

  const related = getProductsByCategory(product.category)
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  const basePrice = product.discountPrice ?? product.price;
  let extraPrice = 0;
  if (selectedSize === "Medium") extraPrice += 20;
  if (selectedSize === "Large") extraPrice += 40;
  if (selectedMilk === "Oat Milk" || selectedMilk === "Almond Milk") extraPrice += 30;
  if (product.addOns) {
    selectedAddOns.forEach((name) => {
      const addOn = product.addOns!.find((a) => a.name === name);
      if (addOn) extraPrice += addOn.price;
    });
  }
  const totalPrice = (basePrice + extraPrice) * quantity;

  const toggleAddOn = (name: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const handleAdd = () => {
    addToCart(product, quantity, {
      selectedSize,
      selectedMilk,
      addOns: selectedAddOns.length ? selectedAddOns : undefined,
    });
    toast.success(`${product.name} × ${quantity} added to cart`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Image */}
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <Link
          to="/menu"
          className="absolute top-24 left-4 sm:left-8 flex h-10 w-10 items-center justify-center rounded-xl glass-dark text-white transition-colors hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-32 lg:pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Tags */}
              <div className="flex items-center gap-2 mb-3">
                {product.isVeg ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <Leaf className="h-3 w-3" /> Vegetarian
                  </span>
                ) : (
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Non-Veg</span>
                )}
                {(product.badge === "bestseller" || product.bestSeller) && (
                  <span className="flex items-center gap-1 text-xs font-medium text-dusty-rose bg-dusty-rose/10 px-2 py-0.5 rounded-full">
                    <Star className="h-3 w-3 fill-current" /> Best Seller
                  </span>
                )}
              </div>

              <div className="flex items-start gap-3 mb-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex-1">{product.name}</h1>
                <FavoriteButton product={product} />
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>

              {/* Quick Info */}
              <div className="flex items-center gap-6 mb-8">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {product.prepTime} min prep
                </div>
                {product.calories && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Flame className="h-4 w-4" />
                  {product.calories} calories
                </div>
                )}
              </div>


            </motion.div>
          </div>

          {/* Sidebar - Order */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-border/50 shadow-sm p-6 sticky top-24"
            >
              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-bold text-foreground">₹{totalPrice}</span>
                {product.discountPrice && (
                  <span className="text-lg text-muted-foreground line-through">₹{product.price * quantity}</span>
                )}
              </div>

              {/* Size Customization */}
              {sizeCustomization && (
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-foreground mb-2">{sizeCustomization.name}</h4>
                  <div className="flex gap-2">
                    {sizeCustomization.options.map((opt) => (
                      <button
                        key={opt.name}
                        onClick={() => setSelectedSize(opt.name)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                          selectedSize === opt.name
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-border text-foreground/70 hover:bg-muted"
                        }`}
                      >
                        {opt.name}
                        {opt.price > 0 && <span className="text-xs ml-1">+₹{opt.price}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Milk Customization */}
              {milkCustomization && (
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-foreground mb-2">{milkCustomization.name}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {milkCustomization.options.map((opt) => (
                      <button
                        key={opt.name}
                        onClick={() => setSelectedMilk(opt.name)}
                        className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                          selectedMilk === opt.name
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-border text-foreground/70 hover:bg-muted"
                        }`}
                      >
                        {opt.name}
                        {opt.price > 0 && <span className="text-xs ml-1">+₹{opt.price}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Customizations */}
              {otherCustomizations.map((custom) => (
                <div key={custom.name} className="mb-5">
                  <h4 className="text-sm font-semibold text-foreground mb-2">{custom.name}</h4>
                  <div className="flex flex-wrap gap-2">
                    {custom.options.map((opt) => (
                      <button
                        key={opt.name}
                        className="px-3 py-2 rounded-xl text-sm border border-border text-foreground/70 hover:bg-muted"
                      >
                        {opt.name}
                        {opt.price > 0 && <span className="text-xs ml-1">+₹{opt.price}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Add-ons */}
              {product.addOns && product.addOns.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Add-ons</h4>
                  <div className="space-y-2">
                    {product.addOns.map((addOn) => (
                      <label
                        key={addOn.name}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          selectedAddOns.includes(addOn.name)
                            ? "border-gold bg-gold/5"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedAddOns.includes(addOn.name)}
                            onChange={() => toggleAddOn(addOn.name)}
                            className="accent-gold"
                          />
                          <span className="text-sm">{addOn.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">+₹{addOn.price}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <h4 className="text-sm font-semibold text-foreground">Quantity</h4>
                <div className="flex items-center gap-3 bg-muted rounded-xl px-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-semibold text-sm w-6 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Combo upsell */}
              {combo && product.available && (
                <div className="mb-5 bg-cafe-gradient rounded-2xl p-4 relative overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-28 h-28 bg-gold/20 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="flex items-center gap-1.5 mb-2">
                      <BadgePercent className="h-3.5 w-3.5 text-gold" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                        {combo.label} — make it a combo
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={combo.pair.image} alt={combo.pair.name} className="h-14 w-14 rounded-xl object-cover border-2 border-white/30" />
                        <span className="absolute -top-1.5 -right-1.5 bg-gold text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          +1
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm truncate">
                          {product.name} + {combo.pair.name}
                        </div>
                        <div className="text-white/60 text-xs mt-0.5">
                          <span className="line-through mr-1.5">₹{combo.original}</span>
                          <span className="text-white font-bold text-sm">₹{combo.comboPrice}</span>
                          <span className="ml-1.5 bg-green-400/20 text-green-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            SAVE ₹{combo.savings}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        addToCart(product, quantity, {
                          selectedSize,
                          selectedMilk,
                          addOns: selectedAddOns.length ? selectedAddOns : undefined,
                        });
                        addToCart(combo.pair, 1);
                        recordUpsell({
                          comboId: combo.id,
                          mainId: combo.main.id,
                          pairId: combo.pair.id,
                          value: combo.comboPrice,
                          savings: combo.savings,
                          accepted: true,
                        }).catch(() => {});
                        toast.success(`Combo added — you saved ₹${combo.savings}`);
                      }}
                      className="mt-3 w-full bg-white text-navy py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-cream transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      ADD COMBO — ₹{combo.comboPrice}
                    </button>
                  </div>
                </div>
              )}

              {/* Add to Cart */}
              {!product.available ? (
                <div className="w-full flex items-center justify-center gap-2 bg-muted text-muted-foreground py-3.5 rounded-xl text-sm font-semibold">
                  Sold out for today — back tomorrow
                </div>
              ) : (
                <button
                  onClick={handleAdd}
                  className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold/90 text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-gold/20"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart — ₹{totalPrice}
                </button>
              )}
            </motion.div>
          </div>
        </div>

        {/* Perfect with */}
        <PerfectWith product={product} />

        {/* Related Items */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-foreground mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to={`/menu/${item.slug}`}
                  className="bg-white rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-lg transition-all"
                >
                  <img src={item.image} alt={item.name} className="h-40 w-full object-cover" />
                  <div className="p-4">
                    <h3 className="font-semibold text-sm text-foreground">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    <div className="mt-3 font-bold text-foreground">₹{item.discountPrice ?? item.price}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
