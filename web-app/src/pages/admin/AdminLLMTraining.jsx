import { useState, useEffect, useCallback, useRef } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import {
  listExamples, createExample, updateExample, approveExample, rejectExample,
  deleteExample, importExamples, downloadCsvTemplate,
  listJobs, triggerJob, cancelJob, getJob,
  listModels, activateModel, deactivateModel,
  listPrompts, getActivePrompt, savePrompt, activatePrompt,
  getMetrics,
} from '../../lib/trainingApi'
import {
  BrainCircuit, Upload, Check, X, Trash2, ChevronDown, ChevronUp,
  Play, Square, RefreshCw, Star, Zap, BookOpen, Settings2,
  AlertTriangle, CheckCircle, Clock, Loader2, Plus, Download,
  ToggleLeft, ToggleRight, Eye, Edit3, History,
} from 'lucide-react'

const TABS = [
  { id: 'data', label: 'Training Data', icon: Upload },
  { id: 'jobs', label: 'Fine-tuning Jobs', icon: Zap },
  { id: 'models', label: 'Model Registry', icon: BrainCircuit },
  { id: 'prompts', label: 'Prompt Lab', icon: BookOpen },
]

const CATEGORIES = [
  'bathroom_remodeling', 'kitchen_remodeling', 'flooring_services',
  'basement_finishing', 'roofing_services', 'siding_exterior',
  'decks_patios_outdoor', 'painting_drywall', 'electrical_services',
  'plumbing_services', 'hvac_services', 'windows_doors',
  'framing_structural', 'masonry_concrete', 'custom_carpentry',
  'home_additions', 'smart_home_security', 'landscaping_drainage',
  'cleaning_restoration', 'handyman',
]

const STATUS_BADGE = {
  PENDING:  { label: 'Pending',  color: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  QUEUED:   { label: 'Queued',   color: 'bg-slate-100 text-slate-600' },
  UPLOADING:{ label: 'Uploading',color: 'bg-blue-100 text-blue-700' },
  RUNNING:  { label: 'Training', color: 'bg-violet-100 text-violet-700' },
  SUCCEEDED:{ label: 'Done',     color: 'bg-emerald-100 text-emerald-700' },
  FAILED:   { label: 'Failed',   color: 'bg-red-100 text-red-700' },
  CANCELLED:{ label: 'Cancelled',color: 'bg-slate-100 text-slate-500' },
}

function Badge({ status }) {
  const s = STATUS_BADGE[status] ?? { label: status, color: 'bg-slate-100 text-slate-600' }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color}`}>{s.label}</span>
}

function StarRating({ value, onChange, readOnly }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" disabled={readOnly}
          onClick={() => onChange?.(n / 5)}
          className={`${!readOnly ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}>
          <Star size={14} className={n <= Math.round((value ?? 0) * 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} />
        </button>
      ))}
    </div>
  )
}

// ── Tab 1: Training Data ──────────────────────────────────────────────────────

