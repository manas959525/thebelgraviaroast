import { useState } from "react";
import {
  LayoutDashboard, Coffee, ShoppingBag, Tag, BarChart3,
  Settings, TrendingUp, DollarSign, Package,
  CheckCircle, XCircle, Eye, Edit, Trash2, Plus,
  QrCode, Calendar, Search, Download,
  Grid3X3, List, LogOut, Menu, X, Star,
  Bell, CheckCheck, Copy, Printer,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useNavigate } from "react-router";
import { categories, products } from "@/data/menu";
import { daypartGreeting } from "@/lib/cafe";
import {
  resolveServiceRequest, timeAgo, useOrders, useServiceRequests,
  updateOrderStatus, ORDER_STATUS_ORDER,
} from "@/lib/orders";
import { toast } from "sonner";

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

type BoardStatus = "pending" | "preparing" | "ready";

interface BoardOrder {
  id: string;
  time: string;
  items: string;
  total: number;
  status: BoardStatus;
  table: number | string;
}

const boardColumns: { key: BoardStatus; label: string; dot: string }[] = [
  { key: "pending", label: "NEW", dot: "bg-yellow-400" },
  { key: "preparing", label: "PREPARING", dot: "bg-orange-400" },
  { key: "ready", label: "READY", dot: "bg-green-400" },
];

