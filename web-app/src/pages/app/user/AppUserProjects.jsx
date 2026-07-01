import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import {
  ChevronLeft, Clock, Loader2, FolderPlus, MapPin, Wrench,
} from 'lucide-react'
import { myProjects, dollars } from '../../../lib/platformApi'

// Map backend project status → display group + label + bar/pill styling + progress.
const STATUS_INFO = {
  DRAFT:       { group:'planning',  label:'Draft',        bar:'bg-slate-300',     pill:'bg-slate-100 text-slate-500',           progress:5  },
  ANALYZING:   { group:'planning',  label:'Analyzing',    bar:'bg-slate-300',     pill:'bg-slate-100 text-slate-500',           progress:10 },
  ESTIMATED:   { group:'planning',  label:'Estimated',    bar:'bg-slate-300',     pill:'bg-slate-100 text-slate-500',           progress:20 },
  POSTED:      { group:'planning',  label:'Posted',       bar:'bg-blue-400',      pill:'bg-blue-100 text-blue-700',             progress:30 },
  MATCHED:     { group:'planning',  label:'Matched',      bar:'bg-blue-400',      pill:'bg-blue-100 text-blue-700',             progress:40 },
  SCHEDULED:   { group:'active',    label:'Scheduled',    bar:'bg-turquoise-500', pill:'bg-turquoise-100 text-turquoise-700',   progress:55 },
  IN_PROGRESS: { group:'active',    label:'In Progress',  bar:'bg-turquoise-500', pill:'bg-turquoise-100 text-turquoise-700',   progress:70 },
  COMPLETED:   { group:'completed', label:'Completed',    bar:'bg-emerald-500',   pill:'bg-emerald-100 text-emerald-700',       progress:100 },
  CANCELLED:   { group:'completed', label:'Cancelled',    bar:'bg-slate-300',     pill:'bg-slate-100 text-slate-500',           progress:0  },
  FAILED:      { group:'completed', label:'Failed',       bar:'bg-red-400',       pill:'bg-red-100 text-red-700',               progress:0  },
}

const info = (p) => STATUS_INFO[p.status] || STATUS_INFO.DRAFT

const projectTitle = (p) =>
  p.scopeEstimate?.categoryLabel || p.categoryKey || 'Project'

const priceRange = (p) => {
  const s = p.scopeEstimate
  if (!s) return null
  return `${dollars(s.priceLow)} – ${dollars(s.priceHigh)}`
}

export default function AppUserProjects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState(null) // null = loading
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('all')

  useEffect(() => { myProjects().then(setProjects).catch(() => setProjects([])) }, [])

  const visible = (projects || []).filter(p => tab === 'all' || info(p).group === tab)

  if (selected) {
    const i = info(selected)
    const range = priceRange(selected)
    const scope = selected.scopeEstimate?.scopeOfWork || []
    return (
      <MobileAppLayout role="user">
        <div className="bg-white min-h-screen pb-8">

          {/* Header */}
          <div className="px-4 pt-10 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <ChevronLeft size={18} className="text-slate-600" />
              </button>
              <p className="text-sm font-semibold text-slate-400">My Projects</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0">
                <Wrench size={22} className="text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-slate-900 text-base leading-tight">{projectTitle(selected)}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selected.location?.city || selected.location?.zip || 'Location pending'}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${i.pill}`}>
                {i.label}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-4">

            {/* KPI row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                ['Est. Range', range || '—'],
                ['Bids', selected.bidCount ?? 0],
                ['Status', i.label],
              ].map(([l, v]) => (
                <div key={l} className="bg-slate-50 rounded-xl py-3 text-center border border-slate-100">
                  <p className="text-[11px] text-slate-400">{l}</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{v}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between mb-2">
                <p className="text-sm font-bold text-slate-900">Progress</p>
                <p className="text-xs text-slate-400">{i.progress}%</p>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${i.bar} rounded-full transition-all`} style={{width:`${i.progress}%`}} />
              </div>
            </div>

            {/* Description */}
            {selected.description && (
              <div>
                <p className="text-sm font-bold text-slate-900 mb-2">Description</p>
                <p className="text-xs text-slate-600 leading-relaxed">{selected.description}</p>
              </div>
            )}

            {/* Scope of work */}
            {scope.length > 0 && (
              <div>
                <p className="text-sm font-bold text-slate-900 mb-2">Scope of Work</p>
                <div className="space-y-1.5">
                  {scope.map((s, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50">
                      <p className="text-xs font-semibold text-slate-700">{s.title}</p>
                      {s.detail && <p className="text-[11px] text-slate-400 mt-0.5">{s.detail}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </MobileAppLayout>
    )
  }

  return (
    <MobileAppLayout role="user">
      <div className="px-4 pt-12 pb-6 space-y-4">
        <h1 className="text-xl font-extrabold text-slate-900">My Projects</h1>

        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {['all','active','planning','completed'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
          ))}
        </div>

        {/* Loading */}
        {projects === null && (
          <div className="flex justify-center py-16">
            <Loader2 size={26} className="text-turquoise-500 animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {projects !== null && visible.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FolderPlus size={22} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-600">
              {tab === 'all' ? 'No projects yet' : `No ${tab} projects`}
            </p>
            <button onClick={() => navigate('/app/user/quote')}
              className="mt-3 text-xs font-bold text-turquoise-600">
              Get an AI quote
            </button>
          </div>
        )}

        {/* Project cards */}
        {projects !== null && visible.length > 0 && (
          <div className="space-y-2">
            {visible.map(p => {
              const i = info(p)
              const range = priceRange(p)
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:bg-slate-50 transition-colors">

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                      <Wrench size={18} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{projectTitle(p)}</p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin size={10} />
                        {p.location?.city || p.location?.zip || 'Location pending'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${i.pill}`}>
                      {i.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-400">{range || 'Estimate pending'}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={10}/>{p.bidCount ?? 0} bid{(p.bidCount ?? 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${i.bar} rounded-full`} style={{width:`${i.progress}%`}} />
                  </div>

                </button>
              )
            })}
          </div>
        )}
      </div>
    </MobileAppLayout>
  )
}
