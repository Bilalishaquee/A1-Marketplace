import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Bath, Bot, Camera, CheckCircle2,
  ChevronRight, Hammer, Home as HomeIcon, Layers,
  MapPin, MessageSquare, PaintBucket, Search,
  ShieldCheck, Sparkles, Star, TrendingUp, Users, Wrench,
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { Button, Container } from '../components/ui/marketplace'

// ── Data ─────────────────────────────────────────────────────────────────────

const services = [
  { label: 'Kitchen Remodeling',   icon: HomeIcon,     avg: '$18k – $45k', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&auto=format&fit=crop&q=80' },
  { label: 'Bathroom Remodeling',  icon: Bath,         avg: '$8k – $25k',  image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&auto=format&fit=crop&q=80' },
  { label: 'Flooring',             icon: Layers,       avg: '$2.5k – $8k', image: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=900&auto=format&fit=crop&q=80' },
  { label: 'Painting & Drywall',   icon: PaintBucket,  avg: '$1.2k – $5k', image: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=900&auto=format&fit=crop&q=80' },
  { label: 'General Repair',       icon: Wrench,       avg: '$500 – $3k',  image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&auto=format&fit=crop&q=80' },
  { label: 'Outdoor Projects',     icon: Hammer,       avg: '$3k – $15k',  image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d56?w=900&auto=format&fit=crop&q=80' },
]

const stats = [
  { label: 'Projects completed', end: 12400, suffix: '+' },
  { label: 'Verified pros',      end: 2800,  suffix: '+' },
  { label: 'Average rating',     end: 4.9,   suffix: '★', decimal: true },
  { label: 'Cities served',      end: 340,   suffix: '+' },
]

const steps = [
  { icon: Camera,        color: 'bg-emerald-500', title: 'Describe your project',    body: 'Add photos, describe the scope, and share your ZIP. Takes under 2 minutes.' },
  { icon: Bot,           color: 'bg-blue-500',    title: 'Get an AI estimate',        body: 'Our AI scopes the job, builds a price range, timeline, and permit checklist.' },
  { icon: Users,         color: 'bg-violet-500',  title: 'Compare provider bids',     body: 'Licensed pros bid on your scoped project — compare price, reviews, and speed.' },
  { icon: CheckCircle2,  color: 'bg-amber-500',   title: 'Book & track everything',   body: 'Schedule the work, message your pro, and track progress from one dashboard.' },
]

const testimonials = [
  {
    avatar: 'SM', name: 'Sarah M.', location: 'Los Angeles, CA', project: 'Kitchen Remodel',
    text: 'The AI estimate was shockingly accurate — we budgeted $32k and the final cost was $34k. Having that anchor before calling contractors saved us weeks of back-and-forth.',
  },
  {
    avatar: 'DK', name: 'David K.', location: 'Pasadena, CA', project: 'Bathroom Renovation',
    text: 'I posted the project and had 4 qualified bids within 24 hours. The built-in messaging and document storage made the whole thing feel professional, not chaotic.',
  },
  {
    avatar: 'ML', name: 'Maria L.', location: 'Santa Monica, CA', project: 'Interior Painting',
    text: "The scoped estimate helped me immediately filter out lowball bids. The provider A-1 surfaced first is who I hired. Couldn't be happier with how it turned out.",
  },
  {
    avatar: 'JT', name: 'James T.', location: 'Glendale, CA', project: 'Flooring Installation',
    text: "A-1 flagged that my project needed a city permit — I had no idea. That one alert saved me from a potential nightmare. The permit checklist alone is worth it.",
  },
]

const quickSearches = ['Bathroom remodeling', 'Flooring', 'Painting', 'Kitchen', 'Roofing']

const proFeatures = [
  'Pre-qualified homeowners with real budgets',
  'Project details, photos & full scope included',
  'Direct messaging — no middlemen',
  'Review management and profile visibility tools',
]

const whyFeatures = [
  {
    title: 'Get to a hire faster.',
    body: 'Share details about your project in your own words, so we can find your best fit.',
    boxed: true,
  },
  {
    title: 'Only see local, trusted pros.',
    body: "We'll only show you pros we're confident can do the job.",
  },
  {
    title: 'A job done right — guaranteed.',
    body: "If the job isn't done as agreed you could get up to $2,500 back. Terms apply.",
  },
]

const estimateFeatures = [
  'Itemized scope: materials, labor, permits',
  'Local cost calibration by ZIP code',
  'Confidence score and timeline estimate',
  'Helps you filter out lowball or inflated bids',
]

const lineItems = [
  { item: 'Cabinets & hardware',       low: 6200,  high: 11000 },
  { item: 'Countertops',               low: 3500,  high: 7200  },
  { item: 'Appliances',                low: 4000,  high: 8000  },
  { item: 'Labor (install + plumbing)', low: 8000, high: 9500  },
  { item: 'Permits & misc',            low: 800,   high: 1200  },
]

// ── Animated Counter ──────────────────────────────────────────────────────────

function AnimatedCounter({ end, suffix, decimal = false }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 1800
    const started = performance.now()
    let raf
    const tick = (now) => {
      const p = Math.min((now - started) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(decimal ? (eased * end).toFixed(1) : Math.round(eased * end))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, end, decimal])

  return <span ref={ref}>{val}{suffix}</span>
}

// ── Testimonial Carousel ──────────────────────────────────────────────────────

function TestimonialCarousel() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setActive((v) => (v + 1) % testimonials.length), 4800)
    return () => clearInterval(t)
  }, [])

  return (
    <div>
      <div className="relative" style={{ minHeight: 240 }}>
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: i === 0 ? 1 : 0, y: 0 }}
            animate={{ opacity: i === active ? 1 : 0, y: i === active ? 0 : 14 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
            style={{ pointerEvents: i === active ? 'auto' : 'none' }}
          >
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={15} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-base leading-8 text-slate-600 italic">"{t.text}"</p>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white shrink-0">
                {t.avatar}
              </div>
              <div>
                <p className="font-semibold text-slate-950">{t.name}</p>
                <p className="text-xs text-slate-500">{t.project} · {t.location}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-8 flex gap-2 pt-2">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-8 bg-emerald-600' : 'w-2 bg-slate-300'}`}
          />
        ))}
      </div>
    </div>
  )
}

