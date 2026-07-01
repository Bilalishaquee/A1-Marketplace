import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, CreditCard, Lock, CheckCircle2, Shield } from 'lucide-react'

function formatCardNumber(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(val) {
  const v = val.replace(/\D/g, '').slice(0, 4)
  return v.length >= 3 ? `${v.slice(0,2)}/${v.slice(2)}` : v
}

export default function AppUserAddCard() {
  const navigate = useNavigate()

  const [card,    setCard]    = useState('')
  const [expiry,  setExpiry]  = useState('')
  const [cvv,     setCvv]     = useState('')
  const [name,    setName]    = useState('')
  const [dflt,    setDflt]    = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [done,    setDone]    = useState(false)

  const last4  = card.replace(/\s/g, '').slice(-4)
  const canSave = card.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvv.length >= 3 && name.length >= 2

  const cardType = () => {
    const n = card.replace(/\s/g, '')
    if (n.startsWith('4')) return 'Visa'
    if (n.startsWith('5')) return 'Mastercard'
    if (n.startsWith('3')) return 'Amex'
    return 'Card'
  }

  const save = () => {
    setSaving(true)
    setTimeout(() => { setSaving(false); setDone(true) }, 1200)
  }

  if (done) {
    return (
      <MobileAppLayout role="user">
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center pb-20">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-5">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="font-extrabold text-slate-900 text-xl mb-2">Card Added!</h2>
          <p className="text-sm text-slate-500 mb-8">{cardType()} ending in {last4} is now saved.</p>

          <div className="w-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-left mb-6">
            <p className="text-slate-400 text-xs mb-4">{cardType()}</p>
            <p className="text-white font-mono text-sm tracking-widest">•••• •••• •••• {last4}</p>
            <div className="flex justify-between mt-3">
              <div>
                <p className="text-slate-500 text-[10px]">CARD HOLDER</p>
                <p className="text-white text-xs font-semibold">{name.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[10px]">EXPIRES</p>
                <p className="text-white text-xs font-semibold">{expiry}</p>
              </div>
            </div>
          </div>

          <button onClick={() => navigate(-1)} className="w-full py-3.5 bg-turquoise-500 text-white font-bold rounded-2xl">
            Done
          </button>
        </div>
      </MobileAppLayout>
    )
  }

  return (
    <MobileAppLayout role="user">
      <div className="pt-10 pb-10 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 px-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="font-extrabold text-slate-900 text-lg">Add Payment Method</h1>
            <p className="text-[11px] text-slate-400 flex items-center gap-1"><Lock size={10}/> Secured by Stripe</p>
          </div>
        </div>

        {/* Card preview */}
        <div className="px-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-6">
              <CreditCard size={20} className="text-slate-400" />
              <span className="text-slate-400 text-xs font-semibold">{cardType()}</span>
            </div>
            <p className="text-white font-mono text-base tracking-widest mb-4">
              {card || '•••• •••• •••• ••••'}
            </p>
            <div className="flex justify-between">
              <div>
                <p className="text-slate-500 text-[10px] uppercase">Card Holder</p>
                <p className="text-white text-xs font-semibold">{name || 'FULL NAME'}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[10px] uppercase">Expires</p>
                <p className="text-white text-xs font-semibold">{expiry || 'MM/YY'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-4 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <label className="text-[11px] font-bold text-slate-400 block mb-1.5">Card Number</label>
            <input
              type="text" inputMode="numeric" value={card}
              onChange={e => setCard(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              className="w-full text-sm font-mono text-slate-800 focus:outline-none bg-transparent tracking-widest" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <label className="text-[11px] font-bold text-slate-400 block mb-1.5">Expiry</label>
              <input
                type="text" inputMode="numeric" value={expiry}
                onChange={e => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                className="w-full text-sm font-semibold text-slate-800 focus:outline-none bg-transparent" />
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1.5">
                CVV <Lock size={9}/>
              </label>
              <input
                type="password" inputMode="numeric" value={cvv}
                onChange={e => setCvv(e.target.value.slice(0, 4))}
                placeholder="•••"
                className="w-full text-sm font-semibold text-slate-800 focus:outline-none bg-transparent" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <label className="text-[11px] font-bold text-slate-400 block mb-1.5">Name on Card</label>
            <input
              type="text" value={name}
              onChange={e => setName(e.target.value)}
              placeholder="James Carter"
              className="w-full text-sm font-semibold text-slate-800 focus:outline-none bg-transparent" />
          </div>

          {/* Default toggle */}
          <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">Set as default</p>
              <p className="text-[11px] text-slate-400">Used for all future payments</p>
            </div>
            <button onClick={() => setDflt(v => !v)}
              className="relative rounded-full shrink-0 transition-colors"
              style={{ width: 40, height: 22, background: dflt ? '#00BCD4' : '#E2E8F0' }}>
              <span className="absolute top-0.5 bg-white rounded-full shadow transition-transform"
                style={{ width: 18, height: 18, transform: dflt ? 'translateX(20px)' : 'translateX(2px)' }} />
            </button>
          </div>
        </div>

        {/* Trust */}
        <div className="px-4 flex items-center gap-3">
          <Shield size={13} className="text-emerald-500 shrink-0" />
          <p className="text-xs text-slate-400">Your card is encrypted and never stored on our servers. Powered by Stripe.</p>
        </div>

        {/* Save */}
        <div className="px-4">
          <button onClick={save} disabled={!canSave || saving}
            className="w-full py-3.5 bg-turquoise-500 disabled:opacity-40 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors">
            {saving ? 'Saving...' : <><CreditCard size={16}/> Save Card</>}
          </button>
        </div>
      </div>
    </MobileAppLayout>
  )
}
