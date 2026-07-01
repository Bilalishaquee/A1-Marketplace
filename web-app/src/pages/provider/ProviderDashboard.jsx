import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, CheckCircle2, Clock, FileText, Inbox, MapPin, Send } from 'lucide-react'
import ProviderLayout from '../../components/layout/ProviderLayout'
import { providerFeed, myBids, dollars } from '../../lib/platformApi'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, EmptyState, LoadingState, MetricCard, PageHeader, StatusBadge } from '../../components/ui/marketplace'

const titleOf = (project) => project?.scopeEstimate?.categoryLabel || project?.categoryKey || 'Project'
const loc = (location) => location ? [location.city, location.region].filter(Boolean).join(', ') : ''

export default function ProviderDashboard() {
  const { user } = useAuth()
  const [feed, setFeed] = useState(null)
  const [bids, setBids] = useState(null)

  useEffect(() => {
    providerFeed().then(setFeed).catch(() => setFeed([]))
    myBids().then(setBids).catch(() => setBids([]))
  }, [])

  const pending = (bids || []).filter((bid) => bid.status === 'PENDING')
  const accepted = (bids || []).filter((bid) => bid.status === 'ACCEPTED')

  return (
    <ProviderLayout title="Dashboard" subtitle="Qualified project opportunities and recent bids">
      <div className="p-5 sm:p-6">
        <PageHeader
          title={`Welcome, ${user?.name?.split(' ')[0] || 'provider'}`}
          description="Review matching homeowner projects, submit bids, and track decisions."
          action={<Button as={Link} to="/provider/jobs"><Briefcase size={16} /> View jobs</Button>}
        />

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Available jobs" value={feed === null ? '—' : feed.length} icon={Briefcase} />
          <MetricCard label="Bids submitted" value={bids === null ? '—' : bids.length} icon={FileText} tone="blue" />
          <MetricCard label="Pending decisions" value={pending.length} icon={Clock} tone="amber" />
          <MetricCard label="Awarded jobs" value={accepted.length} icon={CheckCircle2} tone="green" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">Recommended jobs</h2>
              <Link to="/provider/jobs" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">View all</Link>
            </div>
            {feed === null ? <LoadingState label="Loading jobs…" />
              : feed.length === 0 ? <EmptyState title="No matching jobs right now" description="New posted projects in your service area will appear here." icon={Inbox} />
                : (
                  <div className="space-y-3">
                    {feed.slice(0, 6).map((job) => (
                      <Card key={job.id} className="p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-950">{titleOf(job)}</h3>
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{job.description || job.scopeEstimate?.scopeOfWork?.map((task) => task.title).join(', ') || 'Project details pending.'}</p>
                            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                              {loc(job.location) && <span className="flex items-center gap-1"><MapPin size={12} />{loc(job.location)}</span>}
                              {job.scopeEstimate && <span>{dollars(job.scopeEstimate.priceLow)}–{dollars(job.scopeEstimate.priceHigh)}</span>}
                              <span>{job.bidCount || 0} bids</span>
                            </div>
                          </div>
                          <Button as={Link} to="/provider/jobs" size="sm"><Send size={14} /> Bid</Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
          </section>

          <aside>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">Recent bids</h2>
              <Link to="/provider/quotes" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">Open bids</Link>
            </div>
            {bids === null ? <LoadingState label="Loading bids…" />
              : bids.length === 0 ? <EmptyState title="No bids submitted" description="Submit a bid from the jobs feed to start tracking it here." icon={FileText} />
                : (
                  <Card className="divide-y divide-slate-100 p-0">
                    {bids.slice(0, 7).map((bid) => (
                      <Link key={bid.id} to="/provider/quotes" className="block p-4 transition-colors hover:bg-slate-50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950">{titleOf(bid.project)}</p>
                            <p className="mt-1 text-xs text-slate-500">{dollars(bid.amount)} · {bid.estimatedDurationDays ? `${bid.estimatedDurationDays} days` : 'Duration pending'}</p>
                          </div>
                          <StatusBadge status={bid.status} />
                        </div>
                      </Link>
                    ))}
                  </Card>
                )}
          </aside>
        </div>
      </div>
    </ProviderLayout>
  )
}
