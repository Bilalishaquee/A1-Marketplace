import { useState, useEffect } from 'react'
import ProviderLayout from '../../components/layout/ProviderLayout'
import { Clock, CheckCircle2, XCircle, ChevronDown, MapPin, DollarSign, Loader2, FileText } from 'lucide-react'
import { myBids, dollars } from '../../lib/platformApi'

const catLabel = (p) => p?.scopeEstimate?.categoryLabel || p?.categoryKey || 'Project'
const loc = (l) => l ? [l.city, l.region].filter(Boolean).join(', ') : ''

const STATUS_STYLE = {
  PENDING:  { cls:'bg-amber-50   text-amber-700   border border-amber-200',   label:'Pending'  },
  ACCEPTED: { cls:'bg-emerald-50 text-emerald-700 border border-emerald-200', label:'Accepted' },
  DECLINED: { cls:'bg-slate-100  text-slate-500   border border-slate-200',   label:'Declined' },
}

export default function ProviderQuotes() {
  const [bids, setBids]     = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => { myBids().then(setBids).catch(() => setBids([])) }, [])

  const visible = filter === 'all' ? (bids || []) : (bids || []).filter(b => b.status === filter)
  const count = (s) => (bids || []).filter(b => b.status === s).length

  return (
    <ProviderLayout title="My Quotes" subtitle="Bids you've submitted to homeowners">
      <div className="p-6 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            ['Pending',  count('PENDING'),  'text-amber-600'],
            ['Accepted', count('ACCEPTED'), 'text-emerald-600'],
            ['Declined', count('DECLINED'), 'text-slate-500'],
          ].map(([l,v,cls]) => (
            <div key={l} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500">{l}</p>
              <p className={`text-xl font-extrabold ${cls}`}>{bids === null ? '—' : v}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          {[['all','All'],['PENDING','Pending'],['ACCEPTED','Accepted'],['DECLINED','Declined']].map(([f,l]) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>{l}</button>
          ))}
        </div>

        {/* Bid cards */}
        {bids === null ? (
          <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-400">
            <FileText size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold">No quotes here yet</p>
            <p className="text-xs mt-1">Bids you submit on available jobs will show up here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(b => {
              const s = STATUS_STYLE[b.status] || STATUS_STYLE.PENDING
              const isOpen = expanded === b.id
              const se = b.project?.scopeEstimate
              return (
                <div key={b.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : b.id)}>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm">{catLabel(b.project)}</p>
                      <p className="text-xs text-slate-400">{loc(b.project?.location)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900 text-sm">{dollars(b.amount)}</p>
                      <p className="text-[11px] text-slate-400">Your bid</p>
                    </div>
                    <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.cls}`}>{s.label}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isOpen && (
                    <div className="border-t border-slate-50 px-4 py-4 space-y-3">
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        {se && <span className="flex items-center gap-1"><DollarSign size={11}/>Est. {dollars(se.priceLow)} – {dollars(se.priceHigh)}</span>}
                        {b.estimatedDurationDays && <span className="flex items-center gap-1"><Clock size={11}/>{b.estimatedDurationDays} days</span>}
                        {loc(b.project?.location) && <span className="flex items-center gap-1"><MapPin size={11}/>{loc(b.project?.location)}</span>}
                      </div>
                      {b.message && <p className="text-xs text-slate-600 leading-relaxed">{b.message}</p>}

                      {b.status === 'PENDING' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-xs text-amber-700 font-medium">
                          <Clock size={14}/> Awaiting client decision
                        </div>
                      )}
                      {b.status === 'ACCEPTED' && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 text-xs text-emerald-700 font-medium">
                          <CheckCircle2 size={14}/> Client accepted your bid
                        </div>
                      )}
                      {b.status === 'DECLINED' && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <XCircle size={14}/> This bid was not selected
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ProviderLayout>
  )
}
