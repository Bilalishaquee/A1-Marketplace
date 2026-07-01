import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle2,
  User, Video, Phone, MapPin, ArrowRight, Info, Loader2, CalendarDays
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { myAppointments } from '../lib/platformApi'
import { useAuth } from '../context/AuthContext'

const APPT_STATUS = {
  REQUESTED: { label: 'Requested', cls: 'bg-amber-50 text-amber-700' },
  CONFIRMED: { label: 'Confirmed', cls: 'bg-turquoise-50 text-turquoise-700' },
  COMPLETED: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500' },
}

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const TIME_SLOTS = [
  { time: '8:00 AM',  available: false },
  { time: '9:00 AM',  available: true  },
  { time: '10:00 AM', available: true  },
  { time: '11:00 AM', available: false },
  { time: '12:00 PM', available: false },
  { time: '1:00 PM',  available: true  },
  { time: '2:00 PM',  available: true  },
  { time: '3:00 PM',  available: true  },
  { time: '4:00 PM',  available: false },
  { time: '5:00 PM',  available: true  },
]

const MEETING_TYPES = [
  { id: 'video',    icon: Video,  label: 'Video Call',       desc: '30 min · Google Meet or Zoom' },
  { id: 'phone',    icon: Phone,  label: 'Phone Call',       desc: '30 min · We call you' },
  { id: 'in-person',icon: MapPin, label: 'In-Person Visit',  desc: '60 min · At your location' },
]

const AVAILABLE_DATES = [3,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23]

