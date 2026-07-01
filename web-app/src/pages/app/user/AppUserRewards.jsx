import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, Gift, Star, Zap, CheckCircle2, Lock, ChevronRight } from 'lucide-react'

const TIERS = [
  { name:'Bronze',  min:0,    max:999,   color:'bg-amber-700',  text:'text-amber-700',  ring:'ring-amber-300' },
  { name:'Silver',  min:1000, max:2499,  color:'bg-slate-400',  text:'text-slate-500',  ring:'ring-slate-300' },
  { name:'Gold',    min:2500, max:4999,  color:'bg-amber-400',  text:'text-amber-500',  ring:'ring-amber-200' },
  { name:'Platinum',min:5000, max:99999, color:'bg-turquoise-500',text:'text-turquoise-600',ring:'ring-turquoise-200' },
]

const POINTS = 1240
const NEXT_TIER_POINTS = 2500

const HISTORY = [
  { desc:'Kitchen Remodel completed',    pts:'+500', date:'Apr 28, 2026', icon:'✅' },
  { desc:'Left a 5-star review',         pts:'+50',  date:'Apr 29, 2026', icon:'⭐' },
  { desc:'Referred a friend',            pts:'+200', date:'Mar 15, 2026', icon:'👥' },
  { desc:'First project booked',         pts:'+200', date:'Jan 10, 2026', icon:'🏠' },
  { desc:'Profile completed',            pts:'+100', date:'Jan 5, 2026',  icon:'👤' },
  { desc:'Account created',             pts:'+50',  date:'Jan 3, 2026',  icon:'🎉' },
  { desc:'Redeemed: $25 service credit', pts:'-160', date:'Feb 12, 2026', icon:'🎁' },
]

const REWARDS = [
  { id:1, title:'$25 Service Credit',      cost:200,  unlocked:true,  desc:'Applied to your next booking' },
  { id:2, title:'Priority Matching',       cost:350,  unlocked:true,  desc:'Jump to the front of the queue' },
  { id:3, title:'Free Site Inspection',    cost:500,  unlocked:true,  desc:'$150 value — 1 per project'    },
  { id:4, title:'$100 Service Credit',     cost:750,  unlocked:true,  desc:'Applied to your next booking' },
  { id:5, title:'VIP Pro Access',          cost:1200, unlocked:false, desc:'Access to top-rated pros only'  },
  { id:6, title:'Free Project Management', cost:2000, unlocked:false, desc:'Dedicated project manager'      },
]

const HOW_TO = [
  { action:'Complete a project',   pts:'+500' },
  { action:'Leave a review',       pts:'+50'  },
  { action:'Refer a friend',       pts:'+200' },
  { action:'Book a consultation',  pts:'+25'  },
  { action:'Upload project photos',pts:'+15'  },
]

