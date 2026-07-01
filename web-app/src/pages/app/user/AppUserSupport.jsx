import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, Search, MessageSquare, Phone, Mail, ChevronDown, ChevronUp, CheckCircle2, HelpCircle } from 'lucide-react'

const TOPICS = ['All', 'Payments', 'Projects', 'Finding Pros', 'Account', 'Reviews']

const FAQS = [
  {
    topic: 'Payments',
    q: 'How does the milestone payment system work?',
    a: 'Payments are split into milestones agreed upon before work begins — typically 25% deposit, 25% at mid-project, and 50% on completion. Each payment is held securely and released to the contractor only after you approve that milestone.',
  },
  {
    topic: 'Payments',
    q: 'Can I get a refund if I am not satisfied?',
    a: 'Yes. If the contractor does not complete the agreed scope of work, you can open a dispute within 7 days of the final payment. Our team will review the case and issue a refund if warranted.',
  },
  {
    topic: 'Projects',
    q: 'How do I track my project progress?',
    a: 'Your project dashboard shows milestone progress, contractor updates, site photos, and upcoming appointments. You will also receive push notifications for every update.',
  },
  {
    topic: 'Projects',
    q: 'What happens if my contractor misses a deadline?',
    a: 'Contact your contractor through in-app messages first. If the issue is unresolved, tap "Report an Issue" in your project detail page and our support team will step in within 24 hours.',
  },
  {
    topic: 'Finding Pros',
    q: 'How are contractors verified?',
    a: 'All contractors pass a background check, license verification, and insurance validation before being listed on A-1 Renovations. Verified pros display a blue shield badge.',
  },
  {
    topic: 'Finding Pros',
    q: 'Can I message a contractor before hiring?',
    a: 'Yes. From a contractor profile, tap "Request a Quote" and include any questions in the description. Once they respond, you can message back and forth before committing.',
  },
  {
    topic: 'Account',
    q: 'How do I change my password?',
    a: 'Go to Profile → Settings → scroll to the Account section and tap "Change Password." You will receive an email with a reset link.',
  },
  {
    topic: 'Reviews',
    q: 'When can I leave a review?',
    a: 'You can leave a review once a project is marked complete. You will receive a notification prompting you to review your contractor. Reviews must be submitted within 60 days of project completion.',
  },
]

const TICKET_HISTORY = [
  { id: 'TK-0482', subject: 'Payment not reflected in history', status: 'resolved', date: 'Apr 28' },
  { id: 'TK-0391', subject: 'Contractor did not respond to messages', status: 'resolved', date: 'Mar 10' },
]

export default function AppUserSupport() {
  const navigate   = useNavigate()
  const [query,    setQuery]   = useState('')
  const [topic,    setTopic]   = useState('All')
  const [open,     setOpen]    = useState(null)
  const [chatSent, setChatSent] = useState(false)

  const filtered = FAQS.filter(f =>
    (topic === 'All' || f.topic === topic) &&
    (!query || f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <MobileAppLayout role="user">
      <div className="pt-10 pb-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 px-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="font-extrabold text-slate-900 text-lg">Help & Support</h1>
            <p className="text-[11px] text-slate-400">We typically reply in under 2 hours</p>
          </div>
        </div>

        {/* Contact options */}
        <div className="px-4 grid grid-cols-3 gap-2">
          {[
            { icon: MessageSquare, label: 'Live Chat',   color: 'bg-turquoise-500', action: () => setChatSent(true) },
            { icon: Phone,         label: 'Call Us',     color: 'bg-slate-800',     action: () => {} },
            { icon: Mail,          label: 'Email Us',    color: 'bg-slate-700',     action: () => {} },
          ].map(({ icon: Icon, label, color, action }) => (
            <button key={label} onClick={action}
              className="flex flex-col items-center gap-2 bg-white border border-slate-200 rounded-2xl py-4 hover:bg-slate-50 transition-colors">
              <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center`}>
                <Icon size={16} className="text-white" />
              </div>
              <span className="text-[11px] font-semibold text-slate-700">{label}</span>
            </button>
          ))}
        </div>

        {chatSent && (
          <div className="mx-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            <p className="text-xs text-emerald-800 font-semibold">Live chat started! A support agent will join shortly.</p>
          </div>
        )}

        {/* Search */}
        <div className="px-4">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search help articles..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
          </div>
        </div>

        {/* Topic chips */}
        <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-1">
          {TOPICS.map(t => (
            <button key={t} onClick={() => setTopic(t)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                topic === t
                  ? 'bg-turquoise-500 text-white border-turquoise-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}>{t}</button>
          ))}
        </div>

        {/* FAQ accordion */}
        <div className="px-4 space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Frequently Asked Questions</p>
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <HelpCircle size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500">No results for "{query}"</p>
            </div>
          )}
          {filtered.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                <span className="text-sm font-semibold text-slate-800 pr-3 leading-snug">{f.q}</span>
                {open === i
                  ? <ChevronUp size={15} className="text-slate-400 shrink-0" />
                  : <ChevronDown size={15} className="text-slate-400 shrink-0" />
                }
              </button>
              {open === i && (
                <div className="px-4 pb-4 border-t border-slate-50">
                  <p className="text-sm text-slate-600 leading-relaxed pt-3">{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Past tickets */}
        {TICKET_HISTORY.length > 0 && (
          <div className="px-4 space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">My Support Tickets</p>
            {TICKET_HISTORY.map(t => (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-200 px-4 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t.subject}</p>
                  <p className="text-[11px] text-slate-400">{t.id} · {t.date}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  t.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>{t.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileAppLayout>
  )
}
