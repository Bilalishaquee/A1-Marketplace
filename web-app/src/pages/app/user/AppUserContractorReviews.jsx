import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, Star, CheckCircle2, Filter } from 'lucide-react'

const PRO_DATA = {
  1: {
    name: 'Mike Rodriguez', avatar: 'MR', color: 'bg-slate-900', rating: 4.9, totalReviews: 127,
    breakdown: { 5: 108, 4: 14, 3: 3, 2: 1, 1: 1 },
    reviews: [
      { id: 1, name: 'Sarah J.',    rating: 5, project: 'Kitchen Remodel',    date: 'Apr 2026', tags: ['On time','Great quality','Communicative'],    text: 'Mike and his team were exceptional. On time every day, incredibly clean, and the result is stunning. The kitchen is exactly what we envisioned. Highly recommend.' },
      { id: 2, name: 'David W.',    rating: 5, project: 'Backyard Deck',      date: 'Feb 2026', tags: ['Fair price','Would hire again'],               text: 'Built our composite deck in 3 weeks. Workmanship is top-notch. Will hire again for our bathroom next year.' },
      { id: 3, name: 'Rachel T.',   rating: 5, project: 'Master Bath Reno',   date: 'Jan 2026', tags: ['On time','Great quality'],                    text: 'Transformed our outdated bathroom into a spa-like retreat. Very professional from start to finish.' },
      { id: 4, name: 'Lisa M.',     rating: 4, project: 'Basement Finish',    date: 'Dec 2025', tags: ['Communicative','Fair price'],                  text: 'Great job on the basement overall. Took a little longer than quoted but the quality was excellent and Mike communicated throughout.' },
      { id: 5, name: 'Tom P.',      rating: 5, project: 'Home Addition',      date: 'Nov 2025', tags: ['Professional','Exceeded expectations'],        text: 'Added a 400sqft bedroom and full bath. Permit process was handled entirely by Mike. Came in under budget. Absolutely 5 stars.' },
      { id: 6, name: 'Anna K.',     rating: 4, project: 'Flooring Refinish',  date: 'Oct 2025', tags: ['On time','Clean work'],                       text: 'Refinished 1,800sqft of hardwood. Crew was very respectful of our home and finished on schedule.' },
      { id: 7, name: 'Carlos B.',   rating: 5, project: 'Full Kitchen Reno',  date: 'Sep 2025', tags: ['Great quality','Would hire again'],            text: 'Second time hiring Mike — just as good as the first. Consistent quality and great communication. Our go-to contractor.' },
      { id: 8, name: 'Diane H.',    rating: 3, project: 'Bathroom Tile',      date: 'Aug 2025', tags: [],                                             text: 'Work was fine but ran about 2 weeks over schedule. Mike was responsive when we reached out but project management could be tighter.' },
    ],
  },
  2: {
    name: 'Carlos Morales', avatar: 'CM', color: 'bg-slate-900', rating: 4.7, totalReviews: 89,
    breakdown: { 5: 68, 4: 15, 3: 4, 2: 1, 1: 1 },
    reviews: [
      { id: 1, name: 'Chris W.',  rating: 5, project: 'ADU Conversion',   date: 'Mar 2026', tags: ['Communicative','Professional'], text: 'Carlos handled all the permits and delivered a beautiful ADU. Great communicator throughout the process.' },
      { id: 2, name: 'Maria L.', rating: 4, project: 'Room Addition',     date: 'Feb 2026', tags: ['Fair price'],                  text: 'Solid work on our master bedroom addition. Minor delays due to permits but well managed overall.' },
      { id: 3, name: 'James T.', rating: 5, project: 'Garage Conversion', date: 'Jan 2026', tags: ['On time','Great quality'],    text: 'Converted our 2-car garage into a studio apartment. Exceptional quality and delivered on time.' },
    ],
  },
}

function Stars({ n, size = 13 }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} className={i <= n ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
      ))}
    </div>
  )
}

export default function AppUserContractorReviews() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const pro      = PRO_DATA[Number(id)] || PRO_DATA[1]
  const [sort, setSort] = useState('recent')
  const [filterStar, setFilterStar] = useState(null)

  const sorted = [...pro.reviews]
    .filter(r => !filterStar || r.rating === filterStar)
    .sort((a, b) =>
      sort === 'highest' ? b.rating - a.rating :
      sort === 'lowest'  ? a.rating - b.rating :
      b.id - a.id
    )

  const totalVotes = Object.values(pro.breakdown).reduce((s, v) => s + v, 0)

  return (
    <MobileAppLayout role="user">
      <div className="pt-10 pb-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 px-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 ${pro.color} rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0`}>
              {pro.avatar}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{pro.name}</p>
              <p className="text-[11px] text-slate-400">{pro.totalReviews} reviews</p>
            </div>
          </div>
        </div>

        {/* Rating overview */}
        <div className="px-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-5">
            <div className="text-center">
              <p className="text-4xl font-extrabold text-slate-900">{pro.rating}</p>
              <Stars n={Math.round(pro.rating)} size={14} />
              <p className="text-[11px] text-slate-400 mt-1">{pro.totalReviews} reviews</p>
            </div>
            <div className="w-px h-16 bg-slate-100" />
            <div className="flex-1 space-y-1.5">
              {[5,4,3,2,1].map(star => {
                const count = pro.breakdown[star] || 0
                const pct   = Math.round((count / totalVotes) * 100)
                return (
                  <button key={star} onClick={() => setFilterStar(filterStar === star ? null : star)}
                    className={`w-full flex items-center gap-2 ${filterStar === star ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}>
                    <span className="text-[11px] text-slate-500 w-4 text-right">{star}</span>
                    <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${filterStar === star ? 'bg-turquoise-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] text-slate-400 w-6 text-right">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sort + filter row */}
        <div className="px-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">{sorted.length} review{sorted.length !== 1 ? 's' : ''} shown</p>
          <div className="flex items-center gap-1.5">
            <Filter size={12} className="text-slate-400" />
            {['recent','highest','lowest'].map(s => (
              <button key={s} onClick={() => setSort(s)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg capitalize transition-all ${
                  sort === s ? 'bg-turquoise-100 text-turquoise-700' : 'text-slate-400 hover:text-slate-600'
                }`}>{s}</button>
            ))}
          </div>
        </div>

        {/* Reviews list */}
        <div className="px-4 space-y-3">
          {sorted.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{r.name}</p>
                  <p className="text-[11px] text-slate-400">{r.project} · {r.date}</p>
                </div>
                <Stars n={r.rating} />
              </div>
              {r.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {r.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-turquoise-50 text-turquoise-700 text-[10px] font-semibold rounded-full">{t}</span>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-600 leading-relaxed">{r.text}</p>
              <div className="flex items-center gap-1 mt-2">
                <CheckCircle2 size={11} className="text-emerald-500" />
                <span className="text-[10px] text-slate-400">Verified hire</span>
              </div>
            </div>
          ))}

          {sorted.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-500">No {filterStar}-star reviews yet.</p>
              <button onClick={() => setFilterStar(null)} className="text-xs text-turquoise-600 font-semibold mt-2">Clear filter</button>
            </div>
          )}
        </div>
      </div>
    </MobileAppLayout>
  )
}
