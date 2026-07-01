import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, FolderKanban, Gavel, Handshake, HardHat, Send, Sparkles, Users } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import { adminProjects, adminStats, money } from '../../lib/platformApi'
import { useAuth } from '../../context/AuthContext'
import { Card, EmptyState, LoadingState, MetricCard, PageHeader, StatusBadge } from '../../components/ui/marketplace'

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString() : '—'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [projects, setProjects] = useState(null)

  useEffect(() => {
    adminStats().then(setStats).catch(() => setStats({}))
    adminProjects().then(setProjects).catch(() => setProjects([]))
  }, [])

  const tiles = stats ? [
    { label: 'Users', value: stats.users, icon: Users, to: '/admin/users', tone: 'blue' },
    { label: 'Providers', value: stats.providers, icon: HardHat, to: '/admin/providers', tone: 'green' },
    { label: 'Projects', value: stats.projects, icon: FolderKanban, to: '/admin/projects', tone: 'slate' },
    { label: 'Posted', value: stats.postedProjects, icon: Send, to: '/admin/projects', tone: 'amber' },
    { label: 'Matched', value: stats.matchedProjects, icon: Handshake, to: '/admin/projects', tone: 'green' },
    { label: 'Bids', value: stats.bids, icon: Gavel, to: '/admin/quotes', tone: 'blue' },
    { label: 'Appointments', value: stats.appointments, icon: CalendarClock, to: '/admin/projects', tone: 'slate' },
  ].filter((tile) => tile.value != null) : []

  return (
    <AdminLayout title="Dashboard" subtitle="Marketplace health, project activity, and operational queues">
      <div className="p-5 sm:p-6">
        <PageHeader
          title={`Operations overview`}
          description={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}. Monitor current marketplace activity and follow up on active work.`}
          action={<Link to="/admin/quotes" className="btn-primary"><Sparkles size={16} /> Review quotes</Link>}
        />

        {stats === null ? <LoadingState label="Loading platform metrics…" />
          : (
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {tiles.map((tile) => (
                <Link key={tile.label} to={tile.to}>
                  <MetricCard label={tile.label} value={Number(tile.value || 0).toLocaleString()} icon={tile.icon} tone={tile.tone} className="h-full transition-colors hover:border-emerald-300" />
                </Link>
              ))}
            </div>
          )}

        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">Recent projects</h2>
              <Link to="/admin/projects" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">View all</Link>
            </div>
            {projects === null ? <LoadingState label="Loading projects…" />
              : projects.length === 0 ? <EmptyState title="No projects yet" description="Homeowner projects will appear here as they are created." icon={FolderKanban} />
                : (
                  <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Project</th>
                            <th className="px-4 py-3">Client</th>
                            <th className="px-4 py-3">Region</th>
                            <th className="px-4 py-3">Typical</th>
                            <th className="px-4 py-3">Bids</th>
                            <th className="px-4 py-3">Created</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {projects.slice(0, 10).map((project) => (
                            <tr key={project.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-semibold text-slate-950">{project.categoryKey || 'Uncategorized'}</td>
                              <td className="px-4 py-3 text-slate-600">{project.client || '—'}</td>
                              <td className="px-4 py-3 text-slate-600">{project.region || '—'}</td>
                              <td className="px-4 py-3 font-medium text-slate-900">{project.priceMedCents != null ? money(project.priceMedCents) : '—'}</td>
                              <td className="px-4 py-3 text-slate-600">{project.bidCount ?? 0}</td>
                              <td className="px-4 py-3 text-slate-600">{fmtDate(project.createdAt)}</td>
                              <td className="px-4 py-3"><StatusBadge status={project.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
          </section>

          <aside className="space-y-4">
            <Card className="p-5">
              <h3 className="font-semibold text-slate-950">Operational queues</h3>
              <div className="mt-4 space-y-3">
                <QueueRow label="Projects awaiting bids" value={stats?.postedProjects ?? 0} to="/admin/projects" />
                <QueueRow label="Matched projects" value={stats?.matchedProjects ?? 0} to="/admin/projects" />
                <QueueRow label="Provider bids" value={stats?.bids ?? 0} to="/admin/quotes" />
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-slate-950">AI operations preview</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Future training uploads, prompt versions, model jobs, and evaluation results should live in the Quotes & AI area.</p>
              <Link to="/admin/quotes" className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800">Open Quotes & AI</Link>
            </Card>
          </aside>
        </div>
      </div>
    </AdminLayout>
  )
}

function QueueRow({ label, value, to }) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-md border border-slate-200 p-3 transition-colors hover:border-emerald-300">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className="text-sm font-semibold text-slate-950">{Number(value || 0).toLocaleString()}</span>
    </Link>
  )
}
