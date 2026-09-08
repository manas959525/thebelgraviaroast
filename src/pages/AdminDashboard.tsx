import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Coffee, ShoppingBag, Tag, Users, BarChart3,
  Settings, ChevronRight, Clock, TrendingUp, DollarSign, Package,
  CheckCircle, XCircle, AlertCircle, Eye, Edit, Trash2, Plus,
  QrCode, Calendar, ArrowUpRight, Search, Filter, Download,
  Grid3X3, List, LogOut, Menu, X, Star,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { categories, products } from "@/data/menu";

type AdminSection =
  | "dashboard"
  | "menu"
  | "products"
  | "categories"
  | "tables"
  | "orders"
  | "payments"
  | "offers"
  | "analytics"
  | "content"
  | "settings"
  | "qr-generator";

const sidebarItems: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "menu", label: "Menu Management", icon: Coffee },
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: Grid3X3 },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "payments", label: "Payments", icon: DollarSign },
  { id: "tables", label: "Tables", icon: Calendar },
  { id: "qr-generator", label: "QR Generator", icon: QrCode },
  { id: "offers", label: "Offers & Coupons", icon: Tag },
  { id: "content", label: "Customer Content", icon: Star },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

const mockOrders = [
  { id: "TBR-A1B2C", time: "2 min ago", items: "2× Cappuccino, 1× Croissant", total: 347, status: "preparing" as const, table: 7 },
  { id: "TBR-D3E4F", time: "5 min ago", items: "1× Margherita, 2× Cold Brew", total: 647, status: "ready" as const, table: 12 },
  { id: "TBR-G5H6I", time: "8 min ago", items: "1× Avocado Toast, 1× Matcha Latte", total: 468, status: "confirmed" as const, table: 3 },
  { id: "TBR-J7K8L", time: "12 min ago", items: "3× Masala Chai, 2× Samosa", total: 435, status: "delivered" as const, table: 5 },
  { id: "TBR-M9N0P", time: "15 min ago", items: "1× Classic Burger, 1× Fries, 1× Frappé", total: 797, status: "pending" as const, table: 9 },
];

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  ready: "bg-green-100 text-green-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