export default function AppUserRewards() {
  const navigate       = useNavigate()
  const [redeemed,     setRedeemed]   = useState([])
  const [redeeming,    setRedeeming]  = useState(null)

  const currentTier  = TIERS.find(t => POINTS >= t.min && POINTS <= t.max) || TIERS[0]
  const nextTier     = TIERS[TIERS.indexOf(currentTier) + 1]
  const pctToNext    = nextTier ? Math.round(((POINTS - currentTier.min) / (nextTier.min - currentTier.min)) * 100) : 100

  const handleRedeem = r => {
    if (r.cost > POINTS || redeemed.includes(r.id)) return
    setRedeeming(r.id)
    setTimeout(() => { setRedeemed(p => [...p, r.id]); setRedeeming(null) }, 1200)
  }

  return (
    <MobileAppLayout role="user">
      <div className="pt-10 pb-10 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3 px-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <h1 className="font-extrabold text-slate-900 text-lg">My Rewards</h1>
        </div>

        {/* Points hero card */}
        <div className="mx-4 bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl p-5 shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-amber-100 text-xs font-semibold uppercase tracking-wide">Total Points</p>
              <p className="text-white font-extrabold text-5xl mt-1">{POINTS.toLocaleString()}</p>
            </div>
            <div className={`px-3 py-1.5 ${currentTier.color} rounded-xl flex items-center gap-1.5 shadow`}>
              <Star size={12} className="text-white fill-white" />
              <span className="text-white text-xs font-extrabold">{currentTier.name}</span>
            </div>
          </div>

          {/* Tier progress */}
          {nextTier && (
            <div>
              <div className="flex justify-between text-xs text-amber-100 mb-1.5">
                <span>{currentTier.name}</span>
                <span>{nextTier.name} · {(nextTier.min - POINTS).toLocaleString()} pts away</span>
              </div>
              <div className="h-2.5 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all" style={{width:`${pctToNext}%`}} />
              </div>
            </div>
          )}
          {!nextTier && (
            <p className="text-amber-100 text-xs font-semibold">You have reached the highest tier!</p>
          )}
        </div>

        {/* Tier badges */}
        <div className="px-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Membership Tiers</p>
          <div className="grid grid-cols-4 gap-2">
            {TIERS.map(t => {
              const active = t.name === currentTier.name
              return (
                <div key={t.name} className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all ${
                  active ? `${t.color} border-transparent shadow-md` : 'bg-white border-slate-200'
                }`}>
                  <Star size={16} className={active ? 'text-white fill-white' : 'text-slate-300 fill-slate-200'} />
                  <span className={`text-[10px] font-extrabold ${active ? 'text-white' : 'text-slate-400'}`}>{t.name}</span>
                  <span className={`text-[9px] ${active ? 'text-white/80' : 'text-slate-300'}`}>{t.min >= 1000 ? `${t.min/1000}K` : t.min}+</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Rewards catalog */}
        <div className="px-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Redeem Rewards</p>
          <div className="space-y-2">
            {REWARDS.map(r => {
              const canAfford   = r.cost <= POINTS
              const isRedeemed  = redeemed.includes(r.id)
              const isRedeeming = redeeming === r.id
              return (
                <div key={r.id} className={`bg-white rounded-2xl border p-4 flex items-center gap-3 ${
                  isRedeemed ? 'border-emerald-200 bg-emerald-50/30' : r.unlocked && canAfford ? 'border-slate-200' : 'border-slate-100 opacity-60'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isRedeemed ? 'bg-emerald-500' : r.unlocked && canAfford ? 'bg-amber-400' : 'bg-slate-200'
                  }`}>
                    {isRedeemed
                      ? <CheckCircle2 size={18} className="text-white" />
                      : r.unlocked
                      ? <Gift size={18} className="text-white" />
                      : <Lock size={16} className="text-slate-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{r.title}</p>
                    <p className="text-[11px] text-slate-400">{r.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-extrabold text-amber-600">{r.cost} pts</p>
                    {!isRedeemed && (
                      <button
                        onClick={() => handleRedeem(r)}
                        disabled={!canAfford || !r.unlocked || isRedeeming}
                        className={`mt-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                          canAfford && r.unlocked
                            ? 'bg-amber-400 hover:bg-amber-500 text-white'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}>
                        {isRedeeming ? '...' : canAfford && r.unlocked ? 'Redeem' : r.unlocked ? 'Need pts' : 'Locked'}
                      </button>
                    )}
                    {isRedeemed && (
                      <span className="mt-1 text-[10px] font-bold text-emerald-600">Redeemed</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* How to earn */}
        <div className="px-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">How to Earn Points</p>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-50">
            {HOW_TO.map(h => (
              <div key={h.action} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Zap size={13} className="text-amber-400 shrink-0" />
                  <span className="text-sm text-slate-700">{h.action}</span>
                </div>
                <span className="text-sm font-extrabold text-amber-500">{h.pts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Points history */}
        <div className="px-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Points History</p>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-50">
            {HISTORY.map((h, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span className="text-base shrink-0">{h.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{h.desc}</p>
                  <p className="text-[11px] text-slate-400">{h.date}</p>
                </div>
                <span className={`text-sm font-extrabold shrink-0 ${h.pts.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
                  {h.pts}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </MobileAppLayout>
  )
}
