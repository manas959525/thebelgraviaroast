export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  image: string;
  category: string;
  isVeg: boolean;
  rating: number;
  prepTime: number;
  calories?: number;
  available: boolean;
  tags: string[];
  bestSeller?: boolean;
  badge?: "bestseller" | "new" | "spicy" | "chef's pick" | "signature";
  customizations?: { name: string; options: { name: string; price: number }[] }[];
  addOns?: { name: string; price: number }[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  image?: string;
  description: string;
  productCount: number;
}

export const categories: Category[] = [
  { id: "cat-coffee", name: "Signature Coffee", slug: "coffee", emoji: "☕", description: "Handcrafted espresso beverages from single-origin beans", productCount: 10 },
  { id: "cat-cold-coffee", name: "Cold Coffee", slug: "cold-coffee", emoji: "🧊", description: "Refreshing iced coffee blends and frappés", productCount: 7 },
  { id: "cat-shakes", name: "Shakes & Refreshers", slug: "shakes", emoji: "🥤", description: "Creamy milkshakes, iced teas, and fresh coolers", productCount: 7 },
  { id: "cat-pizza", name: "Pizza", slug: "pizza", emoji: "🍕", description: "Hand-tossed bases with premium toppings", productCount: 6 },
  { id: "cat-burgers", name: "Burgers", slug: "burgers", emoji: "🍔", description: "Gourmet patties and artisan buns", productCount: 5 },
  { id: "cat-sandwiches", name: "Sandwiches", slug: "sandwiches", emoji: "🥪", description: "Pressed, grilled, and stacked to perfection", productCount: 5 },
  { id: "cat-pasta", name: "Pasta", slug: "pasta", emoji: "🍝", description: "Al dente with house-made sauces", productCount: 4 },
  { id: "cat-sides", name: "Sides", slug: "sides", emoji: "🍟", description: "Crispy bites and shareable favourites", productCount: 6 },
  { id: "cat-desserts", name: "Desserts", slug: "desserts", emoji: "🍰", description: "Sweet endings worth savouring", productCount: 7 },
];

// Genuinely relevant Unsplash images by category
const imgs = {
  coffee: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop",
  cold: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=400&fit=crop",
  shake: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=400&fit=crop",
  pizza: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop",
  sandwich: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&h=400&fit=crop",
  pasta: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&h=400&fit=crop",
  sides: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=400&fit=crop",
  dessert: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&h=400&fit=crop",
} as const;

