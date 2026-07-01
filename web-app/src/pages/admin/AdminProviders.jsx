import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { adminUsers } from '../../lib/platformApi'
import { Search, ShieldCheck, X, MapPin, Mail, Phone, Loader2, HardHat } from 'lucide-react'

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—')

// verified is bool|null on the backend → map to a display status.
const statusOf = (p) => (p.verified === true ? 'verified' : 'pending')

const STATUS_STYLE = {
  verified: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  pending:  'bg-amber-50   text-amber-700   border border-amber-200',
}

export default function AdminProviders() {
  const [rows, setRows]     = useState(null)
  const [tab, setTab]       = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => { adminUsers().then(setRows).catch(() => setRows([])) }, [])

  const providers = (rows || []).filter(u => u.role === 'PROVIDER')

  const visible = providers.filter(p => {
    const matchTab = tab === 'all' || statusOf(p) === tab
    if (!matchTab) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (p.name || '').toLowerCase().includes(q) ||
      (p.businessName || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q)
  })

  return (
    <AdminLayout title="Service Providers" subtitle={rows ? `${providers.length} registered providers` : 'Loading…'}>
      <div className="p-6 space-y-4">

        {/* Tabs + search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {[['all','All'],['verified','Verified'],['pending','Pending Review']].map(([v,l]) => (
              <button key={v} onClick={() => setTab(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  tab === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >{l}</button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              placeholder="Search providers…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-turquoise-300"
            />
          </div>
        </div>

        {/* Loading */}
        {rows === null && (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 size={22} className="animate-spin" />
          </div>
        )}

        {/* Empty */}
        {rows !== null && providers.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 py-16 flex flex-col items-center justify-center text-center">
            <HardHat size={28} className="text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-600">No providers yet</p>
            <p className="text-xs text-slate-400 mt-1">Registered service providers will appear here.</p>
          </div>
        )}

        {/* Grid */}
        {rows !== null && providers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map(p => {
              const status = statusOf(p)
              return (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all cursor-pointer" onClick={() => setSelected(p)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-turquoise-100 text-turquoise-700 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                        {(p.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{p.businessName || p.name || '—'}</p>
                        <p className="text-xs text-slate-400">{p.name}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>
                      {status === 'verified' ? '✓ Verified' : 'Pending'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 mb-3">
                    <div className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400" /> {p.email}</div>
                    {p.phone && <div className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400" /> {p.phone}</div>}
                    <div className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" /> Joined {fmtDate(p.createdAt)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Provider detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="relative bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Provider Details</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-turquoise-100 text-turquoise-700 rounded-full flex items-center justify-center text-lg font-bold">
                  {(selected.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{selected.businessName || selected.name || '—'}</p>
                  <p className="text-sm text-slate-500">{selected.name}</p>
                  <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 ${STATUS_STYLE[statusOf(selected)]}`}>
                    {statusOf(selected) === 'verified' ? '✓ Verified' : 'Pending Review'}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {[[Mail, selected.email], [Phone, selected.phone || '—'], [ShieldCheck, `Joined ${fmtDate(selected.createdAt)}`]].map(([Icon, val]) => (
                  <div key={val} className="flex items-center gap-3 text-sm text-slate-600">
                    <Icon size={14} className="text-slate-400 shrink-0" /> {val}
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
