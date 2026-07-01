import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, Briefcase, Calendar, ChevronDown, DollarSign, FileText,
  LayoutDashboard, LogOut, Menu, MessageSquare, User, Wrench, X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui/marketplace'

const nav = [
  { to: '/provider', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/provider/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/provider/quotes', icon: FileText, label: 'Bids' },
  { to: '/provider/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/provider/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/provider/earnings', icon: DollarSign, label: 'Earnings' },
  { to: '/provider/profile', icon: User, label: 'Profile' },
]

function Sidebar({ mobile = false, onClose }) {
  const { pathname } = useLocation()
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-white"><Wrench size={15} /></div>
        <div>
          <p className="text-sm font-semibold text-slate-950">A-1 Renovations</p>
          <p className="text-xs text-slate-500">Provider portal</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const active = pathname === item.to || (item.to !== '/provider' && pathname.startsWith(item.to))
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => mobile && onClose?.()}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <item.icon size={17} /> {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 flex items-center gap-2 rounded-md px-2 py-2">
          <Avatar name={user?.name} className="h-8 w-8 text-xs" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">Available</p>
          </div>
        </div>
        <button onClick={async () => { await logout(); navigate('/login') }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  )
}

export default function ProviderLayout({ children, title, subtitle }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:block"><Sidebar /></div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0"><Sidebar mobile onClose={() => setMobileOpen(false)} /></div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-slate-950">{title}</h1>
            {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100">
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-600" />
          </button>
          <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
            <Avatar name={user?.name} className="h-8 w-8 text-xs" />
            <span className="max-w-[140px] truncate text-sm font-medium text-slate-700">{user?.name}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
          <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(false)}><X size={20} className="hidden" /></button>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
