import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import {
  Bell, Shield, CreditCard, HelpCircle, LogOut,
  ChevronRight, Phone, Mail, Star, Settings,
  CalendarDays, Gift, CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'

const MENU = [
  { icon:Bell,         label:'Notifications',     sub:'Push, email, SMS preferences', to:'/app/user/settings'   },
  { icon:CreditCard,   label:'Payment Methods',   sub:'Manage payment methods',       to:'/app/user/payments'   },
  { icon:CalendarDays, label:'My Schedule',        sub:'Appointments & consultations', to:'/app/user/schedule'   },
  { icon:Shield,       label:'Privacy & Security', sub:'Password, 2FA',               to:'/app/user/settings'   },
  { icon:Star,         label:'My Reviews',         sub:'Reviews you have posted',      to:'/app/user/my-reviews' },
  { icon:Settings,     label:'Settings',           sub:'Account, preferences',         to:'/app/user/settings'   },
  { icon:HelpCircle,   label:'Help & Support',     sub:'Chat, FAQ, tickets',           to:'/app/user/support'    },
]

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative rounded-full shrink-0 transition-colors"
      style={{ width:40, height:22, background: checked ? '#00BCD4' : '#E2E8F0' }}>
      <span
        className="absolute top-0.5 bg-white rounded-full shadow transition-transform"
        style={{ width:18, height:18, transform: checked ? 'translateX(20px)' : 'translateX(2px)' }}
      />
    </button>
  )
}

export default function AppUserProfile() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [notifs, setNotifs] = useState(true)
  const [dark,   setDark]   = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <MobileAppLayout role="user">
      <div className="pt-12 pb-8 space-y-3">

        {/* Profile card */}
        <div className="px-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-lg font-bold text-white shrink-0">
              {user?.initials || 'JC'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-base">{user?.name || 'Your Account'}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <CheckCircle2 size={12} className="text-turquoise-500 shrink-0" />
                <span className="text-xs text-slate-500 capitalize">{user?.role ? user.role.toLowerCase() : 'Homeowner'}</span>
              </div>
            </div>
            <Link
              to="/app/user/edit-profile"
              className="text-xs font-medium text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">
              Edit
            </Link>
          </div>
        </div>

        {/* Contact */}
        <div className="px-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide px-1 mb-2">Contact</p>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-50">
            {[
              [Mail,  user?.email],
              [Phone, user?.phone],
            ].filter(([, val]) => val).map(([Icon, val]) => (
              <div key={val} className="flex items-center gap-3 px-4 py-3">
                <Icon size={14} className="text-slate-400 shrink-0" />
                <span className="text-sm text-slate-700">{val}</span>
              </div>
            ))}
            {!user?.email && !user?.phone && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Mail size={14} className="text-slate-400 shrink-0" />
                <span className="text-sm text-slate-400">No contact info on file</span>
              </div>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div className="px-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide px-1 mb-2">Preferences</p>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-50">
            {[
              ['Push Notifications', notifs, setNotifs],
              ['Dark Mode',          dark,   setDark  ],
            ].map(([label, val, setter]) => (
              <div key={label} className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm text-slate-700">{label}</span>
                <Toggle checked={val} onChange={setter} />
              </div>
            ))}
          </div>
        </div>

        {/* Menu */}
        <div className="px-4">
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-50">
            {MENU.map(({ icon: Icon, label, sub, to }) => {
              const inner = (
                <>
                  <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-slate-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm text-slate-800 font-medium">{label}</p>
                    <p className="text-xs text-slate-400">{sub}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </>
              )
              return to ? (
                <Link key={label} to={to} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors">
                  {inner}
                </Link>
              ) : (
                <button key={label} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors">
                  {inner}
                </button>
              )
            })}
          </div>
        </div>

        {/* Rewards */}
        <div className="px-4">
          <Link
            to="/app/user/rewards"
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl border border-amber-200 hover:bg-amber-50 transition-colors">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <Gift size={14} className="text-amber-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-slate-900">My Rewards</p>
              <p className="text-xs text-slate-400">View your rewards program</p>
            </div>
            <ChevronRight size={14} className="text-slate-300" />
          </Link>
        </div>

        {/* Sign out */}
        <div className="px-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-red-500 font-medium rounded-2xl border border-slate-200 hover:bg-red-50 hover:border-red-200 transition-colors">
            <LogOut size={14}/> Sign Out
          </button>
        </div>

        <p className="text-center text-xs text-slate-300 pb-2">A-1 Renovations v1.0.0</p>
      </div>
    </MobileAppLayout>
  )
}
