import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { adminProjects, money } from '../../lib/platformApi'
import { Search, X, ChevronRight, Loader2, FolderKanban } from 'lucide-react'

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—')

const STATUS_STYLE = {
  DRAFT:     'bg-slate-100      text-slate-500     border border-slate-200',
  POSTED:    'bg-turquoise-50   text-turquoise-700 border border-turquoise-200',
  MATCHED:   'bg-blue-50        text-blue-700      border border-blue-200',
  COMPLETED: 'bg-emerald-50     text-emerald-700   border border-emerald-200',
  CANCELLED: 'bg-red-50         text-red-600       border border-red-200',
}
const statusCls = (s) => STATUS_STYLE[s] || 'bg-slate-100 text-slate-500 border border-slate-200'

export default function AdminProjects() {
  const [rows, setRows]       = useState(null)
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => { adminProjects().then(setRows).catch(() => setRows([])) }, [])

  const all = rows || []
  const statuses = Array.from(new Set(all.map(p => p.status).filter(Boolean)))

  const visible = all.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return (p.categoryKey || '').toLowerCase().includes(q) ||
      (p.region || '').toLowerCase().includes(q) ||
      (p.client || '').toLowerCase().includes(q)
  })

  return (
    <AdminLayout title="Projects" subtitle={rows ? `${all.length} total projects` : 'Loading…'}>
      <div className="p-6 space-y-4">

        {/* Quick stats (computed from real data) */}
        {rows !== null && all.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              ['Total Projects', all.length, 'text-slate-900'],
              ['Posted',         all.filter(p => p.status === 'POSTED').length,  'text-turquoise-600'],
              ['Matched',        all.filter(p => p.status === 'MATCHED').length, 'text-blue-600'],
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
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
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
            <FolderKanban size={28} className="text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-600">No projects yet</p>
            <p className="text-xs text-slate-400 mt-1">Projects created by homeowners will appear here.</p>
          </div>
        )}

        {/* Table */}
        {rows !== null && all.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Category','Client','Region','Est. Price','Bids','Created','Status',''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {visible.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 whitespace-nowrap">{p.categoryKey || '—'}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{p.id}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{p.client || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{p.region || '—'}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-800 whitespace-nowrap">
                        {p.priceMedCents != null ? money(p.priceMedCents) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-700">{p.bidCount ?? 0}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusCls(p.status)}`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelected(p)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="relative bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Project Details</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-[11px] text-slate-400 font-mono">{selected.id}</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{selected.categoryKey || '—'}</p>
                <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 ${statusCls(selected.status)}`}>
                  {selected.status}
                </span>
              </div>

              <div className="space-y-3">
                {[
                  ['Client', selected.client || '—'],
                  ['Region', selected.region || '—'],
                  ['Category', selected.categoryKey || '—'],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="text-xs text-slate-500">{l}</span>
                    <span className="text-sm font-semibold text-slate-800">{v}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Est. Price', selected.priceMedCents != null ? money(selected.priceMedCents) : '—'],
                  ['Bids', selected.bidCount ?? 0],
                  ['Created', fmtDate(selected.createdAt)],
                  ['Posted', fmtDate(selected.postedAt)],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[11px] text-slate-500">{l}</p>
                    <p className="font-bold text-slate-900 text-sm">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
