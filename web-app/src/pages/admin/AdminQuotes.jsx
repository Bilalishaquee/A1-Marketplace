import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { adminBids, money } from '../../lib/platformApi'
import { Sparkles, Search, ChevronDown, Loader2, FileText } from 'lucide-react'

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—')

const STATUS_STYLE = {
  PENDING:  'bg-amber-50   text-amber-700    border border-amber-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700  border border-emerald-200',
  DECLINED: 'bg-red-50     text-red-600      border border-red-200',
  WITHDRAWN:'bg-slate-100  text-slate-500    border border-slate-200',
}
const statusCls = (s) => STATUS_STYLE[s] || 'bg-slate-100 text-slate-500 border border-slate-200'

export default function AdminQuotes() {
  const [rows, setRows]       = useState(null)
  const [filter, setFilter]   = useState('all')
  const [search, setSearch]   = useState('')
  const [expanded, setExpanded] = useState(null)

  // Submitted quotes = provider bids.
  useEffect(() => { adminBids().then(setRows).catch(() => setRows([])) }, [])

  const all = rows || []
  const statuses = Array.from(new Set(all.map(b => b.status).filter(Boolean)))

  const visible = all.filter(q => {
    const matchFilter = filter === 'all' || q.status === filter
    if (!matchFilter) return false
    if (!search) return true
    const s = search.toLowerCase()
    return (q.provider || '').toLowerCase().includes(s) || (q.projectId || '').toLowerCase().includes(s)
  })

  const pendingCount  = all.filter(q => q.status === 'PENDING').length
  const acceptedCount = all.filter(q => q.status === 'ACCEPTED').length

  return (
    <AdminLayout title="Quotes" subtitle={rows ? `${pendingCount} pending · ${acceptedCount} accepted` : 'Loading…'}>
      <div className="p-6 space-y-4">

        {/* Stats row (computed from real data) */}
        {rows !== null && all.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              ['Total Quotes',   all.length,    'text-turquoise-600'],
              ['Pending Review', pendingCount,  'text-amber-600'],
              ['Accepted',       acceptedCount, 'text-emerald-600'],
            ].map(([l, v, cls]) => (
              <div key={l} className="bg-white rounded-xl border border-slate-200 px-5 py-4">
                <p className="text-xs text-slate-500 mb-1">{l}</p>
                <p className={`text-2xl font-extrabold ${cls}`}>{v}</p>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {['all', ...statuses].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                  filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>{f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}</button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input placeholder="Search quotes…" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
          </div>
        </div>

        {/* Loading */}
        {rows === null && (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 size={22} className="animate-spin" />
          </div>
        )}

        {/* Empty */}
        {rows !== null && all.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 py-16 flex flex-col items-center justify-center text-center">
            <FileText size={28} className="text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-600">No quotes yet</p>
            <p className="text-xs text-slate-400 mt-1">Quotes submitted by providers will appear here.</p>
          </div>
        )}

        {/* Quote cards */}
        {rows !== null && all.length > 0 && (
          <div className="space-y-3">
            {visible.map(q => {
              const isOpen = expanded === q.id
              return (
                <div key={q.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-9 h-9 bg-turquoise-50 rounded-xl flex items-center justify-center shrink-0">
                      <Sparkles size={16} className="text-turquoise-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 text-sm">{q.provider || '—'}</p>
                        <span className="text-slate-300">·</span>
                        <p className="text-xs text-slate-500 font-mono">{q.id}</p>
                      </div>
                      <p className="text-xs text-slate-500 truncate">Project {q.projectId}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900 text-sm">{money(q.amountCents)}</p>
                      <p className="text-[11px] text-slate-400">{fmtDate(q.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusCls(q.status)}`}>{q.status}</span>
                      <button onClick={() => setExpanded(isOpen ? null : q.id)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-0 border-t border-slate-50">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 mt-3">
                        {[
                          ['Amount', money(q.amountCents)],
                          ['Status', q.status],
                          ['Project', q.projectId],
                          ['Submitted', fmtDate(q.createdAt)],
                        ].map(([l, v]) => (
                          <div key={l} className="bg-slate-50 rounded-lg p-2.5">
                            <p className="text-[10px] text-slate-400">{l}</p>
                            <p className="text-sm font-bold text-slate-800 truncate">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
