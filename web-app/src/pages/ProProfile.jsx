import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Star, Award, Shield, Clock, CheckCircle2, MapPin, Phone,
  MessageSquare, ChevronLeft, Calendar, Camera, ChevronRight,
  ThumbsUp, Hammer, Home as HomeIcon, Bath, Layers, Zap
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

const REVIEWS = [
  { name:'Jennifer R.', rating:5, date:'Apr 2026', proj:'Kitchen Remodel',     text:'Exceptional work! Mike completely transformed our outdated kitchen into a modern showpiece. On time, on budget, and the craftsmanship is flawless.' },
  { name:'Tom B.',       rating:5, date:'Mar 2026', proj:'Bathroom Renovation', text:'Professional from start to finish. He noticed a hidden plumbing issue during demo and fixed it before it became a major problem. Highly recommend.' },
  { name:'Diana P.',     rating:4, date:'Feb 2026', proj:'Tile Backsplash',     text:'Beautiful tile work. Finished 2 days ahead of schedule. Only minor feedback: communication could be more proactive mid-project.' },
  { name:'Carlos M.',    rating:5, date:'Jan 2026', proj:'Kitchen Remodel',     text:'Third time hiring Mike. He consistently delivers above expectations. Already booked him for the master bath next month.' },
]

const SERVICES = [
  { icon: HomeIcon, name:'Kitchen Remodeling',    starts:'$8,000',  desc:'Full kitchen renovations from layout design to final install.' },
  { icon: Bath,     name:'Bathroom Renovation',   starts:'$4,500',  desc:'Complete bathroom transformations including tile, fixtures, and vanities.' },
  { icon: Layers,   name:'Tile & Flooring',       starts:'$1,500',  desc:'Tile installation, hardwood, LVP, and natural stone.' },
]

const PORTFOLIO = [
  { title:'Modern White Kitchen',   cat:'Kitchen',   color:'bg-turquoise-100' },
  { title:'Spa Master Bathroom',    cat:'Bathroom',  color:'bg-blue-100'      },
  { title:'Herringbone Tile Floor', cat:'Flooring',  color:'bg-amber-100'     },
  { title:'Open Concept Remodel',   cat:'Interior',  color:'bg-violet-100'    },
  { title:'Kitchen Cabinet Redo',   cat:'Kitchen',   color:'bg-teal-100'      },
  { title:'Walk-in Shower Build',   cat:'Bathroom',  color:'bg-sky-100'       },
]

