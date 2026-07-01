import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ChevronRight, FileText, FolderPlus, Hammer, MessageSquare, PlusCircle, ReceiptText } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { myProjects, myThreads, dollars } from '../lib/platformApi'
import { useAuth } from '../context/AuthContext'
import { Button, Card, Container, EmptyState, LoadingState, MetricCard, PageHeader, StatusBadge, Avatar } from '../components/ui/marketplace'

const statusProgress = {
  DRAFT: 5, ANALYZING: 10, ESTIMATED: 20, POSTED: 35, MATCHED: 50,
  SCHEDULED: 65, IN_PROGRESS: 80, COMPLETED: 100, CANCELLED: 0, FAILED: 0,
}
const activeStatuses = ['POSTED', 'MATCHED', 'SCHEDULED', 'IN_PROGRESS']
const titleOf = (project) => project.scopeEstimate?.categoryLabel || project.categoryKey || 'Project'

export default function Dashboard() {
  const { user } = useAuth()
  const [projects, setProjects] = useState(null)
  const [threads, setThreads] = useState(null)

  useEffect(() => {
    myProjects().then(setProjects).catch(() => setProjects([]))
    myThreads().then(setThreads).catch(() => setThreads([]))
  }, [])

  const list = projects || []
  const active = list.filter((p) => activeStatuses.includes(p.status))
  const estimated = list.filter((p) => p.scopeEstimate)
  const totalLow = estimated.reduce((sum, p) => sum + (p.scopeEstimate.priceLow || 0), 0)
  const totalHigh = estimated.reduce((sum, p) => sum + (p.scopeEstimate.priceHigh || 0), 0)
  const range = estimated.length ? `${dollars(totalLow)}–${dollars(totalHigh)}` : '—'
  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Container className="py-8">
        <PageHeader
          title={`Welcome, ${firstName}`}
          description="Manage estimates, bids, messages, appointments, and documents from one place."
          action={<Button as={Link} to="/quote"><PlusCircle size={16} /> New project</Button>}
        />

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Active projects" value={projects === null ? '—' : active.length} icon={Hammer} helper="Posted, matched, or in progress" />
          <MetricCard label="Total projects" value={projects === null ? '—' : list.length} icon={FileText} tone="blue" />
          <MetricCard label="Estimated value" value={range} icon={ReceiptText} tone="amber" helper="Combined AI ranges" />
          <MetricCard label="Conversations" value={threads === null ? '—' : threads.length} icon={MessageSquare} tone="slate" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <main className="space-y-6">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-950">Projects</h2>
                <Link to="/quote" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">Create project</Link>
              </div>
              {projects === null ? <LoadingState label="Loading projects…" />
                : list.length === 0 ? (
                  <EmptyState
                    title="No projects yet"
                    description="Start with a short description and optional photos. You can post the estimate for provider bids when you are ready."
                    icon={FolderPlus}
                    action={<Button as={Link} to="/quote">Start a project</Button>}
                  />
                ) : (
                  <div className="space-y-3">
                    {list.map((project) => <ProjectRow key={project.id} project={project} />)}
                  </div>
                )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-950">Messages</h2>
                <Link to="/app/user/messages" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">Open inbox</Link>
              </div>
              {threads === null ? <LoadingState label="Loading messages…" />
                : threads.length === 0 ? (
                  <EmptyState title="No conversations yet" description="Conversations open after you accept a provider bid." icon={MessageSquare} />
                ) : (
                  <Card className="divide-y divide-slate-100 p-0">
                    {threads.slice(0, 6).map((thread) => (
                      <Link key={thread.id} to="/app/user/messages" className="flex gap-3 p-4 transition-colors hover:bg-slate-50">
                        <Avatar name={thread.otherParty?.name} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-semibold text-slate-950">{thread.otherParty?.name || 'Conversation'}</p>
                            <p className="shrink-0 text-xs text-slate-500">{thread.lastMessage?.createdAt ? new Date(thread.lastMessage.createdAt).toLocaleDateString() : ''}</p>
                          </div>
                          <p className="truncate text-sm text-slate-600">{thread.lastMessage?.body || 'No messages yet'}</p>
                        </div>
                      </Link>
                    ))}
                  </Card>
                )}
            </section>
          </main>

          <aside className="space-y-4">
            <Card className="p-5">
              <h3 className="font-semibold text-slate-950">Next actions</h3>
              <div className="mt-3 space-y-2">
                <Action to="/quote" icon={PlusCircle} label="Create a project" />
                <Action to="/schedule" icon={Calendar} label="View schedule" />
                <Action to="/browse" icon={Hammer} label="Browse providers" />
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-slate-950">Documents</h3>
              <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-5 text-center">
                <FileText size={22} className="mx-auto text-slate-400" />
                <p className="mt-2 text-sm font-medium text-slate-700">Project files will appear here</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Estimates, invoices, contracts, permits, and uploaded files.</p>
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-slate-950">Recent activity</h3>
              <div className="mt-4 space-y-3">
                {list.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex gap-3 text-sm">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-600" />
                    <div>
                      <p className="font-medium text-slate-800">{titleOf(project)}</p>
                      <p className="text-xs text-slate-500">Status changed to {project.status}</p>
                    </div>
                  </div>
                ))}
                {list.length === 0 && <p className="text-sm text-slate-500">No activity yet.</p>}
              </div>
            </Card>
          </aside>
        </div>
      </Container>
      <Footer />
    </div>
  )
}

function ProjectRow({ project }) {
  const progress = statusProgress[project.status] ?? 0
  const estimate = project.scopeEstimate
  return (
    <Card as={Link} to={`/tracking/${project.id}`} className="block p-5 transition-colors hover:border-emerald-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <StatusBadge status={project.status} />
          <h3 className="mt-2 truncate text-lg font-semibold text-slate-950">{titleOf(project)}</h3>
          <p className="mt-1 text-sm text-slate-600">{project.location?.region || project.location?.city || project.location?.zip || 'Location pending'}</p>
        </div>
        <div className="text-sm sm:text-right">
          <p className="font-semibold text-slate-950">{estimate ? `${dollars(estimate.priceLow)}–${dollars(estimate.priceHigh)}` : 'Estimate pending'}</p>
          <p className="text-slate-500">{project.bidCount ?? 0} bid{(project.bidCount ?? 0) === 1 ? '' : 's'}</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Progress</span><span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-700" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </Card>
  )
}

function Action({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-md p-2.5 transition-colors hover:bg-slate-100">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700"><Icon size={17} /></div>
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <ChevronRight size={15} className="ml-auto text-slate-400" />
    </Link>
  )
}
