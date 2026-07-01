import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, Landmark, Shield, CheckCircle2 } from 'lucide-react'

const SAVED_ACCOUNTS = [
  { id:1, bank:'Chase Business Checking', last4:'4821', type:'checking', default:true  },
  { id:2, bank:'Bank of America Savings', last4:'3377', type:'savings',  default:false },
]

export default function AppProviderBankAccount() {
  const navigate    = useNavigate()
  const [accounts,  setAccounts]  = useState(SAVED_ACCOUNTS)
  const [adding,    setAdding]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [form,      setForm]      = useState({ bank:'', routing:'', account:'', type:'checking' })

  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  const setDefault = id => setAccounts(a => a.map(ac => ({ ...ac, default: ac.id === id })))

  const handleAdd = () => {
    if (!form.bank || !form.routing || !form.account) return
    const newAcc = { id: Date.now(), bank: form.bank, last4: form.account.slice(-4), type: form.type, default: false }
    setAccounts(a => [...a, newAcc])
    setForm({ bank:'', routing:'', account:'', type:'checking' })
    setAdding(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <MobileAppLayout role="provider">
      <div className="pt-10 pb-10 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 px-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <h1 className="font-extrabold text-slate-900 text-lg">Payout Account</h1>
        </div>

        {saved && (
          <div className="mx-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            <p className="text-xs font-semibold text-emerald-700">Bank account added successfully.</p>
          </div>
        )}

        {/* Accounts list */}
        <div className="px-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Linked Accounts</p>
          <div className="space-y-3">
            {accounts.map(ac => (
              <div key={ac.id} className={`bg-white rounded-2xl border p-4 flex items-center gap-3 ${ac.default ? 'border-turquoise-300 bg-turquoise-50/30' : 'border-slate-200'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ac.default ? 'bg-emerald-600' : 'bg-slate-600'}`}>
                  <Landmark size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{ac.bank}</p>
                  <p className="text-[11px] text-slate-400 capitalize">···· {ac.last4} · {ac.type}</p>
                </div>
                {ac.default
                  ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-turquoise-100 text-turquoise-700">Default</span>
                  : <button onClick={() => setDefault(ac.id)} className="text-xs font-semibold text-turquoise-600 hover:underline">Set default</button>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Add new */}
        {!adding ? (
          <div className="px-4">
            <button onClick={() => setAdding(true)}
              className="w-full py-3 border-2 border-dashed border-slate-300 rounded-2xl text-sm font-semibold text-slate-500 hover:border-turquoise-400 hover:text-turquoise-600 transition-all">
              + Add Bank Account
            </button>
          </div>
        ) : (
          <div className="px-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">New Account</p>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {[
                ['Bank Name',       'bank',    'text',   'e.g. Wells Fargo Business'],
                ['Routing Number',  'routing', 'number', '9-digit routing number'],
                ['Account Number',  'account', 'number', 'Account number'],
              ].map(([label, key, type, placeholder]) => (
                <div key={key} className="px-4 py-3 border-b border-slate-50 last:border-0">
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">{label}</label>
                  <input type={type} value={form[key]} onChange={e => set(key)(e.target.value)}
                    placeholder={placeholder}
                    className="w-full text-sm font-medium text-slate-800 focus:outline-none focus:text-turquoise-600 bg-transparent placeholder-slate-300" />
                </div>
              ))}
              <div className="px-4 py-3">
                <label className="text-[11px] font-bold text-slate-400 block mb-2">Account Type</label>
                <div className="flex gap-2">
                  {['checking','savings'].map(t => (
                    <button key={t} onClick={() => set('type')(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                        form.type === t ? 'bg-turquoise-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>{t}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-3">
              <button onClick={() => setAdding(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-sm hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleAdd}
                className="flex-1 py-3 bg-turquoise-500 text-white font-bold rounded-2xl text-sm hover:bg-turquoise-600 transition-colors">
                Add Account
              </button>
            </div>
          </div>
        )}

        {/* Trust note */}
        <div className="flex items-center gap-3 px-6">
          <Shield size={14} className="text-emerald-500 shrink-0" />
          <p className="text-xs text-slate-400">Bank details are encrypted and stored securely via Stripe Connect. A-1 Renovations never stores your full account number.</p>
        </div>
      </div>
    </MobileAppLayout>
  )
}
