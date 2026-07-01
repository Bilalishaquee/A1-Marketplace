import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, Search, Star, MapPin, Filter } from 'lucide-react'

const SERVICES = ['All','Kitchen','Bathroom','Addition','Roofing','Flooring','Deck','Electrical','Plumbing']

const CONTRACTORS = [
  { id:1, name:'Mike Rodriguez',    specialty:'General Contractor',  rating:4.9, reviews:127, city:'Austin, TX',     dist:'2.4 mi',  price:'$120–$400/hr', badge:'Top Pro',  verified:true, avatar:'MR' },
  { id:2, name:'Carlos Morales',    specialty:'Home Additions',      rating:4.7, reviews:89,  city:'Austin, TX',     dist:'3.1 mi',  price:'$180–$320/hr', badge:null,       verified:true, avatar:'CM' },
  { id:3, name:'Lisa Chen',         specialty:'Kitchen & Bath',      rating:4.8, reviews:203, city:'Austin, TX',     dist:'4.5 mi',  price:'$150–$380/hr', badge:'Top Pro',  verified:true, avatar:'LC' },
  { id:4, name:'James Thompson',    specialty:'Flooring Specialist', rating:4.6, reviews:54,  city:'Round Rock, TX', dist:'8.2 mi',  price:'$80–$160/hr',  badge:null,       verified:true, avatar:'JT' },
  { id:5, name:'Maria Garcia',      specialty:'Bathroom Renovation', rating:4.9, reviews:312, city:'Austin, TX',     dist:'5.7 mi',  price:'$200–$350/hr', badge:'Top Pro',  verified:true, avatar:'MG' },
  { id:6, name:'David Park',        specialty:'Roofing & Siding',   rating:4.5, reviews:41,  city:'Pflugerville, TX',dist:'11.3 mi', price:'$90–$140/hr',  badge:null,       verified:false,avatar:'DP' },
]

export default function AppUserBrowse() {
  const navigate   = useNavigate()
  const [query, setQuery]     = useState('')
  const [service, setService] = useState('All')
  const [sort, setSort]       = useState('rating')

  const filtered = CONTRACTORS
    .filter(c => !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.specialty.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sort === 'rating' ? b.rating - a.rating : parseFloat(a.dist) - parseFloat(b.dist))

  return (
    <MobileAppLayout role="user">
      <div className="pt-10 pb-6">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 mb-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <h1 className="font-extrabold text-slate-900 text-lg">Find Contractors</h1>
        </div>

        {/* Search */}
        <div className="px-4 mb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search name or specialty..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
          </div>
        </div>

        {/* Service filter chips */}
        <div className="flex gap-2 px-4 overflow-x-auto pb-1 mb-3 scrollbar-hide">
          {SERVICES.map(s => (
            <button key={s} onClick={() => setService(s)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                service === s
                  ? 'bg-turquoise-500 text-white border-turquoise-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}>{s}</button>
          ))}
        </div>

        {/* Sort + count row */}
        <div className="flex items-center justify-between px-4 mb-3">
          <p className="text-xs text-slate-400">{filtered.length} contractors nearby</p>
          <div className="flex items-center gap-1.5">
            <Filter size={12} className="text-slate-400" />
            {['rating','distance'].map(s => (
              <button key={s} onClick={() => setSort(s)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg capitalize ${
                  sort === s ? 'bg-turquoise-100 text-turquoise-700' : 'text-slate-400 hover:text-slate-600'
                }`}>{s}</button>
            ))}
          </div>
        </div>

        {/* Contractor cards */}
        <div className="px-4 space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                    {c.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">{c.badge}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">{c.specialty}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                      <Star size={11} className="fill-amber-400 text-amber-400"/> {c.rating}
                      <span className="text-slate-300 font-normal ml-0.5">({c.reviews})</span>
                    </span>
                    <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
                      <MapPin size={9}/>{c.dist}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                <span className="text-xs font-semibold text-turquoise-600">{c.price}</span>
                <button onClick={() => navigate(`/app/user/contractor/${c.id}`)}
                  className="px-4 py-1.5 bg-turquoise-500 hover:bg-turquoise-600 text-white text-xs font-bold rounded-xl transition-colors">
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileAppLayout>
  )
}
