import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import {
  Bell, ChevronRight, Home, FolderPlus, Loader2,
  Wand2, ClipboardList, Wrench,
  UtensilsCrossed, Bath, BedDouble, Armchair, Coffee,
  Warehouse, TreePine, Layers, Shirt, Monitor, Package, Plus,
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { myProjects, dollars } from '../../../lib/platformApi'

const ROOMS = [
  { id:'kitchen',  label:'Kitchen',     icon:UtensilsCrossed },
  { id:'bathroom', label:'Bathroom',    icon:Bath            },
  { id:'bedroom',  label:'Bedroom',     icon:BedDouble       },
  { id:'living',   label:'Living Room', icon:Armchair        },
  { id:'dining',   label:'Dining Room', icon:Coffee          },
  { id:'garage',   label:'Garage',      icon:Warehouse       },
  { id:'outdoor',  label:'Outdoor',     icon:TreePine        },
  { id:'basement', label:'Basement',    icon:Layers          },
  { id:'laundry',  label:'Laundry',     icon:Shirt           },
  { id:'office',   label:'Home Office', icon:Monitor         },
  { id:'attic',    label:'Attic',       icon:Package         },
  { id:'other',    label:'Other',       icon:Plus            },
]

const STATUS_INFO = {
  DRAFT:       { bar:'bg-slate-300',     label:'Draft',        text:'text-slate-400',     progress:5   },
  ANALYZING:   { bar:'bg-slate-300',     label:'Analyzing',    text:'text-slate-400',     progress:10  },
  ESTIMATED:   { bar:'bg-slate-300',     label:'Estimated',    text:'text-slate-400',     progress:20  },
  POSTED:      { bar:'bg-blue-400',      label:'Posted',       text:'text-blue-600',      progress:30  },
  MATCHED:     { bar:'bg-blue-400',      label:'Matched',      text:'text-blue-600',      progress:40  },
  SCHEDULED:   { bar:'bg-turquoise-500', label:'Scheduled',    text:'text-turquoise-600', progress:55  },
  IN_PROGRESS: { bar:'bg-turquoise-500', label:'In Progress',  text:'text-turquoise-600', progress:70  },
  COMPLETED:   { bar:'bg-emerald-500',   label:'Completed',    text:'text-emerald-600',   progress:100 },
  CANCELLED:   { bar:'bg-slate-300',     label:'Cancelled',    text:'text-slate-400',     progress:0   },
  FAILED:      { bar:'bg-red-400',       label:'Failed',       text:'text-red-600',       progress:0   },
}
const statusInfo = (p) => STATUS_INFO[p.status] || STATUS_INFO.DRAFT
const projectTitle = (p) => p.scopeEstimate?.categoryLabel || p.categoryKey || 'Project'

export default function AppUserHome() {
  const { user }       = useAuth()
  const navigate       = useNavigate()
  const [homeExpanded, setHomeExpanded] = useState(false)
  const [projects, setProjects] = useState(null) // null = loading

  useEffect(() => { myProjects().then(setProjects).catch(() => setProjects([])) }, [])

  const handleRoomTap = room => {
    setHomeExpanded(false)
    navigate(`/app/user/request-quote?room=${room.id}&roomLabel=${encodeURIComponent(room.label)}`)
  }

  return (
    <MobileAppLayout role="user">

      {/* Header */}
      <div className="bg-slate-900 px-4 pt-10 pb-16">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-normal">Good morning,</p>
            <p className="text-white font-bold text-xl tracking-tight mt-0.5">
              {user?.name?.split(' ')[0] || 'there'}
            </p>
          </div>
          <button
            onClick={() => navigate('/app/user/notifications')}
            className="relative w-9 h-9 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
            <Bell size={16} className="text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-8 pb-8 space-y-3">

        {/* ── Start New Project ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
              <FolderPlus size={15} className="text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Start New Project</p>
              <p className="text-xs text-slate-400">Choose how you want to begin</p>
            </div>
          </div>

          {/* Two options */}
          <div className="p-3 grid grid-cols-2 gap-2">
            {/* Quick Start — AI */}
            <button
              onClick={() => navigate('/app/user/quote')}
              className="flex flex-col items-center gap-3 py-5 px-3 bg-turquoise-500 hover:bg-turquoise-600 rounded-xl transition-colors">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Wand2 size={20} className="text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white leading-tight">Quick Start</p>
                <p className="text-xs text-turquoise-100 mt-0.5">AI-powered</p>
              </div>
            </button>

            {/* Manual Entry */}
            <button
              onClick={() => navigate('/app/user/request-quote')}
              className="flex flex-col items-center gap-3 py-5 px-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors">
              <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center">
                <ClipboardList size={20} className="text-slate-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800 leading-tight">Manual Entry</p>
                <p className="text-xs text-slate-400 mt-0.5">Step-by-step</p>
              </div>
            </button>
          </div>
        </div>

        {/* ── My Home ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setHomeExpanded(e => !e)}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition-colors">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
              <Home size={16} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-slate-900">My Home</p>
              <p className="text-xs text-slate-400 mt-0.5">Browse rooms and manage projects</p>
            </div>
            <div className={`w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center transition-transform duration-200 ${homeExpanded ? 'rotate-45' : ''}`}>
              <Plus size={13} className="text-slate-500" />
            </div>
          </button>

          {homeExpanded && (
            <div className="border-t border-slate-100 px-4 pb-5">
              <p className="text-xs text-slate-400 pt-3 pb-3">Select a room to view or start a project</p>
              <div className="grid grid-cols-4 gap-x-2 gap-y-4">
                {ROOMS.map(room => (
                  <button
                    key={room.id}
                    onClick={() => handleRoomTap(room)}
                    className="flex flex-col items-center gap-2 group">
                    <div className="w-13 h-13 w-[52px] h-[52px] bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                      <room.icon size={20} className="text-slate-500" />
                    </div>
                    <span className="text-xs text-slate-500 text-center leading-tight">{room.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── My Projects ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <p className="text-sm font-semibold text-slate-900">My Projects</p>
            {projects && projects.length > 0 && (
              <Link to="/app/user/projects" className="text-xs text-turquoise-600 font-medium flex items-center gap-0.5">
                View all <ChevronRight size={12}/>
              </Link>
            )}
          </div>

          {projects === null ? (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="text-turquoise-500 animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FolderPlus size={22} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600">No projects yet</p>
              <p className="text-xs text-slate-400 mt-1">Start with a free AI quote.</p>
              <button onClick={() => navigate('/app/user/quote')}
                className="mt-3 text-xs font-bold text-turquoise-600">
                Get an AI quote
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 3).map(p => {
                const i = statusInfo(p)
                const s = p.scopeEstimate
                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    {/* Project header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                        <Wrench size={19} className="text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900 truncate">{projectTitle(p)}</p>
                          <span className={`text-xs font-medium ${i.text}`}>{i.label}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {p.location?.city || p.location?.zip || 'Location pending'}
                        </p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-400">{i.progress}% complete</span>
                        {s && (
                          <span className="text-xs text-slate-400">
                            {dollars(s.priceLow)} – {dollars(s.priceHigh)}
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${i.bar} rounded-full transition-all`}
                          style={{width:`${i.progress}%`}}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/app/user/projects')}
                      className="w-full py-2.5 bg-turquoise-500 hover:bg-turquoise-600 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                      View Project <ChevronRight size={12}/>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </MobileAppLayout>
  )
}
