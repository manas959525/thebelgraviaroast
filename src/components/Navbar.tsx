import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, User, Menu, X, Home, Coffee, Tag, Info, Phone, ChevronRight, ClipboardList, CalendarDays } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo.svg";

const navLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/menu", label: "Menu", icon: Coffee },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/reservations", label: "Reserve", icon: CalendarDays },
  { to: "/offers", label: "Offers", icon: Tag },
  { to: "/about", label: "About", icon: Info },
  { to: "/contact", label: "Contact", icon: Phone },
];

const bottomNavLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/menu", label: "Menu", icon: Coffee },
  { to: "/orders", label: "Orders", icon: Tag },
  { to: "/cart", label: "Cart", icon: ShoppingBag },
  { to: "/dashboard", label: "Account", icon: User },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { count } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setMobileOpen(false);
      setSearchOpen(false);
    }, 0);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  const isLanding = location.pathname === "/";
  // Over the dark cinematic hero the transparent bar needs light text;
  // everywhere else (or once scrolled) the glass bar is light with dark text.
  const onDark = isLanding && !scrolled;

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || !isLanding
            ? "glass-liquid shadow-lg shadow-black/5 border-x-0 border-t-0"
            : "bg-transparent"
        } ${onDark ? "text-white" : ""}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between lg:h-20">
            {/* Logo — The Belgravia Roast */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src={logo}
                alt="The Belgravia Roast"
                className="h-10 w-10 rounded-full transition-transform group-hover:scale-105"
              />
              <div className="hidden sm:block leading-tight">
                <div className={`text-[10px] font-medium tracking-[0.2em] uppercase -mb-0.5 ${onDark ? "text-white/50" : "text-muted-foreground"}`}>The</div>
                <span className={`text-base font-bold tracking-tight ${onDark ? "text-white" : "text-foreground"}`}>BELGRAVIA</span>
                <span className={`text-base font-light ml-1 ${onDark ? "text-champagne" : "text-dusty-rose"}`}>Roast</span>
              </div>
            </Link>

            {/* Desktop Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      active
                        ? onDark ? "text-white" : "text-dusty-rose"
                        : onDark
                          ? "text-white/70 hover:text-white hover:bg-white/10"
                          : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
                    }`}
                  >
                    {link.label}
                    {active && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-dusty-rose rounded-full"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
                aria-label="Search"
              >
                <Search className={`h-4.5 w-4.5 ${onDark ? "text-white/80" : "text-foreground/70"}`} />
              </button>

              <Link
                to={isAuthenticated ? "/dashboard" : "/auth"}
                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
              >
                <User className={`h-4.5 w-4.5 ${onDark ? "text-white/80" : "text-foreground/70"}`} />
              </Link>

              <Link
                to="/cart"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
              >
                <ShoppingBag className={`h-4.5 w-4.5 ${onDark ? "text-white/80" : "text-foreground/70"}`} />
                {count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-dusty-rose text-[10px] font-bold text-white px-1"
                  >
                    {count}
                  </motion.span>
                )}
              </Link>

              <Link
                to="/menu"
                className="hidden md:inline-flex items-center gap-1.5 bg-dusty-rose hover:bg-burgundy text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-dusty-rose/20"
              >
                Order Now
              </Link>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
                aria-label="Menu"
              >
                {mobileOpen ? (
                  <X className={`h-5 w-5 ${onDark ? "text-white" : "text-foreground"}`} />
                ) : (
                  <Menu className={`h-5 w-5 ${onDark ? "text-white" : "text-foreground"}`} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border"
            >
              <form onSubmit={handleSearch} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='What are you craving today?'
                    className="w-full rounded-xl border border-border bg-white/50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 transition-all"
                    autoFocus
                  />
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Mobile Slide Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <div className="text-[9px] text-muted-foreground tracking-[0.2em] uppercase">The</div>
                  <span className="text-base font-bold">BELGRAVIA</span>
                  <span className="text-base font-light text-dusty-rose ml-1">Roast</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active ? "bg-dusty-rose/10 text-dusty-rose" : "text-foreground/70 hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      {link.label}
                      <ChevronRight className="ml-auto h-4 w-4 opacity-30" />
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t">
                <Link
                  to="/menu"
                  className="flex items-center justify-center w-full bg-dusty-rose text-white py-2.5 rounded-xl text-sm font-semibold"
                >
                  Order Now
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-liquid border-x-0 border-b-0 rounded-t-2xl safe-bottom">
        <nav className="flex items-center justify-around h-16 px-2">
          {bottomNavLinks.map((link) => {
            const Icon = link.icon;
            const active = location.pathname === link.to;
            const isCart = link.label === "Cart";
            return (
              <Link
                key={link.to}
                to={link.to}
                className="relative flex flex-col items-center gap-0.5 px-3 py-1"
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 transition-colors ${active ? "text-dusty-rose" : "text-foreground/50"}`} />
                  {isCart && count > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-dusty-rose text-[9px] font-bold text-white px-1">
                      {count}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${active ? "text-dusty-rose" : "text-foreground/50"}`}>
                  {link.label}
                </span>
                {active && (
                  <motion.div layoutId="bottom-nav" className="absolute -top-0.5 w-6 h-0.5 rounded-full bg-dusty-rose" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