function DashboardView() {
  const realOrders = useOrders();
  const serviceRequests = useServiceRequests();

  const stats = [
    { label: "Today's Revenue", value: "₹24,580", change: "+12%", icon: DollarSign, color: "text-sage" },
    { label: "Orders Today", value: "89", change: "+8%", icon: ShoppingBag, color: "text-gold" },
    { label: "Avg. Order Value", value: "₹276", change: "+5%", icon: TrendingUp, color: "text-blue-500" },
    { label: "Active Tables", value: "7/15", change: "", icon: Calendar, color: "text-purple-500" },
  ];

  const liveOrders: BoardOrder[] = realOrders.length
    ? realOrders
        .filter((o) => o.status !== "delivered" && o.status !== "cancelled")
        .map((o) => ({
          id: o.id,
          time: timeAgo(o.placedAt),
          items: o.items.map((it) => `${it.name} × ${it.qty}`).join(", "),
          total: o.total,
          status: (o.status === "pending" || o.status === "confirmed" ? "pending" : o.status) as BoardStatus,
          table: o.tableNumber ?? "—",
        }))
    : mockOrders.filter((o) => o.status === "pending" || o.status === "confirmed" || o.status === "preparing" || o.status === "ready").map((o) => ({
        id: o.id,
        time: o.time,
        items: o.items,
        total: o.total,
        status: (o.status === "confirmed" ? "pending" : o.status) as BoardStatus,
        table: o.table,
      }));

  const advance = (id: string, status: BoardStatus) => {
    if (!realOrders.length) return;
    const nextIndex = ORDER_STATUS_ORDER.indexOf(status) + 1;
    const next = ORDER_STATUS_ORDER[Math.min(nextIndex, ORDER_STATUS_ORDER.length - 1)];
    updateOrderStatus(id, next);
    toast.success(`Order ${id} moved to ${next}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{daypartGreeting()}, Admin 👋</h2>
        <p className="text-sm text-muted-foreground">Today's overview at a glance</p>
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

      {/* Live Orders Board */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold text-foreground">Live Orders</h3>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-sage bg-sage/10 px-2 py-0.5 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sage" />
            </span>
            LIVE
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {boardColumns.map((col) => {
            const colOrders = liveOrders.filter((o) => o.status === col.key);
            return (
              <div key={col.key} className="bg-white rounded-2xl border border-border/50 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{col.label}</span>
                  <span className="ml-auto text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{colOrders.length}</span>
                </div>
                <div className="space-y-3">
                  {colOrders.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground py-6 border border-dashed border-border rounded-xl">
                      No orders here
                    </div>
                  ) : (
                    colOrders.map((order) => (
                      <div key={order.id} className="rounded-xl border border-border/60 p-3 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-xs">{order.id}</span>
                          <span className="text-[10px] text-muted-foreground">T#{order.table} · {order.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{order.items}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">₹{order.total}</span>
                          {col.key !== "ready" && realOrders.length > 0 && (
                            <button
                              onClick={() => advance(order.id, order.status)}
                              className="flex items-center gap-1 text-[10px] font-bold text-gold bg-gold/10 px-2 py-1 rounded-lg hover:bg-gold/20 transition-all"
                            >
                              <CheckCheck className="h-3 w-3" /> Advance
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Service Requests */}
      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-dusty-rose" />
            Service Requests
            {serviceRequests.filter((r) => !r.resolved).length > 0 && (
              <span className="text-[10px] font-bold bg-dusty-rose text-white px-2 py-0.5 rounded-full">
                {serviceRequests.filter((r) => !r.resolved).length} new
              </span>
            )}
          </h3>
          <span className="text-xs text-muted-foreground">From table-side ordering</span>
        </div>
        <div className="p-5">
          {serviceRequests.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-6">
              No requests yet — they'll appear the moment a guest taps one on the table-ordering page.
            </div>
          ) : (
            <div className="space-y-3">
              {serviceRequests.slice(0, 8).map((req) => {
                const label = req.resolved
                  ? req.type === "call-staff" ? "Staff called (done)" : `${req.type} (done)`
                  : req.type === "call-staff" ? "Staff called" : req.type;
                return (
                  <div key={req.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${req.resolved ? "border-border/40 opacity-60" : "border-dusty-rose/30 bg-dusty-rose/5"}`}>
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${req.resolved ? "bg-sage/10 text-sage" : "bg-dusty-rose/10 text-dusty-rose"}`}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium capitalize text-foreground">Table #{req.table} — {label}</div>
                      <div className="text-xs text-muted-foreground">{timeAgo(req.createdAt)}</div>
                    </div>
                    {!req.resolved && (
                      <button
                        onClick={() => { resolveServiceRequest(req.id); toast.success("Request marked complete"); }}
                        className="flex items-center gap-1 text-[10px] font-bold text-sage bg-sage/10 px-2.5 py-1.5 rounded-lg hover:bg-sage/20 transition-all shrink-0"
                      >
                        <CheckCheck className="h-3 w-3" /> Done
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
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

type TableStatus = "available" | "occupied" | "reserved" | "bill-requested";

function TablesView() {
  const [tables, setTables] = useState(() =>
    Array.from({ length: 15 }, (_, i) => ({
      number: i + 1,
      capacity: [2, 2, 4, 4, 4, 6, 6, 8, 2, 4, 4, 6, 2, 4, 8][i],
      status: (["available", "occupied", "reserved", "available", "available", "occupied", "available", "available", "bill-requested", "available", "occupied", "available", "available", "available", "available"] as TableStatus[])[i],
      section: i < 5 ? "Indoor" : i < 10 ? "Terrace" : "Private",
    })),
  );
  const [selected, setSelected] = useState<number | null>(null);

  const statusStyle: Record<TableStatus, string> = {
    available: "bg-green-100 border-green-300 text-green-700",
    occupied: "bg-red-100 border-red-300 text-red-700",
    reserved: "bg-yellow-100 border-yellow-300 text-yellow-700",
    "bill-requested": "bg-blue-100 border-blue-300 text-blue-700",
  };
  const statusLabel: Record<TableStatus, string> = {
    available: "Available",
    occupied: "Occupied",
    reserved: "Reserved",
    "bill-requested": "Bill Requested",
  };

  const selectedTable = tables.find((t) => t.number === selected) ?? null;

  const setStatus = (number: number, status: TableStatus) => {
    setTables((prev) => prev.map((t) => (t.number === number ? { ...t, status } : t)));
    toast.success(`Table #${number} marked ${statusLabel[status].toLowerCase()}`);
  };

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

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(Object.keys(statusLabel) as TableStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${statusStyle[s].split(" ")[0].replace("bg-", "bg-")}`} />
            {statusLabel[s]}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {tables.map((t) => (
          <button
            key={t.number}
            onClick={() => setSelected(t.number)}
            className={`rounded-xl border-2 p-4 text-center transition-all ${statusStyle[t.status]} ${selected === t.number ? "ring-2 ring-gold ring-offset-2" : "hover:shadow-md"}`}
          >
            <div className="text-2xl font-bold mb-1">#{t.number}</div>
            <div className="text-xs">{t.capacity} seats</div>
            <div className="text-[10px] font-medium uppercase mt-1">{t.section}</div>
            <div className="text-[10px] font-bold uppercase mt-2">{statusLabel[t.status]}</div>
          </button>
        ))}
      </div>

      {/* Selected table detail */}
      {selectedTable && (
        <div className="bg-white rounded-2xl border border-border/50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Table #{selectedTable.number}</h3>
              <p className="text-xs text-muted-foreground">{selectedTable.capacity} seats · {selectedTable.section} · {statusLabel[selectedTable.status]}</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <button onClick={() => setStatus(selectedTable.number, "available")} className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-all">Mark Available</button>
              <button onClick={() => setStatus(selectedTable.number, "occupied")} className="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-all">Mark Occupied</button>
              <button onClick={() => setStatus(selectedTable.number, "reserved")} className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-200 transition-all">Reserve</button>
              <button onClick={() => setStatus(selectedTable.number, "bill-requested")} className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-all">Bill Requested</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <button onClick={() => toast.success(`Staff notified for Table #${selectedTable.number}`)} className="flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 text-xs font-semibold hover:bg-muted transition-all">
              <Bell className="h-3.5 w-3.5 text-dusty-rose" /> Call Staff
            </button>
            <Link to="/table-ordering" className="flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 text-xs font-semibold hover:bg-muted transition-all">
              <QrCode className="h-3.5 w-3.5 text-gold" /> Table QR & Ordering
            </Link>
            <button onClick={() => toast.success(`Bill requested for Table #${selectedTable.number}`)} className="flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 text-xs font-semibold hover:bg-muted transition-all">
              <DollarSign className="h-3.5 w-3.5 text-sage" /> Request Bill
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const TABLE_COUNT = 12;
const TABLE_QR_URL = (n: number) =>
  `${typeof window !== "undefined" ? window.location.origin : "https://thebelgraviaroast.in"}/table-ordering?table=${n}`;

function downloadQrSvg(table: number) {
  const el = document.getElementById(`table-qr-${table}`);
  if (!el) return;
  const svg = el.outerHTML;
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `belgravia-table-${table}.svg`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Table ${table} QR downloaded`);
}

function QRGeneratorView() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Table QR Codes</h2>
          <p className="text-sm text-muted-foreground mt-1">Each QR opens table ordering with the table pre-filled — print and place them on every table.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { Array.from({ length: TABLE_COUNT }, (_, i) => downloadQrSvg(i + 1)); toast.success(`Downloaded ${TABLE_COUNT} QR codes`); }}
            className="flex items-center gap-2 bg-gold text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gold/90 transition-all"
          >
            <Download className="h-4 w-4" /> Generate All QR Codes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map((n) => {
          const url = TABLE_QR_URL(n);
          return (
            <div key={n} className="bg-white rounded-2xl border border-border/50 p-6 text-center hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">Table #{n}</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-sage bg-sage/10 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-sage" /> Active
                </span>
              </div>
              <div className="w-40 h-40 mx-auto bg-white rounded-xl border border-border/60 flex items-center justify-center mb-3 p-2">
                <QRCodeSVG id={`table-qr-${n}`} value={url} size={140} level="M" />
              </div>
              <p className="text-[10px] text-muted-foreground mb-4 break-all">{url}</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => downloadQrSvg(n)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gold bg-gold/10 px-3 py-1.5 rounded-lg hover:bg-gold/20 transition-all"
                >
                  <Download className="h-3 w-3" /> Download
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(url).catch(() => {}); toast.success(`Table ${n} link copied`); }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-all"
                >
                  <Copy className="h-3 w-3" /> Copy Link
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-all"
                >
                  <Printer className="h-3 w-3" /> Print
                </button>
              </div>
            </div>
          );
        })}
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
