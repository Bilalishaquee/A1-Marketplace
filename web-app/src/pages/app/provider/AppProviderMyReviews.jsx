import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, Star } from 'lucide-react'

const REVIEWS = [
  { name:'Sarah Johnson', project:'Kitchen Full Remodel', rating:5, date:'Apr 2026', text:'Mike and his team were exceptional. On time every day, incredibly clean, and the result is stunning. Highly recommend.', tags:['On time','Great quality','Communicative'] },
  { name:'Emily Rodriguez', project:'Full Home Renovation', rating:5, date:'Mar 2026', text:'Full gut renovation of our home. Mike handled permits, subcontractors, and every detail flawlessly. Would hire again.', tags:['Great quality','Fair price','Clean work'] },
  { name:'David Williams', project:'Composite Deck', rating:5, date:'Feb 2026', text:'Built our composite deck in 3 weeks. Workmanship is top-notch. Will hire again for our bathroom next year.', tags:['On time','Great quality'] },
  { name:'Chris Wilson', project:'ADU Garage Conversion', rating:4, date:'Jan 2026', text:'Carlos did good work on the ADU. Minor delays due to permits but managed well.', tags:['Communicative','Fair price'] },
  { name:'Barbara Anderson', project:'Bathroom Remodel', rating:5, date:'Dec 2025', text:'Transformed our outdated bathroom into a spa-like retreat. Very professional from start to finish.', tags:['Great quality','Clean work','On time'] },
]

const TAGS_ALL = ['On time','Great quality','Clean work','Communicative','Fair price']

function Stars({ n, size = 13 }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} className={i <= n ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
      ))}
    </div>
  )
}

export default function AppProviderMyReviews() {
  const navigate    = useNavigate()
  const [filter,    setFilter]  = useState(null)

  const avgRating = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1)
  const breakdown = [5,4,3,2,1].map(n => ({ n, count: REVIEWS.filter(r => r.rating === n).length }))

  const visible = filter ? REVIEWS.filter(r => r.rating === filter) : REVIEWS

  return (
    <MobileAppLayout role="provider">
      <div className="pt-10 pb-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 px-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <h1 className="font-extrabold text-slate-900 text-lg">My Reviews</h1>
        </div>

        {/* Rating summary */}
        <div className="mx-4 bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-4xl font-extrabold text-slate-900">{avgRating}</p>
              <Stars n={Math.round(Number(avgRating))} size={14} />
              <p className="text-[11px] text-slate-400 mt-1">{REVIEWS.length} reviews</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {breakdown.map(({ n, count }) => (
                <button key={n} onClick={() => setFilter(filter === n ? null : n)}
                  className={`w-full flex items-center gap-2 group ${filter === n ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}>
                  <span className="text-[11px] text-slate-500 w-3 shrink-0">{n}</span>
                  <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${filter === n ? 'bg-amber-400' : 'bg-amber-300'}`}
                      style={{ width: `${REVIEWS.length ? (count / REVIEWS.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 w-4 text-right shrink-0">{count}</span>
                </button>
              ))}
            </div>
          </div>
          {filter && (
            <button onClick={() => setFilter(null)} className="text-xs text-turquoise-600 font-semibold">
              Clear filter ({filter} stars)
            </button>
          )}
        </div>

        {/* Tag summary */}
        <div className="px-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Most Mentioned</p>
          <div className="flex flex-wrap gap-2">
            {TAGS_ALL.map(tag => {
              const count = REVIEWS.filter(r => r.tags?.includes(tag)).length
              if (!count) return null
              return (
                <span key={tag} className="flex items-center gap-1 px-3 py-1.5 bg-turquoise-50 text-turquoise-700 text-xs font-semibold rounded-full border border-turquoise-100">
                  {tag} <span className="text-turquoise-400">{count}</span>
                </span>
              )
            })}
          </div>
        </div>

        {/* Reviews list */}
        <div className="px-4 space-y-3">
          {visible.map((r, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{r.name}</p>
                  <p className="text-[11px] text-slate-400">{r.project} · {r.date}</p>
                </div>
                <Stars n={r.rating} />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-2">{r.text}</p>
              {r.tags && (
                <div className="flex flex-wrap gap-1">
                  {r.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-semibold rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </MobileAppLayout>
  )
}
