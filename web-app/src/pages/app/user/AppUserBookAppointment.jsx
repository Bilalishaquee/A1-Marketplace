import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Calendar, User } from 'lucide-react'

const CONTRACTORS = [
  { id: 1, name: 'Mike Rodriguez',  avatar: 'MR', color: 'bg-turquoise-500', project: 'Kitchen Remodel' },
  { id: 2, name: 'Carlos Morales',  avatar: 'CM', color: 'bg-blue-500',      project: 'ADU Conversion'  },
]

const APPT_TYPES = [
  { label: 'Site Visit',            emoji: '🏠', desc: 'Contractor visits your home'          },
  { label: 'Design Consultation',   emoji: '✏️', desc: 'Review plans, materials & finishes'  },
  { label: 'Progress Walkthrough',  emoji: '📋', desc: 'Walk through mid-project milestone'  },
  { label: 'Final Inspection',      emoji: '✅', desc: 'Confirm completion & punch list'      },
  { label: 'Video Call',            emoji: '💻', desc: 'Remote meeting — no travel needed'   },
]

const TIME_SLOTS = ['9:00 AM','10:00 AM','11:00 AM','1:00 PM','2:00 PM','3:00 PM','4:00 PM']

const today = new Date()
function buildDates() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i + 1)
    return d
  })
}
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function AppUserBookAppointment() {
  const navigate        = useNavigate()
  const [step,  setStep]  = useState(1)
  const [pro,   setPro]   = useState(null)
  const [type,  setType]  = useState(null)
  const [date,  setDate]  = useState(null)
  const [time,  setTime]  = useState(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [done,  setDone]  = useState(false)
  const dates = buildDates()

  const confirm = () => {
    setSaving(true)
    setTimeout(() => { setSaving(false); setDone(true) }, 1400)
  }

  if (done) {
    return (
      <MobileAppLayout role="user">
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center pb-20">
          <div className="w-16 h-16 bg-turquoise-100 rounded-full flex items-center justify-center mb-5">
            <CheckCircle2 size={32} className="text-turquoise-500" />
          </div>
          <h2 className="font-extrabold text-slate-900 text-xl mb-2">Appointment Booked!</h2>
          <p className="text-sm text-slate-500 mb-6">{type?.label} with {pro?.name}</p>

          <div className="w-full bg-white rounded-2xl border border-slate-200 p-4 text-left space-y-2 mb-6">
            {[
              ['Type',        type?.label],
              ['Date',        date ? `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}` : ''],
              ['Time',        time],
              ['Contractor',  pro?.name],
              ['Project',     pro?.project],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-slate-400">{k}</span>
                <span className="font-semibold text-slate-800">{v}</span>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/app/user/schedule')}
            className="w-full py-3.5 bg-turquoise-500 text-white font-bold rounded-2xl mb-3">
            View My Schedule
          </button>
          <button onClick={() => navigate('/app/user/home')} className="text-sm text-slate-400 font-semibold">
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
            <h1 className="font-extrabold text-slate-900 text-lg">Book Appointment</h1>
            <p className="text-[11px] text-slate-400">Step {step} of 4</p>
          </div>
          <div className="flex gap-1">
            {[1,2,3,4].map(n => (
              <div key={n} className={`h-1.5 rounded-full transition-all ${n <= step ? 'bg-turquoise-500 w-5' : 'bg-slate-200 w-3'}`} />
            ))}
          </div>
        </div>

        {/* Step 1: Select contractor */}
        {step === 1 && (
          <div className="px-4 pt-4 space-y-4">
            <div>
              <p className="font-bold text-slate-900 mb-1">Who are you meeting?</p>
              <p className="text-xs text-slate-400 mb-4">Select a contractor from your active projects</p>
              <div className="space-y-2.5">
                {CONTRACTORS.map(c => (
                  <button key={c.id} onClick={() => setPro(c)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      pro?.id === c.id ? 'border-turquoise-500 bg-turquoise-50' : 'border-slate-200 bg-white'
                    }`}>
                    <div className={`w-10 h-10 ${c.color} rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                      {c.avatar}
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold text-sm ${pro?.id === c.id ? 'text-turquoise-700' : 'text-slate-800'}`}>{c.name}</p>
                      <p className="text-[11px] text-slate-400">{c.project}</p>
                    </div>
                    {pro?.id === c.id && <CheckCircle2 size={16} className="text-turquoise-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => pro && setStep(2)} disabled={!pro}
              className="w-full py-3.5 bg-turquoise-500 disabled:opacity-40 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
              Continue <ChevronRight size={16}/>
            </button>
          </div>
        )}

        {/* Step 2: Appointment type */}
        {step === 2 && (
          <div className="px-4 pt-4 space-y-4">
            <div>
              <p className="font-bold text-slate-900 mb-1">What type of appointment?</p>
              <p className="text-xs text-slate-400 mb-4">Select the purpose of this meeting</p>
              <div className="space-y-2.5">
                {APPT_TYPES.map(t => (
                  <button key={t.label} onClick={() => setType(t)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      type?.label === t.label ? 'border-turquoise-500 bg-turquoise-50' : 'border-slate-200 bg-white'
                    }`}>
                    <span className="text-2xl">{t.emoji}</span>
                    <div className="flex-1">
                      <p className={`font-bold text-sm ${type?.label === t.label ? 'text-turquoise-700' : 'text-slate-800'}`}>{t.label}</p>
                      <p className="text-[11px] text-slate-400">{t.desc}</p>
                    </div>
                    {type?.label === t.label && <CheckCircle2 size={16} className="text-turquoise-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => type && setStep(3)} disabled={!type}
              className="w-full py-3.5 bg-turquoise-500 disabled:opacity-40 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
              Continue <ChevronRight size={16}/>
            </button>
          </div>
        )}

        {/* Step 3: Date + Time */}
        {step === 3 && (
          <div className="px-4 pt-4 space-y-5">
            <div>
              <p className="font-bold text-slate-900 mb-1">Pick a date</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide mt-3">
                {dates.map((d, i) => {
                  const isSel     = date?.toDateString() === d.toDateString()
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6
                  return (
                    <button key={i} onClick={() => !isWeekend && setDate(d)} disabled={isWeekend}
                      className={`shrink-0 flex flex-col items-center w-11 py-2 rounded-xl border-2 transition-all ${
                        isSel ? 'border-turquoise-500 bg-turquoise-500' :
                        isWeekend ? 'border-slate-100 bg-slate-50 opacity-40' :
                        'border-slate-200 bg-white'
                      }`}>
                      <span className={`text-[10px] font-semibold ${isSel ? 'text-turquoise-200' : 'text-slate-400'}`}>{DAYS[d.getDay()].slice(0,1)}</span>
                      <span className={`text-sm font-extrabold mt-0.5 ${isSel ? 'text-white' : 'text-slate-800'}`}>{d.getDate()}</span>
                      <span className={`text-[9px] ${isSel ? 'text-turquoise-200' : 'text-slate-400'}`}>{MONTHS[d.getMonth()]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-900 mb-3">Pick a time</p>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map(t => (
                  <button key={t} onClick={() => setTime(t)}
                    className={`py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                      time === t ? 'border-turquoise-500 bg-turquoise-500 text-white' : 'border-slate-200 bg-white text-slate-700'
                    }`}>{t}</button>
                ))}
              </div>
            </div>

            <button onClick={() => date && time && setStep(4)} disabled={!date || !time}
              className="w-full py-3.5 bg-turquoise-500 disabled:opacity-40 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
              Continue <ChevronRight size={16}/>
            </button>
          </div>
        )}

        {/* Step 4: Notes + confirm */}
        {step === 4 && (
          <div className="px-4 pt-4 space-y-4">
            <div>
              <p className="font-bold text-slate-900 mb-1">Any notes for the contractor?</p>
              <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Please bring countertop samples. Access code is #1234..."
                className="w-full mt-3 px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-turquoise-300 resize-none" />
            </div>

            {/* Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Appointment Summary</p>
              {[
                ['With',  pro?.name],
                ['Type',  type?.label],
                ['Date',  date ? `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}` : ''],
                ['Time',  time],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-slate-400">{k}</span>
                  <span className="font-semibold text-slate-700">{v}</span>
                </div>
              ))}
            </div>

            <button onClick={confirm} disabled={saving}
              className="w-full py-3.5 bg-turquoise-500 disabled:opacity-70 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors">
              {saving ? 'Confirming...' : <><CheckCircle2 size={16}/> Confirm Appointment</>}
            </button>
          </div>
        )}
      </div>
    </MobileAppLayout>
  )
}
