import { Link, useLocation } from 'react-router-dom'
import { Home, FolderKanban, MessageSquare, Bell, User } from 'lucide-react'

const USER_TABS = [
  { to: '/app/user/home',     icon: Home,          label: 'Home'     },
  { to: '/app/user/projects', icon: FolderKanban,  label: 'Projects' },
  { to: '/app/user/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/app/user/notifications', icon: Bell,     label: 'Alerts'   },
  { to: '/app/user/profile',  icon: User,          label: 'Profile'  },
]

const PROVIDER_TABS = [
  { to: '/app/provider/home',     icon: Home,          label: 'Home'     },
  { to: '/app/provider/jobs',     icon: FolderKanban,  label: 'Jobs'     },
  { to: '/app/provider/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/app/provider/notifications', icon: Bell,     label: 'Alerts'   },
  { to: '/app/provider/profile',  icon: User,          label: 'Profile'  },
]

export default function MobileAppLayout({ children, role = 'user' }) {
  const { pathname } = useLocation()
  const tabs = role === 'provider' ? PROVIDER_TABS : USER_TABS

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-sm mx-auto relative border-x border-slate-200 shadow-2xl">
      <div className="flex-1 overflow-y-auto pb-20">
        {children}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-slate-200 z-50">
        <div className="flex">
          {tabs.map(({ to, icon: Icon, label, badge }) => {
            const active = pathname === to || pathname.startsWith(to)
            return (
              <Link key={to} to={to}
                className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 relative transition-colors ${
                  active ? 'text-turquoise-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  {badge && (
                    <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${active ? 'text-turquoise-600' : ''}`}>{label}</span>
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-turquoise-500 rounded-full" />}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
