import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProviderLayout from '../../components/layout/ProviderLayout'
import { Star, Shield, Mail, Phone, Wrench, LogOut, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const TABS = ['Profile', 'Services']

export default function ProviderProfile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('Profile')

  const profile = user?.providerProfile
  const displayName = profile?.businessName || user?.name || 'Provider'
  const trades = profile?.trades || []
  const rating = profile?.ratingAvg
  const ratingCount = profile?.ratingCount || 0

  return (
    <ProviderLayout title="My Profile" subtitle="Your provider account">
      <div className="p-6">
        {/* Hero */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-5">
          <div className="h-28 bg-gradient-to-br from-turquoise-600 to-turquoise-800" />
          <div className="px-6 pb-5 relative">
            <div className="flex items-end gap-4 -mt-10 mb-4">
              <div className="w-20 h-20 bg-turquoise-500 rounded-2xl border-4 border-white flex items-center justify-center text-2xl font-extrabold text-white shadow-lg">
                {user?.initials}
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900">{displayName}</h2>
                  {profile?.verified && <Shield size={16} className="text-turquoise-500" />}
                </div>
                <p className="text-sm text-slate-500">{user?.name}</p>
              </div>
              {typeof rating === 'number' && ratingCount > 0 && (
                <div className="ml-auto text-center pb-1">
                  <p className="text-lg font-extrabold text-amber-600">{rating.toFixed(1)} ★</p>
                  <p className="text-[11px] text-slate-400">{ratingCount} review{ratingCount === 1 ? '' : 's'}</p>
                </div>
              )}
            </div>

            {profile?.verified ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <CheckCircle2 size={13}/> Verified provider
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                Verification pending
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-5">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>{t}</button>
          ))}
        </div>

        {tab === 'Profile' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['Business Name', profile?.businessName || '—'],
                  ['Contact Name', user?.name || '—'],
                  ['Email', user?.email || '—'],
                  ['Phone', user?.phone || '—'],
                ].map(([l, v]) => (
                  <div key={l}>
                    <p className="text-xs font-semibold text-slate-600 mb-1">{l}</p>
                    <p className="text-sm text-slate-900">{v}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 pt-1 text-xs text-slate-500">
                {user?.email && <span className="flex items-center gap-2"><Mail size={13} className="text-slate-400"/>{user.email}</span>}
                {user?.phone && <span className="flex items-center gap-2"><Phone size={13} className="text-slate-400"/>{user.phone}</span>}
              </div>
            </div>

            <button onClick={() => { logout(); navigate('/login') }}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-semibold transition-colors">
              <LogOut size={14}/> Sign Out
            </button>
          </div>
        )}

        {tab === 'Services' && (
          <div className="space-y-3">
            {trades.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                <Wrench size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">No trades listed yet</p>
              </div>
            ) : trades.map((t, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-turquoise-50 rounded-xl flex items-center justify-center shrink-0">
                  <Wrench size={16} className="text-turquoise-600" />
                </div>
                <p className="font-bold text-slate-900 text-sm">{t}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProviderLayout>
  )
}
