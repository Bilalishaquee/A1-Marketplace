import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { Clock, CalendarDays, Plus, Loader2 } from 'lucide-react'
import { myAppointments } from '../../../lib/platformApi'

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })

const STATUS_STYLE = {
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  PENDING:   'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

export default function AppProviderSchedule() {
  const navigate = useNavigate()
  const [appts, setAppts] = useState(null)

  useEffect(() => { myAppointments().then(setAppts).catch(() => setAppts([])) }, [])

  const sorted = [...(appts || [])].sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))

  return (
    <MobileAppLayout role="provider">
      <div className="pt-12 pb-8">
        <div className="flex items-center justify-between px-4 mb-5">
          <h1 className="text-xl font-extrabold text-slate-900">Schedule</h1>
          <button onClick={() => navigate('/app/provider/add-block-time')} className="w-8 h-8 bg-turquoise-500 rounded-full flex items-center justify-center shadow-sm">
            <Plus size={16} className="text-white" />
          </button>
        </div>

        <div className="px-4 mb-3 flex items-center gap-2">
          <CalendarDays size={14} className="text-slate-400" />
          <p className="text-sm font-bold text-slate-700">Upcoming Appointments</p>
          {appts && appts.length > 0 && (
            <span className="ml-auto text-[10px] font-bold bg-turquoise-100 text-turquoise-700 px-2 py-0.5 rounded-full">
              {appts.length}
            </span>
          )}
        </div>

        <div className="px-4 space-y-3">
          {appts === null ? (
            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : sorted.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <CalendarDays size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500">No appointments scheduled</p>
              <p className="text-xs text-slate-400 mt-0.5">Appointments with clients will appear here.</p>
            </div>
          ) : sorted.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-1 self-stretch rounded-full bg-turquoise-500" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <p className="font-bold text-slate-900 text-sm">{a.projectCategory || 'Appointment'}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLE[a.status] || 'bg-slate-100 text-slate-500'}`}>
                      {(a.status || '').toLowerCase()}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} className="text-slate-400" /> {fmtDate(a.scheduledFor)} · {fmtTime(a.scheduledFor)}
                    </div>
                    {a.notes && <p className="text-slate-400">{a.notes}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileAppLayout>
  )
}
