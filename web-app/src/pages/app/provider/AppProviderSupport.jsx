import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, MessageSquare, Phone, Mail, Search, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'

const FAQS = [
  { q:'How do I accept a quote request?',         a:'Go to Quote Requests in your menu. Tap any new request to view details, then tap "Accept" to confirm. The homeowner will be notified immediately and a project will be created.' },
  { q:'When do I receive payouts?',               a:'Payouts are released when milestone conditions are met and the homeowner approves the stage. Funds typically settle in your bank account within 2–3 business days.' },
  { q:'How do I update my availability?',         a:'Toggle "Accepting New Jobs" in your Profile tab to pause or resume new quote requests. Your profile will be hidden from search while paused.' },
  { q:'Can I modify a quote after sending?',      a:'Once a quote is accepted by the homeowner, it cannot be changed. You can message the client to discuss adjustments, which can be handled via a change order.' },
  { q:'How do milestone payments work?',          a:'Projects are split into payment milestones (typically 25% deposit, 25% mid, 50% on completion). Each payout is released after the homeowner confirms the milestone is done.' },
  { q:'What if a client disputes my work?',       a:'Contact our support team immediately. We have a dispute resolution process that includes reviewing site logs, photos, and messages. Keep your site log updated to protect yourself.' },
  { q:'How do I upload my license/insurance?',    a:'Go to Settings > Compliance or tap License & Certs in your Profile. Upload documents directly — they are verified within 24 hours.' },
  { q:'How do I add a team member?',              a:'Go to Settings > Business Info and update your team size. Individual team member accounts are currently in beta — contact support to enable this feature.' },
]

const TICKETS = [
  { id:'T-5821', subject:'Payout delay for P-2038', status:'resolved', date:'Apr 25' },
  { id:'T-5714', subject:'Quote request not showing', status:'resolved', date:'Mar 12' },
]

export default function AppProviderSupport() {
  const navigate      = useNavigate()
  const [search,      setSearch]      = useState('')
  const [openFaq,     setOpenFaq]     = useState(null)
  const [chatSent,    setChatSent]    = useState(false)

  const filtered = FAQS.filter(f =>
    f.q.toLowerCase().includes(search.toLowerCase()) ||
    f.a.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <MobileAppLayout role="provider">
      <div className="pt-10 pb-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 px-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <h1 className="font-extrabold text-slate-900 text-lg">Help & Support</h1>
        </div>

        {/* Contact options */}
        <div className="px-4 grid grid-cols-3 gap-2">
          {[
            { icon: MessageSquare, label:'Live Chat',  color:'bg-turquoise-500', action: () => setChatSent(true) },
            { icon: Phone,         label:'Call Us',    color:'bg-blue-500',      action: () => {} },
            { icon: Mail,          label:'Email',      color:'bg-violet-500',    action: () => {} },
          ].map(({ icon: Icon, label, color, action }) => (
            <button key={label} onClick={action}
              className="flex flex-col items-center gap-2 py-4 bg-white rounded-2xl border border-slate-200 hover:border-turquoise-300 hover:bg-turquoise-50/30 transition-all">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                <Icon size={18} className="text-white" />
              </div>
              <span className="text-xs font-semibold text-slate-700">{label}</span>
            </button>
          ))}
        </div>

        {chatSent && (
          <div className="mx-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            <p className="text-xs font-semibold text-emerald-700">Chat started — a support agent will respond within 2 minutes.</p>
          </div>
        )}

        {/* Search */}
        <div className="px-4">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search help articles..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
          </div>
        </div>

        {/* FAQ */}
        <div className="px-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Frequently Asked</p>
          <div className="space-y-2">
            {filtered.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                  <p className="text-sm font-semibold text-slate-800 pr-4">{faq.q}</p>
                  {openFaq === i
                    ? <ChevronUp size={15} className="text-slate-400 shrink-0" />
                    : <ChevronDown size={15} className="text-slate-400 shrink-0" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 border-t border-slate-50">
                    <p className="text-sm text-slate-600 leading-relaxed pt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-6">No results for "{search}"</p>
            )}
          </div>
        </div>

        {/* Past tickets */}
        {TICKETS.length > 0 && (
          <div className="px-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Past Tickets</p>
            <div className="space-y-2">
              {TICKETS.map(t => (
                <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{t.subject}</p>
                    <p className="text-[11px] text-slate-400">{t.id} · {t.date}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MobileAppLayout>
  )
}
