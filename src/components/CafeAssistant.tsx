import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, ShoppingBag } from "lucide-react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { addToCart } from "@/lib/cart";
import { products } from "@/data/menu";
import { toast } from "sonner";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface AssistantResult {
  reply: string;
  suggestions: string[];
  action: { type: string; items: { productId: string; name: string; price: number; quantity: number }[] } | null;
  error: string | null;
}

/** Parse bold markdown (**text**) into <strong> spans. */
function renderRich(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function CafeAssistant() {
  const ask = useAction(api.ai.chat.askAssistant);
  const logEvent = useMutation(api.chat.logChatEvent);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content: "Hi! I'm **Roasty**, your café concierge. Ask me anything — recommendations, offers, opening hours, or I can add items to your cart.",
    },
  ]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(["What do you recommend?", "Today's offers", "Help me order"]);
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<AssistantResult["action"]>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, pendingAction]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setSuggestions([]);
    const history = messages.slice(-10);
    setMessages((m) => [...m, { role: "user", content: message }]);
    setBusy(true);
    setPendingAction(null);
    try {
      const res = (await ask({
        message,
        history,
        page: location.pathname,
      })) as AssistantResult;
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
      setSuggestions(res.suggestions ?? []);
      setPendingAction(res.action);
      void logEvent({ kind: "question", payload: String(message.length) }).catch(() => {});
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I'm having trouble reaching my full brain right now — try again in a moment." },
      ]);
      void logEvent({ kind: "error" }).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  const confirmAddToCart = () => {
    if (!pendingAction) return;
    let added = 0;
    let unavailable = 0;
    pendingAction.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product && product.available) {
        addToCart(product, Math.max(1, Math.min(20, item.quantity)));
        added += item.quantity;
      } else {
        unavailable += 1;
      }
    });
    if (added > 0) {
      toast.success(`${added} item${added === 1 ? "" : "s"} added to your cart`);
      void logEvent({ kind: "cart_action", payload: "add" }).catch(() => {});
    }
    if (unavailable > 0) {
      toast.warning(`${unavailable} item${unavailable === 1 ? " is" : "s are"} unavailable right now`);
    }
    setPendingAction(null);
  };

  return (
    <>
      {/* Floating launcher — hidden on the table-ordering flow and admin panel */}
      {!location.pathname.startsWith("/dashboard") && !location.pathname.startsWith("/kitchen") && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: "spring", damping: 18 }}
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close chat assistant" : "Open chat assistant"}
          className={`fixed z-40 bottom-20 lg:bottom-6 right-4 flex items-center justify-center rounded-full shadow-xl transition-all ${
            open ? "bg-navy text-white rotate-0" : "bg-gold text-white hover:scale-105"
          }`}
          style={{ height: 52, width: 52 }}
        >
          {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
          {!open && <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-sage animate-pulse" />}
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed z-40 bottom-36 lg:bottom-24 right-4 left-4 sm:left-auto sm:w-[380px] max-h-[70vh] flex flex-col rounded-2xl border border-border bg-white shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-cafe-gradient px-4 py-3 flex items-center gap-3 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white text-lg">☕</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white">Roasty</div>
                <div className="text-[10px] text-white/60">The Belgravia Roast assistant</div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-white/60 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-muted/30 min-h-0">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-gold text-white rounded-br-md"
                        : "bg-white border border-border text-muted-foreground rounded-bl-md"
                    }`}
                  >
                    {renderRich(m.content)}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="bg-white border border-border rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-gold" />
                  </div>
                </div>
              )}
              {pendingAction && !busy && (
                <div className="bg-sage/10 border border-sage/30 rounded-2xl p-3">
                  <div className="flex items-start gap-2 mb-2.5">
                    <ShoppingBag className="h-4 w-4 text-sage shrink-0 mt-0.5" />
                    <div className="text-xs text-foreground/80 flex-1">
                      {pendingAction.items.map((it) => `${it.quantity} × ${it.name}`).join(", ")}
                      {(() => {
                        const total = pendingAction.items.reduce((s, it) => s + it.price * it.quantity, 0);
                        return total > 0 ? ` — ₹${total}` : "";
                      })()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={confirmAddToCart}
                      className="flex-1 bg-sage hover:bg-sage/90 text-white py-2 rounded-xl text-xs font-semibold transition-all"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => setPendingAction(null)}
                      className="border border-border text-foreground/70 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-muted transition-all"
                    >
                      Change Order
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && !busy && (
              <div className="flex gap-1.5 overflow-x-auto px-3 py-2 bg-background border-t border-border scrollbar-hide shrink-0">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    className="shrink-0 bg-muted hover:bg-gold/10 hover:text-gold border border-border rounded-full px-3 py-1.5 text-[11px] font-medium text-foreground/70 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="flex items-center gap-2 border-t border-border p-2.5 bg-background shrink-0"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Roasty anything…"
                disabled={busy}
                className="flex-1 rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 placeholder:text-muted-foreground/60 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send message"
                className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-gold text-white transition-all hover:bg-gold/90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
