import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, CheckCircle2, Camera, DollarSign, MessageSquare, Bell, Wrench } from 'lucide-react'

const ALL_ACTIVITY = [
  { id: 1,  type: 'milestone', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50', title: 'Milestone complete — Cabinetry',          desc: 'Upper row cabinet installation finished and inspected.',           time: 'Today 11:30 AM',  author: 'Mike Rodriguez', group: 'Today' },
  { id: 2,  type: 'message',   icon: MessageSquare,color: 'text-turquoise-500 bg-turquoise-50',title: 'Message from Mike Rodriguez',           desc: 'Can we discuss countertop material options this afternoon?',      time: 'Today 10:24 AM',  author: 'Mike Rodriguez', group: 'Today' },
  { id: 3,  type: 'photo',     icon: Camera,       color: 'text-violet-500 bg-violet-50',    title: '4 new site photos uploaded',              desc: 'Cabinet progress photos — upper row complete.',                   time: 'Today 9:00 AM',   author: 'Mike Rodriguez', group: 'Today' },
  { id: 4,  type: 'update',    icon: Bell,         color: 'text-blue-500 bg-blue-50',         title: 'Site update — material delivery',         desc: 'Countertop slab delivered and staged in the garage.',            time: 'Yesterday 3:00 PM',author: 'Mike Rodriguez', group: 'Yesterday' },
  { id: 5,  type: 'payment',   icon: DollarSign,   color: 'text-amber-500 bg-amber-50',       title: 'Milestone 2 payment released',           desc: '$8,200 payment released for Plumbing & Electrical milestone.',   time: 'Yesterday 9:00 AM',author: 'System',         group: 'Yesterday' },
  { id: 6,  type: 'milestone', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50',   title: 'Milestone complete — Electrical',        desc: 'Rough-in electrical passed city inspection (Inspector Dave).',   time: 'Apr 30 2:15 PM',  author: 'Inspector Dave', group: 'Apr 30' },
  { id: 7,  type: 'photo',     icon: Camera,       color: 'text-violet-500 bg-violet-50',     title: '6 new site photos uploaded',             desc: 'Electrical and drywall phase photos.',                           time: 'Apr 28 10:00 AM', author: 'Mike Rodriguez', group: 'Apr 28' },
  { id: 8,  type: 'milestone', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50',   title: 'Milestone complete — Plumbing',          desc: 'Rough-in plumbing passed city inspection.',                     time: 'Apr 25 4:00 PM',  author: 'Inspector Dave', group: 'Apr 25' },
  { id: 9,  type: 'update',    icon: Wrench,       color: 'text-slate-500 bg-slate-100',      title: 'Project started',                        desc: 'Mike Rodriguez and crew arrived on site. Demo underway.',        time: 'Apr 5 8:00 AM',   author: 'Mike Rodriguez', group: 'Apr 5' },
  { id: 10, type: 'payment',   icon: DollarSign,   color: 'text-amber-500 bg-amber-50',       title: 'Initial deposit received',               desc: '$8,500 deposit (25%) processed. Project confirmed.',            time: 'Apr 1 10:00 AM',  author: 'System',         group: 'Apr 1' },
]

const FILTERS = ['All', 'Milestones', 'Photos', 'Payments', 'Messages', 'Updates']
const FILTER_TYPES = { All: null, Milestones: 'milestone', Photos: 'photo', Payments: 'payment', Messages: 'message', Updates: 'update' }

export default function AppUserProjectActivity() {
  const navigate    = useNavigate()
  const [params]    = useSearchParams()
  const projectName = params.get('project') || 'Kitchen Full Remodel'
  const [filter, setFilter] = useState('All')

  const filtered = ALL_ACTIVITY.filter(a =>
    !FILTER_TYPES[filter] || a.type === FILTER_TYPES[filter]
  )

  const groups = [...new Set(filtered.map(a => a.group))]

  return (
    <MobileAppLayout role="user">
      <div className="pt-10 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 mb-5">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="font-extrabold text-slate-900 text-base leading-tight">Activity Log</h1>
            <p className="text-[11px] text-slate-400">{projectName}</p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-2 mb-4">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filter === f
                  ? 'bg-turquoise-500 text-white border-turquoise-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}>{f}</button>
          ))}
        </div>

        {/* Timeline */}
        <div className="px-4 space-y-6">
          {groups.map(group => (
            <div key={group}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">{group}</p>
              <div className="space-y-3">
                {filtered.filter(a => a.group === group).map((a, i) => (
                  <div key={a.id} className="flex items-start gap-3">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${a.color}`}>
                        <a.icon size={14} />
                      </div>
                      {i < filtered.filter(x => x.group === group).length - 1 && (
                        <div className="w-px flex-1 bg-slate-100 mt-1.5 min-h-[16px]" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-1">
                      <p className="text-sm font-semibold text-slate-800 leading-snug">{a.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{a.desc}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-slate-300">{a.time}</p>
                        <span className="text-[10px] text-slate-300">·</span>
                        <p className="text-[10px] text-slate-400">{a.author}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileAppLayout>
  )
}
