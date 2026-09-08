import { Link } from "react-router";
import { Coffee, Instagram, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { useState } from "react";

const footerLinks = {
  explore: [
    { to: "/menu", label: "Full Menu" },
    { to: "/menu?cat=coffee", label: "Signature Coffee" },
    { to: "/menu?cat=cold-coffee", label: "Cold Coffee" },
    { to: "/offers", label: "Current Offers" },
    { to: "/table-ordering", label: "Table Ordering" },
  ],
  company: [
    { to: "/about", label: "Our Story" },
    { to: "/contact", label: "Contact Us" },
    { to: "/about", label: "Careers" },
    { to: "/about", label: "Sustainability" },
  ],
  support: [
    { to: "/contact", label: "Help Centre" },
    { to: "/contact", label: "Feedback" },
    { to: "/about", label: "Privacy Policy" },
    { to: "/about", label: "Terms of Service" },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-cafe-gradient text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-white/10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dusty-rose">
                <Coffee className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-[9px] text-white/50 tracking-[0.2em] uppercase">The</div>
                <span className="text-xl font-bold">BELGRAVIA</span>
                <span className="text-xl font-light text-dusty-rose ml-1">Roast</span>
              </div>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm mb-6">
              A premium specialty café where every roast tells a story. Handcrafted coffee,
              artisanal food, and a space designed for those who appreciate the finer things.
            </p>
            <div>
              <h4 className="text-sm font-semibold mb-3">Stay in the Loop</h4>
              <form onSubmit={(e) => { e.preventDefault(); setEmail(""); }} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-sm placeholder:text-white/40 focus:outline-none focus:border-dusty-rose/50 transition-colors"
                />
                <button type="submit" className="flex h-10 w-10 items-center justify-center rounded-xl bg-dusty-rose hover:bg-burgundy transition-colors shrink-0">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold mb-4 capitalize">{title === "explore" ? "Explore" : title === "company" ? "Company" : "Support"}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-white/50 hover:text-dusty-rose transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-white/40">
            <span>© 2026 The Belgravia Roast. All rights reserved.</span>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              <span>42 Belgravia Lane, New Delhi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3" />
              <span>+91 98765 43210</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {[Instagram, Mail].map((Icon, i) => (
              <a key={i} href="#" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 hover:bg-dusty-rose/20 text-white/50 hover:text-dusty-rose transition-all">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
