import { useSearchParams, useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, CheckCircle2, Clock, Landmark, Download } from 'lucide-react'
import { useState } from 'react'

const PAYOUTS = {
  'P-2041': { id:'P-2041', type:'payout', amount:12400,  project:'Kitchen Full Remodel',   client:'Sarah Johnson',    date:'May 3, 2026',  status:'completed', milestone:'Cabinetry installed', bank:'Chase ····4821', ref:'STR-2041-XK9' },
  'P-2038': { id:'P-2038', type:'payout', amount:8200,   project:'Full Home Renovation',   client:'Emily Rodriguez',  date:'Apr 28, 2026', status:'completed', milestone:'Drywall complete',    bank:'Chase ····4821', ref:'STR-2038-AM3' },
  'P-2031': { id:'P-2031', type:'payout', amount:15600,  project:'ADU Garage Conversion',  client:'Chris Wilson',     date:'Apr 15, 2026', status:'completed', milestone:'Structural complete', bank:'Chase ····4821', ref:'STR-2031-BZ7' },
  'P-2024': { id:'P-2024', type:'hold',   amount:9400,   project:'Bathroom Remodel',       client:'Barbara Anderson', date:'Due May 20',   status:'pending',   milestone:'Tile work complete',  bank:'Chase ····4821', ref:'—'            },
  'P-2017': { id:'P-2017', type:'payout', amount:5800,   project:'Composite Deck',         client:'David Williams',   date:'Mar 30, 2026', status:'completed', milestone:'Final walkthrough',   bank:'Chase ····4821', ref:'STR-2017-QP2' },
  'P-2009': { id:'P-2009', type:'bonus',  amount:500,    project:'Platform Bonus',          client:'A-1 Renovations',  date:'Mar 28, 2026', status:'completed', milestone:'Top Pro bonus Q1',   bank:'Chase ····4821', ref:'STR-2009-RR1' },
}

const TYPE_META = {
  payout: { label:'Payout',  bg:'bg-emerald-50',  text:'text-emerald-700',  border:'border-emerald-200' },
  hold:   { label:'Pending', bg:'bg-amber-50',    text:'text-amber-700',    border:'border-amber-200'   },
  bonus:  { label:'Bonus',   bg:'bg-blue-50',     text:'text-blue-700',     border:'border-blue-200'    },
}

export default function AppProviderPayoutDetail() {
  const [params]       = useSearchParams()
  const navigate       = useNavigate()
  const id             = params.get('id') || 'P-2041'
  const payout         = PAYOUTS[id] || PAYOUTS['P-2041']
  const meta           = TYPE_META[payout.type]
  const [downloaded,   setDownloaded] = useState(false)

  const handleDownload = () => { setDownloaded(true); setTimeout(() => setDownloaded(false), 2000) }

  return (
    <MobileAppLayout role="provider">
      <div className="pt-10 pb-10 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 px-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <h1 className="font-extrabold text-slate-900 text-lg">Payout Detail</h1>
        </div>

        {/* Amount card */}
        <div className={`mx-4 ${meta.bg} border ${meta.border} rounded-2xl p-5 text-center`}>
          <p className={`text-[11px] font-bold uppercase tracking-wide mb-1 ${meta.text}`}>{meta.label}</p>
          <p className={`text-4xl font-extrabold mb-1 ${meta.text}`}>${payout.amount.toLocaleString()}</p>
          <p className={`text-xs ${meta.text} opacity-70`}>{payout.date}</p>
        </div>

        {/* Status badge */}
        <div className="px-4">
          <div className={`flex items-center justify-center gap-2 py-3 rounded-2xl ${
            payout.status === 'completed' ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
          }`}>
            {payout.status === 'completed'
              ? <CheckCircle2 size={15} className="text-emerald-500" />
              : <Clock size={15} className="text-amber-500" />
            }
            <p className={`text-sm font-bold ${payout.status === 'completed' ? 'text-emerald-700' : 'text-amber-700'}`}>
              {payout.status === 'completed' ? 'Deposited to your bank' : 'Pending milestone approval'}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="px-4">
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-50">
            {[
              ['Transaction ID', payout.id],
              ['Project',        payout.project],
              ['Client',         payout.client],
              ['Milestone',      payout.milestone],
              ['Date',           payout.date],
              ['Reference',      payout.ref],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-slate-400 font-medium">{k}</span>
                <span className="text-sm font-semibold text-slate-800 text-right max-w-[55%]">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bank account */}
        <div className="px-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Landmark size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">{payout.bank}</p>
              <p className="text-[11px] text-slate-400">Payout destination</p>
            </div>
          </div>
        </div>

        {/* Download */}
        {payout.status === 'completed' && (
          <div className="px-4">
            <button onClick={handleDownload}
              className={`w-full py-3.5 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all ${
                downloaded ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}>
              {downloaded
                ? <><CheckCircle2 size={16}/> Receipt Downloaded</>
                : <><Download size={16}/> Download Receipt</>
              }
            </button>
          </div>
        )}
      </div>
    </MobileAppLayout>
  )
}
