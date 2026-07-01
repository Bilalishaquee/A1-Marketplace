import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowRight, BriefcaseBusiness, Eye, EyeOff, Home, Lock, Mail, ShieldCheck, Wrench } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth, ROLE_HOME } from '../context/AuthContext'
import { Alert, Button, TextInput } from '../components/ui/marketplace'

const copy = {
  client: {
    title: 'Sign in to manage your projects',
    body: 'Review estimates, compare bids, message providers, and track your renovation work from one dashboard.',
    icon: Home,
    label: 'Homeowner',
  },
  provider: {
    title: 'Sign in to your provider portal',
    body: 'Find qualified projects, submit bids, manage messages, and keep your schedule organized.',
    icon: BriefcaseBusiness,
    label: 'Service provider',
  },
  admin: {
    title: 'Sign in to the admin console',
    body: 'Monitor marketplace activity, users, providers, quotes, and AI operations.',
    icon: ShieldCheck,
    label: 'Admin',
  },
}

const visibleRoles = ['client', 'provider']

export default function Login() {
  const [params] = useSearchParams()
  const role = ['client', 'provider', 'admin'].includes(params.get('role')) ? params.get('role') : 'client'
  const active = useMemo(() => copy[role], [role])
  const Icon = active.icon
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })
  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email.trim(), form.password)
      navigate(ROLE_HOME[user.role] || '/dashboard')
    } catch (err) {
      setError(err.message || 'Could not sign in. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[.9fr_1.1fr]">
        <section className="hidden border-r border-slate-200 bg-white p-10 lg:flex lg:flex-col lg:justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white"><Wrench size={17} /></div>
            <div>
              <p className="text-sm font-semibold text-slate-950">A-1 Renovations</p>
              <p className="text-xs text-slate-500">Home services marketplace</p>
            </div>
          </Link>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Icon size={23} /></div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{active.title}</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">{active.body}</p>
            <div className="mt-8 grid gap-3 text-sm text-slate-700">
              {['Clear project records', 'Direct messaging', 'Role-based dashboard'].map((item) => (
                <div key={item} className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-700" /> {item}</div>
              ))}
            </div>
          </motion.div>
          <p className="text-xs text-slate-500">© 2026 A-1 Renovations LLC</p>
        </section>

        <main className="flex items-center justify-center px-5 py-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white"><Wrench size={17} /></div>
              <span className="text-sm font-semibold text-slate-950">A-1 Renovations</span>
            </Link>
            <div className="mb-6 flex gap-2 rounded-lg bg-slate-100 p-1">
              {visibleRoles.map((key) => {
                const item = copy[key]
                return (
                <Link key={key} to={`/login?role=${key}`} className={`flex-1 rounded-md px-3 py-2 text-center text-xs font-semibold transition-colors ${role === key ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                  {item.label}
                </Link>
                )
              })}
            </div>
            <h2 className="text-2xl font-semibold text-slate-950">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-600">No account yet? <Link to={`/register?role=${role === 'admin' ? 'client' : role}`} className="font-semibold text-emerald-700 hover:text-emerald-800">Create one</Link></p>

            <form onSubmit={submit} className="mt-7 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-950">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <TextInput type="email" required placeholder="you@example.com" className="pl-9" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-950">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <TextInput type={showPwd ? 'text' : 'password'} required placeholder="Your password" className="pl-9 pr-10" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                  <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && <Alert tone="red"><AlertCircle size={16} /> {error}</Alert>}
              <Button type="submit" disabled={loading} size="lg" className="w-full">
                {loading ? 'Signing in…' : <>Sign in <ArrowRight size={16} /></>}
              </Button>
            </form>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
