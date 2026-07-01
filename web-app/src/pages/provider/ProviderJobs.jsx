import { useState, useEffect } from 'react'
import ProviderLayout from '../../components/layout/ProviderLayout'
import { MapPin, DollarSign, Clock, X, Send, Loader2, Inbox, CheckCircle2, Navigation, MapPinned } from 'lucide-react'
import { providerFeed, myBids, placeBid, dollars } from '../../lib/platformApi'

const catLabel = (p) => p?.scopeEstimate?.categoryLabel || p?.categoryKey || 'Project'
const loc = (l) => {
  if (!l) return ''
  if (l.city && l.state) return `${l.city}, ${l.state}`
  return l.region || l.city || l.zip || ''
}

export default function ProviderJobs() {
  const [tab, setTab]   = useState('available')
  const [feed, setFeed] = useState(null)
  const [bids, setBids] = useState(null)
  const [selected, setSelected] = useState(null)   // project being bid on
  const [amount, setAmount]     = useState('')
  const [message, setMessage]   = useState('')
  const [days, setDays]         = useState('')
  const [siteVisitRequested, setSiteVisitRequested] = useState(false)
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
        siteVisitRequested,
      })
      setSelected(null); setAmount(''); setMessage(''); setDays(''); setSiteVisitRequested(false)
      load()
    } catch (e) {
      setError(e?.message || 'Could not submit bid.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProviderLayout title="Jobs" subtitle="Browse open projects and submit bids">
      <div className="p-6 space-y-4">

        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          {[['available','Available'],['accepted','Awarded']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>{l}</button>
          ))}
        </div>

        {/* Available jobs */}
        {tab === 'available' && (
          feed === null ? (
            <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : feed.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-400">
              <Inbox size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold">No available jobs right now</p>
              <p className="text-xs mt-1">New projects from homeowners will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feed.map(j => {
                const se = j.scopeEstimate
                const already = bidProjectIds.has(j.id)
                return (
                  <div key={j.id} className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">{catLabel(j)}</p>
                        <p className="text-xs text-slate-400">{j.client?.firstName ? `Posted by ${j.client.firstName}` : 'Open project'}</p>
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-turquoise-50 text-turquoise-700">{j.bidCount || 0} bids</span>
                    </div>

                    {j.description ? (
                      <p className="text-sm text-slate-600 leading-relaxed mb-3">{j.description}</p>
                    ) : se?.scopeOfWork?.length ? (
                      <p className="text-sm text-slate-600 leading-relaxed mb-3">{se.scopeOfWork.map(t => t.title).join(' · ')}</p>
                    ) : null}

                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
                      {loc(j.location) && <span className="flex items-center gap-1"><MapPin size={11}/>{loc(j.location)}</span>}
                      {typeof j.distanceMiles === 'number' && <span className="flex items-center gap-1"><Navigation size={11}/>{j.distanceMiles.toFixed(0)} mi away</span>}
                      {se && <span className="flex items-center gap-1"><DollarSign size={11}/>{dollars(se.priceLow)} – {dollars(se.priceHigh)}</span>}
                      {se?.estimatedDuration && <span className="flex items-center gap-1"><Clock size={11}/>{se.estimatedDuration.minDays}–{se.estimatedDuration.maxDays} days</span>}
                    </div>

                    {already ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 text-xs font-semibold rounded-lg">
                        <CheckCircle2 size={13}/> Bid submitted
                      </span>
                    ) : (
                      <button onClick={() => { setSelected(j); setError(''); setSiteVisitRequested(false) }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-turquoise-500 hover:bg-turquoise-600 text-white text-sm font-semibold rounded-lg transition-colors">
                        <Send size={13}/> Place Bid
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Awarded jobs */}
        {tab === 'accepted' && (
          bids === null ? (
            <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : accepted.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-400">
              <CheckCircle2 size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold">No awarded jobs yet</p>
              <p className="text-xs mt-1">When a client accepts your bid, the job appears here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {accepted.map(b => (
                <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-bold text-slate-900">{catLabel(b.project)}</p>
                      <p className="text-xs text-slate-400">{loc(b.project?.location)}</p>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Awarded</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><DollarSign size={11}/>{dollars(b.amount)}</span>
                    {b.estimatedDurationDays && <span className="flex items-center gap-1"><Clock size={11}/>{b.estimatedDurationDays} days</span>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Place bid drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => !submitting && setSelected(null)} />
          <div className="relative bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Place a Bid</p>
                <p className="text-xs text-slate-400">{catLabel(selected)}</p>
              </div>
              <button onClick={() => setSelected(null)} disabled={submitting} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18}/></button>
            </div>

            <div className="p-5 space-y-5">
              {selected.scopeEstimate && (
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-700 mb-1">Estimated range</p>
                  {dollars(selected.scopeEstimate.priceLow)} – {dollars(selected.scopeEstimate.priceHigh)}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Preliminary bid amount (USD)</label>
                <div className="relative">
                  <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" min="0" placeholder="e.g. 4500" value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSiteVisitRequested(v => !v)}
                className={`w-full flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                  siteVisitRequested ? 'border-turquoise-300 bg-turquoise-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${
                  siteVisitRequested ? 'border-turquoise-500 bg-turquoise-500 text-white' : 'border-slate-300'
                }`}>
                  {siteVisitRequested ? <CheckCircle2 size={13} /> : null}
                </span>
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800"><MapPinned size={14} /> Request a site visit</span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500">Use this when you need to see the property before confirming the final budget.</span>
                </span>
              </button>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Estimated duration (days)</label>
                <input type="number" min="0" placeholder="e.g. 14" value={days} onChange={e => setDays(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Message to client (optional)</label>
                <textarea rows={4} placeholder="Describe your approach…" value={message} onChange={e => setMessage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-turquoise-300 resize-none" />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button onClick={submitBid} disabled={submitting || !amount}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-turquoise-500 hover:bg-turquoise-600 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14}/>} Submit Bid
              </button>
            </div>
          </div>
        </div>
      )}
    </ProviderLayout>
  )
}
