import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { Settings, Sparkles, Bell, CreditCard, Shield, Globe, Save, CheckCircle2 } from 'lucide-react'

const SECTIONS = ['Platform','AI & Quotes','Notifications','Billing','Security','Integrations']

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-colors ${checked ? 'bg-turquoise-500' : 'bg-slate-200'}`}
      style={{ height: 22, width: 40 }}
    >
      <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-[18px]' : ''}`}
        style={{ width: 18, height: 18, transform: checked ? 'translateX(18px)' : 'translateX(0)' }} />
    </button>
  )
}

function Field({ label, sublabel, children }) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-slate-50">
      <div className="flex-1 mr-6">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export default function AdminSettings() {
  const { user } = useAuth()
  const [active, setActive] = useState('Platform')
  const [saved, setSaved]   = useState(false)
  const [cfg, setCfg] = useState({
    commission: 10,
    maxResponse: 2,
    featuredSlots: 6,
    quoteExpiry: 72,
    aiModel: 'gpt-4-turbo',
    aiConfidenceThreshold: 80,
    autoApproveQuotes: false,
    requireLicenseVerification: true,
    emailNewProject: true,
    emailNewQuote: true,
    emailPayment: true,
    smsAlerts: false,
    pushNotifications: true,
    maintenanceMode: false,
    publicPlatform: true,
    reviewAutoPublish: true,
    twoFactorAdmin: true,
    sessionTimeout: 30,
    ipWhitelist: false,
    stripeConnected: true,
    googleMapsConnected: true,
    twilioConnected: false,
    sendgridConnected: true,
  })

  const set = (k, v) => setCfg(c => ({ ...c, [k]: v }))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <AdminLayout title="Settings" subtitle="Platform configuration and preferences">
      <div className="p-6">
        <div className="flex gap-6">
          {/* Sidebar nav */}
          <div className="w-48 shrink-0">
            {/* Signed-in admin (real data) */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 flex items-center gap-2.5">
              <div className="w-9 h-9 bg-turquoise-100 text-turquoise-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                {user?.initials || (user?.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'Admin'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || ''}</p>
              </div>
            </div>
            <nav className="space-y-0.5">
              {SECTIONS.map(s => (
                <button key={s} onClick={() => setActive(s)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active === s ? 'bg-turquoise-50 text-turquoise-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}>{s}</button>
              ))}
            </nav>
          </div>

          {/* Content panel */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">{active} Settings</h2>
              <button onClick={handleSave}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  saved ? 'bg-emerald-500 text-white' : 'bg-turquoise-500 hover:bg-turquoise-600 text-white'
                }`}>
                {saved ? <><CheckCircle2 size={14}/> Saved!</> : <><Save size={14}/> Save Changes</>}
              </button>
            </div>

            <div className="px-6 py-2">
              {active === 'Platform' && (
                <>
                  <Field label="Commission Rate (%)" sublabel="Percentage taken from each completed project payment">
                    <div className="flex items-center gap-2">
                      <input type="number" value={cfg.commission} onChange={e => set('commission', Number(e.target.value))}
                        className="w-20 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
                      <span className="text-sm text-slate-400">%</span>
                    </div>
                  </Field>
                  <Field label="Featured Pro Slots" sublabel="Number of pros shown in the 'Featured' section on the homepage">
                    <input type="number" value={cfg.featuredSlots} onChange={e => set('featuredSlots', Number(e.target.value))}
                      className="w-20 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
                  </Field>
                  <Field label="Public Platform" sublabel="Allow non-registered users to browse pros and cost guides">
                    <Toggle checked={cfg.publicPlatform} onChange={v => set('publicPlatform', v)} />
                  </Field>
                  <Field label="Auto-Publish Reviews" sublabel="Publish homeowner reviews immediately without admin approval">
                    <Toggle checked={cfg.reviewAutoPublish} onChange={v => set('reviewAutoPublish', v)} />
                  </Field>
                  <Field label="Maintenance Mode" sublabel="Take the platform offline for updates (shows maintenance page)">
                    <Toggle checked={cfg.maintenanceMode} onChange={v => set('maintenanceMode', v)} />
                  </Field>
                </>
              )}

              {active === 'AI & Quotes' && (
                <>
                  <Field label="AI Model" sublabel="Language model used for quote generation and recommendations">
                    <select value={cfg.aiModel} onChange={e => set('aiModel', e.target.value)}
                      className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-turquoise-300 bg-white">
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="claude-3-opus">Claude 3 Opus</option>
                    </select>
                  </Field>
                  <Field label="AI Confidence Threshold (%)" sublabel="Quotes below this confidence score are held for manual review">
                    <div className="flex items-center gap-2">
                      <input type="number" value={cfg.aiConfidenceThreshold} onChange={e => set('aiConfidenceThreshold', Number(e.target.value))}
                        className="w-20 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
                      <span className="text-sm text-slate-400">%</span>
                    </div>
                  </Field>
                  <Field label="Max Quote Response Time (hrs)" sublabel="Target time to deliver AI quote after request">
                    <input type="number" value={cfg.maxResponse} onChange={e => set('maxResponse', Number(e.target.value))}
                      className="w-20 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
                  </Field>
                  <Field label="Quote Expiry (hrs)" sublabel="How long before an unaccepted quote expires">
                    <input type="number" value={cfg.quoteExpiry} onChange={e => set('quoteExpiry', Number(e.target.value))}
                      className="w-20 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
                  </Field>
                  <Field label="Auto-Approve High Confidence Quotes" sublabel="Automatically approve quotes above confidence threshold">
                    <Toggle checked={cfg.autoApproveQuotes} onChange={v => set('autoApproveQuotes', v)} />
                  </Field>
                </>
              )}

              {active === 'Notifications' && (
                <>
                  <Field label="Email: New Project Created" sublabel="Alert admin when a new project is started">
                    <Toggle checked={cfg.emailNewProject} onChange={v => set('emailNewProject', v)} />
                  </Field>
                  <Field label="Email: New Quote Request" sublabel="Alert admin when a quote request comes in">
                    <Toggle checked={cfg.emailNewQuote} onChange={v => set('emailNewQuote', v)} />
                  </Field>
                  <Field label="Email: Payment Processed" sublabel="Confirm when a payment or payout is completed">
                    <Toggle checked={cfg.emailPayment} onChange={v => set('emailPayment', v)} />
                  </Field>
                  <Field label="SMS Alerts" sublabel="Receive critical alerts via SMS (requires Twilio)">
                    <Toggle checked={cfg.smsAlerts} onChange={v => set('smsAlerts', v)} />
                  </Field>
                  <Field label="Push Notifications" sublabel="Browser push notifications for real-time alerts">
                    <Toggle checked={cfg.pushNotifications} onChange={v => set('pushNotifications', v)} />
                  </Field>
                </>
              )}

              {active === 'Security' && (
                <>
                  <Field label="Require License Verification" sublabel="Providers must submit license docs before going live">
                    <Toggle checked={cfg.requireLicenseVerification} onChange={v => set('requireLicenseVerification', v)} />
                  </Field>
                  <Field label="Two-Factor Auth for Admins" sublabel="Require 2FA for all admin accounts">
                    <Toggle checked={cfg.twoFactorAdmin} onChange={v => set('twoFactorAdmin', v)} />
                  </Field>
                  <Field label="Session Timeout (min)" sublabel="Auto-logout admin users after inactivity">
                    <input type="number" value={cfg.sessionTimeout} onChange={e => set('sessionTimeout', Number(e.target.value))}
                      className="w-20 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
                  </Field>
                  <Field label="IP Whitelist (Admin)" sublabel="Restrict admin access to specific IP ranges">
                    <Toggle checked={cfg.ipWhitelist} onChange={v => set('ipWhitelist', v)} />
                  </Field>
                </>
              )}

              {active === 'Billing' && (
                <div className="py-4 space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Stripe Connected</p>
                      <p className="text-xs text-emerald-600">Processing payments via Stripe. Account: acct_1Pxxx…</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 pt-2">Commission payments and provider payouts are automatically processed through Stripe Connect. Contact support to modify billing configuration.</p>
                </div>
              )}

              {active === 'Integrations' && (
                <>
                  {[
                    { key:'stripeConnected',       label:'Stripe',      sub:'Payment processing & provider payouts', connected:cfg.stripeConnected      },
                    { key:'googleMapsConnected',   label:'Google Maps', sub:'Address validation & service area maps', connected:cfg.googleMapsConnected  },
                    { key:'twilioConnected',       label:'Twilio',      sub:'SMS OTP and mobile alerts',              connected:cfg.twilioConnected       },
                    { key:'sendgridConnected',     label:'SendGrid',    sub:'Transactional email delivery',           connected:cfg.sendgridConnected     },
                  ].map(({ key, label, sub, connected }) => (
                    <Field key={key} label={label} sublabel={sub}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {connected ? '● Connected' : '○ Disconnected'}
                        </span>
                        <button className="text-xs text-turquoise-600 hover:underline font-medium">
                          {connected ? 'Configure' : 'Connect'}
                        </button>
                      </div>
                    </Field>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