function TrainingDataTab() {
  const [examples, setExamples] = useState([])
  const [total, setTotal] = useState(0)
  const [countByStatus, setCountByStatus] = useState({})
  const [filter, setFilter] = useState({ status: '', categoryKey: '', search: '' })
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', categoryKey: 'kitchen_remodeling', description: '', zip: '',
    actualLowUsd: '', actualMedUsd: '', actualHighUsd: '', durationDays: '',
    materialQuality: 'mid', notes: '', qualityScore: 0.6,
    scopeOfWork: '', permitsRequired: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listExamples(filter)
      setExamples(data.items ?? [])
      setTotal(data.total ?? 0)
      setCountByStatus(data.countByStatus ?? {})
    } finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createExample({
        ...form,
        actualLowCents: form.actualLowUsd ? Math.round(parseFloat(form.actualLowUsd) * 100) : null,
        actualMedCents: form.actualMedUsd ? Math.round(parseFloat(form.actualMedUsd) * 100) : null,
        actualHighCents: form.actualHighUsd ? Math.round(parseFloat(form.actualHighUsd) * 100) : null,
        durationDays: form.durationDays ? parseInt(form.durationDays) : null,
        scopeOfWork: form.scopeOfWork ? form.scopeOfWork.split('\n').filter(Boolean).map(t => ({ title: t.trim() })) : null,
        permitsRequired: form.permitsRequired ? form.permitsRequired.split(',').map(s => s.trim()).filter(Boolean) : [],
      })
      setShowForm(false)
      setForm({ title:'', categoryKey:'kitchen_remodeling', description:'', zip:'', actualLowUsd:'', actualMedUsd:'', actualHighUsd:'', durationDays:'', materialQuality:'mid', notes:'', qualityScore:0.6, scopeOfWork:'', permitsRequired:'' })
      load()
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  const handleApprove = async (id) => {
    await approveExample(id)
    load()
  }
  const handleReject = async (id) => {
    await rejectExample(id)
    load()
  }
  const handleDelete = async (id) => {
    if (!confirm('Delete this example?')) return
    await deleteExample(id)
    load()
  }

  const fmtCents = (c) => c ? `$${Math.round(c / 100).toLocaleString()}` : '—'
  const approved = countByStatus.APPROVED ?? 0
  const pending = countByStatus.PENDING ?? 0
  const rejected = countByStatus.REJECTED ?? 0

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: total, color: 'text-slate-900' },
          { label: 'Pending', value: pending, color: 'text-amber-600' },
          { label: 'Approved', value: approved, color: 'text-emerald-600' },
          { label: 'Rejected', value: rejected, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Actions + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setShowForm(v => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          <Plus size={15} /> Add Example
        </button>
        <button onClick={downloadCsvTemplate}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Download size={14} /> CSV Template
        </button>
        <div className="flex-1" />
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select value={filter.categoryKey} onChange={e => setFilter(f => ({ ...f, categoryKey: e.target.value }))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
        </select>
        <input value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          placeholder="Search description…"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm w-48" />
      </div>

      {/* Upload form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Add Training Example</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Title (optional)</label>
              <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="e.g. Kitchen Remodel - LA 2024" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category *</label>
              <select value={form.categoryKey} onChange={e => setForm(f=>({...f,categoryKey:e.target.value}))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Project Description * (this becomes the AI prompt input)</label>
              <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))}
                required rows={4} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none"
                placeholder="Full kitchen remodel, approximately 180 sq ft. New shaker cabinets, quartz countertops, tile backsplash, LVP flooring. Keeping existing layout. No structural changes." />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">ZIP Code *</label>
              <input value={form.zip} onChange={e => setForm(f=>({...f,zip:e.target.value}))}
                required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="90012" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Material Quality</label>
              <select value={form.materialQuality} onChange={e => setForm(f=>({...f,materialQuality:e.target.value}))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="builder">Builder (economy)</option>
                <option value="mid">Mid-range</option>
                <option value="luxury">Luxury / Premium</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Actual Cost — Low ($)</label>
              <input type="number" value={form.actualLowUsd} onChange={e => setForm(f=>({...f,actualLowUsd:e.target.value}))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="28000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Actual Cost — Mid ($) *</label>
              <input type="number" value={form.actualMedUsd} onChange={e => setForm(f=>({...f,actualMedUsd:e.target.value}))}
                required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="42000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Actual Cost — High ($)</label>
              <input type="number" value={form.actualHighUsd} onChange={e => setForm(f=>({...f,actualHighUsd:e.target.value}))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="65000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Actual Duration (days)</label>
              <input type="number" value={form.durationDays} onChange={e => setForm(f=>({...f,durationDays:e.target.value}))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="35" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Scope of Work (one task per line)</label>
              <textarea value={form.scopeOfWork} onChange={e => setForm(f=>({...f,scopeOfWork:e.target.value}))}
                rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none"
                placeholder="Demo existing cabinets and countertops&#10;Install new shaker cabinets&#10;Install quartz countertops" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Permits Required (comma-separated)</label>
              <input value={form.permitsRequired} onChange={e => setForm(f=>({...f,permitsRequired:e.target.value}))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Building permit, Electrical permit" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Example Quality</label>
              <StarRating value={form.qualityScore} onChange={(v) => setForm(f=>({...f,qualityScore:v}))} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes / Caveats</label>
              <textarea value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}
                rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none"
                placeholder="Any context that may affect interpretation (e.g. occupied home, historic building)" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save Example
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500 text-xs">Title / Description</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 text-xs">Category</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 text-xs">Cost (mid)</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 text-xs">Quality</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 text-xs">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 text-xs">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                <Loader2 className="animate-spin mx-auto" size={20} />
              </td></tr>
            )}
            {!loading && examples.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                No examples yet. Add your first real completed project above.
              </td></tr>
            )}
            {examples.map(ex => (
              <>
                <tr key={ex.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 truncate max-w-xs">{ex.title || '(untitled)'}</p>
                    <p className="text-slate-400 text-xs truncate max-w-xs">{ex.description?.slice(0, 80)}…</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{ex.categoryKey?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{fmtCents(ex.actualMedCents)}</td>
                  <td className="px-4 py-3"><StarRating value={ex.qualityScore} readOnly /></td>
                  <td className="px-4 py-3"><Badge status={ex.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}
                        className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                        {expanded === ex.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {ex.status !== 'APPROVED' && (
                        <button onClick={() => handleApprove(ex.id)}
                          className="rounded p-1 text-emerald-500 hover:bg-emerald-50" title="Approve">
                          <Check size={14} />
                        </button>
                      )}
                      {ex.status !== 'REJECTED' && (
                        <button onClick={() => handleReject(ex.id)}
                          className="rounded p-1 text-amber-500 hover:bg-amber-50" title="Reject">
                          <X size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(ex.id)}
                        className="rounded p-1 text-red-400 hover:bg-red-50" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded === ex.id && (
                  <tr key={`${ex.id}-exp`} className="bg-slate-50">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-medium text-slate-700 mb-1">Full Description</p>
                          <p className="text-slate-600 whitespace-pre-wrap">{ex.description}</p>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="font-medium text-slate-700 mb-1">Cost Range</p>
                            <p className="text-slate-600">{fmtCents(ex.actualLowCents)} – {fmtCents(ex.actualMedCents)} – {fmtCents(ex.actualHighCents)}</p>
                          </div>
                          {ex.durationDays && <div><p className="font-medium text-slate-700">Duration</p><p className="text-slate-600">{ex.durationDays} days</p></div>}
                          {ex.notes && <div><p className="font-medium text-slate-700">Notes</p><p className="text-slate-600">{ex.notes}</p></div>}
                          {ex.scopeOfWork?.length > 0 && (
                            <div>
                              <p className="font-medium text-slate-700 mb-1">Scope of Work</p>
                              <ul className="text-slate-600 space-y-0.5">
                                {(ex.scopeOfWork || []).map((t, i) => <li key={i}>• {t.title}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab 2: Fine-tuning Jobs ───────────────────────────────────────────────────

function FineTuningTab() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [jobOpts, setJobOpts] = useState({ categoryKeys: [], minQuality: 0.8 })
  const [triggering, setTriggering] = useState(false)
  const [activating, setActivating] = useState(null)
  const pollRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { const data = await listJobs(); setJobs(data ?? []) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    // Auto-refresh every 30s if any job is running
    pollRef.current = setInterval(() => {
      setJobs(prev => {
        if (prev.some(j => ['QUEUED', 'UPLOADING', 'RUNNING'].includes(j.status))) load()
        return prev
      })
    }, 30000)
    return () => clearInterval(pollRef.current)
  }, [load])

  const handleTrigger = async () => {
    setTriggering(true)
    try {
      await triggerJob(jobOpts)
      setShowModal(false)
      load()
    } catch (err) { alert(err.message) }
    finally { setTriggering(false) }
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel this job?')) return
    await cancelJob(id)
    load()
  }

  const handleActivateModel = async (jobId, modelId) => {
    setActivating(jobId)
    try {
      // Find the ModelConfig with this fineTunedModelId and activate it
      const models = await import('../../lib/trainingApi').then(m => m.listModels())
      const mc = models.find(m => m.fineTunedModelId === modelId)
      if (mc) await activateModel(mc.id)
      else alert('Model config not found yet — refresh in a moment')
      load()
    } catch (err) { alert(err.message) }
    finally { setActivating(null) }
  }

  const isRunning = jobs.some(j => ['QUEUED', 'UPLOADING', 'RUNNING'].includes(j.status))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Fine-tuning Jobs</h3>
          <p className="text-xs text-slate-500 mt-0.5">Train a custom OpenAI model on your approved A-1 project data</p>
        </div>
        <div className="flex gap-2">
          {isRunning && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              Training in progress
            </span>
          )}
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            <Play size={14} /> Start Training Run
          </button>
          <button onClick={load} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Start training modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Start Training Run</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Category filter (leave empty = all categories)</label>
                <select multiple value={jobOpts.categoryKeys}
                  onChange={e => setJobOpts(o => ({ ...o, categoryKeys: [...e.target.selectedOptions].map(o => o.value) }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm h-32">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g,'  ')}</option>)}
                </select>
                <p className="text-xs text-slate-400 mt-1">Ctrl/Cmd + click to select multiple</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Minimum quality score</label>
                <select value={jobOpts.minQuality} onChange={e => setJobOpts(o => ({ ...o, minQuality: parseFloat(e.target.value) }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="0">Any quality</option>
                  <option value="0.4">2+ stars</option>
                  <option value="0.6">3+ stars</option>
                  <option value="0.8">4+ stars (recommended)</option>
                  <option value="1">5 stars only</option>
                </select>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700">
                <AlertTriangle size={12} className="inline mr-1" />
                Training requires at least 10 qualifying approved examples and takes 2–4 hours. You will see the model appear in Model Registry when done.
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={handleTrigger} disabled={triggering}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
                {triggering ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                {triggering ? 'Starting…' : 'Start Training'}
              </button>
              <button onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Jobs list */}
      <div className="space-y-3">
        {jobs.length === 0 && !loading && (
          <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-slate-400 text-sm">
            No training jobs yet. Click "Start Training Run" to begin.
          </div>
        )}
        {jobs.map(job => (
          <div key={job.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge status={job.status} />
                  <span className="text-xs text-slate-500">{new Date(job.createdAt).toLocaleDateString()}</span>
                  <span className="text-xs text-slate-500">{job.exampleCount} examples</span>
                  {job.categoryKeys?.length > 0 && (
                    <span className="text-xs text-slate-500">{job.categoryKeys.join(', ')}</span>
                  )}
                </div>
                {job.fineTunedModelId && (
                  <p className="mt-2 text-xs font-mono text-slate-700 truncate">{job.fineTunedModelId}</p>
                )}
                {job.errorMessage && (
                  <p className="mt-1 text-xs text-red-500">{job.errorMessage}</p>
                )}
                {job.metrics && (
                  <p className="mt-1 text-xs text-slate-500">
                    Tokens trained: {job.metrics.trained_tokens?.toLocaleString() ?? '—'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {['QUEUED', 'UPLOADING', 'RUNNING'].includes(job.status) && (
                  <button onClick={() => handleCancel(job.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                    <Square size={12} /> Cancel
                  </button>
                )}
                {job.status === 'SUCCEEDED' && job.fineTunedModelId && (
                  <button onClick={() => handleActivateModel(job.id, job.fineTunedModelId)}
                    disabled={activating === job.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                    {activating === job.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                    Activate Model
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab 3: Model Registry ─────────────────────────────────────────────────────

function ModelRegistryTab() {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [toggling, setToggling] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { const data = await listModels(); setModels(data ?? []) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleActivate = async (id) => {
    if (!confirm('Activate this model? All new estimates will use it.')) return
    setToggling(id)
    try { await activateModel(id); load() }
    catch (err) { alert(err.message) }
    finally { setToggling(null) }
  }

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this model? Estimates will fall back to base GPT-4o.')) return
    setToggling(id)
    try { await deactivateModel(id); load() }
    catch (err) { alert(err.message) }
    finally { setToggling(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Model Registry</h3>
          <p className="text-xs text-slate-500 mt-0.5">Activate fine-tuned model versions for live estimation</p>
        </div>
        <button onClick={load} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Baseline card (always shown) */}
      <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">GPT-4o (Baseline)</p>
            <p className="text-xs text-slate-500 mt-0.5">OpenAI · gpt-4o · Cannot be deactivated</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
            Always available fallback
          </span>
        </div>
      </div>

      {models.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-slate-400 text-sm">
          No fine-tuned models yet. Complete a training job to see models here.
        </div>
      )}

      {models.map(model => (
        <div key={model.id} className={`rounded-xl border-2 p-4 ${model.active ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{model.name}</p>
                {model.active && <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Active</span>}
              </div>
              <p className="text-xs font-mono text-slate-500 mt-1 truncate">{model.fineTunedModelId ?? model.baseModelId}</p>
              <p className="text-xs text-slate-400 mt-1">
                {model.fineTunedModelId ? 'Fine-tuned' : 'Base'} · OpenAI
                {model.activatedAt && ` · Activated ${new Date(model.activatedAt).toLocaleDateString()}`}
              </p>
              {model.categoryKeys?.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">Categories: {model.categoryKeys.join(', ')}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {!model.active ? (
                <button onClick={() => handleActivate(model.id)} disabled={toggling === model.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                  {toggling === model.id ? <Loader2 size={12} className="animate-spin" /> : <ToggleLeft size={12} />}
                  Activate
                </button>
              ) : (
                <button onClick={() => handleDeactivate(model.id)} disabled={toggling === model.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                  {toggling === model.id ? <Loader2 size={12} className="animate-spin" /> : <ToggleRight size={12} />}
                  Deactivate
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tab 4: Prompt Lab ─────────────────────────────────────────────────────────

const PROMPT_KEYS = [
  { key: 'vision', label: 'Vision Prompt', desc: 'Used for analyzing renovation photos — surface detection, damage, scale measurement.' },
  { key: 'scope', label: 'Scope & Pricing Prompt', desc: 'Used to generate the scope of work and Low/Med/High price range. This is the prompt used for fine-tuning.' },
  { key: 'chat', label: 'Q&A Chat Prompt', desc: 'System instruction for the grounded question-answering chat feature.' },
]

function PromptLabTab() {
  const [prompts, setPrompts] = useState({})   // key → { body, version, isDefault }
  const [history, setHistory] = useState([])
  const [editing, setEditing] = useState(null)  // key being edited
  const [editBody, setEditBody] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [all, ...actives] = await Promise.all([
        listPrompts(),
        ...PROMPT_KEYS.map(p => getActivePrompt(p.key)),
      ])
      const active = {}
      PROMPT_KEYS.forEach((p, i) => { active[p.key] = actives[i] })
      setPrompts(active)
      setHistory(all ?? [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const startEdit = (key) => {
    setEditing(key)
    setEditBody(prompts[key]?.body ?? '')
    setEditNotes('')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await savePrompt({ key: editing, body: editBody, notes: editNotes })
      setEditing(null)
      load()
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  const handleActivate = async (id) => {
    setActivating(id)
    try { await activatePrompt(id); load() }
    catch (err) { alert(err.message) }
    finally { setActivating(null) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Prompt Lab</h3>
        <p className="text-xs text-slate-500 mt-0.5">Edit and activate the system prompts that guide the AI. Changes take effect immediately.</p>
        <div className="mt-2 rounded-lg bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700">
          <AlertTriangle size={12} className="inline mr-1" />
          Activating a new prompt immediately affects all new estimates. After editing the scope prompt, run a new fine-tuning job to keep the model in sync.
        </div>
      </div>

      {PROMPT_KEYS.map(({ key, label, desc }) => {
        const active = prompts[key]
        const keyHistory = history.filter(h => h.key === key)
        return (
          <div key={key} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-start justify-between gap-4 p-4 border-b border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                {active && (
                  <span className="text-xs text-slate-400 mt-1 block">
                    Version: {active.version}{active.isDefault ? ' (built-in default)' : ''}
                  </span>
                )}
              </div>
              <button onClick={() => startEdit(key)}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                <Edit3 size={12} /> Edit & Save New Version
              </button>
            </div>

            {/* Current prompt body */}
            <div className="p-4">
              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono bg-slate-50 rounded-lg p-3 max-h-48 overflow-y-auto border border-slate-100">
                {active?.body || '(no prompt set — using built-in default)'}
              </pre>
            </div>

            {/* Edit panel */}
            {editing === key && (
              <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-3">
                <textarea value={editBody} onChange={e => setEditBody(e.target.value)}
                  rows={12} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono bg-white resize-y"
                  placeholder="Enter the full system prompt…" />
                <input value={editNotes} onChange={e => setEditNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Change notes (what did you improve and why?)" />
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save & Activate
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-white">Cancel</button>
                </div>
              </div>
            )}

            {/* Version history */}
            {keyHistory.length > 0 && (
              <details className="border-t border-slate-100">
                <summary className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-500 cursor-pointer hover:bg-slate-50 select-none">
                  <History size={12} /> Version history ({keyHistory.length})
                </summary>
                <div className="divide-y divide-slate-100">
                  {keyHistory.map(h => (
                    <div key={h.id} className="flex items-center justify-between px-4 py-2.5 gap-4">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-slate-700">{h.version}</span>
                        <span className="text-xs text-slate-400 ml-2">{new Date(h.createdAt).toLocaleDateString()}</span>
                        {h.notes && <span className="text-xs text-slate-400 ml-2">— {h.notes}</span>}
                        {h.active && <span className="ml-2 text-xs font-medium text-emerald-600">● active</span>}
                      </div>
                      {!h.active && (
                        <button onClick={() => handleActivate(h.id)} disabled={activating === h.id}
                          className="shrink-0 text-xs text-slate-500 hover:text-slate-900 disabled:opacity-50">
                          {activating === h.id ? <Loader2 size={12} className="animate-spin" /> : 'Restore'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Root page ─────────────────────────────────────────────────────────────────

export default function AdminLLMTraining() {
  const [tab, setTab] = useState('data')
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    getMetrics().then(setMetrics).catch(() => {})
  }, [])

  return (
    <AdminLayout title="LLM Training" subtitle="Train your custom AI engine with real project data">
      <div className="p-6 space-y-6">
        {/* Header metrics */}
        {metrics && (
          <div className="flex flex-wrap gap-4 pb-2">
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-4 py-1.5 text-sm">
              <CheckCircle size={14} className="text-emerald-500" />
              <span className="text-slate-700"><strong className="text-emerald-700">{metrics.totalApproved}</strong> approved examples</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-100 px-4 py-1.5 text-sm">
              <Clock size={14} className="text-amber-500" />
              <span className="text-slate-700"><strong className="text-amber-700">{metrics.totalPending}</strong> pending review</span>
            </div>
            {metrics.activeModel ? (
              <div className="flex items-center gap-2 rounded-full bg-violet-50 border border-violet-100 px-4 py-1.5 text-sm">
                <BrainCircuit size={14} className="text-violet-500" />
                <span className="text-slate-700">
                  Active: <strong className="text-violet-700">{metrics.activeModel.name}</strong>
                  {metrics.activeModel.isFineTuned ? ' (fine-tuned)' : ' (base GPT-4o)'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm text-slate-500">
                <BrainCircuit size={14} /> Using base GPT-4o
              </div>
            )}
          </div>
        )}

        {/* Tab bar */}
        <div className="border-b border-slate-200">
          <div className="flex gap-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}>
                <t.icon size={15} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {tab === 'data' && <TrainingDataTab />}
        {tab === 'jobs' && <FineTuningTab />}
        {tab === 'models' && <ModelRegistryTab />}
        {tab === 'prompts' && <PromptLabTab />}
      </div>
    </AdminLayout>
  )
}
