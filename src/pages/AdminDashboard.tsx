import { useState, useMemo } from "react";
import { AssistantView } from "./admin/AssistantView";
import {
  LayoutDashboard, Coffee, ShoppingBag, Tag, BarChart3,
  Settings, TrendingUp, DollarSign, Package,
  CheckCircle, XCircle, Eye, Edit, Trash2, Plus,
  QrCode, Calendar, Search, Download,
  Grid3X3, List, LogOut, Menu, X, Star,
  Bell, CheckCheck, Copy, Printer,
  Power, PowerOff, ChefHat, ExternalLink, Bot, ShieldCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useNavigate } from "react-router";
import { categories, products as staticProducts } from "@/data/menu";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { daypartGreeting } from "@/lib/cafe";
import { timeAgo, ORDER_STATUS_ORDER } from "@/lib/orders";
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
  | "assistant"
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
  { id: "assistant", label: "AI Assistant", icon: Bot },
  { id: "settings", label: "Settings", icon: Settings },
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

type TableStatus = "available" | "occupied" | "reserved" | "bill_requested";

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

/** Kick off one-time seeding of default offers/tables/settings; safe to call repeatedly. */
function useSeededCafe() {
  const seed = useMutation(api.cafe.seedCafeData);
  const offers = useQuery(api.cafe.listOffers);
  const tables = useQuery(api.cafe.listTables);
  const settings = useQuery(api.cafe.listSettings);
  const ready = offers !== undefined && tables !== undefined && settings !== undefined;
  if (ready && offers.length === 0 && tables.length === 0) {
    void seed({});
  }
  return { ready };
}

