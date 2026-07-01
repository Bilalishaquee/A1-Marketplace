import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { adminStats, adminProjects } from '../../lib/platformApi'
import { Users, HardHat, FolderKanban, Gavel, Loader2, BarChart3 } from 'lucide-react'

const BAR_COLORS = ['bg-turquoise-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-emerald-500', 'bg-slate-400']

function countBy(arr, key) {
  const m = {}
  for (const item of arr) {
    const k = item[key] || 'Unknown'
    m[k] = (m[k] || 0) + 1
  }
  return Object.entries(m).sort((a, b) => b[1] - a[1])
}

function Breakdown({ title, subtitle, entries, total }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="font-bold text-slate-900 mb-1">{title}</h2>
      <p className="text-xs text-slate-400 mb-5">{subtitle}</p>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-400 py-4">No data yet.</p>
      ) : (
        <div className="space-y-4">
          {entries.map(([label, count], i) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-800 w-10 text-right">{count}</span>
                    <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${BAR_COLORS[i % BAR_COLORS.length]} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminAnalytics() {
  const [stats, setStats]       = useState(null)
  const [projects, setProjects] = useState(null)

  useEffect(() => {
    adminStats().then(setStats).catch(() => setStats({}))
    adminProjects().then(setProjects).catch(() => setProjects([]))
  }, [])

  const loading = stats === null || projects === null
  const all = projects || []

  const KPIS = stats ? [
    { label: 'Total Users',  value: stats.users,     icon: Users,        color: 'text-blue-600 bg-blue-50' },
    { label: 'Providers',    value: stats.providers, icon: HardHat,      color: 'text-turquoise-600 bg-turquoise-50' },
    { label: 'Projects',     value: stats.projects,  icon: FolderKanban, color: 'text-violet-600 bg-violet-50' },
    { label: 'Bids',         value: stats.bids,      icon: Gavel,        color: 'text-amber-600 bg-amber-50' },
  ].filter(k => k.value != null) : []

  const byStatus   = countBy(all, 'status')
  const byCategory = countBy(all, 'categoryKey')
  const posted  = stats?.postedProjects ?? all.filter(p => p.status === 'POSTED').length
  const matched = stats?.matchedProjects ?? all.filter(p => p.status === 'MATCHED').length

  return (
    <AdminLayout title="Analytics" subtitle="Platform metrics derived from live data">
      <div className="p-6 space-y-6">

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : (
          <>
            {/* Top KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {KPIS.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                      <Icon size={13} />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900">{Number(value).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Posted vs Matched */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-bold text-slate-900 mb-1">Posted vs Matched</h2>
              <p className="text-xs text-slate-400 mb-5">Project pipeline</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-turquoise-50 rounded-xl p-4">
                  <p className="text-xs text-turquoise-700 font-medium">Posted</p>
                  <p className="text-3xl font-extrabold text-turquoise-700 mt-1">{posted}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-blue-700 font-medium">Matched</p>
                  <p className="text-3xl font-extrabold text-blue-700 mt-1">{matched}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Breakdown title="Projects by Status" subtitle={`${all.length} total projects`} entries={byStatus} total={all.length} />
              <Breakdown title="Projects by Category" subtitle={`${all.length} total projects`} entries={byCategory} total={all.length} />
            </div>

            {all.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 py-12 flex flex-col items-center justify-center text-center">
                <BarChart3 size={26} className="text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-600">No project data yet</p>
                <p className="text-xs text-slate-400 mt-1">Breakdowns will populate as projects are created.</p>
              </div>
            )}
          </>
        )}

      </div>
    </AdminLayout>
  )
}