// ── Why Phone Mockup ─────────────────────────────────────────────────────────

const kbRows = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['⇧','Z','X','C','V','B','N','M','⌫'],
]

function PhoneKeyboard() {
  return (
    <div className="bg-[#d1d5db] px-0.5 pt-1 pb-1 space-y-0.5">
      {kbRows.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-[2.5px]">
          {row.map((k) => (
            <div
              key={k}
              className={`flex items-center justify-center rounded-[3px] shadow-[0_1px_0_rgba(0,0,0,0.3)] ${
                k === '⇧' || k === '⌫' ? 'bg-[#adb5bd] text-slate-700' : 'bg-white text-slate-900'
              }`}
              style={{ width: k === '⇧' || k === '⌫' ? 18 : 16, height: 18, fontSize: 8, fontWeight: 500 }}
            >
              {k}
            </div>
          ))}
        </div>
      ))}
      <div className="flex justify-center gap-[2.5px]">
        <div className="flex items-center justify-center rounded-[3px] bg-[#adb5bd] shadow-[0_1px_0_rgba(0,0,0,0.3)]" style={{ width: 28, height: 18, fontSize: 7, color: '#374151', fontWeight: 500 }}>123</div>
        <div className="flex items-center justify-center rounded-[3px] bg-white shadow-[0_1px_0_rgba(0,0,0,0.3)]" style={{ width: 104, height: 18, fontSize: 8, color: '#6b7280' }}>space</div>
        <div className="flex items-center justify-center rounded-[3px] text-white shadow-[0_1px_0_rgba(0,0,0,0.3)]" style={{ width: 40, height: 18, fontSize: 7, fontWeight: 600, backgroundColor: '#10b981' }}>Search</div>
      </div>
    </div>
  )
}

