import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  /**
   * Real delivery path: hand the message to the visitor's email client,
   * addressed to the café inbox with everything pre-filled. Nothing is
   * silently dropped, and no fake "sent" state is shown.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`[Website] ${form.subject || "Enquiry from " + form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`,
    );
    window.location.href = `mailto:manasshekhawat095@gmail.com?subject=${subject}&body=${body}`;
  };

  const info = [
    { icon: MapPin, label: "Visit Us", value: "42 Belgravia Lane, New Delhi 110001" },
    { icon: Phone, label: "Call Us", value: "+91 77280 59988", href: "tel:+917728059988" },
    { icon: Mail, label: "Email", value: "manasshekhawat095@gmail.com", href: "mailto:manasshekhawat095@gmail.com" },
    { icon: Clock, label: "Hours", value: "Mon–Sun: 10:00 AM – 10:00 PM" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 pb-6 bg-warm-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl font-bold text-foreground">
            Get in Touch
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-muted-foreground mt-2">
            We'd love to hear from you — whether it's feedback, a query, or just a hello.
          </motion.p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Info */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-xl font-bold text-foreground mb-6">Contact Information</h2>
            <div className="space-y-5">
              {info.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{item.label}</div>
                      {item.href ? (
                        <a href={item.href} className="text-sm text-muted-foreground hover:text-gold transition-colors break-all">
                          {item.value}
                        </a>
                      ) : (
                        <div className="text-sm text-muted-foreground">{item.value}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Map placeholder */}
            <div className="mt-8 rounded-2xl overflow-hidden border border-border/50 h-64 bg-muted flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">42 Belgravia Lane, New Delhi</p>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-xl font-bold text-foreground mb-6">Send a Message</h2>
            <form onSubmit={handleSubmit} className="glass-elevated rounded-2xl border-0 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                  className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  required
                  className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold/90 text-white py-3 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
              >
                Open in Email App <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
