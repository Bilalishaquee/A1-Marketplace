import { useState, useEffect } from 'react'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { MapPin, DollarSign, Clock, Loader2, Inbox, CheckCircle2, Send, X, Navigation } from 'lucide-react'
import { providerFeed, myBids, placeBid, dollars } from '../../../lib/platformApi'

const catLabel = (p) => p?.scopeEstimate?.categoryLabel || p?.categoryKey || 'Project'
const loc = (l) => l ? [l.city, l.region].filter(Boolean).join(', ') : ''

export default function AppProviderJobs() {
  const [tab, setTab]   = useState('available')
  const [feed, setFeed] = useState(null)
  const [bids, setBids] = useState(null)
  const [selected, setSelected] = useState(null)
  const [amount, setAmount]     = useState('')
  const [message, setMessage]   = useState('')
  const [days, setDays]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')

  const load = () => {
    providerFeed().then(setFeed).catch(() => setFeed([]))
    myBids().then(setBids).catch(() => setBids([]))
  }
  useEffect(load, [])

  const accepted = (bids || []).filter(b => b.status === 'ACCEPTED')
  const bidProjectIds = new Set((bids || []).map(b => b.projectId))

  const submitBid = async () => {
    if (!selected || !amount) return
    setSubmitting(true); setError('')
    try {
      await placeBid(selected.id, {
        amountCents: Math.round(Number(amount) * 100),
        message: message || undefined,
        estimatedDurationDays: days ? Number(days) : undefined,
      })
      setSelected(null); setAmount(''); setMessage(''); setDays('')
      load()
    } catch (e) {
      setError(e?.message || 'Could not submit bid.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MobileAppLayout role="provider">
      <div className="pt-12 pb-6 space-y-4">
        <h1 className="text-xl font-extrabold text-slate-900 px-4">Jobs</h1>

        <div className="px-4">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {[['available','Available'],['accepted','Awarded']].map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}>{l}</button>
            ))}
          </div>
        </div>

        {/* Available */}
        {tab === 'available' && (
          <div className="px-4 space-y-3">
            {feed === null ? (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
            ) : feed.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                <Inbox size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500">No available jobs right now</p>
              </div>
            ) : feed.map(j => {
              const se = j.scopeEstimate
              const already = bidProjectIds.has(j.id)
              return (
                <div key={j.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-bold text-slate-900 flex-1 min-w-0 pr-2">{catLabel(j)}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-turquoise-100 text-turquoise-700 shrink-0">{j.bidCount || 0} bids</span>
                  </div>
                  {j.description ? (
                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">{j.description}</p>
                  ) : se?.scopeOfWork?.length ? (
                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">{se.scopeOfWork.map(t => t.title).join(' · ')}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3">
                    {loc(j.location) && <span className="flex items-center gap-0.5"><MapPin size={10}/>{loc(j.location)}</span>}
                    {typeof j.distanceMiles === 'number' && <span className="flex items-center gap-0.5"><Navigation size={10}/>{j.distanceMiles.toFixed(0)} mi</span>}
                    {se && <span className="flex items-center gap-0.5"><DollarSign size={10}/>{dollars(se.priceLow)}–{dollars(se.priceHigh)}</span>}
                  </div>
                  {already ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl">
                      <CheckCircle2 size={12}/> Bid submitted
                    </span>
                  ) : (
                    <button onClick={() => { setSelected(j); setError('') }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-turquoise-500 hover:bg-turquoise-600 text-white text-xs font-bold rounded-xl transition-colors">
                      <Send size={12}/> Place Bid
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Awarded */}
        {tab === 'accepted' && (
          <div className="px-4 space-y-3">
            {bids === null ? (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
            ) : accepted.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                <CheckCircle2 size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500">No awarded jobs yet</p>
              </div>
            ) : accepted.map(b => (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-bold text-slate-900">{catLabel(b.project)}</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">Awarded</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-0.5"><MapPin size={10}/>{loc(b.project?.location)}</span>
                  <span className="flex items-center gap-0.5"><DollarSign size={10}/>{dollars(b.amount)}</span>
                  {b.estimatedDurationDays && <span className="flex items-center gap-0.5"><Clock size={10}/>{b.estimatedDurationDays}d</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Place bid sheet */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !submitting && setSelected(null)} />
          <div className="relative w-full max-w-sm mx-auto bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-slate-200 rounded-full" /></div>
            <div className="flex items-start justify-between px-5 py-3 border-b border-slate-100">
              <div>
                <p className="font-extrabold text-slate-900 text-base">Place a Bid</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{catLabel(selected)}</p>
              </div>
              <button onClick={() => setSelected(null)} disabled={submitting} className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center"><X size={14} className="text-slate-500" /></button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {selected.scopeEstimate && (
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-700 mb-0.5">Estimated range</p>
                  {dollars(selected.scopeEstimate.priceLow)} – {dollars(selected.scopeEstimate.priceHigh)}
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Your bid amount (USD)</label>
                <input type="number" min="0" inputMode="numeric" placeholder="e.g. 4500" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Estimated duration (days)</label>
                <input type="number" min="0" inputMode="numeric" placeholder="e.g. 14" value={days} onChange={e => setDays(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Message (optional)</label>
                <textarea rows={3} placeholder="Describe your approach…" value={message} onChange={e => setMessage(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-turquoise-300 resize-none" />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button onClick={submitBid} disabled={submitting || !amount}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-turquoise-500 hover:bg-turquoise-600 disabled:opacity-40 text-white font-bold rounded-2xl transition-colors">
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15}/>} Submit Bid
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileAppLayout>
  )
}
