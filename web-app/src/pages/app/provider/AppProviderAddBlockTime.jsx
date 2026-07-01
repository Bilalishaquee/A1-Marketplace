import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, CheckCircle2, Calendar, Clock } from 'lucide-react'

const today   = new Date()
const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const TIMES   = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM']

function buildDates() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })
}

const BLOCK_TYPES = [
  { id:'unavailable', label:'Unavailable',       color:'bg-red-500'    },
  { id:'site-visit',  label:'Site Visit',         color:'bg-blue-500'   },
  { id:'inspection',  label:'Inspection',         color:'bg-violet-500' },
  { id:'meeting',     label:'Client Meeting',     color:'bg-amber-500'  },
  { id:'other',       label:'Other',              color:'bg-slate-500'  },
]

export default function AppProviderAddBlockTime() {
  const navigate      = useNavigate()
  const dates         = buildDates()
  const [selDate,     setSelDate]   = useState(dates[0])
  const [selType,     setSelType]   = useState('unavailable')
  const [startTime,   setStartTime] = useState('9:00 AM')
  const [endTime,     setEndTime]   = useState('5:00 PM')
  const [note,        setNote]      = useState('')
  const [allDay,      setAllDay]    = useState(true)
  const [done,        setDone]      = useState(false)

  const handleSave = () => setDone(true)

  if (done) {
    const blockType = BLOCK_TYPES.find(t => t.id === selType)
    return (
      <MobileAppLayout role="provider">
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center pb-20">
          <div className="w-20 h-20 bg-turquoise-100 rounded-full flex items-center justify-center mb-5">
            <CheckCircle2 size={40} className="text-turquoise-500" />
          </div>
          <h2 className="font-extrabold text-slate-900 text-2xl mb-2">Block Added</h2>
          <p className="text-sm text-slate-500 mb-1">
            <strong>{blockType?.label}</strong> on{' '}
            {DAYS[selDate.getDay()]}, {MONTHS[selDate.getMonth()]} {selDate.getDate()}
          </p>
          <p className="text-xs text-slate-400 mb-8">
            {allDay ? 'All day' : `${startTime} – ${endTime}`}
          </p>
          <button onClick={() => navigate('/app/provider/schedule')}
            className="w-full py-3.5 bg-turquoise-500 text-white font-bold rounded-2xl mb-3">
            View Schedule
          </button>
          <button onClick={() => { setDone(false) }} className="text-sm text-slate-400 font-semibold">
            Add Another Block
          </button>
        </div>
      </MobileAppLayout>
    )
  }

  return (
    <MobileAppLayout role="provider">
      <div className="pt-10 pb-10 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 px-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <h1 className="font-extrabold text-slate-900 text-lg">Block Time</h1>
        </div>

        {/* Date picker */}
        <div className="px-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
            <Calendar size={11} className="inline mr-1" />Select Date
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {dates.map((d, i) => {
              const isSel = selDate?.toDateString() === d.toDateString()
              return (
                <button key={i} onClick={() => setSelDate(d)}
                  className={`shrink-0 flex flex-col items-center w-12 py-2.5 rounded-xl border-2 transition-all ${
                    isSel ? 'border-turquoise-500 bg-turquoise-500' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}>
                  <span className={`text-[10px] font-semibold ${isSel ? 'text-turquoise-200' : 'text-slate-400'}`}>{DAYS[d.getDay()].slice(0,1)}</span>
                  <span className={`text-sm font-extrabold mt-0.5 ${isSel ? 'text-white' : 'text-slate-800'}`}>{d.getDate()}</span>
                  <span className={`text-[9px] ${isSel ? 'text-turquoise-200' : 'text-slate-400'}`}>{MONTHS[d.getMonth()]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Block type */}
        <div className="px-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Block Type</p>
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map(bt => (
              <button key={bt.id} onClick={() => setSelType(bt.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                  selType === bt.id ? `${bt.color} text-white border-transparent` : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}>{bt.label}</button>
            ))}
          </div>
        </div>

        {/* Time */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">
              <Clock size={11} className="inline mr-1" />Time
            </p>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="accent-turquoise-500" />
              All day
            </label>
          </div>
          {!allDay && (
            <div className="flex gap-3">
              {[['Start', startTime, setStartTime], ['End', endTime, setEndTime]].map(([label, val, setter]) => (
                <div key={label} className="flex-1">
                  <p className="text-[11px] text-slate-400 mb-1">{label}</p>
                  <select value={val} onChange={e => setter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-turquoise-300">
                    {TIMES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note */}
        <div className="px-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Note (optional)</p>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            placeholder="Add details about this block..."
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-turquoise-300 resize-none" />
        </div>

        {/* Save */}
        <div className="px-4">
          <button onClick={handleSave}
            className="w-full py-4 bg-turquoise-500 hover:bg-turquoise-600 text-white font-bold rounded-2xl transition-colors shadow-lg">
            Save Block
          </button>
        </div>
      </div>
    </MobileAppLayout>
  )
}
