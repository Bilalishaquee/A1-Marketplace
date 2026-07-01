import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, Star, CheckCircle2, Trash2 } from 'lucide-react'

const MY_REVIEWS = [
  {
    id: 'R-1', proName: 'Mike Rodriguez', proAvatar: 'MR', proColor: 'bg-slate-900',
    project: 'Kitchen Full Remodel', date: 'May 2, 2026', rating: 5,
    tags: ['On time', 'Great quality', 'Communicative'],
    text: 'Mike and his team were exceptional. On time every day, incredibly clean, and the result is stunning. The kitchen is exactly what we envisioned.',
    photos: 2,
  },
  {
    id: 'R-2', proName: 'Mike Rodriguez', proAvatar: 'MR', proColor: 'bg-slate-900',
    project: 'Backyard Deck', date: 'Mar 1, 2026', rating: 5,
    tags: ['Great quality', 'Fair price', 'Would hire again'],
    text: 'Built our composite deck in under 3 weeks. Workmanship is top-notch. Will hire again for our bathroom next year.',
    photos: 0,
  },
  {
    id: 'R-3', proName: 'Carlos Morales', proAvatar: 'CM', proColor: 'bg-slate-900',
    project: 'ADU Permit Consultation', date: 'Jan 15, 2026', rating: 4,
    tags: ['Professional', 'Communicative'],
    text: 'Carlos was very helpful with the permit process. Slight delays due to city processing but managed it well.',
    photos: 0,
  },
]

function Stars({ n, size = 13 }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} className={i <= n ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
      ))}
    </div>
  )
}

const avgRating = (MY_REVIEWS.reduce((s, r) => s + r.rating, 0) / MY_REVIEWS.length).toFixed(1)

export default function AppUserMyReviews() {
  const navigate = useNavigate()

  return (
    <MobileAppLayout role="user">
      <div className="pt-10 pb-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 px-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <h1 className="font-extrabold text-slate-900 text-lg">My Reviews</h1>
        </div>

        {/* Summary */}
        <div className="px-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-5">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-slate-900">{avgRating}</p>
              <Stars n={Math.round(Number(avgRating))} size={14} />
              <p className="text-[11px] text-slate-400 mt-1">avg rating given</p>
            </div>
            <div className="w-px h-12 bg-slate-100" />
            <div className="flex-1 space-y-1.5">
              {[5,4,3,2,1].map(star => {
                const count = MY_REVIEWS.filter(r => r.rating === star).length
                const pct   = Math.round((count / MY_REVIEWS.length) * 100)
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 w-4">{star}</span>
                    <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] text-slate-400 w-4">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Review list */}
        <div className="px-4 space-y-3">
          {MY_REVIEWS.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              {/* Pro info */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${r.proColor} rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                  {r.proAvatar}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-sm">{r.proName}</p>
                  <p className="text-[11px] text-slate-400">{r.project} · {r.date}</p>
                </div>
                <Stars n={r.rating} />
              </div>

              {/* Tags */}
              {r.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {r.tags.map(t => (
                    <span key={t} className="px-2.5 py-1 bg-turquoise-50 text-turquoise-700 text-[11px] font-semibold rounded-full border border-turquoise-100">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Review text */}
              <p className="text-xs text-slate-600 leading-relaxed mb-3">{r.text}</p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div className="flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-emerald-500" />
                  <span className="text-[10px] text-slate-400">Verified hire</span>
                  {r.photos > 0 && (
                    <span className="ml-2 text-[10px] text-slate-400">{r.photos} photo{r.photos > 1 ? 's' : ''} attached</span>
                  )}
                </div>
                <button className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={11}/> Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-4">
          <button onClick={() => navigate('/app/user/review')}
            className="w-full py-3 border border-turquoise-300 text-turquoise-600 font-semibold text-sm rounded-2xl hover:bg-turquoise-50 transition-colors">
            Write a New Review
          </button>
        </div>
      </div>
    </MobileAppLayout>
  )
}
