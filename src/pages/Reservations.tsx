import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Clock,
  Users,
  Phone,
  CheckCircle2,
  CalendarPlus,
  Loader2,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const inputClass =
  "mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 bg-background";

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** 30-minute slots between the café's configured opening and closing hours. */
function buildSlots(openTime: string, closeTime: string): string[] {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  };
  const start = toMinutes(openTime);
  const end = toMinutes(closeTime);
  if (start === null || end === null || end <= start) {
    return ["10:00", "10:30", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];
  }
  const slots: string[] = [];
  // Last booking starts 30 minutes before close.
  for (let t = start; t <= end - 30; t += 30) {
    slots.push(
      `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`,
    );
  }
  return slots;
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface Confirmation {
  name: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  guests: number;
  notes?: string;
}

export default function Reservations() {
  const settings = useQuery(api.cafe.listSettings);
  const createReservation = useMutation(api.cafe.createReservation);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    date: todayISO(),
    time: "",
    guests: "2",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const slots = useMemo(
    () => buildSlots(settings?.openTime ?? "10:00", settings?.closeTime ?? "22:00"),
    [settings?.openTime, settings?.closeTime],
  );

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.time) {
      setError("Please choose a time slot.");
      return;
    }
    if (form.name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (form.phone.replace(/\D/g, "").length < 7) {
      setError("Please enter a valid phone number so we can confirm your table.");
      return;
    }

    setSubmitting(true);
    try {
      await createReservation({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        date: form.date,
        time: form.time,
        guests: Number(form.guests) || 1,
        notes: form.notes.trim() || undefined,
      });
      setConfirmation({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        date: form.date,
        time: form.time,
        guests: Number(form.guests) || 1,
        notes: form.notes.trim() || undefined,
      });
      toast.success("Table reserved — see your confirmation below");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong — please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setConfirmation(null);
    setForm({
      name: "",
      phone: "",
      email: "",
      date: todayISO(),
      time: "",
      guests: "2",
      notes: "",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-6 bg-warm-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-bold text-foreground"
          >
            Reserve a Table
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-2"
          >
            Skip the queue — book your table and we'll have it ready.
          </motion.p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form / confirmation */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {confirmation ? (
                <motion.div
                  key="confirmation"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-elevated rounded-2xl border-0 p-6 sm:p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/10 text-sage">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        Reservation received
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        We'll confirm your table by phone shortly.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 divide-y divide-border/60">
                    <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium text-foreground text-right">
                        {confirmation.name}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium text-foreground text-right">
                        {formatDate(confirmation.date)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium text-foreground text-right">
                        {formatTime(confirmation.time)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                      <span className="text-muted-foreground">Guests</span>
                      <span className="font-medium text-foreground text-right">
                        {confirmation.guests}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium text-foreground text-right">
                        {confirmation.phone}
                      </span>
                    </div>
                    {confirmation.notes && (
                      <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                        <span className="text-muted-foreground">Special request</span>
                        <span className="font-medium text-foreground text-right">
                          {confirmation.notes}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-4">
                    Need to change or cancel? Call us at{" "}
                    <a
                      href="tel:+917728059988"
                      className="text-gold font-semibold hover:underline"
                    >
                      +91 77280 59988
                    </a>
                    .
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                      onClick={resetForm}
                      className="flex-1 flex items-center justify-center gap-2 bg-gold hover:bg-gold/90 text-white py-3 rounded-xl text-sm font-semibold transition-all"
                    >
                      <CalendarPlus className="h-4 w-4" /> Make another booking
                    </button>
                    <a
                      href="/menu"
                      className="flex-1 flex items-center justify-center gap-2 border border-border text-foreground py-3 rounded-xl text-sm font-semibold hover:bg-muted transition-all"
                    >
                      Browse the menu
                    </a>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleSubmit}
                  className="glass-elevated rounded-2xl border-0 p-6 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="res-name" className="text-sm font-medium text-foreground">
                        Name *
                      </label>
                      <input
                        id="res-name"
                        type="text"
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder="Your full name"
                        required
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="res-phone" className="text-sm font-medium text-foreground">
                        Phone *
                      </label>
                      <input
                        id="res-phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        placeholder="+91 98765 43210"
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="res-email" className="text-sm font-medium text-foreground">
                      Email <span className="text-xs text-muted-foreground">(optional)</span>
                    </label>
                    <input
                      id="res-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="res-date" className="text-sm font-medium text-foreground">
                        Date *
                      </label>
                      <input
                        id="res-date"
                        type="date"
                        value={form.date}
                        min={todayISO()}
                        onChange={(e) => set("date", e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="res-time" className="text-sm font-medium text-foreground">
                        Time *
                      </label>
                      <select
                        id="res-time"
                        value={form.time}
                        onChange={(e) => set("time", e.target.value)}
                        required
                        className={inputClass}
                      >
                        <option value="">
                          {settings === undefined ? "Loading times…" : "Select a time"}
                        </option>
                        {slots.map((t) => (
                          <option key={t} value={t}>
                            {formatTime(t)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="res-guests" className="text-sm font-medium text-foreground">
                        Guests *
                      </label>
                      <select
                        id="res-guests"
                        value={form.guests}
                        onChange={(e) => set("guests", e.target.value)}
                        required
                        className={inputClass}
                      >
                        {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={String(n)}>
                            {n} {n === 1 ? "guest" : "guests"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="res-notes" className="text-sm font-medium text-foreground">
                      Special request{" "}
                      <span className="text-xs text-muted-foreground">(optional)</span>
                    </label>
                    <textarea
                      id="res-notes"
                      value={form.notes}
                      onChange={(e) => set("notes", e.target.value)}
                      rows={3}
                      placeholder="Birthday, high chair, window seat…"
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600"
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold/90 text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Reserving…
                      </>
                    ) : (
                      <>
                        Reserve Table <CalendarDays className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Walk-ins are always welcome. For groups larger than 20, please call us.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Side info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="glass-elevated rounded-2xl border-0 p-6">
              <h2 className="font-bold text-foreground mb-4">Good to know</h2>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">Opening hours</div>
                    <div className="text-muted-foreground">
                      {settings?.openTime ?? "10:00"} – {settings?.closeTime ?? "22:00"},
                      every day
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">Party size</div>
                    <div className="text-muted-foreground">
                      Tables of 1–20 can book online — larger groups, call us.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">Prefer to call?</div>
                    <a
                      href="tel:+917728059988"
                      className="text-gold font-semibold hover:underline break-all"
                    >
                      +91 77280 59988
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-elevated rounded-2xl border-0 p-6">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="h-4 w-4 text-dusty-rose" />
                <h3 className="font-bold text-foreground">Reservation policy</h3>
              </div>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                <li>Tables are held for 15 minutes past your booking time.</li>
                <li>We'll call to confirm every reservation.</li>
                <li>Need to cancel? A quick call is all it takes.</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
