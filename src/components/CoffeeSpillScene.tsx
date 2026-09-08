import { motion, useReducedMotion } from "framer-motion";

/* ── Steam wisp (shared with hero intro) ─────────────────── */
export function SteamWisp({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ opacity: 0, y: 0, scale: 0.8 }}
      animate={{ opacity: [0, 0.5, 0], y: [0, -25, -55], scale: [0.8, 1.2, 0.5], x: [0, 6, -3] }}
      transition={{ duration: 2.5, delay, repeat: Infinity, ease: "easeOut" as const }}
    >
      <svg width="16" height="36" viewBox="0 0 16 36" fill="none">
        <path d="M8 36C8 36 1 26 1 16C1 8 15 8 15 16C15 26 8 36 8 36Z" fill="url(#sg)" opacity="0.5" />
        <defs>
          <linearGradient id="sg" x1="8" y1="36" x2="8" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="1" stopColor="white" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

/* ── Floating coffee bean (shared with hero background) ──── */
export function FloatingBean({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute pointer-events-none select-none ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, y: [0, -10, 0], rotate: [0, 5, -3, 0] }}
      transition={{ duration: 7, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="14" cy="14" rx="10" ry="13" fill="#8B7D6B" opacity="0.6" transform="rotate(-20 14 14)" />
        <path d="M14 2C14 2 11 10 11 14C11 18 14 26 14 26" stroke="#1B2A3D" strokeWidth="1.2" opacity="0.4" fill="none" />
      </svg>
    </motion.div>
  );
}

