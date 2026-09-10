import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, ShoppingCart, Plus, Loader2 } from "lucide-react";
import { products, type Product } from "@/data/menu";
import { addToCart } from "@/lib/cart";
import { useProductsWithFlags } from "@/lib/use-live-catalog";
import { toast } from "sonner";

/**
 * Experimental voice ordering.
 * Uses the browser's Web Speech API (Chrome/Edge/Safari). Nothing is added to
 * the cart until the customer confirms the parsed items — never automatically.
 */

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

interface ParsedLine {
  product: Product;
  quantity: number;
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

function findProduct(words: string[]): Product | null {
  const q = normalize(words.join(" "));
  if (!q) return null;
  // Longest match first so "cafe latte" beats "latte".
  const matches = products
    .filter((p) => {
      const name = normalize(p.name);
      const slugs = normalize(p.slug.replace(/-/g, " "));
      return q.includes(name) || name.includes(q) || q.includes(slugs) || slugs.includes(q);
    })
    .sort((a, b) => normalize(b.name).length - normalize(a.name).length);
  return matches[0] ?? null;
}

function parseUtterance(text: string): ParsedLine[] {
  const words = normalize(text).split(" ").filter(Boolean);
  const lines: ParsedLine[] = [];
  let i = 0;
  while (i < words.length) {
    const qty = NUMBER_WORDS[words[i]] ?? 1;
    if (NUMBER_WORDS[words[i]]) i++;
    const chunk: string[] = [];
    while (i < words.length && !NUMBER_WORDS[words[i]]) {
      chunk.push(words[i]);
      i++;
    }
    if (chunk.length) {
      const product = findProduct(chunk);
      if (product) {
        lines.push({ product, quantity: Math.max(1, Math.min(5, qty)) });
      }
    }
  }
  return lines;
}

export default function VoiceOrder({ variant = "button" }: { variant?: "button" | "fab" }) {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsed, setParsed] = useState<ParsedLine[]>([]);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const { allProducts } = useProductsWithFlags();

  const supported =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  const startListening = () => {
    if (!supported) {
      setUnsupported(true);
      setOpen(true);
      return;
    }
    setTranscript("");
    setParsed([]);
    setListening(true);
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript ?? "";
      setTranscript(text);
      setParsed(parseUtterance(text));
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const confirmAdd = () => {
    if (parsed.length === 0) return;
    parsed.forEach(({ product, quantity }) => {
      const live = allProducts.find((p) => p.id === product.id) ?? product;
      addToCart(live, quantity);
    });
    toast.success(`${parsed.reduce((n, l) => n + l.quantity, 0)} items added to cart`);
    setOpen(false);
    setParsed([]);
    setTranscript("");
  };

  const totalItems = parsed.reduce((n, l) => n + l.quantity, 0);

  return (
    <>
      <button
        onClick={() => (open ? setOpen(false) : startListening())}
        aria-label="Voice order"
        title="Order by voice (experimental)"
        className={
          variant === "fab"
            ? "fixed bottom-24 right-4 z-40 h-12 w-12 rounded-full bg-gold text-white shadow-lg shadow-gold/30 flex items-center justify-center hover:bg-gold/90 transition-all"
            : "shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-navy text-white border border-navy/20 hover:bg-navy/90 transition-all"
        }
      >
        {listening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
        {variant === "button" && (listening ? "Listening…" : "Voice Order")}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-foreground text-lg">🎙️ Voice Order</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Try: “one large cappuccino and two brownies”
                    </p>
                  </div>
                  <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {unsupported || !supported ? (
                  <div className="bg-muted rounded-2xl p-5 text-sm text-muted-foreground leading-relaxed">
                    Voice ordering needs a browser with the Web Speech API (Chrome, Edge or Safari on
                    your phone). You can still order the usual way — browse, customise, and check out.
                  </div>
                ) : (
                  <>
                    {/* Mic circle */}
                    <div className="flex justify-center py-6">
                      <button
                        onClick={listening ? stopListening : startListening}
                        className={`relative h-20 w-20 rounded-full flex items-center justify-center transition-all ${
                          listening ? "bg-dusty-rose text-white" : "bg-gold text-white hover:bg-gold/90"
                        }`}
                      >
                        {listening && (
                          <motion.span
                            className="absolute inset-0 rounded-full border-2 border-dusty-rose"
                            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                          />
                        )}
                        {listening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                      </button>
                    </div>

                    {transcript && (
                      <div className="bg-champagne rounded-2xl p-4 mb-4">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">You said</div>
                        <p className="text-sm text-foreground italic">“{transcript}”</p>
                      </div>
                    )}

                    {parsed.length > 0 ? (
                      <div className="space-y-2 mb-5">
                        {parsed.map((line, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white border border-border rounded-xl p-3">
                            <img src={line.product.image} alt={line.product.name} className="h-10 w-10 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-foreground truncate">{line.product.name}</div>
                              <div className="text-xs text-muted-foreground">
                                ₹{line.product.discountPrice ?? line.product.price} × {line.quantity}
                              </div>
                            </div>
                            <span className="text-xs bg-muted px-2 py-1 rounded-full font-medium">×{line.quantity}</span>
                          </div>
                        ))}
                      </div>
                    ) : listening ? (
                      <div className="text-center text-xs text-muted-foreground py-3">Listening… speak now</div>
                    ) : transcript ? (
                      <div className="text-center text-xs text-muted-foreground py-3">
                        Couldn't match any menu items — try naming items exactly, e.g. “cappuccino and brownie”.
                      </div>
                    ) : null}

                    <button
                      onClick={confirmAdd}
                      disabled={parsed.length === 0}
                      className="w-full bg-gold disabled:bg-muted disabled:text-muted-foreground text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gold/90 transition-all"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {totalItems > 0 ? `Add ${totalItems} item${totalItems > 1 ? "s" : ""} to cart — then review & pay` : "Add to cart"}
                    </button>
                    <p className="text-[10px] text-muted-foreground text-center mt-3">
                      Nothing is ordered until you confirm at checkout. <Plus className="inline h-3 w-3" /> Check your cart after adding.
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}