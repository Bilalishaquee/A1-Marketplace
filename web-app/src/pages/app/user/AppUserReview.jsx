import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, Star, Camera, CheckCircle2, Shield } from 'lucide-react'

const TAGS = [
  'On time', 'Great quality', 'Clean work', 'Communicative', 'Fair price',
  'Professional', 'Would hire again', 'Exceeded expectations',
]

const DEFAULT_PRO = { name: 'Mike Rodriguez', avatar: 'MR', color: 'bg-slate-900', project: 'Kitchen Full Remodel' }

export default function AppUserReview() {
  const navigate     = useNavigate()
  const [params]     = useSearchParams()
  const pro          = {
    name:    params.get('proName')    || DEFAULT_PRO.name,
    avatar:  params.get('proAvatar')  || DEFAULT_PRO.avatar,
    color:   params.get('proColor')   || DEFAULT_PRO.color,
    project: params.get('project')    || DEFAULT_PRO.project,
  }

  const [rating,   setRating]   = useState(0)
  const [hover,    setHover]    = useState(0)
  const [tags,     setTags]     = useState([])
  const [text,     setText]     = useState('')
  const [photos,   setPhotos]   = useState(0)
  const [submitting,setSubmitting] = useState(false)
  const [done,     setDone]     = useState(false)

  const toggleTag = t => setTags(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t])

  const submit = () => {
    if (!rating) return
    setSubmitting(true)
    setTimeout(() => { setSubmitting(false); setDone(true) }, 1200)
  }

  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

  if (done) {
    return (
      <MobileAppLayout role="user">
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center pb-20">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-5">
            <Star size={40} className="text-amber-400 fill-amber-400" />
          </div>
          <h2 className="font-extrabold text-slate-900 text-2xl mb-2">Thank You!</h2>
          <p className="text-sm text-slate-500 mb-1">Your review for <strong>{pro.name}</strong> was submitted.</p>
          <p className="text-xs text-slate-400 mb-8">Reviews help other homeowners find great contractors.</p>

          <div className="flex gap-1 mb-8">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={28} className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
            ))}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {tags.map(t => (
                <span key={t} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                  {t}
                </span>
              ))}
            </div>
          )}

          <button onClick={() => navigate('/app/user/projects')}
            className="w-full py-3.5 bg-turquoise-500 text-white font-bold rounded-2xl mb-3">
            Back to My Projects
          </button>
          <button onClick={() => navigate('/app/user/home')}
            className="text-sm text-slate-400 font-semibold">
            Go to Home
          </button>
        </div>
      </MobileAppLayout>
    )
  }

  return (
    <MobileAppLayout role="user">
      <div className="pt-10 pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 mb-6">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="font-extrabold text-slate-900 text-lg">Leave a Review</h1>
            <p className="text-[11px] text-slate-400">Help other homeowners</p>
          </div>
        </div>

        <div className="px-4 space-y-5">
          {/* Pro card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-base font-extrabold text-white shrink-0">
              {pro.avatar}
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900">{pro.name}</p>
              <p className="text-xs text-slate-400">{pro.project}</p>
            </div>
            <div className="flex items-center gap-1">
              <Shield size={13} className="text-turquoise-500" />
              <span className="text-[11px] text-slate-500">Verified</span>
            </div>
          </div>

          {/* Star rating */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
            <p className="text-sm font-bold text-slate-700 mb-4">How was your experience?</p>
            <div className="flex justify-center gap-3 mb-2">
              {[1,2,3,4,5].map(i => (
                <button key={i}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(i)}
                  className="transition-transform active:scale-110">
                  <Star
                    size={40}
                    className={`transition-colors ${
                      i <= (hover || rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200 fill-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            {(hover || rating) > 0 && (
              <p className="text-sm font-bold text-amber-500">{LABELS[hover || rating]}</p>
            )}
          </div>

          {/* Quality tags */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">What stood out? (optional)</p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(t => (
                <button key={t} onClick={() => toggleTag(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                    tags.includes(t)
                      ? 'border-turquoise-500 bg-turquoise-500 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}>
                  {tags.includes(t) && '✓ '}{t}
                </button>
              ))}
            </div>
          </div>

          {/* Written review */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Write a Review (optional)</p>
            <textarea rows={4} value={text} onChange={e => setText(e.target.value)}
              placeholder="Describe your experience — quality of work, communication, punctuality..."
              className="w-full text-sm text-slate-700 focus:outline-none resize-none placeholder-slate-300 bg-transparent" />
            <p className="text-[11px] text-slate-300 mt-1 text-right">{text.length}/500</p>
          </div>

          {/* Photo upload */}
          <button onClick={() => setPhotos(n => Math.min(n + 1, 4))}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-dashed border-slate-300 hover:border-turquoise-300 hover:bg-turquoise-50/30 transition-all">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Camera size={18} className="text-slate-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-slate-700">Add Photos</p>
              <p className="text-[11px] text-slate-400">Show off the finished work</p>
            </div>
            {photos > 0 && (
              <span className="text-xs font-bold bg-turquoise-100 text-turquoise-700 px-2 py-0.5 rounded-full">{photos} added</span>
            )}
          </button>

          {/* Submit */}
          <button onClick={submit} disabled={!rating || submitting}
            className="w-full py-3.5 bg-turquoise-500 disabled:opacity-40 hover:bg-turquoise-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors">
            {submitting
              ? <><CheckCircle2 size={16} className="animate-pulse"/> Submitting...</>
              : <>Submit Review</>
            }
          </button>

          <p className="text-center text-[11px] text-slate-400">
            Reviews are public and help other homeowners make informed decisions.
          </p>
        </div>
      </div>
    </MobileAppLayout>
  )
}
