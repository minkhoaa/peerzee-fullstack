"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme";
import { 
  MessageSquareText, 
  Lock, 
  Paperclip, 
  Users, 
  Zap, 
  Globe, 
  Sun, 
  Moon, 
  ArrowRight,
  Check,
  Quote,
  Monitor
} from "lucide-react";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
};

// Formal Icons with thick strokes (strokeWidth={2.5})
const Icons = {
  message: <MessageSquareText className="w-6 h-6" strokeWidth={2.5} />,
  lock: <Lock className="w-6 h-6" strokeWidth={2.5} />,
  attach: <Paperclip className="w-6 h-6" strokeWidth={2.5} />,
  users: <Users className="w-6 h-6" strokeWidth={2.5} />,
  zap: <Zap className="w-6 h-6" strokeWidth={2.5} />,
  globe: <Globe className="w-6 h-6" strokeWidth={2.5} />,
  sun: <Sun className="w-5 h-5" strokeWidth={2.5} />,
  moon: <Moon className="w-5 h-5" strokeWidth={2.5} />,
  arrow: <ArrowRight className="w-5 h-5" strokeWidth={2.5} />,
  check: <Check className="w-5 h-5 text-pixel-green" strokeWidth={3} />,
  quote: <Quote className="w-8 h-8 text-cocoa-light" strokeWidth={2} />,
};

// Data
const features = [
  { icon: Icons.message, title: "Real-time Messaging", description: "Instant delivery with typing indicators and read receipts" },
  { icon: Icons.lock, title: "Secure & Private", description: "End-to-end encryption for all conversations" },
  { icon: Icons.attach, title: "File Sharing", description: "Share images, documents, and files seamlessly" },
  { icon: Icons.users, title: "Group Chats", description: "Create groups and stay connected with everyone" },
  { icon: Icons.zap, title: "Lightning Fast", description: "Optimized for speed and performance" },
  { icon: Icons.globe, title: "Cross Platform", description: "Access from any device, anywhere" },
];

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "1M+", label: "Messages Sent" },
  { value: "99.9%", label: "Uptime" },
  { value: "< 50ms", label: "Latency" },
];

const testimonials = [
  { name: "Alex Chen", role: "Product Designer", content: "Peerzee has completely transformed how our team communicates. The real-time features are incredible!", avatar: "A" },
  { name: "Sarah Miller", role: "Startup Founder", content: "Finally, a chat app that's both beautiful and functional. My team loves it!", avatar: "S" },
  { name: "David Park", role: "Developer", content: "The API is clean, the UI is smooth, and the speed is unmatched. Highly recommend!", avatar: "D" },
];

const steps = [
  { number: "01", title: "Create Account", description: "Sign up in seconds with just your email" },
  { number: "02", title: "Find Friends", description: "Search and connect with people you know" },
  { number: "03", title: "Start Chatting", description: "Send messages, share files, stay connected" },
];