export default function Scheduling() {
  const today      = new Date(2026, 4, 1) // May 2026
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selDate, setSelDate]   = useState(null)
  const [selTime, setSelTime]   = useState(null)
  const [meetType, setMeetType] = useState('video')
  const [step, setStep]         = useState(0) // 0=select, 1=confirm, 2=done
  const { user } = useAuth()
  const [form, setForm]         = useState({ name: '', email: '', phone: '', notes: '' })
  const [appointments, setAppointments] = useState(null) // null = loading
  const navigate = useNavigate()

  useEffect(() => { myAppointments().then(setAppointments).catch(() => setAppointments([])) }, [])

  // Prefill the contact form from the authenticated user.
  useEffect(() => {
    if (user) setForm(f => ({
      ...f,
      name:  f.name  || user.name  || '',
      email: f.email || user.email || '',
      phone: f.phone || user.phone || '',
    }))
  }, [user])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  )

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const canProceed = selDate && selTime && meetType

  if (step === 2) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="card">
            <div className="w-20 h-20 bg-turquoise-500 rounded-full flex items-center justify-center mx-auto mb-5 relative">
              <CheckCircle2 size={40} className="text-white" />
              <div className="absolute inset-0 animate-ping rounded-full border-2 border-turquoise-300 opacity-30" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Consultation Booked!</h1>
            <p className="text-slate-500 mb-6">Your consultation is confirmed. You'll receive a calendar invite and reminder email shortly.</p>
            <div className="bg-turquoise-50 border border-turquoise-100 rounded-xl p-5 text-left space-y-3 mb-6">
              {[
                { label: 'Date', val: `May ${selDate}, ${year}` },
                { label: 'Time', val: selTime },
                { label: 'Type', val: MEETING_TYPES.find(m=>m.id===meetType)?.label },
                { label: 'With', val: 'A-1 Renovations Team' },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{r.label}</span>
                  <span className="font-semibold text-slate-900">{r.val}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Link to="/dashboard" className="btn-secondary flex-1 py-3 text-sm">Go to Dashboard</Link>
              <button onClick={() => { setStep(0); setSelDate(null); setSelTime(null) }}
                className="btn-primary flex-1 py-3 text-sm">Book Another</button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-slate-500 hover:text-turquoise-600 mb-5 transition-colors">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Schedule a Consultation</h1>
          <p className="text-slate-500 mt-2">Book a free consultation with our renovation specialists to discuss your project.</p>
        </div>

        {step === 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2 space-y-5">
              {/* Your consultations (real data) */}
              <div className="card">
                <h3 className="font-bold text-slate-900 mb-4">Your Consultations</h3>
                {appointments === null ? (
                  <div className="flex justify-center py-6">
                    <Loader2 size={24} className="text-turquoise-500 animate-spin" />
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-6 text-sm text-slate-400">
                    <CalendarDays size={28} className="mx-auto mb-2 text-slate-200" />
                    <p>No consultations booked yet. Pick a date and time below to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {appointments.map(a => {
                      const meta = APPT_STATUS[a.status] || APPT_STATUS.REQUESTED
                      const d = new Date(a.scheduledFor)
                      return (
                        <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                          <div className="w-10 h-10 bg-turquoise-50 rounded-xl flex items-center justify-center shrink-0">
                            <Calendar size={16} className="text-turquoise-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{a.projectCategory || 'Consultation'}</p>
                            <p className="text-xs text-slate-400">
                              {d.toLocaleDateString()} · {d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${meta.cls}`}>{meta.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Meeting type */}
              <div className="card">
                <h3 className="font-bold text-slate-900 mb-4">Consultation Type</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  {MEETING_TYPES.map(mt => (
                    <button
                      key={mt.id}
                      onClick={() => setMeetType(mt.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        meetType === mt.id
                          ? 'border-turquoise-500 bg-turquoise-50'
                          : 'border-slate-200 hover:border-turquoise-200'
                      }`}
                    >
                      <mt.icon size={20} className={meetType === mt.id ? 'text-turquoise-600' : 'text-slate-400'} />
                      <p className={`font-semibold text-sm mt-2 ${meetType === mt.id ? 'text-turquoise-700' : 'text-slate-800'}`}>{mt.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{mt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900 text-lg">{MONTHS[month]} {year}</h3>
                  <div className="flex gap-2">
                    <button onClick={prevMonth} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-turquoise-50 hover:border-turquoise-300 transition-colors">
                      <ChevronLeft size={16} />
                    </button>
                    <button onClick={nextMonth} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-turquoise-50 hover:border-turquoise-300 transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {DAYS.map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
                  ))}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((day, i) => {
                    if (!day) return <div key={i} />
                    const available = AVAILABLE_DATES.includes(day)
                    const selected  = selDate === day
                    const isToday   = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                    return (
                      <button
                        key={day}
                        disabled={!available}
                        onClick={() => { setSelDate(day); setSelTime(null) }}
                        className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                          selected   ? 'bg-turquoise-500 text-white shadow-md' :
                          available  ? 'hover:bg-turquoise-50 hover:text-turquoise-600 text-slate-800' :
                          'text-slate-300 cursor-not-allowed'
                        } ${isToday && !selected ? 'ring-2 ring-turquoise-300' : ''}`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>

                <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-turquoise-500" /> Available</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-200" /> Unavailable</span>
                </div>
              </div>

              {/* Time slots */}
              {selDate && (
                <div className="card">
                  <h3 className="font-bold text-slate-900 mb-4">
                    Available Times · May {selDate}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {TIME_SLOTS.map(slot => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setSelTime(slot.time)}
                        className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                          selTime === slot.time  ? 'bg-turquoise-500 border-turquoise-500 text-white' :
                          slot.available         ? 'border-slate-200 text-slate-700 hover:border-turquoise-400 hover:bg-turquoise-50' :
                          'border-slate-100 text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Booking summary */}
              <div className="card sticky top-4">
                <h3 className="font-bold text-slate-900 mb-4">Booking Summary</h3>
                {selDate && selTime ? (
                  <div className="space-y-3 text-sm mb-5">
                    <div className="flex items-center gap-3 bg-turquoise-50 rounded-xl p-3">
                      <Calendar size={16} className="text-turquoise-500 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-800">May {selDate}, {year}</p>
                        <p className="text-slate-500">{selTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                      {MEETING_TYPES.find(m=>m.id===meetType) && (() => {
                        const mt = MEETING_TYPES.find(m=>m.id===meetType)
                        return <><mt.icon size={16} className="text-slate-500 shrink-0" /><div><p className="font-semibold text-slate-800">{mt.label}</p><p className="text-slate-500">{mt.desc}</p></div></>
                      })()}
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                      <User size={16} className="text-slate-500 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-800">A-1 Renovations Specialist</p>
                        <p className="text-slate-500">Free · 30–60 min</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-slate-400">
                    <Calendar size={28} className="mx-auto mb-2 text-slate-200" />
                    <p>Select a date and time to see booking details</p>
                  </div>
                )}
                <button
                  onClick={() => canProceed && setStep(1)}
                  disabled={!canProceed}
                  className={`btn-primary w-full py-3 text-sm ${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Continue <ArrowRight size={16} />
                </button>

                <div className="mt-4 flex items-start gap-2 text-xs text-slate-400">
                  <Info size={13} className="shrink-0 mt-0.5" />
                  Free cancellation up to 4 hours before the consultation.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1 — Confirm details */}
        {step === 1 && (
          <div className="max-w-lg mx-auto">
            <div className="card mb-5 bg-turquoise-50 border-turquoise-200">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-turquoise-600" />
                <div>
                  <p className="font-bold text-turquoise-800">May {selDate}, {year} · {selTime}</p>
                  <p className="text-sm text-turquoise-600">{MEETING_TYPES.find(m=>m.id===meetType)?.label} · Free</p>
                </div>
              </div>
            </div>
            <div className="card space-y-4">
              <h2 className="font-bold text-slate-900 text-lg">Confirm Your Details</h2>
              {[
                { key: 'name',  label: 'Full name',      type: 'text',  ph: 'John Smith' },
                { key: 'email', label: 'Email address',  type: 'email', ph: 'john@example.com' },
                { key: 'phone', label: 'Phone number',   type: 'tel',   ph: '(555) 000-0000' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{f.label}</label>
                  <input type={f.type} className="input-field text-sm" placeholder={f.ph}
                    value={form[f.key]} onChange={e => setForm(fr=>({...fr,[f.key]:e.target.value}))} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes (optional)</label>
                <textarea rows={3} className="input-field resize-none text-sm"
                  placeholder="Tell us about your project so we can prepare…"
                  value={form.notes} onChange={e => setForm(fr=>({...fr,notes:e.target.value}))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(0)} className="btn-secondary flex-1 py-3 text-sm">← Back</button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!form.name || !form.email}
                  className={`btn-primary flex-1 py-3 text-sm ${(!form.name || !form.email) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Confirm Booking <CheckCircle2 size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
