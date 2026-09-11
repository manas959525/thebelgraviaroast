import { motion } from "framer-motion";
import { Award, Heart, Leaf, Users, Coffee } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

export default function About() {
  const values = [
    { icon: Coffee, title: "Craftsmanship", desc: "Every cup is an exercise in precision. We obsess over grind size, water temperature, and extraction time so you don't have to." },
    { icon: Leaf, title: "Sustainability", desc: "From compostable cups to direct-trade sourcing, we make choices that respect both people and the planet." },
    { icon: Heart, title: "Community", desc: "More than a café — we're a gathering place. A space where conversations flow as freely as our espresso." },
    { icon: Award, title: "Excellence", desc: "We never settle. Our team trains continuously, our recipes evolve, and our standards only move upward." },
  ];

  const timeline = [
    { year: "2019", title: "The Idea", desc: "A passion project born over too many cups of coffee — what if a café could feel like home and taste like the world's best?" },
    { year: "2020", title: "The Build", desc: "We found the perfect space on Belgravia Lane and spent months designing every detail, from the lighting to the espresso workflow." },
    { year: "2021", title: "Doors Open", desc: "The Belgravia Roast welcomed its first guests. Within weeks, regulars were calling it their second home." },
    { year: "2024", title: "Growing Together", desc: "With a loyal community behind us, we've expanded our menu, our team, and our commitment to doing things the right way." },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-16 bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(196,106,43,0.15),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
          >
            Our Story
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-white/60 max-w-2xl"
          >
            The Belgravia Roast was born from a simple conviction: that great coffee and great company
            can transform an ordinary day into something worth remembering.
          </motion.p>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">Coffee Done Right</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We believe that a truly great café experience begins long before the first sip.
                It starts with the farmer who grew the bean, the roaster who coaxed out its
                character, and the barista who brought it all together in your cup.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                At The Belgravia Roast, we source single-origin beans from ethical farms across
                Ethiopia, Colombia, Guatemala, and India. Our roasting profile is designed to
                highlight the unique terroir of each origin, and our baristas are trained to
                extract every ounce of flavour with precision and care.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                But coffee is only half the story. Our kitchen produces seasonal dishes made
                from locally sourced ingredients, and our space is designed to feel warm, inviting,
                and genuinely comfortable — whether you're here for a quick espresso or a long
                afternoon with friends.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden h-80 lg:h-96"
            >
              <img
                src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=600&fit=crop"
                alt="Coffee preparation"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-warm-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold text-foreground">What We Stand For</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  variants={fadeUp}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="glass-elevated liquid-sheen-slow rounded-2xl p-6 border-0"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-foreground text-center mb-14"
          >
            The Journey
          </motion.h2>
          <div className="space-y-0">
            {timeline.map((item, i) => (
              <motion.div
                key={item.year}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex gap-6"
              >
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-white font-bold text-sm shrink-0">
                    {item.year.slice(2)}
                  </div>
                  {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-border my-2" />}
                </div>
                <div className="pb-8">
                  <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-1">{item.year}</div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-cafe-gradient text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Users className="h-12 w-12 text-gold mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">The People Behind the Roast</h2>
            <p className="text-white/60 max-w-xl mx-auto leading-relaxed">
              A small, dedicated team of coffee lovers, chefs, and hospitality professionals who
              believe that the best café experiences are built on genuine care and relentless attention
              to detail. Every member of our team shares a passion for making your visit exceptional.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
