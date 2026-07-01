import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { adminUsers } from '../../lib/platformApi'
import { Search, MoreVertical, Mail, Phone, X, ShieldOff, Eye, Loader2, Users as UsersIcon } from 'lucide-react'

const ROLE_STYLE = {
  CLIENT:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  PROVIDER: 'bg-blue-50    text-blue-700    border border-blue-200',
  ADMIN:    'bg-violet-50  text-violet-700  border border-violet-200',
}

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—')

export default function AdminUsers() {
  const [rows, setRows]       = useState(null)
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => { adminUsers().then(setRows).catch(() => setRows([])) }, [])

  // This screen lists homeowners (clients).
  const clients = (rows || []).filter(u => u.role === 'CLIENT')

  const visible = clients.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
  })

  return (
    <AdminLayout title="Users" subtitle={rows ? `${clients.length} registered homeowners` : 'Loading…'}>
      <div className="p-6 space-y-4">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              placeholder="Search users…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-turquoise-300"
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
        {rows !== null && clients.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 py-16 flex flex-col items-center justify-center text-center">
            <UsersIcon size={28} className="text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-600">No users yet</p>
            <p className="text-xs text-slate-400 mt-1">Registered homeowners will appear here.</p>
          </div>
        )}

        {/* Table */}
        {rows !== null && clients.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['User','Phone','Joined','Role',''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {visible.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-turquoise-100 text-turquoise-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                            {(u.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 whitespace-nowrap">{u.name || '—'}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{u.phone || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${ROLE_STYLE[u.role] || 'bg-slate-100 text-slate-500'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelected(u)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                          <MoreVertical size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">Showing {visible.length} of {clients.length} users</p>
            </div>
          </div>
        )}
      </div>

      {/* User detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="relative bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">User Details</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-turquoise-100 text-turquoise-700 rounded-full flex items-center justify-center text-lg font-bold">
                  {(selected.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{selected.name || '—'}</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${ROLE_STYLE[selected.role] || 'bg-slate-100 text-slate-500'}`}>
                    {selected.role}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  [Mail, selected.email],
                  [Phone, selected.phone || '—'],
                ].map(([Icon, val]) => (
                  <div key={val} className="flex items-center gap-3 text-sm text-slate-600">
                    <Icon size={15} className="text-slate-400 shrink-0" /> {val}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Joined', fmtDate(selected.createdAt)],
                  ['Role', selected.role],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[11px] text-slate-500 mb-1">{l}</p>
                    <p className="font-bold text-slate-900 text-sm">{v}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <button className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold bg-turquoise-500 hover:bg-turquoise-600 text-white rounded-lg transition-colors justify-center">
                  <Eye size={15} /> View Full Profile
                </button>
                <button className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors justify-center">
                  <ShieldOff size={15} /> Suspend Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