function DashboardView() {
  useSeededCafe();
  const convexOrders = useQuery(api.cafe.listOrders);
  const convexPayments = useQuery(api.cafe.listPayments);
  const convexRequests = useQuery(api.cafe.listServiceRequests);
  const convexAdvance = useMutation(api.cafe.updateOrderStatus);
  const convexResolve = useMutation(api.cafe.resolveServiceRequest);

  const orders = convexOrders ?? [];
  const payments = convexPayments ?? [];
  const serviceRequests = convexRequests ?? [];

  const verifiedToday = payments.filter((p) => p.status === "verified" && p.verifiedAt && p.verifiedAt > Date.now() - 86400000);
  const revenueToday = verifiedToday.reduce((sum, p) => sum + p.amount, 0);
  const ordersToday = orders.filter((o) => o._creationTime > Date.now() - 86400000).length;
  const avgOrder = orders.length ? Math.round(orders.reduce((sum, o) => sum + o.total, 0) / orders.length) : 0;
  const pendingVerifications = payments.filter((p) => p.status === "pending_verification").length;

  const stats = [
    { label: "Today's Revenue", value: revenueToday > 0 ? `₹${revenueToday.toLocaleString("en-IN")}` : "₹0", change: `${ordersToday} order${ordersToday === 1 ? "" : "s"} today`, icon: DollarSign, color: "text-sage" },
    { label: "Orders Today", value: `${ordersToday}`, change: "live", icon: ShoppingBag, color: "text-gold" },
    { label: "Avg. Order Value", value: `₹${avgOrder}`, change: `${orders.length} total orders`, icon: TrendingUp, color: "text-blue-500" },
    { label: "Pending Verifications", value: `${pendingVerifications}`, change: pendingVerifications > 0 ? "needs review" : "all clear", icon: Calendar, color: "text-purple-500" },
  ];

  const liveOrders: BoardOrder[] = orders
    .filter((o) => o.status !== "delivered" && o.status !== "cancelled")
    .map((o) => ({
      id: o.orderNumber ?? o._id,
      time: timeAgo(o._creationTime),
      items: o.items.map((it) => `${it.name} × ${it.quantity}`).join(", "),
      total: o.total,
      status: (o.status === "pending" || o.status === "confirmed" ? "pending" : o.status) as BoardStatus,
      table: o.tableNumber ?? "—",
    }));

  const advance = async (id: string, status: BoardStatus) => {
    const order = orders.find((o) => (o.orderNumber ?? o._id) === id);
    if (!order) return;
    const nextIndex = ORDER_STATUS_ORDER.indexOf(order.status) + 1;
    const next = ORDER_STATUS_ORDER[Math.min(nextIndex, ORDER_STATUS_ORDER.length - 1)];
    await convexAdvance({ id: order._id, status: next });
    toast.success(`Order ${id} moved to ${next}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{daypartGreeting()}, Admin 👋</h2>
            <p className="text-sm text-muted-foreground">Today's overview at a glance</p>
          </div>
          <Link
            to="/kitchen"
            className="inline-flex items-center gap-2 bg-cafe-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
          >
            <ChefHat className="h-4 w-4 text-amber-300" />
            Kitchen Display
            <ExternalLink className="h-3 w-3 text-white/50" />
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-elevated rounded-2xl border-0 p-5">
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
              <div key={col.key} className="glass-elevated rounded-2xl border-0 p-4">
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
                          {col.key !== "ready" && (
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
      <div className="glass-elevated rounded-2xl border-0 overflow-hidden">
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
                  <div key={req._id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${req.resolved ? "border-border/40 opacity-60" : "border-dusty-rose/30 bg-dusty-rose/5"}`}>
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${req.resolved ? "bg-sage/10 text-sage" : "bg-dusty-rose/10 text-dusty-rose"}`}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium capitalize text-foreground">Table #{req.table} — {label}</div>
                      <div className="text-xs text-muted-foreground">{timeAgo(req.createdAt)}</div>
                    </div>
                    {!req.resolved && (
                      <button
                        onClick={() => { void convexResolve({ id: req._id }); toast.success("Request marked complete"); }}
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
      <div className="glass-elevated rounded-2xl border-0 overflow-hidden">
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
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No orders yet — they'll appear here the moment a customer places one.
                  </td>
                </tr>
              ) : (
                orders.slice(0, 8).map((order) => (
                  <tr key={order._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-mono font-medium text-foreground">{order.orderNumber ?? order._id}</td>
                    <td className="px-5 py-3 text-muted-foreground">{order.tableNumber ? `#${order.tableNumber}` : "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground max-w-[200px] truncate">
                      {order.items.map((it) => `${it.name} × ${it.quantity}`).join(", ")}
                    </td>
                    <td className="px-5 py-3 font-medium">₹{order.total}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{timeAgo(order._creationTime)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProductsView() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const flagsQuery = useQuery(api.cafe.listProductFlags);
  const setAvailability = useMutation(api.cafe.setProductAvailability);

  // DB availability overrides win over the static catalog flag.
  const flagMap = new Map((flagsQuery ?? []).map((f) => [f.productId, f.available]));
  const effective = (id: string) => flagMap.get(id) ?? staticProducts.find((p) => p.id === id)?.available ?? true;

  const filtered = staticProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (categories.find((c) => c.id === p.category)?.name.toLowerCase().includes(search.toLowerCase()) ?? false),
  );

  const toggle = (id: string, name: string, next: boolean) => {
    void setAvailability({ productId: id, available: next, note: next ? undefined : "Marked sold out by staff" });
    toast.success(next ? `${name} is back on the menu` : `${name} marked sold out`);
  };

  const soldOutCount = staticProducts.filter((p) => !effective(p.id)).length;

  const StatusChip = ({ id }: { id: string }) => (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${effective(id) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
      {effective(id) ? "Available" : "Sold Out"}
    </span>
  );

  const ToggleButtons = ({ p }: { p: (typeof staticProducts)[0] }) => (
    <div className="flex gap-1">
      {effective(p.id) ? (
        <button
          onClick={() => toggle(p.id, p.name, false)}
          className="flex items-center gap-1 h-7 px-2 rounded-lg border text-[10px] font-bold text-red-500 hover:bg-red-50 transition-all"
        >
          <PowerOff className="h-3 w-3" /> Mark Sold Out
        </button>
      ) : (
        <button
          onClick={() => toggle(p.id, p.name, true)}
          className="flex items-center gap-1 h-7 px-2 rounded-lg border text-[10px] font-bold text-sage hover:bg-green-50 transition-all"
        >
          <Power className="h-3 w-3" /> Mark Available
        </button>
      )}
      <Link
        to={`/menu/${p.slug}`}
        className="h-7 w-7 rounded-lg border flex items-center justify-center hover:bg-muted"
        aria-label={`View ${p.name}`}
      >
        <Eye className="h-3 w-3" />
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Products & Availability</h2>
          <p className="text-sm text-muted-foreground">
            {staticProducts.length} items in catalogue · {soldOutCount} sold out · changes reach every menu instantly
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-9 pr-4 py-2 rounded-xl border border-border text-sm outline-none focus:border-gold w-56"
            />
          </div>
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-gold text-white" : "bg-white"}`}><Grid3X3 className="h-4 w-4" /></button>
            <button onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-gold text-white" : "bg-white"}`}><List className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="glass-elevated rounded-2xl border-0 overflow-hidden group">
              <div className="relative h-40 overflow-hidden">
                <img src={p.image} alt={p.name} className={`w-full h-full object-cover group-hover:scale-105 transition-transform ${!effective(p.id) ? "grayscale" : ""}`} />
                {!effective(p.id) && (
                  <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Sold Out Today</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm">{p.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold">₹{p.discountPrice ?? p.price}</span>
                  <StatusChip id={p.id} />
                </div>
                <div className="mt-3">
                  <ToggleButtons p={p} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-elevated rounded-2xl border-0 overflow-hidden">
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
              {filtered.map((p) => (
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
                  <td className="px-5 py-3"><StatusChip id={p.id} /></td>
                  <td className="px-5 py-3"><ToggleButtons p={p} /></td>
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
          <div key={cat.id} className="glass-elevated rounded-2xl border-0 p-5 flex items-center justify-between">
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
  const convexOrders = useQuery(api.cafe.listOrders);
  const convexAdvance = useMutation(api.cafe.updateOrderStatus);
  const orders = convexOrders ?? [];
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const advance = (id: string, status: string) => {
    const order = orders.find((o) => o._id === id);
    if (!order) return;
    const nextIndex = ORDER_STATUS_ORDER.indexOf(order.status) + 1;
    const next = ORDER_STATUS_ORDER[Math.min(nextIndex, ORDER_STATUS_ORDER.length - 1)];
    void convexAdvance({ id: order._id, status: next });
    toast.success(`Order moved to ${next}`);
  };

  const cancel = (id: string) => {
    const order = orders.find((o) => o._id === id);
    if (!order) return;
    void convexAdvance({ id: order._id, status: "cancelled" });
    toast.success("Order cancelled");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Orders</h2>
          <p className="text-sm text-muted-foreground">{orders.length} total · changes sync to the customer's tracker in real time</p>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", "pending", "confirmed", "preparing", "ready", "delivered", "cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              filter === f ? "bg-gold text-white" : "glass-chip text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {orders.length === 0 && filter === "all" ? (
          <div className="glass-elevated rounded-xl border-0 p-10 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No orders yet — they'll show up here the moment a customer checks out.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-elevated rounded-xl border-0 p-10 text-center">
            <p className="text-sm text-muted-foreground">No {filter} orders.</p>
          </div>
        ) : (
          filtered.map((order) => (
            <div key={order._id} className="glass-elevated rounded-xl border-0 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono font-bold text-sm">{order.orderNumber ?? order._id}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(order._creationTime)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{order.items.map((it) => `${it.name} × ${it.quantity}`).join(", ")}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {order.orderType} · {order.tableNumber ? `Table #${order.tableNumber}` : "Takeaway"} · Payment: {order.paymentMethod} · {order.paymentStatus}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-sm">₹{order.total}</div>
                {order.discount != null && order.discount > 0 && <div className="text-[10px] text-sage">-₹{order.discount} coupon</div>}
              </div>
              {order.status !== "delivered" && order.status !== "cancelled" && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => advance(order._id, order.status)}
                    className="h-8 px-2.5 rounded-lg border flex items-center gap-1 text-[10px] font-bold text-sage hover:bg-green-50 transition-all"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> {order.status === "ready" ? "Deliver" : "Advance"}
                  </button>
                  <button
                    onClick={() => cancel(order._id)}
                    className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-red-50 text-red-500"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PaymentsView() {
  const convexPayments = useQuery(api.cafe.listPayments);
  const convexVerify = useMutation(api.cafe.verifyPayment);
  const payments = convexPayments ?? [];

  const verifiedTotal = payments.filter((p) => p.status === "verified").reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = payments.filter((p) => p.status === "pending_verification").length;
  const failedCount = payments.filter((p) => p.status === "failed").length;

  const statusBadge: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-700" },
    pending_verification: { label: "Awaiting Verification", cls: "bg-amber-100 text-amber-700" },
    verified: { label: "Verified", cls: "bg-green-100 text-green-700" },
    failed: { label: "Failed", cls: "bg-red-100 text-red-700" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Payments & Receipts</h2>
        <p className="text-sm text-muted-foreground">Verify UPI payments using the customer's UTR and keep the receipts ledger.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Verified Revenue", value: `₹${verifiedTotal.toLocaleString("en-IN")}`, color: "text-sage" },
          { label: "Awaiting Verification", value: `${pendingCount}`, color: "text-amber-600" },
          { label: "Failed Payments", value: `${failedCount}`, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="glass-elevated rounded-2xl border-0 p-5">
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {payments.length === 0 ? (
        <div className="glass-elevated rounded-2xl border-0 p-6 text-center py-16">
          <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Payment records will appear here once orders are placed. Customers are asked for their UTR so you can verify instantly.</p>
        </div>
      ) : (
        <div className="glass-elevated rounded-2xl border-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Receipt</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Order</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Method</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">UTR</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Time</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-3 font-mono font-medium">{p.receiptId}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{p.orderNumber ?? "—"}</td>
                  <td className="px-5 py-3 font-medium">₹{p.amount}</td>
                  <td className="px-5 py-3 capitalize text-muted-foreground">{p.method}</td>
                  <td className="px-5 py-3 font-mono text-xs">{p.utr ?? <span className="text-muted-foreground/50">—</span>}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge[p.status]?.cls ?? "bg-muted"}`}>
                      {statusBadge[p.status]?.label ?? p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{timeAgo(p.paidAt)}</td>
                  <td className="px-5 py-3">
                    {p.status === "pending_verification" ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => { void convexVerify({ id: p._id, verified: true }); toast.success(`${p.receiptId} verified`); }}
                          className="text-[10px] font-bold text-sage bg-sage/10 px-2.5 py-1.5 rounded-lg hover:bg-sage/20 transition-all"
                        >
                          <CheckCheck className="h-3 w-3 inline mr-1" />Verify
                        </button>
                        <button
                          onClick={() => { void convexVerify({ id: p._id, verified: false }); toast.error(`${p.receiptId} marked failed`); }}
                          className="text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-all"
                        >
                          <XCircle className="h-3 w-3 inline mr-1" />Fail
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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

function TablesView() {
  const dbTables = useQuery(api.cafe.listTables);
  const setStatusMutation = useMutation(api.cafe.setTableStatus);
  const saveTableMutation = useMutation(api.cafe.saveTable);
  const deleteTableMutation = useMutation(api.cafe.deleteTable);
  const [selected, setSelected] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTable, setNewTable] = useState({ number: "", capacity: "4", section: "Indoor" });

  const tables = (dbTables ?? []).map((t) => ({
    number: t.number,
    capacity: t.capacity,
    status: t.status as TableStatus,
    section: t.section,
  }));

  const statusStyle: Record<TableStatus, string> = {
    available: "bg-green-100 border-green-300 text-green-700",
    occupied: "bg-red-100 border-red-300 text-red-700",
    reserved: "bg-yellow-100 border-yellow-300 text-yellow-700",
    bill_requested: "bg-blue-100 border-blue-300 text-blue-700",
  };
  const statusLabel: Record<TableStatus, string> = {
    available: "Available",
    occupied: "Occupied",
    reserved: "Reserved",
    bill_requested: "Bill Requested",
  };

  const selectedTable = tables.find((t) => t.number === selected) ?? null;

  // Open bills attached to each table, straight from the orders database.
  const orders = useQuery(api.cafe.listOrders) ?? [];
  const openOrdersFor = (number: number) =>
    orders.filter(
      (o) =>
        o.tableNumber === number &&
        o.status !== "delivered" &&
        o.status !== "cancelled",
    );

  const setStatus = (number: number, status: TableStatus) => {
    void setStatusMutation({ number, status });
    toast.success(`Table #${number} marked ${statusLabel[status].toLowerCase()}`);
  };

  const addTable = () => {
    const number = Number(newTable.number);
    if (!number || number < 1) {
      toast.error("Enter a valid table number");
      return;
    }
    void saveTableMutation({ number, capacity: Number(newTable.capacity) || 4, section: newTable.section });
    toast.success(`Table #${number} added`);
    setAdding(false);
    setNewTable({ number: "", capacity: "4", section: "Indoor" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tables</h2>
          <p className="text-sm text-muted-foreground">
            {tables.filter((t) => t.status === "available").length} available · {tables.filter((t) => t.status !== "available").length} engaged · saved live to the café database
          </p>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-2 bg-gold text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> {adding ? "Cancel" : "Add Table"}
        </button>
      </div>

      {adding && (
        <div className="glass-elevated rounded-2xl border-0 p-5 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium block mb-1">Table Number</label>
            <input type="number" min={1} value={newTable.number} onChange={(e) => setNewTable({ ...newTable, number: e.target.value })} className="w-24 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Seats</label>
            <input type="number" min={1} value={newTable.capacity} onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })} className="w-24 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Section</label>
            <select value={newTable.section} onChange={(e) => setNewTable({ ...newTable, section: e.target.value })} className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold">
              {["Indoor", "Terrace", "Private"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={addTable} className="bg-gold text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gold/90 transition-all">Save Table</button>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(Object.keys(statusLabel) as TableStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--legend)]" style={{ "--legend": statusStyle[s].split(" ")[0] } as React.CSSProperties} />
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
        {dbTables === undefined && (
          <div className="col-span-full flex items-center justify-center py-6">
            <div className="h-5 w-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Selected table detail */}
      {selectedTable && (
        <div className="glass-elevated rounded-2xl border-0 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Table #{selectedTable.number}</h3>
              <p className="text-xs text-muted-foreground">{selectedTable.capacity} seats · {selectedTable.section} · {statusLabel[selectedTable.status]}</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              {(Object.keys(statusLabel) as TableStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(selectedTable.number, s)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${statusStyle[s]} ${selectedTable.status === s ? "ring-1 ring-current" : ""}`}
                >
                  {statusLabel[s]}
                </button>
              ))}
              <button
                onClick={() => { void deleteTableMutation({ number: selectedTable.number }); toast.success(`Table #${selectedTable.number} removed`); setSelected(null); }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-all"
              >
                Remove
              </button>
            </div>
          </div>
          {(() => {
            const open = openOrdersFor(selectedTable.number);
            if (open.length === 0) {
              return <p className="text-sm text-muted-foreground">No open orders at this table.</p>;
            }
            return (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Open orders</p>
                {open.map((o) => (
                  <div key={o._id} className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-xs mr-2">{o.orderNumber ?? o._id}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {o.items.map((it) => `${it.name} × ${it.quantity}`).join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold">₹{o.total}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColors[o.status]}`}>{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mt-4">
            <Link to={`/table-ordering?table=${selectedTable.number}`} className="flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 text-xs font-semibold hover:bg-muted transition-all">
              <QrCode className="h-3.5 w-3.5 text-gold" /> Open as This Table
            </Link>
            <Link to="/dashboard" className="flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 text-xs font-semibold hover:bg-muted transition-all">
              <Bell className="h-3.5 w-3.5 text-dusty-rose" /> Service Requests
            </Link>
            <button onClick={() => setStatus(selectedTable.number, "bill_requested")} className="flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 text-xs font-semibold hover:bg-muted transition-all">
              <DollarSign className="h-3.5 w-3.5 text-sage" /> Request Bill
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
  useSeededCafe();
  const dbTables = useQuery(api.cafe.listTables);
  const tableNumbers = (dbTables ?? []).map((t) => t.number).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Table QR Codes</h2>
          <p className="text-sm text-muted-foreground mt-1">Each QR opens table ordering with the table pre-filled — print and place them on every table. Tables come from the Tables screen.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { tableNumbers.forEach((n) => downloadQrSvg(n)); if (tableNumbers.length) toast.success(`Downloaded ${tableNumbers.length} QR codes`); }}
            className="flex items-center gap-2 bg-gold text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gold/90 transition-all"
          >
            <Download className="h-4 w-4" /> Generate All QR Codes
          </button>
        </div>
      </div>

      {dbTables !== undefined && tableNumbers.length === 0 && (
        <div className="glass-elevated rounded-2xl border-0 p-10 text-center">
          <QrCode className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No tables yet — add tables in the Tables screen and they'll appear here.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tableNumbers.map((n) => {
          const url = TABLE_QR_URL(n);
          return (
            <div key={n} className="glass-elevated rounded-2xl border-0 p-6 text-center hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">Table #{n}</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-sage bg-sage/10 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-sage" /> Active
                </span>
              </div>
              <div className="w-40 h-40 mx-auto bg-white rounded-xl border-0 flex items-center justify-center mb-3 p-2">
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
  useSeededCafe();
  const dbOffers = useQuery(api.cafe.listOffers);
  const saveOffer = useMutation(api.cafe.saveOffer);
  const deleteOffer = useMutation(api.cafe.deleteOffer);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    code: "",
    description: "",
    tag: "Special",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "10",
    minOrder: "0",
    maxDiscount: "",
    days: "180",
  });

  const create = () => {
    const code = form.code.trim().toUpperCase();
    if (!code) {
      toast.error("Give the coupon a code");
      return;
    }
    void saveOffer({
      code,
      description: form.description.trim() || `${form.discountValue}${form.discountType === "percentage" ? "%" : "₹"} off`,
      tag: form.tag,
      discountType: form.discountType,
      discountValue: Number(form.discountValue) || 0,
      minOrder: Number(form.minOrder) || 0,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      validUntil: Date.now() + (Number(form.days) || 30) * 86400000,
      active: true,
    });
    toast.success(`Coupon ${code} is live`);
    setCreating(false);
    setForm({ code: "", description: "", tag: "Special", discountType: "percentage", discountValue: "10", minOrder: "0", maxDiscount: "", days: "180" });
  };

  const fmtDiscount = (o: { discountType: "percentage" | "fixed"; discountValue: number }) =>
    o.discountType === "percentage" ? `${o.discountValue}%` : `₹${o.discountValue}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Offers & Coupons</h2>
          <p className="text-sm text-muted-foreground">These codes are validated live at checkout — edits take effect instantly.</p>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          className="flex items-center gap-2 bg-gold text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> {creating ? "Cancel" : "Create Offer"}
        </button>
      </div>

      {creating && (
        <div className="glass-elevated rounded-2xl border-0 p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="text-xs font-medium block mb-1">Code</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" className="w-full rounded-xl border border-border px-3 py-2 text-sm font-mono uppercase outline-none focus:border-gold" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium block mb-1">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="10% off your first order" className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Type</label>
            <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as "percentage" | "fixed" })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed (₹)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Discount value</label>
            <input type="number" min={1} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Max discount (₹, optional)</label>
            <input type="number" min={0} value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Min order (₹)</label>
            <input type="number" min={0} value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Valid for (days)</label>
            <input type="number" min={1} value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Tag</label>
            <select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold">
              {["New Guests", "Popular", "Afternoon", "Weekend", "Students", "Special"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <button onClick={create} className="bg-gold text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gold/90 transition-all">Publish Coupon</button>
          </div>
        </div>
      )}

      <div className="glass-elevated rounded-2xl border-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Code</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Discount</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Min Order</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Used</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Valid Until</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(dbOffers ?? []).length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">No coupons yet — create your first offer above.</td></tr>
            ) : (
              (dbOffers ?? []).map((o) => (
                <tr key={o.code} className="border-b last:border-0">
                  <td className="px-5 py-3 font-mono font-bold">{o.code}</td>
                  <td className="px-5 py-3">{fmtDiscount(o)}{o.maxDiscount ? <span className="text-[10px] text-muted-foreground"> (max ₹{o.maxDiscount})</span> : null}</td>
                  <td className="px-5 py-3 text-muted-foreground">{o.minOrder > 0 ? `₹${o.minOrder}` : "—"}</td>
                  <td className="px-5 py-3">{o.usedCount}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(o.validUntil).toLocaleDateString("en-IN")}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {o.active ? "Active" : "Paused"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => { void saveOffer({ code: o.code, description: o.description, title: o.title, tag: o.tag, discountType: o.discountType, discountValue: o.discountValue, minOrder: o.minOrder, maxDiscount: o.maxDiscount, validUntil: o.validUntil, active: !o.active }); toast.success(o.active ? `${o.code} paused` : `${o.code} re-activated`); }}
                        className="h-7 px-2 rounded-lg border flex items-center gap-1 text-[10px] font-bold hover:bg-muted"
                      >
                        {o.active ? <><PowerOff className="h-3 w-3" /> Pause</> : <><Power className="h-3 w-3" /> Activate</>}
                      </button>
                      <button
                        onClick={() => { void deleteOffer({ code: o.code }); toast.success(`${o.code} deleted`); }}
                        className="h-7 w-7 rounded-lg border flex items-center justify-center hover:bg-red-50 text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContentView() {
  const dbReviews = useQuery(api.cafe.listAllReviews);
  const approveReview = useMutation(api.cafe.setReviewApproval);
  const deleteReviewMutation = useMutation(api.cafe.deleteReview);

  const pending = (dbReviews ?? []).filter((r) => !r.approved);
  const approved = (dbReviews ?? []).filter((r) => r.approved);

  const ReviewCard = ({ r }: { r: (NonNullable<typeof dbReviews>)[0] }) => (
    <div className={`rounded-xl border p-4 ${r.approved ? "border-border/50" : "border-amber-200 bg-amber-50/40"}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{r.name}</span>
            <span className="flex gap-0.5">
              {Array.from({ length: r.rating }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
              ))}
            </span>
          </div>
          {r.orderNumber && <span className="text-[10px] font-mono text-muted-foreground">{r.orderNumber}</span>}
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(r.createdAt)}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{r.text}</p>
      <div className="flex gap-2">
        {r.approved ? (
          <button
            onClick={() => { void approveReview({ id: r._id, approved: false }); toast.success("Review hidden from the site"); }}
            className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border hover:bg-muted transition-all"
          >
            Unpublish
          </button>
        ) : (
          <button
            onClick={() => { void approveReview({ id: r._id, approved: true }); toast.success("Review published to the landing page"); }}
            className="flex items-center gap-1 text-[10px] font-bold text-sage bg-sage/10 px-2.5 py-1.5 rounded-lg hover:bg-sage/20 transition-all"
          >
            <CheckCheck className="h-3 w-3" /> Approve & Publish
          </button>
        )}
        <button
          onClick={() => { void deleteReviewMutation({ id: r._id }); toast.success("Review deleted"); }}
          className="text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-all"
        >
          Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Customer Reviews</h2>
        <p className="text-sm text-muted-foreground">Guests review their order right after checkout. Approved reviews appear on the landing page.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            Awaiting moderation
            {pending.length > 0 && (
              <span className="text-[10px] font-bold bg-dusty-rose text-white px-2 py-0.5 rounded-full">{pending.length}</span>
            )}
          </h3>
          {dbReviews === undefined ? (
            <div className="flex items-center justify-center py-8"><div className="h-5 w-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /></div>
          ) : pending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border/50 p-10 text-center">
              <Star className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No reviews waiting — you're all caught up.</p>
            </div>
          ) : (
            pending.map((r) => <ReviewCard key={r._id} r={r} />)
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Published ({approved.length})</h3>
          {approved.length === 0 ? (
            <p className="text-sm text-muted-foreground">Approved reviews will be listed here.</p>
          ) : (
            approved.map((r) => <ReviewCard key={r._id} r={r} />)
          )}
        </div>
      </div>
    </div>
  );
}

function AnalyticsView() {
  const convexOrders = useQuery(api.cafe.listOrders);
  const convexPayments = useQuery(api.cafe.listPayments);
  const orders = convexOrders ?? [];
  const payments = convexPayments ?? [];

  const verifiedTotal = payments.filter((p) => p.status === "verified").reduce((sum, p) => sum + p.amount, 0);
  const weekStart = Date.now() - 7 * 86400000;
  const weeklyOrders = orders.filter((o) => o._creationTime > weekStart).length;

  // Aggregate quantities across every placed order for the true top sellers.
  const itemCounts = new Map<string, { name: string; qty: number; revenue: number }>();
  orders.forEach((o) => {
    o.items.forEach((it) => {
      const cur = itemCounts.get(it.name) ?? { name: it.name, qty: 0, revenue: 0 };
      cur.qty += it.quantity;
      cur.revenue += it.price * it.quantity;
      itemCounts.set(it.name, cur);
    });
  });
  const topItems = [...itemCounts.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Verified Revenue (all time)", value: `₹${verifiedTotal.toLocaleString("en-IN")}`, change: `${payments.length} payment records` },
          { label: "Orders (7 days)", value: `${weeklyOrders}`, change: `${orders.length} total orders` },
          { label: "Avg. Order Value", value: `₹${orders.length ? Math.round(orders.reduce((sum, o) => sum + o.total, 0) / orders.length) : 0}`, change: "Across all orders" },
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
        {topItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Order data will appear here as customers place orders.</p>
        ) : (
          <div className="space-y-3">
            {topItems.map((item, i) => {
              const product = staticProducts.find((p) => p.name === item.name);
              return (
                <div key={item.name} className="flex items-center gap-4">
                  <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}.</span>
                  {product && <img src={product.image} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.qty} sold · ₹{item.revenue}</div>
                  </div>
                  <span className="font-bold text-sm">× {item.qty}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsView() {
  useSeededCafe();
  const settings = useQuery(api.cafe.listSettings);
  const saveSettings = useMutation(api.cafe.saveSettings);
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const value = (key: string) => form?.[key] ?? settings?.[key] ?? "";
  const set = (key: string, v: string) => setForm({ ...(form ?? settings ?? {}), [key]: v });
  const fields: { key: string; label: string; hint?: string; wide?: boolean }[] = [
    { key: "cafeName", label: "Café Name" },
    { key: "tagline", label: "Tagline" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "address", label: "Address", wide: true },
    { key: "upiId", label: "UPI ID", hint: "Used for the payment QR and UPI deep links" },
    { key: "taxRate", label: "Tax Rate (%)", hint: "Applied at checkout" },
    { key: "openTime", label: "Opens At" },
    { key: "closeTime", label: "Closes At" },
    { key: "avgPrepMinutes", label: "Avg. Prep Time (min)", hint: "Shown on the homepage status strip" },
  ];
  const save = () => {
    if (!form) return;
    void saveSettings({ values: Object.entries(form).map(([key, v]) => ({ key, value: v })) });
    toast.success("Settings saved — live across the whole site");
    setForm(null);
  };
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Settings</h2>
      <div className="bg-white rounded-2xl border border-border/50 p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-foreground mb-1">Café Information</h3>
          <p className="text-xs text-muted-foreground mb-4">
            These details power the footer, contact pages, payment screen and UPI QR — saved to the café database, applied site-wide.
          </p>
          {settings === undefined ? (
            <div className="flex items-center justify-center py-8"><div className="h-5 w-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.key} className={f.wide ? "sm:col-span-2" : ""}>
                  <label className="text-sm font-medium">{f.label}</label>
                  {f.hint && <span className="text-[10px] text-muted-foreground block">{f.hint}</span>}
                  <input
                    value={value(f.key)}
                    onChange={(e) => set(f.key, e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          {form && <span className="text-xs text-amber-600">Unsaved changes</span>}
          <button
            onClick={save}
            disabled={!form}
            className="ml-auto bg-gold text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gold/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
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

  // Server-side role gate: the backend enforces admin access on every mutation;
  // this gives a friendly screen instead of silently failing panels.
  const role = useQuery(api.cafe.myRole);

  if (role !== undefined && role !== "admin") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-white rounded-2xl border border-border p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-gold">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-bold text-foreground mb-2">Admin access required</h1>
          <p className="text-sm text-muted-foreground mb-6">
            You're signed in as {user?.isAnonymous ? "a guest" : "a customer account"}. The admin panel is only available to the café's admin account.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={async () => {
                await signOut();
                navigate("/auth?returnTo=%2Fdashboard");
              }}
              className="bg-gold hover:bg-gold/90 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              Switch account
            </button>
            <Link
              to="/"
              className="border border-border text-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted transition-all"
            >
              Back to café
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
      case "assistant": return <AssistantView />;
      case "settings": return <SettingsView />;
      case "menu": return <ProductsView />;
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
