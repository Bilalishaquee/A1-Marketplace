import { useState, useEffect } from 'react'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { DollarSign, Wallet, CheckCircle2, Loader2, Info } from 'lucide-react'
import { myBids, dollars } from '../../../lib/platformApi'

const catLabel = (p) => p?.scopeEstimate?.categoryLabel || p?.categoryKey || 'Project'
const loc = (l) => l ? [l.city, l.region].filter(Boolean).join(', ') : ''

export default function AppProviderEarnings() {
  const [bids, setBids] = useState(null)

  useEffect(() => { myBids().then(setBids).catch(() => setBids([])) }, [])

  const accepted = (bids || []).filter(b => b.status === 'ACCEPTED')
  const awardedValue = accepted.reduce((s, b) => s + (Number(b.amount) || 0), 0)

  return (
    <MobileAppLayout role="provider">
      <div className="pt-12 pb-8 space-y-5">
        <h1 className="text-xl font-extrabold text-slate-900 px-4">Earnings</h1>

        {/* Honest note */}
        <div className="px-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
            <Info size={15} className="text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Payouts aren't tracked yet. Totals below reflect the value of bids clients have accepted, not money paid out.
            </p>
          </div>
        </div>

        {bids === null ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
        ) : (
          <>
            {/* KPI row */}
            <div className="px-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-50 rounded-2xl p-3 text-center">
                  <p className="font-extrabold text-base text-emerald-700">{dollars(awardedValue)}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Awarded Value</p>
                </div>
                <div className="bg-turquoise-50 rounded-2xl p-3 text-center">
                  <p className="font-extrabold text-base text-turquoise-700">{accepted.length}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Jobs Awarded</p>
                </div>
              </div>
            </div>

            {/* Awarded jobs */}
            <div className="px-4">
              <p className="text-xs font-bold text-slate-500 mb-2">Awarded Jobs</p>
              {accepted.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                  <DollarSign size={28} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-500">No earnings data yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">Accepted bids will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {accepted.map(b => (
                    <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
                      <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{catLabel(b.project)}</p>
                        <p className="text-[11px] text-slate-400 truncate">{loc(b.project?.location)}</p>
                      </div>
                      <p className="text-sm font-extrabold text-emerald-600 shrink-0">{dollars(b.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MobileAppLayout>
  )
}