function DashboardView() {
  const stats = [
    { label: "Today's Revenue", value: "₹24,580", change: "+12%", icon: DollarSign, color: "text-sage" },
    { label: "Orders Today", value: "89", change: "+8%", icon: ShoppingBag, color: "text-gold" },
    { label: "Avg. Order Value", value: "₹276", change: "+5%", icon: TrendingUp, color: "text-blue-500" },
    { label: "Active Tables", value: "7/15", change: "", icon: Calendar, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Overview of today's operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-2xl border border-border/50 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-muted ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                {stat.change && (
                  <span className="text-xs font-medium text-sage bg-sage/10 px-2 py-0.5 rounded-full">
                    {stat.change}
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold text-foreground">Recent Orders</h3>
          <button className="text-xs text-gold font-medium hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Order ID</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Table</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Items</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-mono font-medium text-foreground">{order.id}</td>
                  <td className="px-5 py-3 text-muted-foreground">#{order.table}</td>
                  <td className="px-5 py-3 text-muted-foreground max-w-[200px] truncate">{order.items}</td>
                  <td className="px-5 py-3 font-medium">₹{order.total}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{order.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProductsView() {
  const [view, setView] = useState<"grid" | "list">("grid");
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Products</h2>
          <p className="text-sm text-muted-foreground">{products.length} items in catalogue</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Search products..." className="pl-9 pr-4 py-2 rounded-xl border border-border text-sm outline-none focus:border-gold w-56" />
          </div>
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-gold text-white" : "bg-white"}`}><Grid3X3 className="h-4 w-4" /></button>
            <button onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-gold text-white" : "bg-white"}`}><List className="h-4 w-4" /></button>
          </div>
          <button className="flex items-center gap-2 bg-gold text-white px-4 py-2 rounded-xl text-sm font-semibold">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.slice(0, 12).map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-border/50 overflow-hidden group">
              <div className="relative h-40 overflow-hidden">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button className="h-7 w-7 rounded-lg bg-white/90 flex items-center justify-center hover:bg-white"><Edit className="h-3 w-3" /></button>
                  <button className="h-7 w-7 rounded-lg bg-white/90 flex items-center justify-center hover:bg-red-50 text-red-500"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm">{p.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold">₹{p.discountPrice ?? p.price}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {p.available ? "Active" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Category</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Price</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 12).map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-3 flex items-center gap-3">
                    <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.isVeg ? "🟢 Veg" : "🔴 Non-Veg"}</div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{categories.find((c) => c.id === p.category)?.name}</td>
                  <td className="px-5 py-3 font-medium">₹{p.discountPrice ?? p.price}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {p.available ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <button className="h-7 w-7 rounded-lg border flex items-center justify-center hover:bg-muted"><Eye className="h-3 w-3" /></button>
                      <button className="h-7 w-7 rounded-lg border flex items-center justify-center hover:bg-muted"><Edit className="h-3 w-3" /></button>
                      <button className="h-7 w-7 rounded-lg border flex items-center justify-center hover:bg-red-50 text-red-500"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CategoriesView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Categories</h2>
          <p className="text-sm text-muted-foreground">{categories.length} categories</p>
        </div>
        <button className="flex items-center gap-2 bg-gold text-white px-4 py-2 rounded-xl text-sm font-semibold">
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl border border-border/50 p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl">{cat.emoji}</div>
              <div>
                <h3 className="font-semibold text-foreground">{cat.name}</h3>
                <p className="text-xs text-muted-foreground">{cat.productCount} products · {cat.slug}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-muted"><Edit className="h-3.5 w-3.5" /></button>
              <button className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-red-50 text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersView() {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? mockOrders : mockOrders.filter((o) => o.status === filter);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Orders</h2>
          <p className="text-sm text-muted-foreground">Manage all incoming orders</p>
        </div>
        <button className="flex items-center gap-2 border border-border px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", "pending", "confirmed", "preparing", "ready", "delivered"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              filter === f ? "bg-gold text-white" : "bg-white border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((order) => (
          <div key={order.id} className="bg-white rounded-xl border border-border/50 p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono font-bold text-sm">{order.id}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColors[order.status]}`}>
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{order.items}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="font-bold text-sm">₹{order.total}</div>
              <div className="text-xs text-muted-foreground">Table #{order.table}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-green-50 text-green-600">
                <CheckCircle className="h-3.5 w-3.5" />
              </button>
              <button className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-red-50 text-red-500">
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Payments</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Today's Revenue", value: "₹24,580", color: "text-sage" },
          { label: "Pending Payments", value: "₹3,240", color: "text-yellow-600" },
          { label: "Failed Payments", value: "₹0", color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-border/50 p-5">
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-border/50 p-6 text-center py-16">
        <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Payment history will appear here once orders are placed.</p>
      </div>
    </div>
  );
}

function TablesView() {
  const tables = Array.from({ length: 15 }, (_, i) => ({
    number: i + 1,
    capacity: [2, 2, 4, 4, 4, 6, 6, 8, 2, 4, 4, 6, 2, 4, 8][i],
    status: (["available", "occupied", "reserved", "available", "available", "occupied", "available", "available", "reserved", "available", "occupied", "available", "available", "available", "available"] as const)[i],
    section: i < 5 ? "Indoor" : i < 10 ? "Terrace" : "Private",
  }));
  const statusStyle = { available: "bg-green-100 border-green-300 text-green-700", occupied: "bg-red-100 border-red-300 text-red-700", reserved: "bg-yellow-100 border-yellow-300 text-yellow-700" };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tables</h2>
          <p className="text-sm text-muted-foreground">{tables.filter((t) => t.status === "available").length} available · {tables.filter((t) => t.status === "occupied").length} occupied</p>
        </div>
        <button className="flex items-center gap-2 bg-gold text-white px-4 py-2 rounded-xl text-sm font-semibold">
          <Plus className="h-4 w-4" /> Add Table
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {tables.map((t) => (
          <div key={t.number} className={`rounded-xl border-2 p-4 text-center cursor-pointer hover:shadow-md transition-all ${statusStyle[t.status]}`}>
            <div className="text-2xl font-bold mb-1">#{t.number}</div>
            <div className="text-xs">{t.capacity} seats</div>
            <div className="text-[10px] font-medium uppercase mt-1">{t.section}</div>
            <div className="text-[10px] font-bold uppercase mt-2">{t.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QRGeneratorView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">QR Code Generator</h2>
      <p className="text-sm text-muted-foreground">Generate unique QR codes for each table that link directly to the table ordering page.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border/50 p-6 text-center">
            <div className="w-40 h-40 mx-auto bg-muted rounded-xl flex items-center justify-center mb-3">
              <QrCode className="h-20 w-20 text-muted-foreground/30" />
            </div>
            <h4 className="font-semibold">Table #{i + 1}</h4>
            <p className="text-xs text-muted-foreground mb-3">belgraviaroast.in/table/{i + 1}</p>
            <button className="text-xs text-gold font-medium hover:underline">Download QR</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function OffersView() {
  const offers = [
    { code: "BELGRAVIA10", desc: "10% Off First Order", active: true, used: 234 },
    { code: "COMBO49", desc: "Combos at ₹499", active: true, used: 189 },
    { code: "HAPPY3PM", desc: "Happy Hours 20% Off", active: true, used: 456 },
    { code: "STUDENT15", desc: "15% Student Discount", active: true, used: 78 },
    { code: "OLD2024", desc: "Expired Festival Offer", active: false, used: 1023 },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Offers & Coupons</h2>
        <button className="flex items-center gap-2 bg-gold text-white px-4 py-2 rounded-xl text-sm font-semibold">
          <Plus className="h-4 w-4" /> Create Offer
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Code</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Description</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Used</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.code} className="border-b last:border-0">
                <td className="px-5 py-3 font-mono font-bold">{o.code}</td>
                <td className="px-5 py-3 text-muted-foreground">{o.desc}</td>
                <td className="px-5 py-3">{o.used}</td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {o.active ? "Active" : "Expired"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1">
                    <button className="h-7 w-7 rounded-lg border flex items-center justify-center hover:bg-muted"><Edit className="h-3 w-3" /></button>
                    <button className="h-7 w-7 rounded-lg border flex items-center justify-center hover:bg-red-50 text-red-500"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContentView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Customer Content</h2>
      <p className="text-sm text-muted-foreground">Review and moderate customer-uploaded photos and reviews.</p>
      <div className="bg-white rounded-2xl border border-border/50 p-16 text-center">
        <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No customer submissions yet. They'll appear here once guests start sharing.</p>
      </div>
    </div>
  );
}

function AnalyticsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Weekly Revenue", value: "₹1,42,300", change: "+18% vs last week" },
          { label: "Weekly Orders", value: "547", change: "+12% vs last week" },
          { label: "Avg. Rating", value: "4.8 ★", change: "Based on 312 reviews" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-border/50 p-5">
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-sage mt-1">{s.change}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-border/50 p-6">
        <h3 className="font-semibold mb-4">Top Selling Items</h3>
        <div className="space-y-3">                    {products.filter((p) => p.badge === "bestseller" || p.bestSeller).slice(0, 5).map((p, i) => (
            <div key={p.id} className="flex items-center gap-4">
              <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}.</span>
              <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
              <div className="flex-1">
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{categories.find((c) => c.id === p.category)?.name}</div>
              </div>
              <span className="font-bold text-sm">₹{p.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Settings</h2>
      <div className="bg-white rounded-2xl border border-border/50 p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-foreground mb-1">Café Information</h3>
          <p className="text-xs text-muted-foreground mb-4">Basic details about your café</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Café Name</label>
              <input defaultValue="The Belgravia Roast" className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input defaultValue="+91 98765 43210" className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input defaultValue="hello@thebelgraviaroast.in" className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <input defaultValue="42 Belgravia Lane, New Delhi 110001" className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold" />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button className="bg-gold text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gold/90 transition-all">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const renderSection = () => {
    switch (section) {
      case "dashboard": return <DashboardView />;
      case "products": return <ProductsView />;
      case "categories": return <CategoriesView />;
      case "orders": return <OrdersView />;
      case "payments": return <PaymentsView />;
      case "tables": return <TablesView />;
      case "qr-generator": return <QRGeneratorView />;
      case "offers": return <OffersView />;
      case "content": return <ContentView />;
      case "analytics": return <AnalyticsView />;
      case "settings": return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-bold text-sm">Admin Panel</span>
        </div>
        <button onClick={async () => { await signOut(); navigate("/"); }} className="text-xs text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-0 left-0 bottom-0 z-20 w-64 bg-white border-r border-border flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-5 border-b">
            <div className="font-bold text-foreground">The Belgravia <span className="text-gold">Roast</span></div>
            <div className="text-xs text-muted-foreground mt-0.5">Admin Panel</div>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setSection(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    section === item.id ? "bg-gold/10 text-gold" : "text-foreground/60 hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="p-3 border-t">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-gold/10 flex items-center justify-center text-gold text-sm font-bold">
                {user?.name?.[0] || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user?.name || "Admin"}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
              </div>
              <button onClick={async () => { await signOut(); navigate("/"); }} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen lg:pt-0 pt-14">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
