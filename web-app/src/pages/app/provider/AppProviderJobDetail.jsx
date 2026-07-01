import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, CheckCircle2, Clock, MapPin, DollarSign, Camera, MessageSquare, Phone, User, Activity, Upload } from 'lucide-react'

const JOBS = {
  'P-1247': {
    id:'P-1247', name:'Kitchen Full Remodel', client:'Sarah Johnson', clientPhone:'+1 (512) 555-0192',
    clientAvatar:'SJ', clientBg:'bg-slate-900',
    progress:48, daysLeft:24, budget:45000, status:'active',
    city:'Austin, TX', addr:'2847 Oak St, Austin, TX 78704',
    start:'Apr 1, 2026', end:'Jun 15, 2026',
    milestones:[
      { name:'Demolition',        done:true,  date:'Apr 3' },
      { name:'Plumbing rough-in', done:true,  date:'Apr 8' },
      { name:'Electrical rough-in',done:true, date:'Apr 12'},
      { name:'Drywall',           done:true,  date:'Apr 20'},
      { name:'Cabinetry',         done:false, date:'May 14', current:true },
      { name:'Countertops',       done:false, date:'May 25' },
      { name:'Backsplash',        done:false, date:'Jun 2'  },
      { name:'Appliances',        done:false, date:'Jun 8'  },
      { name:'Final walkthrough', done:false, date:'Jun 15' },
    ],
    nextPayout: { amount:11250, milestone:'Cabinetry complete', due:'May 25' },
  },
  'P-1089': {
    id:'P-1089', name:'Full Home Renovation', client:'Emily Rodriguez', clientPhone:'+1 (305) 555-0177',
    clientAvatar:'ER', clientBg:'bg-slate-900',
    progress:61, daysLeft:17, budget:180000, status:'active',
    city:'Miami, FL', addr:'1524 Bayshore Dr, Miami, FL 33131',
    start:'Feb 10, 2026', end:'May 30, 2026',
    milestones:[
      { name:'Demo & Permits',   done:true,  date:'Feb 15' },
      { name:'Structural',       done:true,  date:'Mar 1'  },
      { name:'Plumbing',         done:true,  date:'Mar 15' },
      { name:'Electrical',       done:true,  date:'Apr 1'  },
      { name:'Drywall',          done:true,  date:'Apr 20' },
      { name:'Flooring',         done:false, date:'May 10', current:true },
      { name:'Kitchen & Baths',  done:false, date:'May 20' },
      { name:'Paint & Finish',   done:false, date:'May 28' },
      { name:'Final walkthrough',done:false, date:'May 30' },
    ],
    nextPayout: { amount:45000, milestone:'Flooring complete', due:'May 15' },
  },
  'P-1312': {
    id:'P-1312', name:'ADU Garage Conversion', client:'Chris Wilson', clientPhone:'+1 (512) 555-0204',
    clientAvatar:'CW', clientBg:'bg-slate-900',
    progress:10, daysLeft:99, budget:85000, status:'planning',
    city:'Austin, TX', addr:'982 Garden Ln, Austin, TX 78702',
    start:'Apr 18, 2026', end:'Aug 10, 2026',
    milestones:[
      { name:'Permits',     done:true,  date:'Apr 25', current:true },
      { name:'Structural',  done:false, date:'May 10' },
      { name:'Plumbing',    done:false, date:'May 25' },
      { name:'Electrical',  done:false, date:'Jun 5'  },
      { name:'Framing',     done:false, date:'Jun 20' },
      { name:'Drywall',     done:false, date:'Jul 5'  },
      { name:'Kitchen',     done:false, date:'Jul 18' },
      { name:'Bathroom',    done:false, date:'Jul 28' },
      { name:'Finish work', done:false, date:'Aug 10' },
    ],
    nextPayout: { amount:21250, milestone:'Structural complete', due:'May 15' },
  },
  'P-1320': {
    id:'P-1320', name:'Bathroom & Half Bath', client:'Barbara Anderson', clientPhone:'+1 (415) 555-0133',
    clientAvatar:'BA', clientBg:'bg-slate-900',
    progress:2, daysLeft:28, budget:38000, status:'planning',
    city:'San Francisco, CA', addr:'2204 Market St, San Francisco, CA 94114',
    start:'May 5, 2026', end:'Jun 10, 2026',
    milestones:[
      { name:'Demo',           done:false, date:'May 8',  current:true },
      { name:'Plumbing',       done:false, date:'May 15' },
      { name:'Tile work',      done:false, date:'May 22' },
      { name:'Vanity install', done:false, date:'May 28' },
      { name:'Fixtures',       done:false, date:'Jun 5'  },
      { name:'Final',          done:false, date:'Jun 10' },
    ],
    nextPayout: { amount:9500, milestone:'Demo complete', due:'May 12' },
  },
  'P-1198': {
    id:'P-1198', name:'Composite Deck', client:'David Williams', clientPhone:'+1 (615) 555-0188',
    clientAvatar:'DW', clientBg:'bg-slate-900',
    progress:100, daysLeft:0, budget:28000, status:'completed',
    city:'Nashville, TN', addr:'401 Riverside Dr, Nashville, TN 37201',
    start:'Jan 10, 2026', end:'Feb 28, 2026',
    milestones:[
      { name:'Permits',   done:true, date:'Jan 14' },
      { name:'Footings',  done:true, date:'Jan 20' },
      { name:'Frame',     done:true, date:'Feb 3'  },
      { name:'Decking',   done:true, date:'Feb 14' },
      { name:'Railing',   done:true, date:'Feb 20' },
      { name:'Lighting',  done:true, date:'Feb 25' },
      { name:'Final',     done:true, date:'Feb 28' },
    ],
    nextPayout: null,
  },
}

