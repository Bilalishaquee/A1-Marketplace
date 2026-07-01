import { useState, useEffect } from 'react'
import ProviderLayout from '../../components/layout/ProviderLayout'
import { DollarSign, CheckCircle2, Loader2, Wallet, Info } from 'lucide-react'
import { myBids, dollars } from '../../lib/platformApi'

const catLabel = (p) => p?.scopeEstimate?.categoryLabel || p?.categoryKey || 'Project'

export default function ProviderEarnings() {
  const [bids, setBids] = useState(null)

  useEffect(() => { myBids().then(setBids).catch(() => setBids([])) }, [])

  const accepted = (bids || []).filter(b => b.status === 'ACCEPTED')
  const awardedValue = accepted.reduce((s, b) => s + (Number(b.amount) || 0), 0)

  return (
    <ProviderLayout title="Earnings" subtitle="Awarded work value">
      <div className="p-6 space-y-5">

        {/* Honest note — no payments backend */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            Payments and payouts aren't tracked yet. The figures below reflect the total value of bids that
            clients have accepted — not money paid out.
          </p>
        </div>

        {bids === null ? (
          <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500">Awarded Work Value</p>
                  <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center"><Wallet size={13} className="text-white" /></div>
                </div>
                <p className="text-xl font-extrabold text-emerald-600">{dollars(awardedValue)}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">From accepted bids</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500">Jobs Awarded</p>
                  <div className="w-7 h-7 bg-turquoise-500 rounded-lg flex items-center justify-center"><CheckCircle2 size={13} className="text-white" /></div>
                </div>
                <p className="text-xl font-extrabold text-slate-900">{accepted.length}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Bids accepted by clients</p>
              </div>
            </div>

            {/* Awarded jobs list */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-sm">Awarded Jobs</h2>
              </div>
              {accepted.length === 0 ? (
                <div className="px-5 py-16 text-center text-slate-400">
                  <DollarSign size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-semibold">No earnings data yet</p>
                  <p className="text-xs mt-1">Once a client accepts one of your bids, it will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {accepted.map(b => (
                    <div key={b.id} className="flex items-center justify-between px-5 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{catLabel(b.project)}</p>
                        <p className="text-xs text-slate-400">{[b.project?.location?.city, b.project?.location?.region].filter(Boolean).join(', ')}</p>
                      </div>
                      <p className="text-sm font-bold text-emerald-600">{dollars(b.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ProviderLayout>
  )
}
