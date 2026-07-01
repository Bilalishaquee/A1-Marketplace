import { useState, useEffect } from 'react'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { CheckCircle2, XCircle, Clock, MapPin, DollarSign, ChevronRight, Loader2, FileText } from 'lucide-react'
import { myBids, dollars } from '../../../lib/platformApi'

const catLabel = (p) => p?.scopeEstimate?.categoryLabel || p?.categoryKey || 'Project'
const loc = (l) => l ? [l.city, l.region].filter(Boolean).join(', ') : ''

const STATUS_STYLES = {
  PENDING:  'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  DECLINED: 'bg-slate-100 text-slate-500',
}

export default function AppProviderQuotes() {
  const [bids, setBids] = useState(null)
  const [tab, setTab]   = useState('all')
  const [detail, setDetail] = useState(null)

  useEffect(() => { myBids().then(setBids).catch(() => setBids([])) }, [])

  const visible = tab === 'all' ? (bids || []) : (bids || []).filter(b => b.status === tab)

  if (detail) {
    const se = detail.project?.scopeEstimate
    return (
      <MobileAppLayout role="provider">
        <div className="pt-10 pb-8">
          <div className="flex items-center gap-3 px-4 mb-6">
            <button onClick={() => setDetail(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <ChevronRight size={18} className="text-slate-600 rotate-180" />
            </button>
            <div>
              <h1 className="font-extrabold text-slate-900 text-lg">{catLabel(detail.project)}</h1>
              <p className="text-[11px] text-slate-400">Your bid</p>
            </div>
          </div>

          <div className="px-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Bid Details</p>
              {[
                ['Your bid', dollars(detail.amount)],
                ['Location', loc(detail.project?.location) || '—'],
                ['Duration', detail.estimatedDurationDays ? `${detail.estimatedDurationDays} days` : '—'],
                ['Est. range', se ? `${dollars(se.priceLow)} – ${dollars(se.priceHigh)}` : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-slate-400">{k}</span>
                  <span className="font-semibold text-slate-800">{v}</span>
                </div>
              ))}
            </div>

            {detail.message && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Your Message</p>
                <p className="text-sm text-slate-700 leading-relaxed">{detail.message}</p>
              </div>
            )}

            <div className={`py-3 rounded-2xl text-center text-sm font-bold ${
              detail.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700' :
              detail.status === 'DECLINED' ? 'bg-slate-100 text-slate-500' :
              'bg-amber-50 text-amber-700'
            }`}>
              {detail.status === 'ACCEPTED' ? 'Accepted by client' :
               detail.status === 'DECLINED' ? 'Not selected' :
               'Awaiting client decision'}
            </div>
          </div>
        </div>
      </MobileAppLayout>
    )
  }

  return (
    <MobileAppLayout role="provider">
      <div className="pt-12 pb-6 space-y-4">
        <h1 className="text-xl font-extrabold text-slate-900 px-4">My Quotes</h1>

        <div className="px-4">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {[['all','All'],['PENDING','Pending'],['ACCEPTED','Accepted'],['DECLINED','Declined']].map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}>{l}</button>
            ))}
          </div>
        </div>

        <div className="px-4 space-y-3">
          {bids === null ? (
            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : visible.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <FileText size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500">No quotes yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Bids you submit will appear here.</p>
            </div>
          ) : visible.map(b => (
            <button key={b.id} onClick={() => setDetail(b)}
              className="w-full text-left bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-bold text-slate-900 text-sm">{catLabel(b.project)}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{dollars(b.amount)}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[b.status] || STATUS_STYLES.PENDING}`}>
                  {b.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                {loc(b.project?.location) && <span className="flex items-center gap-0.5"><MapPin size={10}/>{loc(b.project?.location)}</span>}
                {b.estimatedDurationDays && <span className="flex items-center gap-0.5"><Clock size={10}/>{b.estimatedDurationDays}d</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </MobileAppLayout>
  )
}