// Screen 0 — search + services + keyboard
function PhoneScreen0() {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-slate-100 px-3 pb-2">
        <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-2.5 py-2 ring-1 ring-slate-200">
          <Search size={10} className="mt-0.5 shrink-0 text-slate-400" />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] leading-tight text-slate-800">
              My sprinkler system has a leak that I can't locate.
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="inline-block ml-px h-[9px] w-px bg-emerald-500 align-middle"
              />
            </p>
            <div className="mt-1 flex items-center gap-1">
              <MapPin size={7} className="text-slate-400" />
              <span className="text-[8px] text-slate-500">97215</span>
            </div>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden px-3 pt-2">
        <p className="mb-1.5 flex items-center gap-1 text-[8.5px] font-semibold text-slate-500">
          <Sparkles size={7} className="text-emerald-500" /> Popular services
        </p>
        {['House cleaning', 'Local moving (under 50 miles)', 'Interior painting', 'Lawn mowing and trimming', 'Junk removal'].map((svc, i) => (
          <motion.div
            key={svc}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.28 }}
            className="flex items-center gap-2 border-b border-slate-50 py-1.5"
          >
            <div className="h-2.5 w-2.5 shrink-0 rounded-full border border-slate-300 bg-white" />
            <span className="text-[8.5px] text-slate-700">{svc}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-auto shrink-0">
        <PhoneKeyboard />
      </div>
    </div>
  )
}

// Screen 1 — matched local pros
const matchedPros = [
  { initials: 'MR', color: '#10b981', name: 'Marcus R.', rating: '4.9', jobs: '142 jobs', dist: '2.3 mi' },
  { initials: 'SK', color: '#3b82f6', name: 'Sarah K.',  rating: '4.8', jobs: '98 jobs',  dist: '3.1 mi' },
  { initials: 'JT', color: '#8b5cf6', name: 'James T.',  rating: '4.7', jobs: '77 jobs',  dist: '4.5 mi' },
]

