"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme";

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

// Icons
const Icons = {
  message: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  lock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  attach: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  ),
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  zap: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  globe: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  sun: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  moon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  arrow: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  quote: (
    <svg className="w-8 h-8 text-neutral-300 dark:text-neutral-600" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  ),
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
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 antialiased transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center">
              <span className="text-white dark:text-neutral-900 font-bold text-sm">P</span>
            </div>
            <span className="font-semibold">Peerzee</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              {theme === "light" ? Icons.moon : Icons.sun}
            </button>
            <Link href="/discover" className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              Discover
            </Link>
            <Link href="/community" className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Community
            </Link>
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/register" className="px-5 py-2.5 text-sm font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
              Get Started
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Now Live — Start chatting today</span>
            </motion.div>

            <motion.h1 initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
              Connect with Peers,
              <br />
              <span className="bg-gradient-to-r from-neutral-400 to-neutral-600 dark:from-neutral-500 dark:to-neutral-300 bg-clip-text text-transparent">Instantly.</span>
            </motion.h1>

            <motion.p initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto mb-10">
              Experience seamless real-time messaging with a clean, modern interface. Share moments, stay connected, and build meaningful conversations.
            </motion.p>

            <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="group w-full sm:w-auto px-8 py-4 text-base font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all flex items-center justify-center gap-2">
                Get Started Free
                <motion.span className="group-hover:translate-x-1 transition-transform">{Icons.arrow}</motion.span>
              </Link>
              <Link href="/login" className="w-full sm:w-auto px-8 py-4 text-base font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all">
                I have an account
              </Link>
            </motion.div>
          </div>

          {/* Chat Preview */}
          <motion.div initial="hidden" animate="visible" variants={scaleIn} transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 max-w-3xl mx-auto perspective-1000">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl shadow-neutral-200/50 dark:shadow-black/50 border border-neutral-200 dark:border-neutral-800 overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
              <div className="border-b border-neutral-100 dark:border-neutral-800 px-5 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 flex items-center justify-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700"></div>
                  <span className="text-sm font-medium">John Doe</span>
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                </div>
              </div>
              <div className="p-6 space-y-4 bg-neutral-50/50 dark:bg-neutral-900 min-h-[200px]">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="flex justify-start">
                  <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-2.5 rounded-2xl rounded-tl-md max-w-xs shadow-sm">
                    <p className="text-sm">Hey! Have you tried Peerzee yet? 👋</p>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }} className="flex justify-end">
                  <div className="bg-neutral-900 dark:bg-white px-4 py-2.5 rounded-2xl rounded-tr-md max-w-xs">
                    <p className="text-sm text-white dark:text-neutral-900">Just signed up! The UI is so clean ✨</p>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }} className="flex justify-start">
                  <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-2.5 rounded-2xl rounded-tl-md max-w-xs shadow-sm">
                    <p className="text-sm">Right? Real-time messaging is super smooth! 🚀</p>
                  </div>
                </motion.div>
              </div>
              <div className="bg-white dark:bg-neutral-900 px-5 py-3 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3 bg-neutral-100 dark:bg-neutral-800 rounded-full px-4 py-2.5">
                  <span className="text-neutral-400">📎</span>
                  <span className="flex-1 text-sm text-neutral-400">Type a message...</span>
                  <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center">
                    <svg className="w-4 h-4 text-white dark:text-neutral-900" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 border-y border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
          className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div key={i} variants={fadeInUp} className="text-center">
              <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">{stat.value}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6" id="features">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
            <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything you need to stay connected</h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} variants={fadeInUp} whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 mb-4 group-hover:bg-neutral-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-neutral-900 transition-colors duration-300">
                  {f.icon}
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-neutral-50 dark:bg-neutral-900/50" id="how-it-works">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
            <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Get started in 3 simple steps</h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center relative">
                {i < steps.length - 1 && <div className="hidden md:block absolute top-12 left-1/2 w-full h-px bg-neutral-200 dark:bg-neutral-800"></div>}
                <motion.div whileHover={{ scale: 1.05 }}
                  className="relative z-10 w-24 h-24 mx-auto mb-6 rounded-full bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold">{s.number}</span>
                </motion.div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{s.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
            <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Loved by thousands</h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeInUp}
                className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                {Icons.quote}
                <p className="text-neutral-600 dark:text-neutral-300 mt-4 mb-6">&quot;{t.content}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-medium">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-neutral-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-3xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
            <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently asked questions</h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="space-y-4">
            {faqs.map((f, i) => (
              <motion.div key={i} variants={fadeInUp}
                className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <h3 className="font-semibold mb-2">{f.q}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{f.a}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}
          className="max-w-4xl mx-auto">
          <div className="rounded-3xl bg-neutral-900 dark:bg-white p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-950 dark:from-neutral-100 dark:to-white"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white dark:text-neutral-900 mb-4 tracking-tight">
                Ready to connect?
              </h2>
              <p className="text-neutral-400 dark:text-neutral-600 mb-8 max-w-md mx-auto text-lg">
                Join thousands of users already enjoying seamless conversations on Peerzee.
              </p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  Create Free Account
                  {Icons.arrow}
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center">
                <span className="text-white dark:text-neutral-900 font-bold text-sm">P</span>
              </div>
              <span className="font-semibold">Peerzee</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-neutral-500">
              <Link href="#features" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Features</Link>
              <Link href="#how-it-works" className="hover:text-neutral-900 dark:hover:text-white transition-colors">How It Works</Link>
              <Link href="/login" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Login</Link>
              <Link href="/register" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Register</Link>
            </div>
            <p className="text-sm text-neutral-400">© 2026 Peerzee. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