/* ── Cinematic coffee-spill scene (hero only) ────────────── */
/*
  Choreography:
   0.0s  warm glow fades in, saucer rises into place
   0.6s  the cup slides up onto the saucer
   1.3s  the cup tilts and holds (continuous gentle wobble afterwards)
   1.75s espresso pours — a stream falls from the tilted rim
   2.05s the liquid meets the table: pool springs out, ripples expand
   2.1s  droplets burst upward around the impact
   2.8s  a dark wave of coffee sweeps across the scene
   3.05s the wave reveals the Belgravia lockup
   ∞     steam rises, beans drift, pool shimmers, a drip falls now and then
*/
export function CoffeeSpillScene() {
  const reduce = useReducedMotion();
  const d = (v: number) => (reduce ? 0 : v);

  const droplets = [
    { left: "17%", dx: -30, dy: -62, s: 7, delay: 2.14 },
    { left: "24%", dx: 24, dy: -52, s: 5, delay: 2.22 },
    { left: "21%", dx: -12, dy: -74, s: 6, delay: 2.32 },
    { left: "29%", dx: 40, dy: -34, s: 4, delay: 2.4 },
    { left: "14%", dx: -18, dy: -40, s: 4, delay: 2.48 },
  ];

  return (
    <div
      className="relative mx-auto w-full max-w-[440px] select-none"
      style={{ aspectRatio: "360 / 400" }}
      aria-hidden="true"
    >
      {/* Warm glow behind the cup */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: reduce ? 0.9 : 1 }}
        transition={{ duration: 1.2, delay: d(0.3) }}
        className="absolute top-[24%] left-1/2 h-[72%] w-[92%] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(196,164,120,0.24) 0%, rgba(184,128,138,0.12) 55%, transparent 78%)",
        }}
      />

      {/* Wave of coffee sweeping across the table */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1.15, delay: d(2.8), ease: "easeInOut" }}
        className="absolute bottom-[0.5%] left-0 h-[13%] w-full origin-left"
        style={{
          background:
            "linear-gradient(90deg, rgba(74,51,34,0.72) 0%, rgba(122,85,56,0.52) 45%, rgba(196,164,120,0.16) 100%)",
        }}
      />
      {/* Gold light riding the wave */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.75 }}
        transition={{ duration: 1.25, delay: d(3.0), ease: "easeOut" }}
        className="absolute bottom-[5.5%] left-[8%] h-[2px] w-[78%] origin-left rounded-full"
        style={{ background: "linear-gradient(90deg, rgba(222,190,140,0.95) 0%, rgba(196,164,120,0.15) 85%, transparent)" }}
      />

      {/* Splash pool where the stream lands */}
      <div className="absolute bottom-[3%] left-[12%] h-[10%] w-[44%] -translate-x-[6%]">
        <motion.div
          initial={{ scale: 0.12, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 120, damping: 13, delay: d(2.05) }
          }
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at 35% 30%, #8A5A36 0%, #6F4E37 40%, #3E2A1A 78%, #2A1A0E 100%)",
            boxShadow: "0 10px 30px rgba(42,26,14,0.55)",
          }}
        />
        {/* Expanding ripples */}
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.25, opacity: 0.65 }}
            animate={{ scale: 2.15, opacity: 0 }}
            transition={{ duration: 1.5, delay: d(2.2 + i * 0.22), ease: "easeOut" }}
            className="absolute inset-0 rounded-full border border-[#C4A478]/60"
          />
        ))}
        {/* Surface shimmer */}
        <motion.div
          animate={
            reduce
              ? { opacity: 0.35 }
              : { opacity: [0.2, 0.55, 0.2] }
          }
          transition={
            reduce
              ? {}
              : { duration: 4.5, delay: d(3.4), repeat: Infinity, ease: "easeInOut" }
          }
          className="absolute top-[16%] left-[12%] h-[32%] w-[52%] rounded-full bg-white/15 blur-[2px]"
        />
      </div>

      {/* Porcelain saucer */}
      <div className="absolute bottom-[4%] left-1/2 w-[64%] -translate-x-1/2">
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.94 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 90, damping: 15, delay: d(0.35) }
          }
          className="relative"
          style={{ aspectRatio: "5.6 / 1" }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at center, #F7F0E4 0%, #E9DCC6 55%, #D8C5A6 100%)",
              boxShadow: "0 8px 22px rgba(0,0,0,0.4)",
            }}
          />
          <div className="absolute left-1/2 top-1/2 h-[36%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#C4A478]/50" />
          <div className="absolute left-1/2 top-1/2 h-[10%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C4A478]/35 blur-[1px]" />
        </motion.div>
        {/* Contact shadow cast by the cup */}
        <div className="absolute left-1/2 top-[14%] h-[26%] w-[46%] -translate-x-1/2 rounded-full bg-black/30 blur-md" />
      </div>

      {/* Cup + pour (entrance, then tilt) */}
      <div className="absolute top-[15%] left-1/2 w-[62%] -translate-x-1/2">
        <motion.div
          initial={{ y: 64, opacity: 0, scale: 0.9, rotate: 0 }}
          animate={{ y: 0, opacity: 1, scale: 1, rotate: -24 }}
          transition={{
            y: reduce ? { duration: 0 } : { type: "spring", stiffness: 110, damping: 15, delay: d(0.6) },
            opacity: { duration: reduce ? 0 : 0.55, delay: d(0.6) },
            scale: { duration: reduce ? 0 : 0.55, delay: d(0.6) },
            rotate: { duration: reduce ? 0 : 0.9, delay: d(1.3), ease: "easeInOut" },
          }}
          style={{ transformOrigin: "50% 100%" }}
        >
          {/* gentle ambient wobble while tilted */}
          <motion.div
            initial={{ rotate: -24 }}
            animate={reduce ? { rotate: -24 } : { rotate: [-24, -22.7, -24, -24] }}
            transition={
              reduce
                ? {}
                : { duration: 6.5, times: [0, 0.3, 0.65, 1], delay: d(3.4), repeat: Infinity, repeatDelay: 2.6, ease: "easeInOut" }
            }
            style={{ transformOrigin: "50% 100%" }}
            className="relative"
          >
            {/* The cup */}
            <svg viewBox="0 0 240 190" className="block w-full">
              <defs>
                <linearGradient id="cupBodyG" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#FDFAF4" />
                  <stop offset="0.55" stopColor="#F3E9D9" />
                  <stop offset="1" stopColor="#E2D0B4" />
                </linearGradient>
                <linearGradient id="bandG" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#5A3E28" />
                  <stop offset="0.5" stopColor="#7A5538" />
                  <stop offset="1" stopColor="#4A3322" />
                </linearGradient>
                <linearGradient id="streamG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#8A5A36" />
                  <stop offset="0.6" stopColor="#6F4E37" />
                  <stop offset="1" stopColor="#4A3322" />
                </linearGradient>
              </defs>
              {/* handle */}
              <path d="M196 46 C232 46 240 98 198 106" stroke="#E8D9C2" strokeWidth="13" fill="none" strokeLinecap="round" />
              <path d="M196 52 C226 52 232 96 198 102" stroke="#D9C6A8" strokeWidth="5" fill="none" strokeLinecap="round" />
              {/* body */}
              <path
                d="M52 30 C52 22 188 22 188 30 L182 150 C181 164 174 170 158 170 L82 170 C66 170 59 164 58 150 Z"
                fill="url(#cupBodyG)"
              />
              {/* sheen */}
              <path d="M70 40 C66 78 66 118 72 158" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" opacity="0.22" fill="none" />
              {/* espresso band */}
              <path
                d="M57 118 L183 118 L181 150 C180 162 174 168 158 168 L82 168 C66 168 60 162 59 150 Z"
                fill="url(#bandG)"
              />
              {/* gold trim */}
              <path d="M59 156 L181 156" stroke="#C4A478" strokeWidth="3" strokeLinecap="round" />
              {/* rim */}
              <ellipse cx="120" cy="30" rx="68" ry="13" fill="#F9F3E9" stroke="#E2D1B6" strokeWidth="1.5" />
              {/* coffee */}
              <ellipse cx="120" cy="33" rx="58" ry="10" fill="#3E2A1A" />
              <ellipse cx="120" cy="33" rx="58" ry="10" fill="none" stroke="#8B5E3C" strokeWidth="2" opacity="0.85" />
              <ellipse cx="102" cy="31" rx="10" ry="4" fill="#7A5538" opacity="0.55" />
            </svg>

            {/* Falling stream, poured from the tilted rim */}
            <div
              className="absolute overflow-visible"
              style={{ left: "15%", top: "9%", width: "13%", height: "160%", transformOrigin: "50% 0%" }}
            >
              <motion.div
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ duration: reduce ? 0 : 0.55, delay: d(1.75), ease: "easeInOut" }}
                className="absolute inset-0 origin-top"
                style={{
                  background: "linear-gradient(180deg, #8A5A36 0%, #6F4E37 55%, #4A3322 100%)",
                  borderRadius: "2px 2px 999px 999px",
                  boxShadow: "0 6px 14px rgba(42,26,14,0.5)",
                  filter: "blur(0.4px)",
                }}
              />
              {/* drip bead that falls now and then */}
              <motion.span
                className="absolute left-1/2 h-[7%] w-[30%] -translate-x-1/2 rounded-full"
                style={{ background: "#6F4E37", top: "6%" }}
                animate={reduce ? { opacity: 0 } : { top: ["8%", "96%"], opacity: [0, 1, 0] }}
                transition={
                  reduce
                    ? {}
                    : { duration: 1.9, delay: d(5), repeat: Infinity, repeatDelay: 2.8, ease: "easeIn" }
                }
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Droplets bursting from the impact */}
      {droplets.map((drop, i) => (
        <motion.span
          key={i}
          className="absolute bottom-[13%] rounded-full"
          style={{ left: drop.left, width: drop.s, height: drop.s, background: "#6F4E37" }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.6 }}
          animate={{ x: drop.dx, y: drop.dy, opacity: [0, 1, 0], scale: [0.6, 1, 0.4] }}
          transition={{ duration: 1.1, delay: d(drop.delay), ease: "easeOut" }}
        />
      ))}

      {/* Steam rising from the rim */}
      <div className="absolute top-[3%] left-1/2 flex w-[46%] -translate-x-1/2 justify-center">
        <div className="relative">
          <SteamWisp delay={0.2} />
          <SteamWisp className="left-4" delay={0.7} />
          <SteamWisp className="left-8" delay={1.2} />
        </div>
      </div>

      {/* The lockup — revealed by the passing wave */}
      <div
        className="absolute right-[2%] bottom-[6%] w-[54%] overflow-hidden"
        style={{ fontSize: "clamp(13px, 3.2vw, 18px)" }}
      >
        <motion.div
          initial={{ x: "-104%" }}
          animate={{ x: reduce ? 0 : 0 }}
          transition={{ duration: reduce ? 0 : 0.85, delay: d(3.05), ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: d(3.45) }}>
            <div className="font-display leading-tight">
              <div className="text-white/50 uppercase" style={{ fontSize: "0.5em", letterSpacing: "0.42em" }}>
                The
              </div>
              <div className="font-bold text-white" style={{ fontSize: "1.3em", letterSpacing: "0.02em" }}>
                BELGRAVIA
              </div>
              <div
                className="font-bold"
                style={{
                  fontSize: "1.3em",
                  letterSpacing: "0.02em",
                  background: "linear-gradient(120deg, #E8C48E 0%, #C4A478 45%, #B8808A 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                ROAST
              </div>
              <div
                className="mt-1 h-px w-full"
                style={{ background: "linear-gradient(90deg, rgba(222,190,140,0.8) 0%, rgba(222,190,140,0) 100%)" }}
              />
              <div className="mt-1 text-white/40 uppercase" style={{ fontSize: "0.44em", letterSpacing: "0.3em" }}>
                Est. MMXXIV · London
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating beans within the scene */}
      <FloatingBean className="top-[10%] right-[4%] opacity-50" delay={1.2} />
      <FloatingBean className="top-[34%] left-[2%] opacity-40" delay={3} />
      <FloatingBean className="bottom-[24%] right-[10%] opacity-30" delay={5} />
    </div>
  );
}