function PhoneScreen1() {
  return (
    <div className="flex h-full flex-col px-3 pt-2">
      <p className="mb-2 text-[9px] font-bold text-slate-800">3 pros near you</p>
      <div className="space-y-2">
        {matchedPros.map((pro, i) => (
          <motion.div
            key={pro.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2 shadow-sm"
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
              style={{ backgroundColor: pro.color }}
            >
              {pro.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-semibold text-slate-900">{pro.name}</p>
                <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[7px] font-semibold text-emerald-700">Verified</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="text-[8px] text-amber-500">★ {pro.rating}</span>
                <span className="text-[7px] text-slate-400">·</span>
                <span className="text-[7.5px] text-slate-500">{pro.jobs}</span>
                <span className="text-[7px] text-slate-400">·</span>
                <span className="text-[7.5px] text-slate-500">{pro.dist}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-3 rounded-xl bg-emerald-500 py-2 text-center"
      >
        <p className="text-[9px] font-bold text-white">Request quotes from all 3</p>
      </motion.div>
    </div>
  )
}

// Screen 2 — booking confirmed + guarantee
function PhoneScreen2() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 pb-6">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-200"
      >
        <CheckCircle2 size={28} className="text-white" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-center"
      >
        <p className="text-[12px] font-bold text-slate-900">Booking confirmed!</p>
        <p className="mt-0.5 text-[9px] text-slate-500">Marcus R. · Plumbing</p>
        <p className="mt-0.5 text-[9px] text-slate-500">Fri Jun 20 · 10:00 AM</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-5 w-full rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center"
      >
        <ShieldCheck size={14} className="mx-auto text-emerald-600 mb-1" />
        <p className="text-[9px] font-bold text-emerald-800">Backed by $2,500 Guarantee</p>
        <p className="mt-0.5 text-[8px] text-emerald-700">If the job isn't done right, we'll make it right.</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 flex items-center gap-1.5"
      >
        <MessageSquare size={9} className="text-slate-400" />
        <p className="text-[8.5px] text-slate-500">Message your pro anytime</p>
      </motion.div>
    </div>
  )
}

// Phone status bar (shared)
function PhoneStatusBar() {
  return (
    <div className="flex shrink-0 items-center justify-between px-5 pt-3 pb-1">
      <span className="text-[11px] font-bold text-slate-900">9:41</span>
      <div className="flex items-center gap-1.5">
        <svg viewBox="0 0 16 11" width="13" fill="currentColor" className="text-slate-900">
          <rect x="0" y="7" width="3" height="4" rx="0.5" />
          <rect x="4.5" y="4.5" width="3" height="6.5" rx="0.5" />
          <rect x="9" y="2" width="3" height="9" rx="0.5" />
          <rect x="13.5" y="0" width="3" height="11" rx="0.5" />
        </svg>
        <svg viewBox="0 0 16 11" width="12" fill="none" className="text-slate-900">
          <path d="M8 8.5a1.2 1.2 0 110 2.4A1.2 1.2 0 018 8.5z" fill="currentColor"/>
          <path d="M4.2 6.1C5.1 5.2 6.5 4.6 8 4.6s2.9.6 3.8 1.5l1-1C11.5 4 9.9 3.2 8 3.2s-3.5.8-4.8 1.9l1 1z" fill="currentColor"/>
          <path d="M1.4 3.4C3 1.9 5.4 1 8 1s5 .9 6.6 2.4l1-1C13.8.9 11.1 0 8 0S2.2.9.4 2.4l1 1z" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 25 12" width="20" fill="none" className="text-slate-900">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35"/>
          <rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor"/>
          <path d="M23 4v4a2 2 0 000-4z" fill="currentColor" fillOpacity="0.4"/>
        </svg>
      </div>
    </div>
  )
}

function WhyPhoneMockup({ activeIndex }) {
  const screens = [<PhoneScreen0 />, <PhoneScreen1 />, <PhoneScreen2 />]

  return (
    <div className="relative mx-auto select-none" style={{ width: 240 }}>
      {/* Decorative background blob */}
      <div
        className="absolute -right-8 top-6 -z-10 rounded-[56px] bg-slate-100"
        style={{ width: 248, height: 480 }}
      />

      {/* Floating phone */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
        style={{ width: 240 }}
      >
        {/* SVG dual-border frame */}
        <svg
          className="pointer-events-none absolute"
          style={{ top: -7, left: -7, width: 'calc(100% + 14px)', height: 'calc(100% + 14px)', zIndex: 10 }}
          viewBox="-210 -440 420 880"
          preserveAspectRatio="xMidYMid meet"
          fill="none"
        >
          <path
            stroke="rgb(224,225,230)" strokeOpacity="1" strokeWidth="2"
            strokeLinecap="butt" strokeLinejoin="miter" fillOpacity="0" strokeMiterlimit="10"
            d="M140.94,-425.89 C140.94,-425.89 -140.93,-425.89 -140.93,-425.89 C-171.3,-425.89 -195.91,-401.25 -195.91,-370.85 C-195.91,-370.85 -195.91,369.64 -195.91,369.64 C-195.91,400.03 -171.3,424.68 -140.93,424.68 C-140.93,424.68 140.94,424.68 140.94,424.68 C171.3,424.68 195.92,400.03 195.92,369.64 C195.92,369.64 195.92,-370.85 195.92,-370.85 C195.92,-401.25 171.3,-425.89 140.94,-425.89z"
          />
          <path
            stroke="rgb(224,225,230)" strokeOpacity="1" strokeWidth="2"
            strokeLinecap="butt" strokeLinejoin="miter" fillOpacity="0" strokeMiterlimit="10"
            d="M139.62,-439.02 C139.62,-439.02 -139.62,-439.02 -139.62,-439.02 C-178.19,-439.02 -209.46,-407.72 -209.46,-369.11 C-209.46,-369.11 -209.46,367.9 -209.46,367.9 C-209.46,406.5 -178.19,437.8 -139.62,437.8 C-139.62,437.8 139.62,437.8 139.62,437.8 C178.19,437.8 209.46,406.5 209.46,367.9 C209.46,367.9 209.46,-369.11 209.46,-369.11 C209.46,-407.72 178.19,-439.02 139.62,-439.02z"
          />
        </svg>

        {/* Phone body */}
        <div
          className="relative flex flex-col overflow-hidden bg-white"
          style={{
            borderRadius: 36,
            aspectRatio: '9 / 19.5',
            boxShadow: '0 24px 64px rgba(0,0,0,0.14), 0 0 0 1.5px rgb(224,225,230)',
          }}
        >
          <PhoneStatusBar />

          {/* Animated screen content */}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.38, ease: 'easeInOut' }}
                className="absolute inset-0"
              >
                {screens[activeIndex]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-1.5 left-0 right-0 flex justify-center">
            <div className="h-[4px] w-20 rounded-full bg-slate-800/20" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Why Section (cycling features + phone) ───────────────────────────────────

function WhySection() {
  const [active, setActive] = useState(0)
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { once: false, margin: '-20%' })

  // Auto-cycle every 3s when section is in view
  useEffect(() => {
    if (!inView) return
    const t = setInterval(() => setActive((v) => (v + 1) % whyFeatures.length), 3000)
    return () => clearInterval(t)
  }, [inView])

  return (
    <section ref={sectionRef} className="overflow-hidden py-20">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Why homeowners choose A-1.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-500">
            Every day, homeowners like you rely on A-1 to care for their homes — and we've got your back if things don't go as planned.
          </p>
        </motion.div>

        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* Left: feature list */}
          <div className="space-y-2">
            {whyFeatures.map((feat, i) => (
              <motion.button
                key={feat.title}
                onClick={() => setActive(i)}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="w-full text-left"
              >
                <div
                  className={`relative rounded-2xl border px-5 py-5 transition-all duration-400 ${
                    active === i
                      ? 'border-slate-200 bg-white shadow-md'
                      : 'border-transparent bg-transparent'
                  }`}
                >
                  {/* Active left accent bar */}
                  {active === i && (
                    <motion.div
                      layoutId="why-accent"
                      className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full bg-emerald-500"
                    />
                  )}
                  <p
                    className={`text-lg font-bold transition-colors duration-300 ${
                      active === i ? 'text-slate-950' : 'text-slate-500'
                    }`}
                  >
                    {feat.title}
                  </p>
                  <AnimatePresence>
                    {active === i && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-1.5 overflow-hidden leading-7 text-slate-500"
                      >
                        {feat.body}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            ))}

            {/* Progress dots */}
            <div className="flex gap-2 pt-2 pl-5">
              {whyFeatures.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === active ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right: phone with animated screens */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18 }}
            className="flex justify-center lg:justify-end"
          >
            <WhyPhoneMockup activeIndex={active} />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [query, setQuery] = useState('')
  const [zip, setZip] = useState('')
  const navigate = useNavigate()

  const submit = (e) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (query.trim()) p.set('service', query.trim())
    if (zip.trim()) p.set('zip', zip.trim())
    navigate(`/browse${p.toString() ? `?${p}` : ''}`)
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950 pt-16 pb-0">
        {/* Animated glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 h-[600px] w-[600px] rounded-full bg-emerald-600/20 blur-[130px]" style={{ animation: 'pulse 4s ease-in-out infinite' }} />
          <div className="absolute bottom-0 -left-32 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[110px]" style={{ animation: 'pulse 5s ease-in-out infinite 1.5s' }} />
        </div>

        <Container className="relative z-10 grid gap-12 pb-8 lg:grid-cols-2 lg:items-center lg:pb-20">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400"
            >
              <Sparkles size={12} /> AI-powered renovation estimates · Free & instant
            </motion.div>

            <h1 className="text-5xl font-extrabold leading-[1.06] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Your home.<br />
              <span className="text-emerald-400">Better.</span>{' '}
              <span className="text-white/50">Smarter.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
              Describe your renovation project, get an AI-scoped estimate in seconds, then compare bids from verified local pros.
            </p>

            {/* Search */}
            <form onSubmit={submit} className="mt-8">
              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur sm:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-xl bg-white px-4 py-3">
                  <Search size={17} className="shrink-0 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="What do you need done?"
                    className="flex-1 min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    list="service-list"
                  />
                  <datalist id="service-list">
                    {services.map((s) => <option key={s.label} value={s.label} />)}
                  </datalist>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 sm:w-36">
                  <MapPin size={15} className="shrink-0 text-slate-400" />
                  <input
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="ZIP code"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-400 active:scale-95"
                >
                  Search <ArrowRight size={15} />
                </button>
              </div>
            </form>

            {/* Quick pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {quickSearches.map((item) => (
                <Link
                  key={item}
                  to={`/browse?service=${encodeURIComponent(item)}`}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-emerald-400/50 hover:text-emerald-400"
                >
                  {item}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Right: image collage + floating cards */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.18 }}
            className="relative hidden lg:block"
          >
            <div className="grid grid-cols-2 gap-3">
              <img
                className="h-80 w-full rounded-2xl object-cover"
                src="https://images.unsplash.com/photo-1600210492493-0946911123ea?w=900&auto=format&fit=crop&q=80"
                alt="Finished kitchen"
              />
              <div className="grid gap-3">
                <img className="h-[154px] w-full rounded-2xl object-cover" src="https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=700&auto=format&fit=crop&q=80" alt="Bathroom" />
                <img className="h-[154px] w-full rounded-2xl object-cover" src="https://images.unsplash.com/photo-1615529182904-14819c35db37?w=700&auto=format&fit=crop&q=80" alt="Flooring" />
              </div>
            </div>

            {/* Floating AI card */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.65, duration: 0.5 }}
              className="absolute -bottom-6 -left-8 rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl backdrop-blur"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
                <Bot size={13} /> AI Estimate Ready
              </div>
              <p className="text-xl font-bold text-white">$24,000 – $38,000</p>
              <p className="text-xs text-slate-400 mt-0.5">Kitchen remodel · 3–5 weeks</p>
              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={11} className="fill-amber-400 text-amber-400" />)}
                <span className="text-xs text-slate-400 ml-1.5">High confidence</span>
              </div>
            </motion.div>

            {/* Floating pros nearby */}
            <motion.div
              initial={{ opacity: 0, y: -24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -top-4 -right-4 rounded-2xl border border-white/10 bg-slate-900/90 p-3.5 shadow-2xl backdrop-blur"
            >
              <p className="text-xs text-slate-400 mb-1.5">Available pros nearby</p>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {['#10b981', '#3b82f6', '#8b5cf6'].map((c, i) => (
                    <div key={i} style={{ backgroundColor: c }} className="h-7 w-7 rounded-full border-2 border-slate-900" />
                  ))}
                </div>
                <span className="text-sm font-bold text-white">14 pros</span>
              </div>
            </motion.div>
          </motion.div>
        </Container>

        {/* Wave divider */}
        <div className="relative h-16">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 64" fill="none" preserveAspectRatio="none">
            <path d="M0 64L1440 64L1440 28C1200 0 900 56 720 44C540 32 280 0 0 28Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="py-16">
        <Container>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.09 }}
                className="text-center"
              >
                <p className="text-4xl font-extrabold tabular-nums text-slate-950">
                  <AnimatedCounter end={s.end} suffix={s.suffix} decimal={s.decimal} />
                </p>
                <p className="mt-1.5 text-sm font-medium text-slate-500">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Partner logos ────────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 py-10 overflow-hidden">
        <Container>
          <p className="mb-7 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
            Trusted by homeowners across America
          </p>
        </Container>
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-slate-50 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-slate-50 to-transparent" />

          <div className="logo-track flex w-max items-center gap-16">
            {/* Items rendered twice so the loop is seamless */}
            {[...Array(2)].map((_, pass) =>
              [
                { name: 'Houzz',         color: '#b84e2f', font: 'Georgia, serif',    size: 26, weight: 700 },
                { name: 'Zillow',         color: '#1277e1', font: 'Arial, sans-serif', size: 24, weight: 800 },
                { name: 'Angi',           color: '#e3000b', font: 'Arial, sans-serif', size: 26, weight: 800 },
                { name: 'HomeAdvisor',    color: '#f47920', font: 'Arial, sans-serif', size: 22, weight: 700 },
                { name: 'Houzz Pro',      color: '#b84e2f', font: 'Georgia, serif',    size: 22, weight: 700 },
                { name: 'Google',         color: '#4285F4', font: 'Arial, sans-serif', size: 26, weight: 700 },
                { name: 'Nextdoor',       color: '#00b246', font: 'Arial, sans-serif', size: 24, weight: 700 },
                { name: 'BBB',            color: '#003a7d', font: 'Arial, sans-serif', size: 22, weight: 900 },
              ].map((logo) => (
                <div
                  key={`${pass}-${logo.name}`}
                  aria-hidden={pass === 1}
                  className="flex-shrink-0 flex h-[67px] items-center justify-center px-2 opacity-40 grayscale transition duration-300 hover:opacity-80 hover:grayscale-0"
                >
                  <span
                    style={{
                      fontFamily: logo.font,
                      fontSize: logo.size,
                      fontWeight: logo.weight,
                      color: logo.color,
                      letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {logo.name}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Services grid ────────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-18 py-16">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Services</p>
              <h2 className="mt-1.5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Popular home services
              </h2>
              <p className="mt-2 text-slate-500">Click any category to see verified local pros and price guidance.</p>
            </div>
            <Button as={Link} to="/browse" variant="secondary" className="shrink-0">
              Browse all <ArrowRight size={15} />
            </Button>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((svc, i) => (
              <motion.div
                key={svc.label}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <Link
                  to={`/browse?service=${encodeURIComponent(svc.label)}`}
                  className="group relative block overflow-hidden rounded-2xl bg-slate-900 shadow-md transition-shadow duration-300 hover:shadow-xl"
                >
                  <img
                    src={svc.image}
                    alt={svc.label}
                    className="h-52 w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-lg font-bold text-white">{svc.label}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-sm text-slate-300">Avg {svc.avg}</p>
                      <div className="flex h-8 w-8 translate-y-2 items-center justify-center rounded-full bg-emerald-500 text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Simple process</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              How A-1 Renovations works
            </h2>
            <p className="mt-3 mx-auto max-w-xl text-slate-500">
              From project description to completed work, everything stays in one place.
            </p>
          </motion.div>

          <div className="relative grid gap-10 md:grid-cols-4">
            {/* Connector line */}
            <div className="absolute top-10 left-[12.5%] right-[12.5%] hidden h-px bg-gradient-to-r from-emerald-400 via-blue-400 via-violet-400 to-amber-400 md:block" />

            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.13 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl ${step.color} shadow-lg mb-6`}>
                  <step.icon size={30} className="text-white" />
                  <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-xs font-extrabold text-white">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-950 mb-2">{step.title}</h3>
                <p className="text-sm leading-6 text-slate-500">{step.body}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Button as={Link} to="/quote" size="lg">
              Start your project <ArrowRight size={16} />
            </Button>
          </div>
        </Container>
      </section>

      {/* ── AI Feature ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950 py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-emerald-600/15 blur-[100px]" />
          <div className="absolute left-0 bottom-0 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[90px]" />
        </div>
        <Container className="relative z-10">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
                <Sparkles size={12} /> Only on A-1 Renovations
              </div>
              <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                Get a real estimate before<br />talking to a single contractor
              </h2>
              <p className="mt-4 leading-7 text-slate-400">
                Our AI analyzes your photos, project description, and local market data to build a scoped cost range — including materials, labor, timeline, and permits.
              </p>
              <ul className="mt-7 space-y-3">
                {estimateFeatures.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 size={12} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                as={Link}
                to="/quote"
                size="lg"
                className="mt-9 border-emerald-500 bg-emerald-500 hover:bg-emerald-400"
              >
                Get your free estimate <ArrowRight size={16} />
              </Button>
            </motion.div>

            {/* Mock estimate card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 mb-1">AI Estimate · Kitchen Remodel</p>
                  <p className="text-3xl font-extrabold text-white">$24,000 – $38,000</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Bot size={24} />
                </div>
              </div>
              <div className="space-y-2">
                {lineItems.map((row) => (
                  <div key={row.item} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5">
                    <span className="text-sm text-slate-300">{row.item}</span>
                    <span className="text-sm font-semibold text-white">
                      ${row.low.toLocaleString()} – ${row.high.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-xs text-slate-400">Timeline: 3–5 weeks · Permit required</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">High confidence</span>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-20">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[1fr_1.4fr] lg:items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Reviews</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Homeowners love the clarity
              </h2>
              <p className="mt-3 leading-7 text-slate-500">
                Real reviews from homeowners who used A-1 to scope, bid, and complete renovation projects.
              </p>
              <div className="mt-7 flex items-center gap-4">
                <p className="text-5xl font-extrabold text-slate-950">4.9</p>
                <div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={20} className="fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">Based on 1,200+ reviews</p>
                </div>
              </div>
              <Button as={Link} to="/register" variant="secondary" className="mt-8">
                Join 12,000+ homeowners <ArrowRight size={15} />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <TestimonialCarousel />
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ── Why Choose A-1 ──────────────────────────────────────────────── */}
      <WhySection />

      {/* ── For Providers ────────────────────────────────────────────────── */}
      <section className="py-20">
        <Container>
          <div className="overflow-hidden rounded-3xl bg-slate-950">
            <div className="grid lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-10 lg:p-14"
              >
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white">
                  <TrendingUp size={12} /> For Service Providers
                </div>
                <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                  Grow your business with qualified leads
                </h2>
                <p className="mt-4 leading-7 text-slate-400">
                  Every project comes pre-scoped with an AI estimate, so you're bidding on real jobs — not tire-kickers. No cold calls. No chasing.
                </p>
                <ul className="mt-6 space-y-3">
                  {proFeatures.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Button
                    as={Link}
                    to="/register?role=provider"
                    className="border-emerald-500 bg-emerald-500 hover:bg-emerald-400"
                  >
                    Join as a pro <ArrowRight size={15} />
                  </Button>
                  <Button
                    as={Link}
                    to="/browse"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    See how it works
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.12 }}
                className="relative hidden lg:block"
              >
                <img
                  src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&auto=format&fit=crop&q=80"
                  alt="Professional contractor"
                  className="h-full w-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 to-transparent" />
                <div className="absolute bottom-10 right-10 rounded-2xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-sm">
                  <p className="text-2xl font-extrabold text-white">$8,400</p>
                  <p className="mt-1 text-sm text-slate-400">Avg. monthly revenue per pro</p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <TrendingUp size={14} className="text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">+24% from last quarter</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="bg-emerald-600 py-18 py-16">
        <Container className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to start your project?
            </h2>
            <p className="mt-3 text-lg text-emerald-100">
              Get a free AI estimate in under 2 minutes. No account required.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/quote"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-10 py-4 text-base font-bold text-emerald-700 transition hover:bg-emerald-50 active:scale-95"
              >
                Get free estimate <ArrowRight size={17} />
              </Link>
              <Link
                to="/browse"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-transparent px-10 py-4 text-base font-bold text-white transition hover:bg-white/10 active:scale-95"
              >
                Browse providers
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

      <Footer />
    </div>
  )
}
