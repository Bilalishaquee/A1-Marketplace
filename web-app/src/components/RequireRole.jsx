import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Route guard (layout). Redirects to /login when signed out, or home when the
// signed-in user's role isn't allowed. Used as an element wrapper with nested
// <Route>s rendered through <Outlet/>.
export default function RequireRole({ roles }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-turquoise-500" size={28} />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <Outlet />
}
