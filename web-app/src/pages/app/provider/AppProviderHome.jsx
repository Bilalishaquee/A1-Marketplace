import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { Briefcase, ChevronRight, MapPin, DollarSign, Loader2, Inbox, CheckCircle2, Clock } from 'lucide-react'
import { providerFeed, myBids, dollars } from '../../../lib/platformApi'
import { useAuth } from '../../../context/AuthContext'

const catLabel = (p) => p?.scopeEstimate?.categoryLabel || p?.categoryKey || 'Project'
const loc = (l) => l ? [l.city, l.region].filter(Boolean).join(', ') : ''

export default function AppProviderHome() {
  const { user } = useAuth()
  const [feed, setFeed] = useState(null)
  const [bids, setBids] = useState(null)

  useEffect(() => {
    providerFeed().then(setFeed).catch(() => setFeed([]))
    myBids().then(setBids).catch(() => setBids([]))
  }, [])

  const pending  = (bids || []).filter(b => b.status === 'PENDING')
  const accepted = (bids || []).filter(b => b.status === 'ACCEPTED')

  return (
    <MobileAppLayout role="provider">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-4 pt-10 pb-14">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-slate-400 text-xs">Welcome back,</p>
            <p className="text-white font-extrabold text-lg">{user?.name?.split(' ')[0]}</p>
          </div>
          <div className="w-10 h-10 bg-turquoise-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
            {user?.initials}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            [feed ? feed.length : '—',     'Available',   'text-turquoise-400'],
            [bids ? pending.length : '—',  'Pending Bids','text-white'],
            [bids ? accepted.length : '—', 'Awarded',     'text-amber-400'],
          ].map(([v, l, c]) => (
            <div key={l} className="bg-white/10 rounded-xl p-3 text-center">
              <p className={`font-extrabold text-base ${c}`}>{v}</p>
              <p className="text-white/60 text-[11px] mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 -mt-10 space-y-4 pb-6">
        {/* Available jobs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="font-bold text-slate-900 text-sm">Available Jobs</p>
            <Link to="/app/provider/jobs" className="text-[11px] text-turquoise-600 font-semibold">View all</Link>
          </div>
          {feed === null ? (
            <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : feed.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400">
              <Inbox size={26} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold">No available jobs right now</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {feed.slice(0, 4).map(j => (
                <Link key={j.id} to="/app/provider/jobs" className="block px-4 py-3">
                  <p className="text-sm font-bold text-slate-900">{catLabel(j)}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={10}/>{loc(j.location)}</p>
                    {j.scopeEstimate && <p className="text-xs font-bold text-slate-700">{dollars(j.scopeEstimate.priceLow)}–{dollars(j.scopeEstimate.priceHigh)}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My bids */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="font-bold text-slate-900 text-sm">My Bids</p>
            <Link to="/app/provider/quotes" className="text-[11px] text-turquoise-600 font-semibold">View all</Link>
          </div>
          {bids === null ? (
            <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : bids.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400">
              <Briefcase size={26} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold">No bids submitted yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {bids.slice(0, 4).map(b => (
                <div key={b.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{catLabel(b.project)}</p>
                    <p className="text-xs text-slate-400">{dollars(b.amount)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                    b.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                    b.status === 'DECLINED' ? 'bg-slate-100 text-slate-500' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {b.status === 'ACCEPTED' ? <CheckCircle2 size={10}/> : <Clock size={10}/>}
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          {[
            ['View All Jobs',  '/app/provider/jobs',     'bg-turquoise-500'],
            ['My Quotes',      '/app/provider/quotes',   'bg-amber-500'    ],
            ['Messages',       '/app/provider/messages', 'bg-slate-800'    ],
            ['My Schedule',    '/app/provider/schedule', 'bg-emerald-500'  ],
          ].map(([label, to, color]) => (
            <Link key={label} to={to} className={`${color} text-white rounded-2xl py-4 flex items-center justify-center gap-2 text-sm font-bold`}>
              {label} <ChevronRight size={14}/>
            </Link>
          ))}
        </div>
      </div>
    </MobileAppLayout>
  )
}
