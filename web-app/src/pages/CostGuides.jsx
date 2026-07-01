import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DollarSign, TrendingUp, ArrowRight, ChevronRight, Home as HomeIcon,
  Bath, Layers, PaintBucket, TreePine, Hammer, Zap, Search,
  Wind, Droplets, Plug, Info
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

const GUIDES = [
  {
    icon: HomeIcon, service:'Kitchen Remodeling', low:8000, high:35000, avg:15000,
    grad:'from-turquoise-500 to-teal-600',
    factors:['Cabinet type (stock vs. custom)','Countertop material (laminate vs quartz)','Appliance grade','Square footage'],
    breakdown:[{item:'Labor',pct:35},{item:'Cabinetry',pct:30},{item:'Countertops',pct:15},{item:'Appliances',pct:12},{item:'Other',pct:8}],
    timeline:'2–6 weeks',
  },
  {
    icon: Bath, service:'Bathroom Renovation', low:4500, high:18000, avg:9500,
    grad:'from-blue-500 to-blue-700',
    factors:['Fixture quality','Tile choice','Shower vs. tub','Layout changes'],
    breakdown:[{item:'Labor',pct:40},{item:'Fixtures',pct:25},{item:'Tile & Materials',pct:25},{item:'Other',pct:10}],
    timeline:'1–3 weeks',
  },
  {
    icon: Layers, service:'Flooring Installation', low:1500, high:8000, avg:4200,
    grad:'from-amber-500 to-orange-600',
    factors:['Material type (LVP, hardwood, tile)','Area square footage','Subfloor condition','Removal of old flooring'],
    breakdown:[{item:'Labor',pct:45},{item:'Materials',pct:40},{item:'Prep & Disposal',pct:15}],
    timeline:'3–7 days',
  },
  {
    icon: PaintBucket, service:'Interior Painting', low:900, high:4500, avg:2200,
    grad:'from-purple-500 to-violet-700',
    factors:['Number of rooms','Ceiling height','Wall condition','Number of coats'],
    breakdown:[{item:'Labor',pct:70},{item:'Paint & Supplies',pct:25},{item:'Prep',pct:5}],
    timeline:'2–5 days',
  },
  {
    icon: TreePine, service:'Roof Replacement', low:5500, high:22000, avg:11000,
    grad:'from-rose-500 to-red-700',
    factors:['Roof pitch and complexity','Material type (asphalt, tile, metal)','Square footage','Decking condition'],
    breakdown:[{item:'Labor',pct:40},{item:'Materials',pct:45},{item:'Disposal',pct:15}],
    timeline:'1–5 days',
  },
  {
    icon: Hammer, service:'Basement Finishing', low:10000, high:40000, avg:22500,
    grad:'from-emerald-500 to-teal-600',
    factors:['Square footage','Egress windows needed','Bathroom addition','Current plumbing/electrical'],
    breakdown:[{item:'Framing & Drywall',pct:25},{item:'Electrical',pct:20},{item:'HVAC',pct:15},{item:'Flooring',pct:20},{item:'Other',pct:20}],
    timeline:'4–10 weeks',
  },
]

export default function CostGuides() {
  const [selected, setSelected] = useState(0)
  const [search, setSearch] = useState('')
  const guide = GUIDES[selected]
  const fmt = n => `$${n.toLocaleString()}`

  const filtered = GUIDES.filter(g => g.service.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-[68px]">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="badge bg-turquoise-500/20 text-turquoise-300 border border-turquoise-500/30 mx-auto mb-4 text-sm">
              <TrendingUp size={13} /> AI-Updated Daily
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">Renovation Cost Guides</h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Real pricing data from 2,400+ completed projects in the Los Angeles area. Updated daily by our AI pricing engine.
            </p>
            {/* Search */}
            <div className="relative max-w-md mx-auto mt-8">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input-field pl-11 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-turquoise-400 text-sm py-3.5 rounded-xl"
                placeholder="Search service (e.g. Kitchen)…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-[280px,1fr] gap-8">
            {/* Sidebar nav */}
            <div>
              <div className="card p-2 sticky top-24">
                {(search ? filtered : GUIDES).map((g, i) => {
                  const idx = GUIDES.indexOf(g)
                  return (
                    <button key={g.service} onClick={() => { setSelected(idx); setSearch('') }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all duration-200 ${
                        selected === idx ? 'bg-turquoise-500 text-white' : 'text-slate-600 hover:bg-turquoise-50 hover:text-turquoise-700'
                      }`}>
                      <g.icon size={17} />
                      <span className="flex-1 leading-tight">{g.service}</span>
                      {selected !== idx && <span className="text-xs font-normal text-slate-400">{fmt(g.avg)}</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Detail */}
            <div className="space-y-5 animate-fade-in">
              {/* Hero card */}
              <div className={`rounded-3xl p-8 bg-gradient-to-br ${guide.grad} text-white relative overflow-hidden`}>
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start gap-5 relative z-10">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 shrink-0">
                    <guide.icon size={28} />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm font-medium mb-1">{guide.timeline} · Los Angeles area</p>
                    <h2 className="text-2xl font-extrabold mb-1">{guide.service}</h2>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/20 relative z-10">
                  {[{l:'Low estimate',v:fmt(guide.low)},{l:'LA Average',v:fmt(guide.avg),big:true},{l:'High estimate',v:fmt(guide.high)}].map(s=>(
                    <div key={s.l} className="text-center">
                      <div className={`${s.big?'text-3xl':'text-xl'} font-extrabold`}>{s.v}</div>
                      <div className="text-white/70 text-xs mt-0.5">{s.l}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 relative z-10">
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>{fmt(guide.low)}</span><span>{fmt(guide.high)}</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white/60 rounded-full" style={{ width:'60%', marginLeft:'20%' }} />
                  </div>
                </div>
              </div>

              {/* Cost breakdown */}
              <div className="card">
                <h3 className="font-bold text-slate-900 mb-5">Cost Breakdown</h3>
                <div className="space-y-3">
                  {guide.breakdown.map(b => (
                    <div key={b.item} className="flex items-center gap-3">
                      <div className="w-28 text-sm text-slate-600 font-medium shrink-0">{b.item}</div>
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-turquoise-500 rounded-full transition-all duration-700" style={{ width:`${b.pct}%` }} />
                      </div>
                      <span className="text-sm font-bold text-slate-700 w-10 text-right">{b.pct}%</span>
                      <span className="text-xs text-slate-400 w-20 text-right">~{fmt(Math.round(guide.avg*b.pct/100))}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Factors */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Info size={17} className="text-turquoise-500" />
                  <h3 className="font-bold text-slate-900">What affects the cost?</h3>
                </div>
                <ul className="space-y-2.5">
                  {guide.factors.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <ChevronRight size={15} className="text-turquoise-400 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="card bg-turquoise-50 border-turquoise-200">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-12 h-12 bg-turquoise-500 rounded-2xl flex items-center justify-center shrink-0">
                    <Zap size={22} className="text-white fill-white" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-bold text-slate-900 mb-0.5">Get an exact quote for your project</h3>
                    <p className="text-sm text-slate-500">Upload photos → AI analyzes your space → get a personalized estimate in &lt;2 min</p>
                  </div>
                  <Link to="/quote" className="btn-primary text-sm py-3 px-6 shrink-0">
                    Get AI Quote <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
