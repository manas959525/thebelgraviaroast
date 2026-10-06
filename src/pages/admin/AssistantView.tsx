import { useState, useEffect, useRef } from "react";
import {
  Bot, Send, Sparkles, MousePointerClick, MessageSquare, AlertTriangle, Trash2,
} from "lucide-react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { timeAgo } from "@/lib/orders";
import { toast } from "sonner";

/** Admin panel: test the guest-facing AI concierge live + monitor chat events. */
export function AssistantView() {
  const eventsQuery = useQuery(api.chat.listChatEvents);
  const clearEvents = useMutation(api.chat.clearChatEvents);
  const ask = useAction(api.ai.chat.askAssistant);

  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content:
        "Hey! I'm Roasty — the same AI concierge your guests talk to on the site. Ask me something to test it live.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  const events = eventsQuery ?? [];
  // Snapshot of "now" for the whole mount: stable across re-renders (keeps the
  // 24h window consistent) and keeps render pure.
  const [now] = useState(() => Date.now());
  const last24h = events.filter((e) => now - e.createdAt < 86400000);
  const cartActions = events.filter((e) => e.kind === "chat_action_add_to_cart").length;
  const errors = events.filter((e) => e.kind === "chat_error").length;

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    setBusy(true);
    try {
      const res = await ask({
        message,
        history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        page: "/admin-assistant",
      });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (e) {
      console.error("Assistant test failed:", e);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Something went wrong reaching the assistant service. Check the OPENAI_API_KEY is configured and try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const stats = [
    { label: "Chat Events (24h)", value: `${last24h.length}`, icon: MessageSquare, color: "text-gold" },
    { label: "Cart Actions", value: `${cartActions}`, icon: MousePointerClick, color: "text-sage" },
    { label: "Errors", value: `${errors}`, icon: AlertTriangle, color: errors > 0 ? "text-red-500" : "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">AI Assistant</h2>
        <p className="text-sm text-muted-foreground">
          Test Roasty exactly as guests experience it, and monitor chatbot usage. The assistant answers from the live
          menu, offers and café info — no menu knowledge to maintain separately.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-elevated rounded-2xl border-0 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-muted ${s.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Live test console */}
        <div className="lg:col-span-3 glass-elevated rounded-2xl border-0 overflow-hidden flex flex-col h-[560px]">
          <div className="flex items-center justify-between p-5 border-b">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-gold">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-foreground text-sm">Roasty — Live Test Console</div>
                <div className="text-[11px] text-muted-foreground">Guest experience, exactly as shipped</div>
              </div>
            </div>
            <button
              onClick={() =>
                setMessages([{ role: "assistant", content: "Cleared. What would you like to test next?" }])
              }
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    m.role === "user" ? "bg-gold text-white rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "120ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "240ms" }} />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {["What do you recommend?", "Today's offers", "Something under ₹200", "Where are you located?"].map((q) => (
                <button
                  key={q}
                  onClick={() => void send(q)}
                  disabled={busy}
                  className="text-[11px] font-medium text-muted-foreground glass-chip px-2.5 py-1 rounded-full hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a test message…"
                disabled={busy}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="h-10 w-10 shrink-0 rounded-xl bg-gold text-white flex items-center justify-center hover:bg-gold/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send"
              >
                {busy ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>

        {/* Event log */}
        <div className="lg:col-span-2 glass-elevated rounded-2xl border-0 overflow-hidden flex flex-col h-[560px]">
          <div className="flex items-center justify-between p-5 border-b">
            <div className="font-semibold text-foreground text-sm">Chat Event Log</div>
            <button
              onClick={() => {
                void clearEvents({});
                toast.success("Chat events cleared");
              }}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Clear log
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {eventsQuery === undefined ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-5 w-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-12 px-4">
                No chat events yet. Every guest conversation on the site logs here automatically.
              </p>
            ) : (
              events.slice(0, 50).map((e) => (
                <div key={e._id} className="rounded-xl border border-border/50 px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-foreground/80">{e.kind}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(e.createdAt)}</span>
                  </div>
                  {e.payload && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{e.payload}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
