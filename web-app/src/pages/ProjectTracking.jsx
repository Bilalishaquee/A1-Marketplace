import { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ChevronLeft, CheckCircle2, Loader2, MapPin, Clock, ShieldCheck, Hammer,
  ClipboardList, Send, AlertCircle, Info, Pencil, Save, UserCheck, MapPinned,
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { getProject, projectBids, acceptBid, declineBid, postProject, updateProjectBudget, dollars } from '../lib/platformApi'

const STAGES = ['POSTED', 'MATCHED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED']
const STAGE_LABEL = { POSTED: 'Posted', MATCHED: 'Matched', SCHEDULED: 'Scheduled', IN_PROGRESS: 'In progress', COMPLETED: 'Complete' }
const STATUS_BADGE = {
  DRAFT: 'bg-slate-100 text-slate-500', ANALYZING: 'bg-slate-100 text-slate-500', ESTIMATED: 'bg-amber-100 text-amber-700',
  POSTED: 'bg-blue-100 text-blue-700', MATCHED: 'bg-blue-100 text-blue-700', SCHEDULED: 'bg-turquoise-100 text-turquoise-700',
  IN_PROGRESS: 'bg-turquoise-100 text-turquoise-700', COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-600', FAILED: 'bg-red-100 text-red-600',
}

export default function ProjectTracking() {
  const { id } = useParams()
  const [project, setProject] = useState(null) // null = loading
  const [bids, setBids] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [budgetValue, setBudgetValue] = useState('')

  const load = useCallback(() => {
    getProject(id).then(setProject).catch((e) => { setProject(undefined); setError(e.message) })
    projectBids(id).then(setBids).catch(() => setBids([]))
  }, [id])
  useEffect(load, [load])
  useEffect(() => {
    if (!project || project === undefined) return
    const value = project.selectedBudget ?? (project.selectedBudgetCents != null ? project.selectedBudgetCents / 100 : '')
    setBudgetValue(value ? String(Math.round(value)) : '')
  }, [project])

  const act = async (fn) => { setBusy(true); try { await fn() } catch (e) { setError(e.message) } finally { setBusy(false); load() } }
  const post = () => act(() => postProject(id))
  const accept = (bidId) => act(async () => { await acceptBid(bidId) })
  const decline = (bidId) => act(() => declineBid(bidId))
  const saveBudget = () => act(async () => {
    const cents = budgetValue === '' ? null : Math.max(0, Math.round(Number(budgetValue) * 100))
    const updated = await updateProjectBudget(id, cents)
    setProject(updated)
    setBudgetOpen(false)
  })

  if (project === null) return <Shell><div className="card text-center py-20"><Loader2 size={32} className="animate-spin text-turquoise-500 mx-auto" /></div></Shell>
  if (project === undefined) return (
    <Shell>
      <div className="card text-center py-16">
        <AlertCircle size={34} className="text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">Couldn’t open this project</h2>
        <p className="text-sm text-slate-500 mb-6">{error || 'It may have been removed.'}</p>
        <Link to="/dashboard" className="btn-primary px-6 py-3 inline-flex">Back to dashboard</Link>
      </div>
    </Shell>
  )

  const s = project.scopeEstimate
  const stageIdx = STAGES.indexOf(project.status)
  const title = s?.categoryLabel || project.categoryKey || 'Project'
  const selectedBudget = project.selectedBudget ?? (project.selectedBudgetCents != null ? project.selectedBudgetCents / 100 : null)

  return (
    <Shell>
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-turquoise-600 mb-5"><ChevronLeft size={15} /> Back to dashboard</Link>

      {/* Header */}
      <div className="card mb-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <span className={`badge ${STATUS_BADGE[project.status] || 'bg-slate-100 text-slate-500'} mb-2`}>{STAGE_LABEL[project.status] || project.status}</span>
            <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap gap-3">
              <span className="flex items-center gap-1"><MapPin size={11} /> {project.location?.region || project.location?.city || project.location?.zip || 'Location pending'}</span>
              <span className="flex items-center gap-1"><Clock size={11} /> Created {new Date(project.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
          {project.status === 'ESTIMATED' && (
            <button onClick={post} disabled={busy} className="btn-primary text-sm disabled:opacity-60"><Send size={15} /> Post for providers</button>
          )}
        </div>

        {s && (
          <div className="grid sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-100 text-center">
            <Stat label="Estimated range" val={`${dollars(s.priceLow)}–${dollars(s.priceHigh)}`} />
            <Stat label="Selected budget" val={selectedBudget != null ? dollars(selectedBudget) : 'Not set'} />
            <Stat label="Est. duration" val={s.estimatedDuration ? `${s.estimatedDuration.minDays}–${s.estimatedDuration.maxDays} days` : '—'} />
            <Stat label="Bids" val={String(bids.length)} />
          </div>
        )}
      </div>

      {/* Stage pipeline (only once posted) */}
      {stageIdx >= 0 && (
        <div className="card mb-5 overflow-x-auto">
          <div className="flex items-center min-w-max">
            {STAGES.map((st, i) => (
              <div key={st} className="flex items-center">
                <div className="flex flex-col items-center w-[92px] text-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 mb-1.5 text-xs font-bold ${
                    i <= stageIdx ? 'bg-turquoise-500 border-turquoise-500 text-white' : 'bg-white border-slate-200 text-slate-300'
                  }`}>{i < stageIdx ? <CheckCircle2 size={16} /> : i + 1}</div>
                  <p className={`text-[10px] font-semibold ${i <= stageIdx ? 'text-turquoise-600' : 'text-slate-400'}`}>{STAGE_LABEL[st]}</p>
                </div>
                {i < STAGES.length - 1 && <div className={`w-8 h-0.5 mb-6 ${i < stageIdx ? 'bg-turquoise-400' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Scope + description */}
        <div className="lg:col-span-2 space-y-5">
          {project.description && (
            <div className="card">
              <h3 className="font-bold text-slate-900 mb-2">Project description</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
            </div>
          )}
          {s && (
            <div className="card">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Budget</h3>
                  <p className="text-sm text-slate-500">
                    Selected budget: <span className="font-semibold text-slate-900">{selectedBudget != null ? dollars(selectedBudget) : 'Not set yet'}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Estimated range: {dollars(s.priceLow)}–{dollars(s.priceHigh)}</p>
                </div>
                <button onClick={() => setBudgetOpen(v => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  <Pencil size={13} /> Adjust budget
                </button>
              </div>
              {budgetOpen && (
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                    <input
                      type="number"
                      min="0"
                      value={budgetValue}
                      onChange={(e) => setBudgetValue(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise-300"
                      placeholder="Set selected budget"
                    />
                  </div>
                  <button onClick={saveBudget} disabled={busy} className="btn-primary text-sm disabled:opacity-60">
                    <Save size={14} /> Save budget
                  </button>
                </div>
              )}
            </div>
          )}
          {s?.scopeOfWork?.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><ClipboardList size={16} className="text-turquoise-500" /> Scope of work</h3>
              <ul className="space-y-2.5">
                {s.scopeOfWork.map((t, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm"><CheckCircle2 size={16} className="text-turquoise-500 shrink-0 mt-0.5" />
                    <div><span className="font-medium text-slate-800">{t.title}</span>{t.detail ? <span className="text-slate-500"> — {t.detail}</span> : null}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {s && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card"><h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><ShieldCheck size={16} className="text-turquoise-500" /> Permits</h3>
                {s.permitsRequired?.length ? <ul className="text-sm text-slate-600 space-y-1">{s.permitsRequired.map((p) => <li key={p}>• {p}</li>)}</ul> : <p className="text-sm text-slate-400">None typically required.</p>}</div>
              <div className="card"><h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Hammer size={16} className="text-turquoise-500" /> Suggested pros</h3>
                <div className="flex flex-wrap gap-2">{(s.suggestedTrades || []).map((t) => <span key={t} className="badge badge-turquoise">{t}</span>)}</div></div>
            </div>
          )}
        </div>

        {/* Bids */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-slate-900 mb-3">Bids ({bids.length})</h3>
            {error && <div className="text-xs text-red-600 mb-2 flex items-center gap-1"><AlertCircle size={12} /> {error}</div>}
            {bids.length === 0 ? (
              <div className="text-center py-6">
                <Info size={22} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">{project.status === 'POSTED' ? 'No bids yet — providers nearby will send quotes.' : 'Post your project to start receiving bids.'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bids.map((b) => (
                  <div key={b.id} className="border border-slate-100 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">{b.provider?.businessName || b.provider?.name || 'Provider'}</p>
                      <span className="text-sm font-bold text-turquoise-600">{dollars(b.amount)}</span>
                    </div>
                    {b.estimatedDurationDays ? <p className="text-xs text-slate-400 mt-0.5">{b.estimatedDurationDays} days</p> : null}
                    {b.siteVisitRequested ? (
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                        <MapPinned size={12} /> Site visit requested for accurate budget
                      </p>
                    ) : null}
                    {b.message ? <p className="text-xs text-slate-500 mt-1">{b.message}</p> : null}
                    {b.status === 'PENDING' && ['POSTED', 'MATCHED'].includes(project.status) ? (
                      <div className="grid gap-2 mt-2">
                        <Link to={`/pro/${b.provider?.id}`} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                          <UserCheck size={13} /> Review profile first
                        </Link>
                        <div className="flex gap-2">
                        <button onClick={() => accept(b.id)} disabled={busy} className="btn-primary text-xs py-1.5 px-3 flex-1 disabled:opacity-60">Accept</button>
                        <button onClick={() => decline(b.id)} disabled={busy} className="text-xs py-1.5 px-3 flex-1 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">Decline</button>
                        </div>
                      </div>
                    ) : (
                      <span className={`inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[b.status] || 'bg-slate-100 text-slate-500'}`}>{b.status}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      <Footer />
    </div>
  )
}
function Stat({ label, val }) {
  return <div><div className="text-base font-extrabold text-slate-900">{val}</div><div className="text-[11px] text-slate-400 mt-0.5">{label}</div></div>
}
