import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { MotionConfig } from "framer-motion";
import "./index.css";
import CafeAssistant from "./components/CafeAssistant";

// Lazy load all route components. Each importer is kept as a named function so
// it can also be used to warm the chunk during browser idle time (below), which
// prevents the full-screen Suspense fallback from flashing on navigation.
const loadLanding = () => import("./pages/Landing.tsx");
const loadAuthPage = () => import("./pages/Auth.tsx");
const loadNotFound = () => import("./pages/NotFound.tsx");
const loadMenuPage = () => import("./pages/Menu.tsx");
const loadProductDetail = () => import("./pages/ProductDetail.tsx");
const loadCartPage = () => import("./pages/Cart.tsx");
const loadCheckoutPage = () => import("./pages/Checkout.tsx");
const loadPaymentPage = () => import("./pages/Payment.tsx");
const loadOrderConfirmation = () => import("./pages/OrderConfirmation.tsx");
const loadTrackOrder = () => import("./pages/TrackOrder.tsx");
const loadCustomerOrders = () => import("./pages/CustomerOrders.tsx");
const loadAbout = () => import("./pages/About.tsx");
const loadOffers = () => import("./pages/Offers.tsx");
const loadContact = () => import("./pages/Contact.tsx");
const loadReservationsPage = () => import("./pages/Reservations.tsx");
const loadTableOrdering = () => import("./pages/TableOrdering.tsx");
const loadBuildYourDrink = () => import("./pages/BuildYourDrink.tsx");
const loadAdminDashboard = () => import("./pages/AdminDashboard.tsx");
const loadKitchen = () => import("./pages/Kitchen.tsx");

const Landing = lazy(loadLanding);
const AuthPage = lazy(loadAuthPage);
const NotFound = lazy(loadNotFound);
const MenuPage = lazy(loadMenuPage);
const ProductDetail = lazy(loadProductDetail);
const CartPage = lazy(loadCartPage);
const CheckoutPage = lazy(loadCheckoutPage);
const PaymentPage = lazy(loadPaymentPage);
const OrderConfirmation = lazy(loadOrderConfirmation);
const TrackOrder = lazy(loadTrackOrder);
const CustomerOrders = lazy(loadCustomerOrders);
const About = lazy(loadAbout);
const Offers = lazy(loadOffers);
const Contact = lazy(loadContact);
const ReservationsPage = lazy(loadReservationsPage);
const TableOrdering = lazy(loadTableOrdering);
const BuildYourDrink = lazy(loadBuildYourDrink);
const AdminDashboard = lazy(loadAdminDashboard);
const Kitchen = lazy(loadKitchen);

const routeLoaders = [
  loadLanding,
  loadMenuPage,
  loadCartPage,
  loadAuthPage,
  loadProductDetail,
  loadOffers,
  loadAbout,
  loadContact,
  loadTrackOrder,
  loadCheckoutPage,
  loadCustomerOrders,
  loadReservationsPage,
  loadPaymentPage,
  loadOrderConfirmation,
  loadTableOrdering,
  loadBuildYourDrink,
  loadNotFound,
  loadAdminDashboard,
  loadKitchen,
];

// Warm route chunks once the browser is idle so client-side navigation doesn't
// stall on a network fetch (and flash the full-screen loading fallback).
// Staggered to avoid a bandwidth spike; skipped entirely on data-saver connections.
function prefetchRouteChunks() {
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  if (connection?.saveData) return;
  const warm = () => {
    routeLoaders.forEach((load, i) => window.setTimeout(load, i * 120));
  };
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(warm, { timeout: 4000 });
  } else {
    // Global setTimeout: `window` is narrowed to `never` in this branch since
    // requestIdleCallback is a known Window member in the TS DOM lib.
    setTimeout(warm, 2500);
  }
}

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="h-5 w-5 border-2 border-caramel/30 border-t-caramel rounded-full animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  );
}

class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Fail soft if the Convex URL is missing: render a friendly screen instead of
// crashing inside the client constructor before any error boundary mounts.
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string | undefined;
const convex = CONVEX_URL
  ? new ConvexReactClient(CONVEX_URL)
  : null;

if (!convex) {
  // Surface a readable error page when the backend URL isn't configured.
  createRoot(document.getElementById("root")!).render(
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">☕</div>
        <p className="text-lg font-semibold">The café is opening shortly.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          The backend connection isn't configured yet. Please add the VITE_CONVEX_URL key and reload this page.
        </p>
      </div>
    </div>,
  );
} else {

// PWA: register the service worker (network-first — safe with the dev preview).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// Warm lazily-loaded route chunks once the first paint has settled.
window.addEventListener("load", () => prefetchRouteChunks(), { once: true });

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <RouteSyncer />
          <Suspense fallback={<RouteLoading />}>
            <CafeAssistant />
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthPage redirectAfterAuth="/dashboard" />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/menu/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/orders" element={<CustomerOrders />} />
              <Route path="/about" element={<About />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/reservations" element={<ReservationsPage />} />
              <Route path="/table-ordering" element={<TableOrdering />} />
              <Route path="/build-your-drink" element={<BuildYourDrink />} />

              {/* Admin (protected) */}
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <AdminDashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/kitchen"
                element={
                  <RequireAuth>
                    <Kitchen />
                  </RequireAuth>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </MotionConfig>
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
  );
}
