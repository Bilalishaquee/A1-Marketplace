import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, BriefcaseBusiness, Calendar, ChevronDown, FolderKanban, LayoutDashboard,
  LogOut, Menu, Search, ShieldCheck, User, Wrench, X,
} from 'lucide-react'
import { useAuth, ROLE_HOME } from '../../context/AuthContext'
import { Avatar, Button, Container } from '../ui/marketplace'

const publicNav = [
  { label: 'Find pros', href: '/browse' },
  { label: 'Cost guides', href: '/cost-guides' },
  { label: 'For pros', href: '/register?role=provider' },
]

function ProfileMenu({ user, logout }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const home = ROLE_HOME[user.role] || '/dashboard'
  const links = user.role === 'provider'
    ? [
        { label: 'Provider dashboard', to: '/provider', icon: BriefcaseBusiness },
        { label: 'Jobs', to: '/provider/jobs', icon: FolderKanban },
        { label: 'Schedule', to: '/provider/schedule', icon: Calendar },
      ]
    : user.role === 'admin'
      ? [{ label: 'Admin console', to: '/admin', icon: LayoutDashboard }]
      : [
          { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
          { label: 'Projects', to: '/dashboard', icon: FolderKanban },
          { label: 'Schedule', to: '/schedule', icon: Calendar },
        ]

  const doLogout = async () => {
    setOpen(false)
    await logout()
    navigate('/login')
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-slate-100">
        <Avatar name={user.name} className="h-8 w-8 text-xs" />
        <span className="hidden max-w-[140px] truncate text-sm font-semibold text-slate-900 sm:block">{user.name}</span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="truncate text-sm font-semibold text-slate-950">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
            <Link to={home} onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <LayoutDashboard size={15} /> Home
            </Link>
            {links.map((item) => (
              <Link key={item.label} to={item.to} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                <item.icon size={15} /> {item.label}
              </Link>
            ))}
            <button onClick={doLogout} className="mt-1 flex w-full items-center gap-2 rounded-md border-t border-slate-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const isApp = ['/dashboard', '/tracking', '/schedule', '/quote'].some((p) => pathname.startsWith(p))

  if (isApp) return <AppNavbar user={user} logout={logout} />

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center gap-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
              <Wrench size={17} />
            </div>
            <div className="leading-tight">
              <span className="block text-sm font-semibold text-slate-950">A-1 Renovations</span>
              <span className="block text-[11px] font-medium text-slate-500">Home services marketplace</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex">
            {publicNav.map((item) => (
              <Link key={item.label} to={item.href} className="nav-link">{item.label}</Link>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            {user ? (
              <>
                <Button as={Link} to={ROLE_HOME[user.role] || '/dashboard'} variant="ghost" size="sm">Dashboard</Button>
                <ProfileMenu user={user} logout={logout} />
              </>
            ) : (
              <>
                <Button as={Link} to="/login" variant="ghost" size="sm">Sign in</Button>
                <Button as={Link} to="/register?role=provider" variant="secondary" size="sm">Join as a pro</Button>
                <Button as={Link} to="/quote" size="sm"><Search size={15} /> Start a project</Button>
              </>
            )}
          </div>

          <button className="ml-auto rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </Container>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <Container className="py-3">
            <div className="space-y-1">
              {publicNav.map((item) => (
                <Link key={item.label} to={item.href} onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">{item.label}</Link>
              ))}
              <div className="border-t border-slate-100 pt-3">
                {user ? (
                  <div className="space-y-2">
                    <Button as={Link} to={ROLE_HOME[user.role] || '/dashboard'} className="w-full" onClick={() => setMobileOpen(false)}>Dashboard</Button>
                    <Button variant="secondary" className="w-full" onClick={async () => { setMobileOpen(false); await logout() }}>Sign out</Button>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Button as={Link} to="/quote" className="w-full" onClick={() => setMobileOpen(false)}>Start a project</Button>
                    <Button as={Link} to="/login" variant="secondary" className="w-full" onClick={() => setMobileOpen(false)}>Sign in</Button>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </div>
      )}
    </header>
  )
}

function AppNavbar({ user, logout }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <Container>
        <div className="flex h-16 items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-white"><Wrench size={15} /></div>
            <span className="text-sm font-semibold text-slate-950">A-1 Renovations</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {[
              { label: 'Dashboard', to: '/dashboard' },
              { label: 'Projects', to: '/dashboard' },
              { label: 'New project', to: '/quote' },
              { label: 'Schedule', to: '/schedule' },
            ].map((item) => (
              <Link key={item.label} to={item.to} className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950">{item.label}</Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100">
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-600" />
            </button>
            {user ? <ProfileMenu user={user} logout={logout} /> : <Button as={Link} to="/login" size="sm">Sign in</Button>}
          </div>
        </div>
      </Container>
    </header>
  )
}
