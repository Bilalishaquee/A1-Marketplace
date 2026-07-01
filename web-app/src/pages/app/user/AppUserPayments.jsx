import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, ArrowDownLeft, ArrowUpRight, RefreshCw, CreditCard, DollarSign } from 'lucide-react'

const TRANSACTIONS = [
  { id:'T-1047', type:'payment',   amount:15000, project:'Kitchen Remodel',    date:'May 3, 2026',  status:'completed', label:'Milestone 2 payment'    },
  { id:'T-1033', type:'deposit',   amount:8500,  project:'Kitchen Remodel',    date:'Apr 15, 2026', status:'completed', label:'Initial deposit (25%)'  },
  { id:'T-1019', type:'payment',   amount:9200,  project:'Backyard Deck',      date:'Mar 28, 2026', status:'completed', label:'Final payment'           },
  { id:'T-1002', type:'refund',    amount:1200,  project:'Backyard Deck',      date:'Mar 15, 2026', status:'completed', label:'Material credit returned'},
  { id:'T-0987', type:'payment',   amount:5000,  project:'ADU Conversion',     date:'Apr 18, 2026', status:'completed', label:'Initial deposit (10%)'  },
  { id:'T-0954', type:'pending',   amount:12750, project:'Kitchen Remodel',    date:'Due May 15',   status:'pending',   label:'Milestone 3 — due May 15'},
]

const TYPE_META = {
  payment: { icon: ArrowUpRight,   color:'text-red-500',     bg:'bg-red-50',      label:'Payment' },
  deposit: { icon: ArrowUpRight,   color:'text-red-500',     bg:'bg-red-50',      label:'Deposit' },
  refund:  { icon: ArrowDownLeft,  color:'text-emerald-500', bg:'bg-emerald-50',  label:'Refund'  },
  pending: { icon: RefreshCw,      color:'text-amber-500',   bg:'bg-amber-50',    label:'Pending' },
}

const total    = TRANSACTIONS.filter(t => t.type !== 'refund' && t.status === 'completed').reduce((s, t) => s + t.amount, 0)
const pending  = TRANSACTIONS.filter(t => t.status === 'pending').reduce((s, t) => s + t.amount, 0)
const thisMonth= TRANSACTIONS.filter(t => t.date.startsWith('May') && t.status === 'completed').reduce((s, t) => s + t.amount, 0)

export default function AppUserPayments() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')

  const visible = tab === 'all' ? TRANSACTIONS : TRANSACTIONS.filter(t => t.type === tab || t.status === tab)

  return (
    <MobileAppLayout role="user">
      <div className="pt-10 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 mb-5">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <h1 className="font-extrabold text-slate-900 text-lg">Payments</h1>
        </div>

        {/* KPI chips */}
        <div className="px-4 mb-5">
          <div className="grid grid-cols-3 gap-2">
            {[
              ['Total Paid',  `$${(total/1000).toFixed(1)}K`,    'text-slate-900',   'bg-slate-50'    ],
              ['Pending',     `$${(pending/1000).toFixed(1)}K`,  'text-amber-700',   'bg-amber-50'    ],
              ['This Month',  `$${(thisMonth/1000).toFixed(1)}K`,'text-turquoise-700','bg-turquoise-50'],
            ].map(([l, v, tc, bg]) => (
              <div key={l} className={`${bg} rounded-2xl p-3 text-center`}>
                <p className={`font-extrabold text-base ${tc}`}>{v}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment method */}
        <div className="px-4 mb-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
              <CreditCard size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Visa ending in 4242</p>
              <p className="text-[11px] text-slate-400">Default · Expires 08/27</p>
            </div>
            <button onClick={() => navigate('/app/user/add-card')} className="text-xs font-semibold text-turquoise-600 hover:text-turquoise-700">+ Add Card</button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="px-4 mb-3">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
            {['all','payment','refund','pending'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`shrink-0 flex-1 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                  tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}>{t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}</button>
            ))}
          </div>
        </div>

        {/* Transaction list */}
        <div className="px-4 space-y-2.5">
          {visible.map(t => {
            const meta = TYPE_META[t.type]
            const Icon = meta.icon
            return (
              <button key={t.id} onClick={() => navigate(`/app/user/invoice?id=${t.id}`)}
                className="w-full text-left bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                <div className={`w-9 h-9 ${meta.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon size={16} className={meta.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{t.label}</p>
                  <p className="text-[11px] text-slate-400 truncate">{t.project} · {t.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-extrabold ${t.type === 'refund' ? 'text-emerald-600' : t.status === 'pending' ? 'text-amber-600' : 'text-slate-900'}`}>
                    {t.type === 'refund' ? '+' : '-'}${(t.amount).toLocaleString()}
                  </p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    t.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>{t.status}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </MobileAppLayout>
  )
}
