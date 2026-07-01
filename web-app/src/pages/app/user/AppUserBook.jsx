import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, CreditCard, CheckCircle2, Shield, Star, Calendar } from 'lucide-react'

const today = new Date()
function buildDates() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i + 1)
    return d
  })
}

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const DEFAULT_QUOTE = {
  proName: 'Mike Rodriguez', proAvatar: 'MR', proColor: 'bg-slate-900', proRating: 4.9,
  project: 'Kitchen Full Remodel',
  quote: { low: 42000, high: 48000, timeline: '8–10 weeks', deposit: 10500 },
  breakdown: [
    { item: '25% deposit (today)',    pct: 25, amount: 10500 },
    { item: '25% at mid-project',     pct: 25, amount: 10500 },
    { item: '50% on completion',      pct: 50, amount: 21000 },
  ],
}

export default function AppUserBook() {
  const navigate       = useNavigate()
  const location       = useLocation()
  const q              = location.state?.quote || DEFAULT_QUOTE
  const pro            = { name: q.proName, avatar: q.proAvatar, color: q.proColor, rating: q.proRating }
  const quote          = q.quote
  const dates          = buildDates()

  const [selDate, setSelDate] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [done, setDone]       = useState(false)
  const projectId             = 'P-' + Math.floor(1300 + Math.random() * 100)

  const confirm = () => {
    setConfirming(true)
    setTimeout(() => { setConfirming(false); setDone(true) }, 1600)
  }

  if (done) {
    return (
      <MobileAppLayout role="user">
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center pb-20">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h2 className="font-extrabold text-slate-900 text-2xl mb-2">You hired {pro.name}!</h2>
          <p className="text-sm text-slate-500 mb-1">Your project <strong>{q.project}</strong> has started.</p>
          <p className="text-xs text-slate-400 mb-8">Project ID: <strong>{projectId}</strong></p>

          <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left space-y-2 mb-6">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Deposit Charged</p>
            <p className="text-xl font-extrabold text-emerald-800">${(quote.deposit).toLocaleString()}</p>
            <p className="text-xs text-emerald-600">Visa ···· 4242 · Secure payment via Stripe</p>
          </div>

          <div className="w-full space-y-2 mb-8">
            {[
              ['Start Date', selDate ? `${DAYS[selDate.getDay()]}, ${MONTHS[selDate.getMonth()]} ${selDate.getDate()}` : 'TBD with contractor'],
              ['Timeline',   quote.timeline],
              ['Total Est.', `$${(quote.low/1000).toFixed(0)}K – $${(quote.high/1000).toFixed(0)}K`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm bg-white border border-slate-200 px-4 py-3 rounded-xl">
                <span className="text-slate-400">{k}</span>
                <span className="font-semibold text-slate-800">{v}</span>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/app/user/projects')}
            className="w-full py-3.5 bg-turquoise-500 text-white font-bold rounded-2xl mb-3">
            View My Projects
          </button>
          <button onClick={() => navigate('/app/user/messages')}
            className="text-sm text-slate-400 font-semibold">
            Message {pro.name}
          </button>
        </div>
      </MobileAppLayout>
    )
  }

  return (
    <MobileAppLayout role="user">
      <div className="pt-10 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 mb-6">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="font-extrabold text-slate-900 text-lg">Confirm Booking</h1>
            <p className="text-[11px] text-slate-400">Review and hire</p>
          </div>
        </div>

        <div className="px-4 space-y-4">
          {/* Pro card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-base font-extrabold text-white">
                {pro.avatar}
              </div>
              <div>
                <p className="font-bold text-slate-900">{pro.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={11} className={i <= Math.round(pro.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                  ))}
                  <span className="text-xs text-slate-500 ml-0.5">{pro.rating}</span>
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-slate-400">Quoted</p>
                <p className="font-extrabold text-slate-900">${(quote.low/1000).toFixed(0)}K–${(quote.high/1000).toFixed(0)}K</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">{q.project}</span>
              <span className="text-xs font-semibold text-slate-700">{quote.timeline}</span>
            </div>
          </div>

          {/* Start date */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
              <Calendar size={11} className="inline mr-1" />Select Start Date
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {dates.map((d, i) => {
                const isSel = selDate?.toDateString() === d.toDateString()
                const isWeekend = d.getDay() === 0 || d.getDay() === 6
                return (
                  <button key={i} onClick={() => setSelDate(d)}
                    className={`shrink-0 flex flex-col items-center w-11 py-2 rounded-xl border-2 transition-all ${
                      isSel
                        ? 'border-turquoise-500 bg-turquoise-500'
                        : isWeekend
                        ? 'border-slate-100 bg-slate-50 opacity-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}>
                    <span className={`text-[10px] font-semibold ${isSel ? 'text-turquoise-200' : 'text-slate-400'}`}>{DAYS[d.getDay()].slice(0,1)}</span>
                    <span className={`text-sm font-extrabold mt-0.5 ${isSel ? 'text-white' : 'text-slate-800'}`}>{d.getDate()}</span>
                    <span className={`text-[9px] ${isSel ? 'text-turquoise-200' : 'text-slate-400'}`}>{MONTHS[d.getMonth()]}</span>
                  </button>
                )
              })}
            </div>
            {!selDate && <p className="text-[11px] text-slate-400 mt-2">Or leave blank — the contractor will reach out to confirm a date.</p>}
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
              <CreditCard size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Visa ending in 4242</p>
              <p className="text-[11px] text-slate-400">Default · Expires 08/27</p>
            </div>
            <button onClick={() => navigate('/app/user/add-card')} className="text-xs font-semibold text-turquoise-600">Change</button>
          </div>

          {/* Milestone payment schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Payment Schedule</p>
            <div className="space-y-2.5">
              {[
                { label:'Deposit (today)',      pct: 25, amount: quote.deposit,                      active: true  },
                { label:'At project mid-point', pct: 25, amount: Math.round(quote.low * 0.25),       active: false },
                { label:'On completion',        pct: 50, amount: Math.round(quote.low * 0.50),       active: false },
              ].map((m, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${m.active ? 'bg-turquoise-50 border border-turquoise-100' : 'bg-slate-50'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${m.active ? 'bg-turquoise-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {m.pct}%
                  </div>
                  <span className={`flex-1 text-xs font-semibold ${m.active ? 'text-turquoise-700' : 'text-slate-500'}`}>{m.label}</span>
                  <span className={`text-sm font-extrabold ${m.active ? 'text-turquoise-800' : 'text-slate-600'}`}>${m.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust badge */}
          <div className="flex items-center gap-3 px-2">
            <Shield size={14} className="text-emerald-500 shrink-0" />
            <p className="text-xs text-slate-400">Your deposit is held securely. Released to the contractor only after work begins.</p>
          </div>

          {/* CTA */}
          <button onClick={confirm} disabled={confirming}
            className="w-full py-4 bg-turquoise-500 hover:bg-turquoise-600 disabled:opacity-70 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg">
            {confirming
              ? <><CheckCircle2 size={16} className="animate-pulse"/> Processing...</>
              : <>Confirm & Hire · Pay ${quote.deposit.toLocaleString()} deposit</>
            }
          </button>
          <p className="text-center text-[11px] text-slate-400">Secure checkout powered by Stripe</p>
        </div>
      </div>
    </MobileAppLayout>
  )
}