export default function ProProfile() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [msgOpen, setMsgOpen] = useState(false)
  const [msg, setMsg] = useState('')

  const pro = {
    name:'Mike Rodriguez', initials:'MR', color:'bg-turquoise-500',
    title:'Kitchen & Bath Specialist', badge:'Top Pro', rating:4.9,
    reviews:214, jobs:312, resp:'< 1 hr', since:'2018', price:'$$',
    zip:'Los Angeles, CA', verified:true,
    bio:`Mike Rodriguez has been transforming Los Angeles kitchens and bathrooms for over 15 years. Known for his meticulous attention to detail, transparent communication, and on-time project delivery, Mike has earned a reputation as one of the most trusted contractors in the LA area.

He specializes in full kitchen and bathroom renovations, from structural layout changes and plumbing rough-ins to final tile work and fixture installation. All projects are managed directly by Mike — no subcontracting without client approval.`,
    certs:['Licensed General Contractor (CA #784321)','NKBA Certified Kitchen Designer','EPA Lead-Safe Certified','Fully Insured — $2M Liability'],
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-[68px]">
        {/* Hero */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link to="/browse" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-turquoise-600 mb-6 transition-colors">
              <ChevronLeft size={15} /> Back to search results
            </Link>

            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Avatar */}
              <div className={`pro-avatar w-24 h-24 text-3xl ${pro.color} shadow-lg shrink-0`}>{pro.initials}</div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold text-slate-900">{pro.name}</h1>
                  {pro.badge && (
                    <span className="top-pro-badge">
                      <Award size={13} className="fill-amber-600 text-amber-600" /> {pro.badge}
                    </span>
                  )}
                  {pro.verified && <span className="badge-success"><Shield size={12} /> Verified & Insured</span>}
                </div>
                <p className="text-slate-500 mb-3">{pro.title}</p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <div className="flex">{[1,2,3,4,5].map(n=><Star key={n} size={15} className={n<=Math.floor(pro.rating)?'star-filled':'star-empty'}/>)}</div>
                    <strong className="text-slate-900">{pro.rating}</strong>
                    <span className="text-slate-400">({pro.reviews} reviews)</span>
                  </div>
                  <span className="flex items-center gap-1"><Hammer size={14} className="text-turquoise-400" />{pro.jobs} jobs</span>
                  <span className="flex items-center gap-1"><Clock size={14} className="text-turquoise-400" />Responds {pro.resp}</span>
                  <span className="flex items-center gap-1"><MapPin size={14} className="text-turquoise-400" />{pro.zip}</span>
                  <span className="flex items-center gap-1 text-slate-400">On platform since {pro.since}</span>
                </div>
              </div>

              {/* CTA sidebar */}
              <div className="flex flex-col gap-3 md:w-52 shrink-0">
                <Link to="/quote" className="btn-primary w-full py-3 text-sm">
                  <Zap size={15} className="fill-white" /> Get AI Quote
                </Link>
                <button onClick={() => setMsgOpen(true)} className="btn-secondary w-full py-3 text-sm">
                  <MessageSquare size={15} /> Send Message
                </button>
                <Link to="/schedule" className="btn-ghost w-full py-2.5 text-sm border border-slate-200 rounded-xl flex items-center justify-center gap-2 hover:bg-turquoise-50 hover:border-turquoise-300">
                  <Calendar size={15} /> Schedule Consult
                </Link>
              </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
              {[
                { val:`${pro.rating}★`,   label:'Rating' },
                { val:`${pro.reviews}`,   label:'Reviews' },
                { val:`${pro.jobs}`,      label:'Jobs Done' },
                { val:pro.resp,           label:'Avg Response' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-xl font-extrabold text-slate-900">{s.val}</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-slate-100 sticky top-16 z-30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-0 overflow-x-auto">
              {['overview','portfolio','reviews','services'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-5 py-4 text-sm font-semibold capitalize whitespace-nowrap border-b-2 transition-all duration-200 ${
                    activeTab === tab ? 'border-turquoise-500 text-turquoise-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">

              {/* Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="card">
                    <h2 className="font-bold text-slate-900 text-lg mb-4">About {pro.name}</h2>
                    {pro.bio.split('\n\n').map((p,i) => (
                      <p key={i} className="text-slate-600 text-sm leading-relaxed mb-3 last:mb-0">{p}</p>
                    ))}
                  </div>
                  <div className="card">
                    <h2 className="font-bold text-slate-900 text-lg mb-4">Certifications & Credentials</h2>
                    <ul className="space-y-3">
                      {pro.certs.map(c => (
                        <li key={c} className="flex items-center gap-3 text-sm text-slate-700">
                          <CheckCircle2 size={16} className="text-turquoise-500 shrink-0" /> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Recent review preview */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-slate-900 text-lg">Recent Reviews</h2>
                      <button onClick={() => setActiveTab('reviews')} className="text-turquoise-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                        All {pro.reviews} <ChevronRight size={14} />
                      </button>
                    </div>
                    {REVIEWS.slice(0,2).map((r,i) => (
                      <div key={i} className={`py-4 ${i<1?'border-b border-slate-100':''}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex">{[1,2,3,4,5].map(n=><Star key={n} size={13} className={n<=r.rating?'star-filled':'star-empty'}/>)}</div>
                          <span className="badge-turquoise text-[10px]">{r.proj}</span>
                          <span className="text-xs text-slate-400 ml-auto">{r.date}</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed italic">"{r.text}"</p>
                        <p className="text-xs text-slate-400 font-semibold mt-1.5">— {r.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio */}
              {activeTab === 'portfolio' && (
                <div className="animate-fade-in">
                  <h2 className="font-bold text-slate-900 text-lg mb-5">Project Portfolio ({PORTFOLIO.length} projects)</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {PORTFOLIO.map((p, i) => (
                      <div key={i} className={`rounded-2xl overflow-hidden aspect-[4/3] ${p.color} flex flex-col justify-end group cursor-pointer relative hover:shadow-card-hover transition-all duration-300`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Camera size={32} className="text-slate-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="relative bg-gradient-to-t from-black/60 via-black/20 to-transparent p-3">
                          <p className="text-white font-bold text-xs leading-tight">{p.title}</p>
                          <span className="badge-turquoise text-[10px] mt-1">{p.cat}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {activeTab === 'reviews' && (
                <div className="animate-fade-in space-y-4">
                  <div className="card flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-5xl font-extrabold text-slate-900">{pro.rating}</div>
                      <div className="flex justify-center mt-1">{[1,2,3,4,5].map(n=><Star key={n} size={18} className={n<=Math.floor(pro.rating)?'star-filled':'star-empty'}/>)}</div>
                      <div className="text-xs text-slate-400 mt-1">{pro.reviews} reviews</div>
                    </div>
                    <div className="flex-1">
                      {[5,4,3,2,1].map(n => {
                        const count = n===5?180:n===4?25:n===3?7:n===2?2:0
                        const pct = Math.round(count/pro.reviews*100)
                        return (
                          <div key={n} className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs text-slate-500 w-4">{n}</span>
                            <Star size={11} className="star-filled shrink-0" />
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-turquoise-500 rounded-full" style={{ width:`${pct}%` }} />
                            </div>
                            <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  {REVIEWS.map((r, i) => (
                    <div key={i} className="card">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-turquoise-500 flex items-center justify-center text-white text-xs font-bold">{r.name[0]}</div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{r.name}</p>
                            <p className="text-xs text-slate-400">{r.date}</p>
                          </div>
                        </div>
                        <div className="flex">{[1,2,3,4,5].map(n=><Star key={n} size={14} className={n<=r.rating?'star-filled':'star-empty'}/>)}</div>
                      </div>
                      <span className="badge-turquoise text-[10px] mb-2">{r.proj}</span>
                      <p className="text-sm text-slate-700 leading-relaxed mt-2">"{r.text}"</p>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50">
                        <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-turquoise-600 transition-colors"><ThumbsUp size={12} /> Helpful</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Services */}
              {activeTab === 'services' && (
                <div className="animate-fade-in space-y-4">
                  <h2 className="font-bold text-slate-900 text-lg mb-4">Services & Pricing</h2>
                  {SERVICES.map((s, i) => (
                    <div key={i} className="card-hover p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 bg-turquoise-50 rounded-xl flex items-center justify-center shrink-0">
                          <s.icon size={20} className="text-turquoise-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-slate-900">{s.name}</h3>
                            <span className="text-turquoise-600 font-bold text-sm">Starts at {s.starts}</span>
                          </div>
                          <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                          <Link to="/quote" className="mt-3 text-turquoise-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                            Get quote for this service <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky sidebar */}
            <div className="space-y-4">
              <div className="card sticky top-24">
                <h3 className="font-bold text-slate-900 mb-1">Contact {pro.name.split(' ')[0]}</h3>
                <p className="text-xs text-slate-400 mb-4">Typically responds {pro.resp}</p>
                <Link to="/quote" className="btn-primary w-full py-3 text-sm mb-2">
                  <Zap size={15} className="fill-white" /> Get AI-Powered Quote
                </Link>
                <button onClick={() => setMsgOpen(true)} className="btn-secondary w-full py-3 text-sm mb-2">
                  <MessageSquare size={15} /> Message
                </button>
                <Link to="/schedule" className="btn-ghost w-full py-2.5 text-sm border border-slate-200 rounded-xl flex items-center justify-center gap-2">
                  <Calendar size={15} /> Free Consultation
                </Link>
                <p className="text-xs text-slate-400 text-center mt-4">
                  <Shield size={11} className="inline mr-1 text-turquoise-400" />
                  Your info is secure & never shared without permission
                </p>
              </div>

              <div className="card">
                <h3 className="font-bold text-slate-900 mb-3 text-sm">Service Area</h3>
                <div className="bg-turquoise-50 rounded-xl p-3 mb-3 text-sm text-slate-600 flex items-center gap-2">
                  <MapPin size={15} className="text-turquoise-500 shrink-0" />
                  Los Angeles metro area within 30 miles
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Los Angeles','Glendale','Burbank','Pasadena','Santa Monica','Culver City','Torrance'].map(a => (
                    <span key={a} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{a}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message modal */}
      {msgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`pro-avatar w-10 h-10 text-sm ${pro.color}`}>{pro.initials}</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{pro.name}</p>
                  <p className="text-xs text-turquoise-500">Responds {pro.resp}</p>
                </div>
              </div>
              <button onClick={() => setMsgOpen(false)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your name</label>
                <input className="input-field text-sm" placeholder="John Smith" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message</label>
                <textarea rows={4} className="input-field resize-none text-sm"
                  placeholder={`Hi ${pro.name.split(' ')[0]}, I'm interested in getting a quote for my ${SERVICES[0].name.toLowerCase()} project…`}
                  value={msg} onChange={e => setMsg(e.target.value)} />
              </div>
              <button onClick={() => { setMsgOpen(false); setMsg('') }} className="btn-primary w-full py-3 text-sm">
                <MessageSquare size={15} /> Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
