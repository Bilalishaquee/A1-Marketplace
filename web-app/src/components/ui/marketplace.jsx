import { motion } from 'framer-motion'
import clsx from 'clsx'
import { AlertCircle, CheckCircle2, Clock, FolderOpen, Loader2, Search } from 'lucide-react'

export function PageShell({ children, className = '' }) {
  return <div className={clsx('min-h-screen bg-slate-50 text-slate-900', className)}>{children}</div>
}

export function Container({ children, className = '' }) {
  return <div className={clsx('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>
}

export function SectionHeader({ eyebrow, title, description, action, className = '' }) {
  return (
    <div className={clsx('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{eyebrow}</p>}
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function PageHeader({ title, description, action, meta, className = '' }) {
  return (
    <div className={clsx('mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0">
        {meta && <div className="mb-2">{meta}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        {description && <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function Card({ children, className = '', as: Component = 'div' }) {
  return <Component className={clsx('rounded-lg border border-slate-200 bg-white shadow-sm', className)}>{children}</Component>
}

export function MotionCard({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay }}
      className={clsx('rounded-lg border border-slate-200 bg-white shadow-sm', className)}
    >
      {children}
    </motion.div>
  )
}

export function Button({ children, variant = 'primary', size = 'md', className = '', as: Component = 'button', ...props }) {
  const variants = {
    primary: 'bg-emerald-700 text-white hover:bg-emerald-800 border-emerald-700',
    secondary: 'bg-white text-slate-900 hover:bg-slate-50 border-slate-300',
    ghost: 'border-transparent text-slate-700 hover:bg-slate-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 border-red-600',
  }
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-5 text-base',
  }
  return (
    <Component
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md border font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

export function TextInput({ className = '', ...props }) {
  return (
    <input
      className={clsx('h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15', className)}
      {...props}
    />
  )
}

export function TextArea({ className = '', ...props }) {
  return (
    <textarea
      className={clsx('w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15', className)}
      {...props}
    />
  )
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={clsx('h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15', className)}
      {...props}
    >
      {children}
    </select>
  )
}

export function Badge({ children, tone = 'slate', className = '' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }
  return <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold', tones[tone], className)}>{children}</span>
}

export function StatusBadge({ status }) {
  const key = String(status || '').toUpperCase()
  const tone = ['COMPLETED', 'ACCEPTED'].includes(key) ? 'green'
    : ['POSTED', 'MATCHED', 'SCHEDULED', 'IN_PROGRESS', 'ESTIMATED'].includes(key) ? 'blue'
      : ['FAILED', 'CANCELLED', 'DECLINED'].includes(key) ? 'red'
        : 'amber'
  return <Badge tone={tone}>{status || 'Pending'}</Badge>
}

export function MetricCard({ label, value, icon: Icon, helper, tone = 'green', className = '' }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-700',
  }
  return (
    <Card className={clsx('p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
          {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
        </div>
        {Icon && <div className={clsx('flex h-9 w-9 items-center justify-center rounded-md', tones[tone])}><Icon size={18} /></div>}
      </div>
    </Card>
  )
}

export function EmptyState({ title = 'Nothing here yet', description, icon: Icon = FolderOpen, action }) {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-400">
        <Icon size={22} />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  )
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <Card className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-slate-500">
      <Loader2 size={18} className="animate-spin text-emerald-700" />
      {label}
    </Card>
  )
}

export function Alert({ children, tone = 'amber', className = '' }) {
  const Icon = tone === 'green' ? CheckCircle2 : tone === 'blue' ? Clock : AlertCircle
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    red: 'border-red-200 bg-red-50 text-red-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  }
  return (
    <div className={clsx('flex gap-3 rounded-lg border p-4 text-sm leading-6', tones[tone], className)}>
      <Icon size={17} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

export function SearchField({ className = '', ...props }) {
  return (
    <div className={clsx('relative', className)}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <TextInput className="pl-9" {...props} />
    </div>
  )
}

export function Avatar({ name = '?', className = '' }) {
  const initials = name.trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase() || '?'
  return <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white', className)}>{initials}</div>
}
