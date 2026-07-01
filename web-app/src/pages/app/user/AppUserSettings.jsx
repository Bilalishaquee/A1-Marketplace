import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, CheckCircle2, HelpCircle, Star, FileText, ExternalLink } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)}
      className="relative rounded-full shrink-0 transition-colors"
      style={{width:40, height:22, background: checked ? '#00BCD4' : '#E2E8F0'}}>
      <span className="absolute top-0.5 bg-white rounded-full shadow transition-transform"
        style={{width:18, height:18, transform: checked ? 'translateX(20px)' : 'translateX(2px)'}} />
    </button>
  )
}

function Section({ title, children }) {
  return (
    <div className="px-4">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">{title}</p>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <div className="px-4 py-3 border-b border-slate-50 last:border-0">
      <label className="text-[11px] font-bold text-slate-400 block mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full text-sm font-medium text-slate-800 focus:outline-none focus:text-turquoise-600 bg-transparent" />
    </div>
  )
}

function ToggleRow({ label, sub, checked, onChange }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

function LinkRow({ icon: Icon, label, to, navigate: nav }) {
  return (
    <button onClick={() => to && nav(to)}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors">
      <Icon size={15} className="text-slate-400 shrink-0" />
      <span className="flex-1 text-left text-sm font-semibold text-slate-800">{label}</span>
      <ExternalLink size={12} className="text-slate-300" />
    </button>
  )
}

export default function AppUserSettings() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [form, setForm] = useState({
    name:  user?.name  || 'James Carter',
    email: user?.email || 'james.carter@email.com',
    phone: '+1 (512) 555-0187',
  })
  const [push,    setPush]    = useState(true)
  const [email,   setEmail]   = useState(true)
  const [sms,     setSms]     = useState(false)
  const [share,   setShare]   = useState(false)
  const [analytics,setAnalytics] = useState(true)
  const [saved,   setSaved]   = useState(false)

  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <MobileAppLayout role="user">
      <div className="pt-10 pb-10 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 px-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <h1 className="font-extrabold text-slate-900 text-lg">Settings</h1>
        </div>

        <Section title="Account">
          <Field label="Full Name"    value={form.name}  onChange={set('name')}  />
          <Field label="Email"        value={form.email} onChange={set('email')} />
          <Field label="Phone Number" value={form.phone} onChange={set('phone')} />
        </Section>

        <Section title="Notifications">
          <ToggleRow label="Push Notifications" sub="Job updates and alerts"      checked={push}     onChange={setPush}     />
          <ToggleRow label="Email Digest"        sub="Weekly project summary"      checked={email}    onChange={setEmail}    />
          <ToggleRow label="SMS Alerts"          sub="Critical updates via text"   checked={sms}      onChange={setSms}      />
        </Section>

        <Section title="Privacy">
          <ToggleRow label="Share Usage Data"   sub="Help improve the app"         checked={share}    onChange={setShare}    />
          <ToggleRow label="Analytics"          sub="Performance tracking"          checked={analytics}onChange={setAnalytics}/>
        </Section>

        <Section title="Support">
          <LinkRow icon={HelpCircle} label="Help Center"      to="/app/user/support" navigate={navigate} />
          <LinkRow icon={Star}       label="Rate the App"      to={null}              navigate={navigate} />
          <LinkRow icon={FileText}   label="Terms of Service"  to={null}              navigate={navigate} />
        </Section>

        <div className="px-4">
          <button onClick={handleSave}
            className={`w-full py-3.5 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all ${
              saved ? 'bg-emerald-500 text-white' : 'bg-turquoise-500 hover:bg-turquoise-600 text-white'
            }`}>
            {saved ? <><CheckCircle2 size={16}/> Saved!</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </MobileAppLayout>
  )
}