const faqs = [
  { q: "Is Peerzee free to use?", a: "Yes! Peerzee is completely free for personal use with all core features included." },
  { q: "How secure are my messages?", a: "All messages are encrypted end-to-end. We never store or read your conversations." },
  { q: "Can I use Peerzee on mobile?", a: "Yes, Peerzee works on all devices through your web browser. Native apps coming soon!" },
  { q: "How do I create a group chat?", a: "Click 'New Chat', add multiple participants, and give your group a name. It's that simple!" },
];

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-retro-bg text-cocoa antialiased transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-retro-white border-b-3 border-cocoa shadow-pixel">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-cocoa border-2 border-cocoa flex items-center justify-center shadow-pixel-sm">
              <Monitor className="w-5 h-5 text-retro-white" strokeWidth={2.5} />
            </div>
            <span className="font-pixel text-lg uppercase tracking-widest">Peerzee</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg border-2 border-cocoa hover:bg-pixel-blue transition-colors">
              {theme === "light" ? Icons.moon : Icons.sun}
            </button>
            <Link href="/discover" className="px-3 py-2 text-sm font-bold text-cocoa hover:bg-pixel-pink/30 rounded-lg border-2 border-transparent hover:border-cocoa transition-colors flex items-center gap-1">
              <Globe className="w-4 h-4" strokeWidth={2.5} />
              Discover
            </Link>
            <Link href="/community" className="px-3 py-2 text-sm font-bold text-cocoa hover:bg-pixel-purple/30 rounded-lg border-2 border-transparent hover:border-cocoa transition-colors flex items-center gap-1">
              <Users className="w-4 h-4" strokeWidth={2.5} />
              Community
            </Link>
            <Link href="/login" className="px-3 py-2 text-sm font-bold text-cocoa hover:bg-pixel-blue/30 rounded-lg border-2 border-transparent hover:border-cocoa transition-colors">
              Login
            </Link>
            <Link href="/register" className="px-4 py-2 text-sm font-pixel uppercase tracking-widest bg-pixel-pink border-2 border-cocoa text-cocoa rounded-lg shadow-pixel-sm hover:bg-pixel-pink-dark transition-colors active:translate-y-0.5 active:shadow-none">
              Start
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-cocoa bg-pixel-green mb-6 shadow-pixel-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded bg-cocoa opacity-75"></span>
                <span className="relative inline-flex rounded h-2 w-2 bg-cocoa"></span>
              </span>
              <span className="text-sm font-bold text-cocoa">Now Live — Start chatting today</span>
            </motion.div>

            <motion.h1 initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-pixel uppercase tracking-widest leading-tight mb-6">
              Connect with Peers,
              <br />
              <span className="text-pixel-pink">Instantly.</span>
            </motion.h1>

            <motion.p initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-cocoa-light font-bold max-w-xl mx-auto mb-8">
              Experience seamless real-time messaging with a clean, modern interface. Share moments, stay connected, and build meaningful conversations.
            </motion.p>

            <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="group w-full sm:w-auto px-6 py-3 text-base font-pixel uppercase tracking-widest bg-pixel-pink border-3 border-cocoa text-cocoa rounded-xl shadow-pixel hover:bg-pixel-pink-dark transition-all flex items-center justify-center gap-2 active:translate-y-0.5 active:shadow-none">
                Get Started Free
                <motion.span className="group-hover:translate-x-1 transition-transform">{Icons.arrow}</motion.span>
              </Link>
              <Link href="/login" className="w-full sm:w-auto px-6 py-3 text-base font-pixel uppercase tracking-widest border-3 border-cocoa text-cocoa rounded-xl bg-retro-white shadow-pixel hover:bg-pixel-blue/30 transition-all active:translate-y-0.5 active:shadow-none">
                I have an account
              </Link>
            </motion.div>
          </div>

          {/* Chat Preview */}
          <motion.div initial="hidden" animate="visible" variants={scaleIn} transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 max-w-3xl mx-auto">
            <div className="bg-retro-white rounded-xl shadow-pixel border-3 border-cocoa overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
              <div className="border-b-3 border-cocoa px-4 py-3 flex items-center gap-3 bg-pixel-purple/20">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded bg-pixel-red border border-cocoa"></div>
                  <div className="w-3 h-3 rounded bg-pixel-yellow border border-cocoa"></div>
                  <div className="w-3 h-3 rounded bg-pixel-green border border-cocoa"></div>
                </div>
                <div className="flex-1 flex items-center justify-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-pixel-blue border border-cocoa"></div>
                  <span className="text-sm font-pixel uppercase tracking-wider">John Doe</span>
                  <span className="w-2 h-2 rounded bg-pixel-green border border-cocoa"></span>
                </div>
              </div>
              <div className="p-5 space-y-3 bg-retro-paper min-h-[180px]">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="flex justify-start">
                  <div className="bg-retro-white border-2 border-cocoa px-4 py-2.5 rounded-xl rounded-tl-sm max-w-xs shadow-pixel-sm">
                    <p className="text-sm font-bold">Hey! Have you tried Peerzee yet? 👋</p>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }} className="flex justify-end">
                  <div className="bg-pixel-pink border-2 border-cocoa px-4 py-2.5 rounded-xl rounded-tr-sm max-w-xs shadow-pixel-sm">
                    <p className="text-sm font-bold text-cocoa">Just signed up! The UI is so clean ✨</p>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }} className="flex justify-start">
                  <div className="bg-retro-white border-2 border-cocoa px-4 py-2.5 rounded-xl rounded-tl-sm max-w-xs shadow-pixel-sm">
                    <p className="text-sm font-bold">Right? Real-time messaging is super smooth! 🚀</p>
                  </div>
                </motion.div>
              </div>
              <div className="bg-retro-white px-4 py-3 border-t-3 border-cocoa">
                <div className="flex items-center gap-3 bg-retro-paper rounded-lg px-4 py-2.5 border-2 border-cocoa shadow-pixel-inset">
                  <Paperclip className="w-4 h-4 text-cocoa-light" strokeWidth={2.5} />
                  <span className="flex-1 text-sm text-cocoa-light font-bold">Type a message...</span>
                  <div className="w-8 h-8 rounded-lg bg-pixel-pink border-2 border-cocoa flex items-center justify-center shadow-pixel-sm">
                    <ArrowRight className="w-4 h-4 text-cocoa" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-6 border-y-3 border-cocoa bg-retro-white">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
          className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div key={i} variants={fadeInUp} className="text-center p-4 bg-pixel-blue/20 border-2 border-cocoa rounded-lg shadow-pixel-sm">
              <p className="text-2xl md:text-3xl font-pixel uppercase tracking-widest text-cocoa">{stat.value}</p>
              <p className="text-sm text-cocoa-light font-bold mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6" id="features">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-12">
            <p className="text-sm font-pixel uppercase tracking-widest text-pixel-pink mb-3">Features</p>
            <h2 className="text-2xl md:text-3xl font-pixel uppercase tracking-widest">Everything you need to stay connected</h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={i} variants={fadeInUp} whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group p-5 bg-retro-white rounded-xl border-3 border-cocoa shadow-pixel hover:shadow-pixel-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-pixel-purple border-2 border-cocoa flex items-center justify-center text-cocoa mb-4 shadow-pixel-sm group-hover:bg-pixel-pink transition-colors duration-300">
                  {f.icon}
                </div>
                <h3 className="font-pixel uppercase tracking-widest text-sm mb-2">{f.title}</h3>
                <p className="text-sm text-cocoa-light font-bold">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-retro-paper border-y-3 border-cocoa" id="how-it-works">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-12">
            <p className="text-sm font-pixel uppercase tracking-widest text-pixel-green mb-3">How It Works</p>
            <h2 className="text-2xl md:text-3xl font-pixel uppercase tracking-widest">Get started in 3 simple steps</h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center relative">
                {i < steps.length - 1 && <div className="hidden md:block absolute top-12 left-1/2 w-full h-1 bg-cocoa/30"></div>}
                <motion.div whileHover={{ scale: 1.05 }}
                  className="relative z-10 w-20 h-20 mx-auto mb-5 rounded-xl bg-retro-white border-3 border-cocoa flex items-center justify-center shadow-pixel">
                  <span className="text-xl font-pixel uppercase tracking-widest">{s.number}</span>
                </motion.div>
                <h3 className="font-pixel uppercase tracking-widest text-sm mb-2">{s.title}</h3>
                <p className="text-sm text-cocoa-light font-bold">{s.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-12">
            <p className="text-sm font-pixel uppercase tracking-widest text-pixel-yellow mb-3">Testimonials</p>
            <h2 className="text-2xl md:text-3xl font-pixel uppercase tracking-widest">Loved by thousands</h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeInUp}
                className="p-5 bg-retro-white rounded-xl border-3 border-cocoa shadow-pixel">
                <div className="text-3xl mb-3">💬</div>
                <p className="text-cocoa font-bold mt-3 mb-5">&quot;{t.content}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-pixel-blue border-2 border-cocoa flex items-center justify-center font-pixel text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-cocoa-light">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-retro-paper border-y-3 border-cocoa">
        <div className="max-w-3xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-12">
            <p className="text-sm font-pixel uppercase tracking-widest text-pixel-purple mb-3">FAQ</p>
            <h2 className="text-2xl md:text-3xl font-pixel uppercase tracking-widest">Frequently asked questions</h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="space-y-4">
            {faqs.map((f, i) => (
              <motion.div key={i} variants={fadeInUp}
                className="p-5 bg-retro-white rounded-xl border-3 border-cocoa shadow-pixel">
                <h3 className="font-pixel uppercase tracking-widest text-sm mb-2">{f.q}</h3>
                <p className="text-sm text-cocoa-light font-bold">{f.a}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}
          className="max-w-4xl mx-auto">
          <div className="rounded-xl bg-cocoa border-3 border-cocoa p-10 md:p-14 text-center shadow-pixel-lg relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-pixel uppercase tracking-widest text-retro-white mb-4">
                Ready to connect?
              </h2>
              <p className="text-retro-white/80 mb-8 max-w-md mx-auto text-lg font-bold">
                Join thousands of users already enjoying seamless conversations on Peerzee.
              </p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 text-base font-pixel uppercase tracking-widest bg-pixel-pink border-3 border-retro-white text-cocoa rounded-xl shadow-pixel hover:bg-pixel-pink-dark transition-colors active:translate-y-0.5 active:shadow-none">
                  Create Free Account
                  {Icons.arrow}
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t-3 border-cocoa bg-retro-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-cocoa border-2 border-cocoa flex items-center justify-center shadow-pixel-sm">
                <Monitor className="w-5 h-5 text-retro-white" strokeWidth={2.5} />
              </div>
              <span className="font-pixel uppercase tracking-widest">Peerzee</span>
            </div>
            <div className="flex items-center gap-6 text-sm font-bold text-cocoa-light">
              <Link href="#features" className="hover:text-cocoa transition-colors">Features</Link>
              <Link href="#how-it-works" className="hover:text-cocoa transition-colors">How It Works</Link>
              <Link href="/login" className="hover:text-cocoa transition-colors">Login</Link>
              <Link href="/register" className="hover:text-cocoa transition-colors">Register</Link>
            </div>
            <p className="text-sm text-cocoa-light font-bold">© 2026 Peerzee. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