const STATUS_COLORS = { active:'bg-turquoise-500', planning:'bg-slate-300', completed:'bg-emerald-500' }
const STATUS_PILL  = { active:'bg-turquoise-100 text-turquoise-700', planning:'bg-slate-100 text-slate-500', completed:'bg-emerald-100 text-emerald-700' }
const STATUS_LABEL = { active:'Active', planning:'Planning', completed:'Completed' }

export default function AppProviderJobDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const job        = JOBS[id] || JOBS['P-1247']
  const doneCount  = job.milestones.filter(m => m.done).length
  const [uploading, setUploading] = useState(false)
  const [uploaded,  setUploaded]  = useState(false)

  const handleUpload = () => {
    setUploading(true)
    setTimeout(() => { setUploading(false); setUploaded(true) }, 1400)
  }

  return (
    <MobileAppLayout role="provider">
      <div className="pb-8">
        {/* Header */}
        <div className="bg-slate-900 px-4 pt-10 pb-5">
          <button onClick={() => navigate(-1)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center mb-4">
            <ChevronLeft size={18} className="text-white" />
          </button>
          <p className="text-white font-extrabold text-lg leading-tight">{job.name}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_PILL[job.status]}`}>{STATUS_LABEL[job.status]}</span>
            <span className="text-slate-400 text-xs">{job.id}</span>
          </div>
        </div>

        <div className="px-4 space-y-4 mt-4">
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              [`$${(job.budget/1000).toFixed(0)}K`, 'Budget'],
              [job.daysLeft || 'Done', 'Days Left'],
              [`${job.progress}%`, 'Progress'],
            ].map(([v, l]) => (
              <div key={l} className="bg-slate-50 rounded-xl py-3 text-center">
                <p className="font-extrabold text-slate-900 text-sm">{v}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{l}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between mb-1.5">
              <p className="text-xs font-bold text-slate-700">Milestones</p>
              <p className="text-xs text-slate-400">{doneCount}/{job.milestones.length} complete</p>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${STATUS_COLORS[job.status]} rounded-full transition-all`} style={{width:`${job.progress}%`}} />
            </div>
          </div>

          {/* Client card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Client</p>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${job.clientBg} rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                {job.clientAvatar}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900 text-sm">{job.client}</p>
                <div className="flex items-center gap-0.5 text-xs text-slate-400 mt-0.5">
                  <MapPin size={10}/> {job.addr}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate('/app/provider/messages')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-turquoise-50 text-turquoise-700 text-xs font-bold rounded-xl border border-turquoise-100 hover:bg-turquoise-100 transition-colors">
                <MessageSquare size={12}/> Message
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                <Phone size={12}/> Call
              </button>
            </div>
          </div>

          {/* Next payout */}
          {job.nextPayout && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">Next Payout</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-extrabold text-emerald-800">${job.nextPayout.amount.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">On: {job.nextPayout.milestone}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-emerald-600">Due</p>
                  <p className="text-sm font-bold text-emerald-800">{job.nextPayout.due}</p>
                </div>
              </div>
            </div>
          )}

          {/* Site log upload */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Site Log</p>
            <button onClick={handleUpload} disabled={uploading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-semibold transition-all ${
                uploaded
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-300 bg-slate-50 text-slate-500 hover:border-turquoise-300 hover:bg-turquoise-50 hover:text-turquoise-600'
              }`}>
              {uploading
                ? <><Upload size={15} className="animate-bounce"/> Uploading...</>
                : uploaded
                ? <><CheckCircle2 size={15}/> Photos uploaded</>
                : <><Camera size={15}/> Upload site photos</>
              }
            </button>
          </div>

          {/* Milestones */}
          <div>
            <p className="text-sm font-bold text-slate-900 mb-2">Milestone Tracker</p>
            <div className="space-y-2">
              {job.milestones.map((m, i) => (
                <div key={m.name} className={`flex items-center gap-3 p-3 rounded-xl ${
                  m.done ? 'bg-emerald-50' : m.current ? 'bg-turquoise-50 border border-turquoise-200' : 'bg-slate-50'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    m.done ? 'bg-emerald-500' : m.current ? 'bg-turquoise-500' : 'bg-slate-200'
                  }`}>
                    {m.done && <CheckCircle2 size={12} className="text-white" />}
                    {m.current && !m.done && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className={`flex-1 text-xs font-medium ${
                    m.done ? 'text-emerald-700' : m.current ? 'text-turquoise-700 font-bold' : 'text-slate-400'
                  }`}>{m.name}</span>
                  <span className={`text-[10px] ${m.done ? 'text-emerald-500' : 'text-slate-400'}`}>{m.date}</span>
                  {m.current && <span className="text-[10px] bg-turquoise-100 text-turquoise-700 px-1.5 py-0.5 rounded font-semibold">Active</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2 pb-4">
            <button onClick={() => navigate(`/app/provider/messages`)}
              className="flex items-center justify-center gap-1.5 py-3 bg-turquoise-500 text-white text-xs font-bold rounded-xl hover:bg-turquoise-600 transition-colors">
              <MessageSquare size={13}/> Message Client
            </button>
            <button onClick={() => navigate(`/app/provider/schedule`)}
              className="flex items-center justify-center gap-1.5 py-3 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-colors">
              <Activity size={13}/> View Schedule
            </button>
          </div>
        </div>
      </div>
    </MobileAppLayout>
  )
}
