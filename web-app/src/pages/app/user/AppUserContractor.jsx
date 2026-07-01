import { useParams, useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { Star, Shield, MapPin, Clock, ChevronLeft, ChevronRight, CheckCircle2, Briefcase, Camera, MessageSquare } from 'lucide-react'

const CONTRACTORS = {
  1: {
    id: 1, name: 'Mike Rodriguez', specialty: 'General Contractor', badge: 'Top Pro',
    rating: 4.9, reviews: 127, hired: 89, years: 14, employees: 8, responseTime: '< 1 hour',
    avatar: 'MR', color: 'bg-turquoise-500', city: 'Austin, TX', verified: true,
    services: ['Kitchen Remodel', 'Bathroom Renovation', 'Home Addition', 'Flooring', 'Drywall', 'Painting'],
    about: 'Licensed general contractor with 14 years of residential experience in Austin. Specializing in full kitchen and bathroom remodels. All work is permitted and inspected.',
    portfolio: [
      { img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&auto=format&fit=crop&q=80', label: 'Kitchen Remodel' },
      { img: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&auto=format&fit=crop&q=80', label: 'Master Bath' },
      { img: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&auto=format&fit=crop&q=80', label: 'Open Concept' },
      { img: 'https://images.unsplash.com/photo-1558618047-f5e2b7f0c7cf?w=400&auto=format&fit=crop&q=80', label: 'Deck Build' },
      { img: 'https://images.unsplash.com/photo-1567538096621-38d2284b23ff?w=400&auto=format&fit=crop&q=80', label: 'Flooring' },
      { img: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&auto=format&fit=crop&q=80', label: 'Exterior' },
    ],
    recentReviews: [
      { name: 'Sarah J.', rating: 5, project: 'Kitchen Remodel', date: 'Apr 2026', text: 'Mike and his team were exceptional. On time every day, incredibly clean, and the result is stunning. Highly recommend.' },
      { name: 'David W.', rating: 5, project: 'Backyard Deck',   date: 'Feb 2026', text: 'Built our composite deck in 3 weeks. Workmanship is top-notch. Will hire again for our bathroom next year.' },
      { name: 'Rachel T.', rating: 5, project: 'Bathroom Reno',  date: 'Jan 2026', text: 'Transformed our outdated bathroom into a spa-like retreat. Very professional from start to finish.' },
    ],
  },
  2: {
    id: 2, name: 'Carlos Morales', specialty: 'Home Additions', badge: null,
    rating: 4.7, reviews: 89, hired: 62, years: 9, employees: 5, responseTime: '< 2 hours',
    avatar: 'CM', color: 'bg-blue-500', city: 'Austin, TX', verified: true,
    services: ['Home Addition', 'ADU Conversion', 'Garage Conversion', 'Structural Work', 'Foundation'],
    about: 'Specializing in room additions and ADU conversions throughout Central Texas. Full permit management included. 9 years building code expertise.',
    portfolio: [
      { img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop&q=80', label: 'ADU Build' },
      { img: 'https://images.unsplash.com/photo-1560440021-33f9b867899d?w=400&auto=format&fit=crop&q=80', label: 'Room Addition' },
      { img: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&auto=format&fit=crop&q=80', label: 'Open Floor Plan' },
      { img: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&auto=format&fit=crop&q=80', label: 'Exterior' },
    ],
    recentReviews: [
      { name: 'Chris W.', rating: 5, project: 'ADU Conversion',  date: 'Mar 2026', text: 'Carlos handled all the permits and delivered a beautiful ADU. Great communicator throughout the process.' },
      { name: 'Maria L.', rating: 4, project: 'Room Addition',   date: 'Feb 2026', text: 'Solid work on our master bedroom addition. Minor delays due to permits but well managed.' },
    ],
  },
  3: { id: 3, name: 'Lisa Chen', specialty: 'Kitchen & Bath', badge: 'Top Pro', rating: 4.8, reviews: 203, hired: 151, years: 11, employees: 6, responseTime: '< 30 min', avatar: 'LC', color: 'bg-violet-500', city: 'Austin, TX', verified: true, services: ['Kitchen Remodel', 'Bathroom Renovation', 'Tile Work', 'Cabinetry', 'Countertops'], about: 'Award-winning kitchen and bath designer-builder. Published in Austin Home Magazine 2025. Specializing in luxury renovations with designer-quality finishes.', portfolio: [{ img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&auto=format&fit=crop&q=80', label: 'Kitchen' },{ img: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&auto=format&fit=crop&q=80', label: 'Master Bath' },{ img: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&auto=format&fit=crop&q=80', label: 'Guest Bath' },{ img: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&auto=format&fit=crop&q=80', label: 'Open Kitchen' }], recentReviews: [{ name: 'Amy R.', rating: 5, project: 'Kitchen Remodel', date: 'Apr 2026', text: 'Lisa brought our vision to life perfectly. Every detail was considered. The kitchen is magazine-worthy.' },{ name: 'Tom P.', rating: 5, project: 'Bathroom', date: 'Mar 2026', text: 'Incredible tile work and design sensibility. Lisa is a true professional.' }] },
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

export default function AppUserContractor() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const pro       = CONTRACTORS[Number(id)] || CONTRACTORS[1]

  return (
    <MobileAppLayout role="user">
      <div className="pb-24">
        {/* Header */}
        <div className="bg-slate-900 px-4 pt-10 pb-5">
          <button onClick={() => navigate(-1)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center mb-4">
            <ChevronLeft size={18} className="text-white" />
          </button>
        </div>

        {/* Profile card */}
        <div className="px-4 mt-4 mb-4">
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-lg font-extrabold text-white shrink-0">
                {pro.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-extrabold text-slate-900">{pro.name}</p>
                  {pro.verified && <Shield size={14} className="text-turquoise-500" />}
                  {pro.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">{pro.badge}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{pro.specialty}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Stars n={Math.round(pro.rating)} />
                  <span className="text-xs font-bold text-slate-700">{pro.rating}</span>
                  <span className="text-xs text-slate-400">({pro.reviews} reviews)</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                [pro.hired,           'Times hired'],
                [`${pro.years} yrs`,  'In business'],
                [pro.responseTime,    'Response time'],
              ].map(([v, l]) => (
                <div key={l} className="bg-slate-50 rounded-xl py-2.5 text-center">
                  <p className="font-extrabold text-slate-900 text-sm leading-tight">{v}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* About */}
        <div className="px-4 mb-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">About</p>
            <p className="text-sm text-slate-700 leading-relaxed">{pro.about}</p>
            <div className="flex items-center gap-1 mt-3">
              <MapPin size={12} className="text-slate-400" />
              <p className="text-xs text-slate-500">{pro.city}</p>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="px-4 mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 px-1">Services</p>
          <div className="flex flex-wrap gap-2">
            {pro.services.map(s => (
              <span key={s} className="px-3 py-1.5 bg-turquoise-50 text-turquoise-700 text-xs font-semibold rounded-full border border-turquoise-100">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Portfolio */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Portfolio</p>
            <span className="text-[11px] text-slate-400 flex items-center gap-1"><Camera size={11}/>{pro.portfolio.length} photos</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {pro.portfolio.map((p, i) => (
              <div key={i} className="aspect-square rounded-xl bg-slate-100 flex flex-col items-center justify-center gap-1">
                <Camera size={16} className="text-slate-400" />
                <p className="text-[9px] font-semibold text-slate-500 truncate px-1">{p.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reviews</p>
            <button onClick={() => navigate(`/app/user/contractor-reviews/${pro.id}`)}
              className="flex items-center gap-1 text-xs font-bold text-turquoise-600">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              {pro.rating} · See all {pro.reviews}
            </button>
          </div>
          <div className="space-y-3">
            {pro.recentReviews.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{r.name}</p>
                    <p className="text-[11px] text-slate-400">{r.project} · {r.date}</p>
                  </div>
                  <Stars n={r.rating} />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{r.text}</p>
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle2 size={11} className="text-emerald-500" />
                  <span className="text-[10px] text-slate-400">Verified hire</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky footer CTA */}
      <div className="fixed bottom-[64px] left-1/2 -translate-x-1/2 w-full max-w-sm px-4 pb-3 bg-white border-t border-slate-200 pt-3 z-40">
        <div className="flex gap-3">
          <button onClick={() => navigate('/app/user/messages')}
            className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-2xl flex items-center justify-center shrink-0 transition-colors">
            <MessageSquare size={18} className="text-slate-600" />
          </button>
          <button
            onClick={() => navigate(`/app/user/request-quote?proId=${pro.id}&proName=${encodeURIComponent(pro.name)}`)}
            className="flex-1 py-3.5 bg-turquoise-500 hover:bg-turquoise-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg"
          >
            <Briefcase size={16}/> Request a Quote
          </button>
        </div>
      </div>
    </MobileAppLayout>
  )
}