export const products: Product[] = [
  // ── SIGNATURE COFFEE ──────────────────────────────────
  { id: "sig-roast", name: "Belgravia Signature Roast", slug: "belgravia-signature-roast", description: "Our house blend — a carefully balanced medium roast with notes of dark chocolate, toasted walnut, and a hint of dried fruit. The drink that started it all.", price: 179, image: imgs.coffee, category: "cat-coffee", isVeg: true, rating: 4.9, prepTime: 4, available: true, tags: ["signature", "must-try"], badge: "signature", customizations: [{ name: "Size", options: [{ name: "Regular", price: 0 }, { name: "Large", price: 30 }] }, { name: "Milk", options: [{ name: "Regular", price: 0 }, { name: "Oat Milk", price: 30 }, { name: "Almond Milk", price: 30 }] }] },
  { id: "espresso", name: "Espresso", slug: "espresso", description: "A bold, concentrated shot pulled from our single-origin blend. Rich crema, intense flavour, no compromise.", price: 99, image: imgs.coffee, category: "cat-coffee", isVeg: true, rating: 4.7, prepTime: 2, available: true, tags: ["classic", "strong"], badge: "bestseller" },
  { id: "double-esp", name: "Double Espresso", slug: "double-espresso", description: "Twice the dose, twice the intensity. For those who take their coffee seriously.", price: 129, image: imgs.coffee, category: "cat-coffee", isVeg: true, rating: 4.6, prepTime: 2, available: true, tags: ["strong"], badge: "chef's pick" },
  { id: "americano", name: "Americano", slug: "americano", description: "Smooth espresso lengthened with hot water. Clean, robust, and perfectly balanced.", price: 119, image: imgs.coffee, category: "cat-coffee", isVeg: true, rating: 4.5, prepTime: 3, available: true, tags: ["classic", "black"] },
  { id: "cappuccino", name: "Cappuccino", slug: "cappuccino", description: "Equal parts espresso, steamed milk, and velvety microfoam. Finished with a dusting of cocoa.", price: 149, image: imgs.coffee, category: "cat-coffee", isVeg: true, rating: 4.8, prepTime: 4, available: true, tags: ["classic", "milky"], badge: "bestseller", customizations: [{ name: "Size", options: [{ name: "Regular", price: 0 }, { name: "Large", price: 30 }] }] },
  { id: "latte", name: "Café Latte", slug: "cafe-latte", description: "Smooth espresso paired with generous steamed milk for a creamy, comforting cup.", price: 149, image: imgs.coffee, category: "cat-coffee", isVeg: true, rating: 4.7, prepTime: 4, available: true, tags: ["classic", "milky"], customizations: [{ name: "Size", options: [{ name: "Regular", price: 0 }, { name: "Large", price: 30 }] }] },
  { id: "flat-white", name: "Flat White", slug: "flat-white", description: "Double espresso with a thin layer of velvety microfoam. Smooth, intense, refined.", price: 159, image: imgs.coffee, category: "cat-coffee", isVeg: true, rating: 4.8, prepTime: 4, available: true, tags: ["strong", "milky"], badge: "chef's pick" },
  { id: "mocha", name: "Café Mocha", slug: "cafe-mocha", description: "Rich espresso blended with dark chocolate and steamed milk, topped with whipped cream.", price: 179, image: imgs.coffee, category: "cat-coffee", isVeg: true, rating: 4.7, prepTime: 5, available: true, tags: ["chocolate", "indulgent"], addOns: [{ name: "Extra chocolate", price: 20 }, { name: "Whipped cream", price: 15 }] },
  { id: "caramel-latte", name: "Caramel Latte", slug: "caramel-latte", description: "Velvety latte with buttery caramel syrup and a drizzle on top. Sweet, smooth, addictive.", price: 179, image: imgs.coffee, category: "cat-coffee", isVeg: true, rating: 4.6, prepTime: 4, available: true, tags: ["sweet", "caramel"], badge: "new" },
  { id: "hazelnut-latte", name: "Hazelnut Latte", slug: "hazelnut-latte", description: "Aromatic hazelnut syrup blended into our signature latte. Nutty, warm, and comforting.", price: 179, image: imgs.coffee, category: "cat-coffee", isVeg: true, rating: 4.5, prepTime: 4, available: true, tags: ["nutty"] },
  { id: "vanilla-latte", name: "Vanilla Latte", slug: "vanilla-latte", description: "Classic latte kissed with Madagascar vanilla. Simple, elegant, unforgettable.", price: 169, image: imgs.coffee, category: "cat-coffee", isVeg: true, rating: 4.6, prepTime: 4, available: true, tags: ["sweet", "vanilla"] },

  // ── COLD COFFEE ──────────────────────────────────────
  { id: "sig-cold", name: "Belgravia Signature Cold Coffee", slug: "belgravia-signature-cold-coffee", description: "Our signature blend, cold-brewed for 18 hours and blended with milk and a touch of vanilla. The drink that built our reputation.", price: 199, image: imgs.cold, category: "cat-cold-coffee", isVeg: true, rating: 4.9, prepTime: 3, available: true, tags: ["signature", "must-try"], badge: "signature" },
  { id: "classic-cold", name: "Classic Cold Coffee", slug: "classic-cold-coffee", description: "Rich coffee blended with chilled milk, ice, and a hint of chocolate. A café classic done right.", price: 149, image: imgs.cold, category: "cat-cold-coffee", isVeg: true, rating: 4.5, prepTime: 3, available: true, tags: ["classic", "cold"] },
  { id: "iced-americano", name: "Iced Americano", slug: "iced-americano", description: "Double espresso poured over ice-cold water. Bold, refreshing, zero guilt.", price: 129, image: imgs.cold, category: "cat-cold-coffee", isVeg: true, rating: 4.4, prepTime: 2, available: true, tags: ["cold", "black"] },
  { id: "iced-latte", name: "Iced Latte", slug: "iced-latte", description: "Smooth espresso over cold milk and ice. Light, creamy, and perfectly chilled.", price: 149, image: imgs.cold, category: "cat-cold-coffee", isVeg: true, rating: 4.6, prepTime: 3, available: true, tags: ["cold", "milky"] },
  { id: "caramel-frappe", name: "Caramel Frappé", slug: "caramel-frappe", description: "Blended iced coffee with caramel syrup, topped with whipped cream and a caramel drizzle.", price: 199, image: imgs.cold, category: "cat-cold-coffee", isVeg: true, rating: 4.7, prepTime: 5, available: true, tags: ["cold", "sweet"], badge: "bestseller" },
  { id: "mocha-frappe", name: "Mocha Frappé", slug: "mocha-frappe", description: "Chocolate and coffee blended with ice, topped with whipped cream. A Belgravia staple.", price: 199, image: imgs.cold, category: "cat-cold-coffee", isVeg: true, rating: 4.6, prepTime: 5, available: true, tags: ["cold", "chocolate"] },
  { id: "choco-frappe", name: "Chocolate Frappé", slug: "chocolate-frappe", description: "Pure chocolate indulgence blended with ice and cream. No coffee, all chocolate.", price: 189, image: imgs.cold, category: "cat-cold-coffee", isVeg: true, rating: 4.5, prepTime: 5, available: true, tags: ["cold", "chocolate"] },

  // ── SHAKES & REFRESHERS ─────────────────────────────
  { id: "oreo-shake", name: "Oreo Shake", slug: "oreo-shake", description: "Crushed Oreo cookies blended into thick vanilla ice cream. Pure indulgence in every sip.", price: 199, image: imgs.shake, category: "cat-shakes", isVeg: true, rating: 4.7, prepTime: 5, available: true, tags: ["indulgent", "popular"], badge: "bestseller" },
  { id: "choc-shake", name: "Chocolate Shake", slug: "chocolate-shake", description: "Rich Belgian chocolate blended with vanilla ice cream and topped with chocolate sauce.", price: 179, image: imgs.shake, category: "cat-shakes", isVeg: true, rating: 4.6, prepTime: 5, available: true, tags: ["chocolate"] },
  { id: "strawberry-shake", name: "Strawberry Shake", slug: "strawberry-shake", description: "Fresh strawberries blended with vanilla ice cream. Sweet, fruity, and refreshing.", price: 179, image: imgs.shake, category: "cat-shakes", isVeg: true, rating: 4.5, prepTime: 5, available: true, tags: ["fruity"] },
  { id: "vanilla-shake", name: "Vanilla Shake", slug: "vanilla-shake", description: "Classic vanilla bean shake with Madagascar vanilla ice cream and whipped cream.", price: 169, image: imgs.shake, category: "cat-shakes", isVeg: true, rating: 4.4, prepTime: 5, available: true, tags: ["classic"] },
  { id: "peach-iced-tea", name: "Peach Iced Tea", slug: "peach-iced-tea", description: "Freshly brewed tea infused with peach and served over ice. Light, fruity, and refreshing.", price: 129, image: imgs.shake, category: "cat-shakes", isVeg: true, rating: 4.5, prepTime: 3, available: true, tags: ["refreshing", "fruity"] },
  { id: "lemon-iced-tea", name: "Lemon Iced Tea", slug: "lemon-iced-tea", description: "Classic iced tea with fresh lemon juice and a touch of honey. The ultimate cooler.", price: 109, image: imgs.shake, category: "cat-shakes", isVeg: true, rating: 4.4, prepTime: 3, available: true, tags: ["refreshing"] },
  { id: "lime-soda", name: "Fresh Lime Soda", slug: "fresh-lime-soda", description: "Freshly squeezed lime with sparkling soda water. Sweet, salty, or both — your call.", price: 89, image: imgs.shake, category: "cat-shakes", isVeg: true, rating: 4.3, prepTime: 2, available: true, tags: ["refreshing", "quick"] },

  // ── PIZZA ───────────────────────────────────────────
  { id: "margherita", name: "Margherita", slug: "margherita", description: "Classic tomato sauce, fresh mozzarella, basil, and a drizzle of extra-virgin olive oil on hand-tossed dough.", price: 199, image: imgs.pizza, category: "cat-pizza", isVeg: true, rating: 4.6, prepTime: 15, available: true, tags: ["classic", "vegetarian"], badge: "bestseller" },
  { id: "farmhouse", name: "Farmhouse", slug: "farmhouse", description: "Bell peppers, mushrooms, onions, corn, and olives on a rich tomato base with mozzarella.", price: 249, image: imgs.pizza, category: "cat-pizza", isVeg: true, rating: 4.5, prepTime: 15, available: true, tags: ["vegetarian"] },
  { id: "paneer-tikka-pizza", name: "Paneer Tikka", slug: "paneer-tikka-pizza", description: "Tandoori paneer tikka, onions, capsicum, and spicy red sauce. Indian flavours on an Italian canvas.", price: 279, image: imgs.pizza, category: "cat-pizza", isVeg: true, rating: 4.7, prepTime: 15, available: true, tags: ["spicy", "fusion"], badge: "chef's pick", customizations: [{ name: "Heat Level", options: [{ name: "Mild", price: 0 }, { name: "Medium", price: 0 }, { name: "Extra Spicy", price: 0 }] }] },
  { id: "cheese-corn", name: "Cheese Corn", slug: "cheese-corn-pizza", description: "Sweet corn kernels loaded with a blend of mozzarella and cheddar cheese.", price: 229, image: imgs.pizza, category: "cat-pizza", isVeg: true, rating: 4.4, prepTime: 15, available: true, tags: ["vegetarian", "cheesy"] },
  { id: "veggie-supreme", name: "Veggie Supreme", slug: "veggie-supreme", description: "Loaded with golden corn, black olives, capsicum, mushrooms, and jalapeños.", price: 269, image: imgs.pizza, category: "cat-pizza", isVeg: true, rating: 4.6, prepTime: 15, available: true, tags: ["loaded", "vegetarian"] },
  { id: "spicy-mexican", name: "Spicy Mexican", slug: "spicy-mexican-pizza", description: "Jalapeños, paprika-paneer, corn, and spicy salsa with a chilli-garlic sauce base.", price: 279, image: imgs.pizza, category: "cat-pizza", isVeg: true, rating: 4.5, prepTime: 15, available: true, tags: ["spicy"], badge: "spicy" },

  // ── BURGERS ─────────────────────────────────────────
  { id: "classic-veg-burger", name: "Classic Veg Burger", slug: "classic-veg-burger", description: "Crispy veg patty with fresh lettuce, tomato, onions, and our signature burger sauce on a toasted bun.", price: 149, image: imgs.burger, category: "cat-burgers", isVeg: true, rating: 4.4, prepTime: 10, available: true, tags: ["classic", "vegetarian"] },
  { id: "paneer-burger", name: "Crispy Paneer Burger", slug: "crispy-paneer-burger", description: "Golden-fried paneer patty with mint chutney, onions, and pickled jalapeños.", price: 179, image: imgs.burger, category: "cat-burgers", isVeg: true, rating: 4.6, prepTime: 10, available: true, tags: ["Indian", "vegetarian"], badge: "bestseller" },
  { id: "cheese-burger", name: "Cheese Burger", slug: "cheese-burger", description: "Juicy veg patty with a generous slice of melted cheddar, ketchup, and mustard.", price: 169, image: imgs.burger, category: "cat-burgers", isVeg: true, rating: 4.5, prepTime: 10, available: true, tags: ["cheesy"] },
  { id: "double-cheese", name: "Double Cheese Burger", slug: "double-cheese-burger", description: "Two patties, two slices of cheese, all the fixings. Go big or go home.", price: 199, image: imgs.burger, category: "cat-burgers", isVeg: true, rating: 4.7, prepTime: 12, available: true, tags: ["cheesy", "loaded"], badge: "new" },
  { id: "spicy-mexican-burger", name: "Spicy Mexican Burger", slug: "spicy-mexican-burger", description: "Spicy bean patty with jalapeño mayo, salsa, and tortilla crunch.", price: 189, image: imgs.burger, category: "cat-burgers", isVeg: true, rating: 4.5, prepTime: 10, available: true, tags: ["spicy"], badge: "spicy" },

  // ── SANDWICHES ──────────────────────────────────────
  { id: "grilled-veg", name: "Grilled Veg Sandwich", slug: "grilled-veg-sandwich", description: "Grilled bell peppers, zucchini, and mushrooms with herbed cream cheese on sourdough.", price: 149, image: imgs.sandwich, category: "cat-sandwiches", isVeg: true, rating: 4.4, prepTime: 10, available: true, tags: ["grilled", "vegetarian"] },
  { id: "paneer-tikka-sandwich", name: "Paneer Tikka Sandwich", slug: "paneer-tikka-sandwich", description: "Tandoori paneer tikka with onions, capsicum, and mint chutney, pressed golden.", price: 169, image: imgs.sandwich, category: "cat-sandwiches", isVeg: true, rating: 4.6, prepTime: 10, available: true, tags: ["Indian", "grilled"], badge: "chef's pick" },
  { id: "cheese-corn-sandwich", name: "Cheese Corn Sandwich", slug: "cheese-corn-sandwich", description: "Sweet corn and melted cheese in a perfectly toasted sandwich. Simple and satisfying.", price: 139, image: imgs.sandwich, category: "cat-sandwiches", isVeg: true, rating: 4.3, prepTime: 8, available: true, tags: ["cheesy", "quick"] },
  { id: "club-sandwich", name: "Club Sandwich", slug: "club-sandwich", description: "Triple-decker with grilled vegetables, egg, cheese, lettuce, and tomato. A towering classic.", price: 179, image: imgs.sandwich, category: "cat-sandwiches", isVeg: false, rating: 4.7, prepTime: 12, available: true, tags: ["hearty", "loaded"], badge: "bestseller" },
  { id: "peri-peri-sandwich", name: "Peri-Peri Sandwich", slug: "peri-peri-sandwich", description: "Spiced peri-peri paneer or chicken with crunchy coleslaw and cheese.", price: 169, image: imgs.sandwich, category: "cat-sandwiches", isVeg: true, rating: 4.5, prepTime: 10, available: true, tags: ["spicy"], badge: "spicy" },

  // ── PASTA ───────────────────────────────────────────
  { id: "alfredo", name: "Alfredo / White Sauce", slug: "alfredo-pasta", description: "Creamy white sauce pasta with garlic, parmesan, and a hint of black pepper.", price: 199, image: imgs.pasta, category: "cat-pasta", isVeg: true, rating: 4.6, prepTime: 12, available: true, tags: ["creamy", "classic"], badge: "bestseller" },
  { id: "arrabbiata", name: "Arrabbiata / Red Sauce", slug: "arrabbiata-pasta", description: "Fiery tomato sauce with garlic, red chilli, and fresh basil over penne.", price: 189, image: imgs.pasta, category: "cat-pasta", isVeg: true, rating: 4.5, prepTime: 12, available: true, tags: ["spicy", "tomato"], badge: "spicy" },
  { id: "pink-sauce", name: "Pink Sauce Pasta", slug: "pink-sauce-pasta", description: "The best of both worlds — creamy tomato sauce with oregano and parmesan.", price: 199, image: imgs.pasta, category: "cat-pasta", isVeg: true, rating: 4.7, prepTime: 12, available: true, tags: ["creamy", "tomato"] },
  { id: "cheese-pasta", name: "Cheese Pasta", slug: "cheese-pasta", description: "Triple-cheese sauce pasta — mozzarella, cheddar, and parmesan. Cheesy heaven.", price: 219, image: imgs.pasta, category: "cat-pasta", isVeg: true, rating: 4.6, prepTime: 12, available: true, tags: ["cheesy", "indulgent"], badge: "new" },

  // ── SIDES ───────────────────────────────────────────
  { id: "classic-fries", name: "Classic Fries", slug: "classic-fries", description: "Crispy golden fries seasoned with sea salt. A timeless companion.", price: 99, image: imgs.sides, category: "cat-sides", isVeg: true, rating: 4.4, prepTime: 5, available: true, tags: ["classic"] },
  { id: "peri-peri-fries", name: "Peri-Peri Fries", slug: "peri-peri-fries", description: "Our classic fries tossed in house-made peri-peri seasoning. Bold, spicy, addictive.", price: 119, image: imgs.sides, category: "cat-sides", isVeg: true, rating: 4.6, prepTime: 5, available: true, tags: ["spicy"], badge: "bestseller" },
  { id: "loaded-fries", name: "Loaded Cheese Fries", slug: "loaded-cheese-fries", description: "Crispy fries drowned in melted cheese sauce with jalapeños, sour cream, and spring onions.", price: 179, image: imgs.sides, category: "cat-sides", isVeg: true, rating: 4.7, prepTime: 8, available: true, tags: ["indulgent", "loaded"], badge: "chef's pick" },
  { id: "garlic-bread", name: "Garlic Bread", slug: "garlic-bread", description: "Toasted ciabatta with garlic butter and Italian herbs. Warm, fragrant, irresistible.", price: 109, image: imgs.sides, category: "cat-sides", isVeg: true, rating: 4.5, prepTime: 5, available: true, tags: ["classic"] },
  { id: "cheese-garlic", name: "Cheese Garlic Bread", slug: "cheese-garlic-bread", description: "Garlic bread loaded with melted mozzarella and a sprinkle of oregano.", price: 149, image: imgs.sides, category: "cat-sides", isVeg: true, rating: 4.6, prepTime: 6, available: true, tags: ["cheesy"] },
  { id: "nachos", name: "Nachos", slug: "nachos", description: "Crispy tortilla chips topped with cheese, salsa, jalapeños, and sour cream.", price: 179, image: imgs.sides, category: "cat-sides", isVeg: true, rating: 4.5, prepTime: 8, available: true, tags: ["shareable"], badge: "new" },

  // ── DESSERTS ────────────────────────────────────────
  { id: "brownie", name: "Chocolate Brownie", slug: "chocolate-brownie", description: "Dense, fudgy dark chocolate brownie baked in-house. Rich and deeply satisfying.", price: 129, image: imgs.dessert, category: "cat-desserts", isVeg: true, rating: 4.7, prepTime: 3, available: true, tags: ["chocolate"], badge: "bestseller" },
  { id: "brownie-icecream", name: "Brownie with Ice Cream", slug: "brownie-with-ice-cream", description: "Our signature brownie topped with a scoop of vanilla ice cream and chocolate sauce.", price: 179, image: imgs.dessert, category: "cat-desserts", isVeg: true, rating: 4.8, prepTime: 3, available: true, tags: ["indulgent", "popular"], badge: "chef's pick" },
  { id: "choco-cake", name: "Belgian Chocolate Cake", slug: "belgian-chocolate-cake", description: "Three layers of moist chocolate sponge with Belgian dark chocolate ganache.", price: 199, image: imgs.dessert, category: "cat-desserts", isVeg: true, rating: 4.7, prepTime: 3, available: true, tags: ["chocolate", "celebration"] },
  { id: "cheesecake", name: "Cheesecake", slug: "cheesecake", description: "Creamy New York-style cheesecake on a biscuit base with berry compote.", price: 179, image: imgs.dessert, category: "cat-desserts", isVeg: true, rating: 4.6, prepTime: 3, available: true, tags: ["classic"] },
  { id: "classic-waffle", name: "Classic Waffle", slug: "classic-waffle", description: "Crispy golden waffle served with maple syrup and butter. Simple perfection.", price: 149, image: imgs.dessert, category: "cat-desserts", isVeg: true, rating: 4.5, prepTime: 8, available: true, tags: ["classic"] },
  { id: "choco-waffle", name: "Chocolate Waffle", slug: "chocolate-waffle", description: "Chocolate-infused waffle drizzled with Nutella and topped with fresh cream.", price: 179, image: imgs.dessert, category: "cat-desserts", isVeg: true, rating: 4.7, prepTime: 8, available: true, tags: ["chocolate", "indulgent"], badge: "new" },
  { id: "ice-cream", name: "Ice Cream", slug: "ice-cream", description: "Two scoops of artisan gelato. Ask your server for today's rotating flavours.", price: 99, image: imgs.dessert, category: "cat-desserts", isVeg: true, rating: 4.4, prepTime: 2, available: true, tags: ["classic"] },
];

// ── Helpers ──────────────────────────────────────────
export const getProductBySlug = (slug: string) => products.find((p) => p.slug === slug);
export const getCategoryBySlug = (slug: string) => categories.find((c) => c.slug === slug);
export const getProductsByCategory = (categoryId: string) => products.filter((p) => p.category === categoryId);
export const getBestSellers = () => products.filter((p) => p.badge === "bestseller" || p.tags.includes("bestseller"));
export const getSignature = () => products.filter((p) => p.badge === "signature");
export const getPopular = () => products.filter((p) => p.rating >= 4.7);
export const searchProducts = (query: string) => {
  const q = query.toLowerCase();
  return products.filter(
    (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some((t) => t.includes(q)),
  );
};
