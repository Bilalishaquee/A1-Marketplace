import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3, Bell, BrainCircuit, ChevronDown, CreditCard, FolderKanban, HardHat,
  LayoutDashboard, LogOut, Menu, Settings, Sparkles, Users, Wrench,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui/marketplace'

const nav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/providers', icon: HardHat, label: 'Providers' },
  { to: '/admin/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/admin/quotes', icon: Sparkles, label: 'Quotes & AI' },
  { to: '/admin/llm-training', icon: BrainCircuit, label: 'LLM Training' },
  { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

function Sidebar({ onClose }) {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <aside className="flex h-full w-64 flex-col bg-slate-950 text-white">
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-slate-950"><Wrench size={15} /></div>
        <div>
          <p className="text-sm font-semibold">A-1 Admin</p>
          <p className="text-xs text-slate-400">Operations console</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const active = pathname === item.to || (item.to !== '/admin' && pathname.startsWith(item.to))
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-white text-slate-950' : 'text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon size={17} /> {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-2 rounded-md px-2 py-2">
          <Avatar name={user?.name} className="h-8 w-8 bg-white text-slate-950 text-xs" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
        </div>
        <button onClick={async () => { await logout(); navigate('/login') }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  )
}

export default function AdminLayout({ children, title, subtitle }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:block"><Sidebar /></div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0"><Sidebar onClose={() => setMobileOpen(false)} /></div>
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
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>
          <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
            <Avatar name={user?.name} className="h-8 w-8 text-xs" />
            <span className="max-w-[140px] truncate text-sm font-medium text-slate-700">{user?.name}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
