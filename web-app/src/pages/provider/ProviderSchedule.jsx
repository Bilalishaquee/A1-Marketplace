import { useState, useEffect } from 'react'
import ProviderLayout from '../../components/layout/ProviderLayout'
import { Clock, CalendarDays, Loader2 } from 'lucide-react'
import { myAppointments } from '../../lib/platformApi'

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })

const STATUS_STYLE = {
  CONFIRMED: 'bg-emerald-50 text-emerald-700',
  PENDING:   'bg-amber-50 text-amber-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

export default function ProviderSchedule() {
  const [appts, setAppts] = useState(null)

  useEffect(() => { myAppointments().then(setAppts).catch(() => setAppts([])) }, [])

  const sorted = [...(appts || [])].sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))

  return (
    <ProviderLayout title="Schedule" subtitle="Your upcoming appointments">
      <div className="p-6 space-y-5">
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <CalendarDays size={15} className="text-turquoise-500" />
            <h2 className="font-bold text-slate-900 text-sm">Appointments</h2>
            {appts && appts.length > 0 && (
              <span className="ml-auto text-[11px] font-bold bg-turquoise-100 text-turquoise-700 px-2 py-0.5 rounded-full">{appts.length}</span>
            )}
          </div>

          {appts === null ? (
            <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : sorted.length === 0 ? (
            <div className="px-5 py-16 text-center text-slate-400">
              <CalendarDays size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold">No appointments scheduled</p>
              <p className="text-xs mt-1">Appointments with clients will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {sorted.map(a => (
                <div key={a.id} className="flex gap-4 px-5 py-4">
                  <div className="text-center w-14 shrink-0">
                    <p className="text-[10px] text-slate-400 uppercase">{new Date(a.scheduledFor).toLocaleDateString('en-US',{ month:'short' })}</p>
                    <p className="text-lg font-extrabold text-slate-900 leading-none">{new Date(a.scheduledFor).getDate()}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900">{a.projectCategory || 'Appointment'}</p>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize ${STATUS_STYLE[a.status] || 'bg-slate-100 text-slate-500'}`}>
                        {(a.status || '').toLowerCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Clock size={11}/>{fmtDate(a.scheduledFor)} · {fmtTime(a.scheduledFor)}</p>
                    {a.notes && <p className="text-xs text-slate-400 mt-1">{a.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProviderLayout>
  )
}
