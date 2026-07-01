import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowRight, BriefcaseBusiness, Eye, EyeOff, Home, Lock, Mail, Phone, User, Wrench } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth, ROLE_HOME } from '../context/AuthContext'
import { getTaxonomy } from '../lib/aiEngine'
import { Alert, Button, Card, TextInput } from '../components/ui/marketplace'

export default function Register() {
  const [params] = useSearchParams()
  const initialRole = params.get('role') === 'provider' ? 'provider' : 'client'
  const [accountType, setAccountType] = useState(initialRole)
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', businessName: '', trades: [] })
  const { register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { getTaxonomy().then((d) => setCategories(d.categories || [])).catch(() => {}) }, [])

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const toggleTrade = (key) => setForm((f) => ({ ...f, trades: f.trades.includes(key) ? f.trades.filter((t) => t !== key) : [...f.trades, key] }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (accountType === 'provider' && !form.businessName.trim()) {
      setError('Please enter your business name.')
      return
    }
    setLoading(true)
    try {
      const user = await register({
        email: form.email.trim(),
        password: form.password,
        name: `${form.firstName} ${form.lastName}`.trim(),
        phone: form.phone || undefined,
        role: accountType,
        ...(accountType === 'provider' ? { businessName: form.businessName.trim(), trades: form.trades } : {}),
      })
      navigate(ROLE_HOME[user.role] || '/dashboard')
    } catch (err) {
      setError(err.message || 'Could not create your account. Please try again.')
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
          <div>
            <h1 className="max-w-sm text-3xl font-semibold text-slate-950">Create an account for the right side of the marketplace.</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">Homeowners can create projects and compare bids. Providers can find work and manage submitted quotes.</p>
          </div>
          <p className="text-xs text-slate-500">Already have an account? <Link to="/login" className="font-semibold text-emerald-700">Sign in</Link></p>
        </section>

        <main className="flex items-center justify-center px-5 py-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
            <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white"><Wrench size={17} /></div>
              <span className="text-sm font-semibold text-slate-950">A-1 Renovations</span>
            </Link>

            <h2 className="text-2xl font-semibold text-slate-950">Create your account</h2>
            <p className="mt-1 text-sm text-slate-600">Already registered? <Link to="/login" className="font-semibold text-emerald-700">Sign in</Link></p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { id: 'client', icon: Home, label: 'Homeowner', body: 'Post projects and compare bids.' },
                { id: 'provider', icon: BriefcaseBusiness, label: 'Service provider', body: 'Find jobs and submit quotes.' },
              ].map((item) => {
                const Icon = item.icon
                const active = accountType === item.id
                return (
                  <button key={item.id} type="button" onClick={() => setAccountType(item.id)} className={`rounded-lg border p-4 text-left transition-colors ${active ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <Icon size={20} className={active ? 'text-emerald-700' : 'text-slate-500'} />
                    <p className="mt-3 font-semibold text-slate-950">{item.label}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{item.body}</p>
                  </button>
                )
              })}
            </div>

            <Card className="mt-6 p-5">
              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field icon={User} label="First name"><TextInput required placeholder="John" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} className="pl-9" /></Field>
                  <Field label="Last name"><TextInput placeholder="Smith" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} /></Field>
                </div>

                {accountType === 'provider' && (
                  <>
                    <Field label="Business name"><TextInput required placeholder="Smith Renovations LLC" value={form.businessName} onChange={(e) => update('businessName', e.target.value)} /></Field>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-950">Services offered</label>
                      <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 p-2">
                        <div className="grid gap-1 sm:grid-cols-2">
                          {categories.map((category) => (
                            <label key={category.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                              <input type="checkbox" checked={form.trades.includes(category.key)} onChange={() => toggleTrade(category.key)} className="accent-emerald-700" />
                              {category.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Field icon={Mail} label="Email address"><TextInput type="email" required placeholder="you@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} className="pl-9" /></Field>
                <Field icon={Phone} label="Phone"><TextInput type="tel" placeholder="(555) 000-0000" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="pl-9" /></Field>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-950">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <TextInput type={showPwd ? 'text' : 'password'} required minLength={8} placeholder="Minimum 8 characters" value={form.password} onChange={(e) => update('password', e.target.value)} className="pl-9 pr-10" />
                    <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && <Alert tone="red"><AlertCircle size={16} /> {error}</Alert>}
                <Button type="submit" size="lg" disabled={loading} className="w-full">
                  {loading ? 'Creating account…' : <>Create account <ArrowRight size={16} /></>}
                </Button>
              </form>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  )
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-950">{label}</label>
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />}
        {children}
      </div>
    </div>
  )
}
