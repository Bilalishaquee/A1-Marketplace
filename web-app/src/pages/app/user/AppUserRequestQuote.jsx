import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, ChevronRight, CheckCircle2, Calendar, MapPin, Clock, Sparkles } from 'lucide-react'

const PROJECT_TYPES = [
  { label:'Kitchen Remodel',   emoji:'🍳' },
  { label:'Bathroom Renovation',emoji:'🚿' },
  { label:'Home Addition',     emoji:'🏗️' },
  { label:'Flooring',          emoji:'🪵' },
  { label:'Deck / Patio',      emoji:'🌿' },
  { label:'Painting',          emoji:'🎨' },
  { label:'Basement Finish',   emoji:'🏠' },
  { label:'Whole Home Reno',   emoji:'✨' },
]

const TIMELINES = [
  { label:'ASAP',           sub:'Ready to start within the week',        icon:'⚡' },
  { label:'Within a month', sub:'Flexible on exact start date',          icon:'📅' },
  { label:'1–3 months',     sub:'Planning ahead, no rush',               icon:'🗓️' },
  { label:'Just exploring', sub:'Getting quotes to budget for later',     icon:'🔍' },
]

export default function AppUserRequestQuote() {
  const navigate          = useNavigate()
  const [params]          = useSearchParams()
  const proName           = params.get('proName') || 'the contractor'
  const [step, setStep]   = useState(1)
  const [type, setType]   = useState('')
  const [desc, setDesc]   = useState('')
  const [timeline, setTimeline] = useState('')
  const [address, setAddress]   = useState('2847 Oak St, Austin, TX 78703')
  const [notes, setNotes]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]   = useState(false)

  const submit = () => {
    setSubmitting(true)
    setTimeout(() => { setSubmitting(false); setDone(true) }, 1400)
  }

  const canNext = {
    1: type && desc.length >= 10,
    2: !!timeline,
    3: !!address,
  }

  if (done) {
    return (
      <MobileAppLayout role="user">
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center pb-20">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-5">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="font-extrabold text-slate-900 text-xl mb-2">Quote Request Sent!</h2>
          <p className="text-sm text-slate-500 mb-1">Your request was sent to <strong>{proName}</strong>.</p>
          <p className="text-sm text-slate-400 mb-8">Expect a response within 24 hours.</p>

          <div className="w-full bg-white rounded-2xl border border-slate-200 p-4 text-left space-y-3 mb-6">
            {[['Project', type], ['Timeline', timeline], ['Address', address]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-slate-400">{k}</span>
                <span className="font-semibold text-slate-800 text-right max-w-[60%]">{v}</span>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/app/user/quotes')}
            className="w-full py-3.5 bg-turquoise-500 text-white font-bold rounded-2xl mb-3">
            View My Quotes
          </button>
          <button onClick={() => navigate('/app/user/home')}
            className="text-sm text-slate-400 font-semibold">
            Back to Home
          </button>
        </div>
      </MobileAppLayout>
    )
  }

  return (
    <MobileAppLayout role="user">
      <div className="pt-10 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 mb-2">
          <button onClick={() => step === 1 ? navigate(-1) : setStep(s => s - 1)}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="font-extrabold text-slate-900 text-lg">Request a Quote</h1>
            <p className="text-[11px] text-slate-400">to {proName} · Step {step} of 3</p>
          </div>
          <div className="flex gap-1">
            {[1,2,3].map(n => (
              <div key={n} className={`h-1.5 rounded-full transition-all ${n <= step ? 'bg-turquoise-500 w-6' : 'bg-slate-200 w-4'}`} />
            ))}
          </div>
        </div>

        {/* Step 1: Project type + description */}
        {step === 1 && (
          <div className="px-4 pt-4 space-y-5">
            <div>
              <p className="font-bold text-slate-900 mb-1">What do you need done?</p>
              <p className="text-xs text-slate-400 mb-4">Select the type of project</p>
              <div className="grid grid-cols-2 gap-2.5">
                {PROJECT_TYPES.map(p => (
                  <button key={p.label} onClick={() => setType(p.label)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
                      type === p.label
                        ? 'border-turquoise-500 bg-turquoise-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}>
                    <span className="text-xl">{p.emoji}</span>
                    <span className={`text-sm font-semibold leading-tight ${type === p.label ? 'text-turquoise-700' : 'text-slate-700'}`}>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">Describe the work</label>
              <textarea rows={4} value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="e.g. Full kitchen gut — new cabinets, quartz countertops, tile backsplash, and new appliances..."
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-turquoise-300 resize-none" />
              <p className="text-[11px] text-slate-400 mt-1">{desc.length} chars · min 10</p>
            </div>

            <button onClick={() => canNext[1] && setStep(2)} disabled={!canNext[1]}
              className="w-full py-3.5 bg-turquoise-500 disabled:opacity-40 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
              Continue <ChevronRight size={16}/>
            </button>
          </div>
        )}

        {/* Step 2: Timeline */}
        {step === 2 && (
          <div className="px-4 pt-4 space-y-5">
            <div>
              <p className="font-bold text-slate-900 mb-1">When do you want to start?</p>
              <p className="text-xs text-slate-400 mb-4">This helps the contractor plan their schedule</p>
              <div className="space-y-2.5">
                {TIMELINES.map(t => (
                  <button key={t.label} onClick={() => setTimeline(t.label)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      timeline === t.label
                        ? 'border-turquoise-500 bg-turquoise-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}>
                    <span className="text-2xl">{t.icon}</span>
                    <div>
                      <p className={`font-bold text-sm ${timeline === t.label ? 'text-turquoise-700' : 'text-slate-800'}`}>{t.label}</p>
                      <p className="text-[11px] text-slate-400">{t.sub}</p>
                    </div>
                    {timeline === t.label && <CheckCircle2 size={16} className="text-turquoise-500 ml-auto shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => canNext[2] && setStep(3)} disabled={!canNext[2]}
              className="w-full py-3.5 bg-turquoise-500 disabled:opacity-40 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
              Continue <ChevronRight size={16}/>
            </button>
          </div>
        )}

        {/* Step 3: Address + notes */}
        {step === 3 && (
          <div className="px-4 pt-4 space-y-5">
            <div>
              <p className="font-bold text-slate-900 mb-1">Where is the project?</p>
              <p className="text-xs text-slate-400 mb-4">The contractor will use this for their estimate</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">
                    <MapPin size={11} className="inline mr-1 text-slate-400" />Service Address
                  </label>
                  <input value={address} onChange={e => setAddress(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">
                    <Clock size={11} className="inline mr-1 text-slate-400" />Access Notes (optional)
                  </label>
                  <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Gate code is 1234. Best time to call is after 10 AM..."
                    className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-turquoise-300 resize-none" />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-2xl p-4 mt-4 space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Your Request Summary</p>
                {[['Project', type], ['Timeline', timeline], ['Address', address]].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-slate-400">{k}</span>
                    <span className="font-semibold text-slate-700 text-right max-w-[60%] truncate">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={submit} disabled={!canNext[3] || submitting}
              className="w-full py-3.5 bg-turquoise-500 disabled:opacity-40 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
              {submitting
                ? <><Sparkles size={16} className="animate-pulse"/> Sending...</>
                : <>Send Quote Request <ChevronRight size={16}/></>
              }
            </button>
          </div>
        )}
      </div>
    </MobileAppLayout>
  )
}
