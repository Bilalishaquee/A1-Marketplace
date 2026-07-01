import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import {
  ChevronRight, DollarSign, ChevronDown, ChevronUp, Sparkles, Loader2,
} from 'lucide-react'
import { myProjects, dollars } from '../../../lib/platformApi'

function QuoteCard({ p }) {
  const [open, setOpen] = useState(false)
  const s = p.scopeEstimate
  const title = s.categoryLabel || p.categoryKey || 'Project'
  const scope = s.scopeOfWork || []
  const dur = s.estimatedDuration
  const timeline = dur
    ? (dur.minDays === dur.maxDays ? `${dur.maxDays} days` : `${dur.minDays}–${dur.maxDays} days`)
    : null

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Card header */}
      <button onClick={() => setOpen(o => !o)} className="w-full text-left p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-turquoise-500 rounded-full flex items-center justify-center text-white shrink-0">
            <Sparkles size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <p className="font-bold text-slate-900 text-sm truncate">{title}</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-turquoise-50 text-turquoise-700">AI Estimate</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {p.location?.city || p.location?.zip || 'Location pending'}
              {p.createdAt && ` · ${new Date(p.createdAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Estimated range</p>
            <p className="font-extrabold text-slate-900">{dollars(s.priceLow)} – {dollars(s.priceHigh)}</p>
          </div>
          {timeline && (
            <div className="text-right">
              <p className="text-xs text-slate-400">Timeline</p>
              <p className="font-bold text-slate-700 text-sm">{timeline}</p>
            </div>
          )}
          {open ? <ChevronUp size={16} className="text-slate-400 ml-2" /> : <ChevronDown size={16} className="text-slate-400 ml-2" />}
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 space-y-3">
          {p.description && (
            <div className="pt-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Project</p>
              <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>
            </div>
          )}

          {scope.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Scope of Work</p>
              <div className="space-y-1.5">
                {scope.map((b, i) => (
                  <div key={i} className="text-xs">
                    <p className="font-semibold text-slate-800">{b.title}</p>
                    {b.detail && <p className="text-slate-500 mt-0.5">{b.detail}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-turquoise-50 border border-turquoise-200 rounded-xl px-3 py-2 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-turquoise-600 font-semibold">Typical price</p>
              <p className="font-extrabold text-turquoise-800">{dollars(s.priceMed)}</p>
            </div>
            <Sparkles size={14} className="text-turquoise-500" />
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppUserQuotes() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState(null) // null = loading

  useEffect(() => { myProjects().then(setProjects).catch(() => setProjects([])) }, [])

  const quotes = (projects || []).filter(p => p.scopeEstimate)

  return (
    <MobileAppLayout role="user">
      <div className="pt-12 pb-6 space-y-4">
        <div className="flex items-center justify-between px-4">
          <h1 className="text-xl font-extrabold text-slate-900">My Quotes</h1>
          {quotes.length > 0 && (
            <span className="bg-turquoise-100 text-turquoise-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
              {quotes.length}
            </span>
          )}
        </div>

        {/* Loading */}
        {projects === null && (
          <div className="flex justify-center py-16">
            <Loader2 size={26} className="text-turquoise-500 animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {projects !== null && quotes.length === 0 && (
          <div className="px-4">
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <DollarSign size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500">No quotes yet</p>
              <p className="text-xs text-slate-400 mt-1">Get an instant AI estimate for your project.</p>
              <button onClick={() => navigate('/app/user/quote')}
                className="mt-3 text-xs font-bold text-turquoise-600">
                Get an AI quote
              </button>
            </div>
          </div>
        )}

        {/* Quotes */}
        {projects !== null && quotes.length > 0 && (
          <>
            <div className="px-4 space-y-3">
              {quotes.map(p => <QuoteCard key={p.id} p={p} />)}
            </div>

            {/* CTA */}
            <div className="px-4">
              <button onClick={() => navigate('/app/user/quote')}
                className="w-full flex items-center justify-center gap-2 py-3 border border-turquoise-300 text-turquoise-600 font-semibold text-sm rounded-2xl hover:bg-turquoise-50 transition-colors">
                Get Another Quote <ChevronRight size={14}/>
              </button>
            </div>
          </>
        )}
      </div>
    </MobileAppLayout>
  )
}
