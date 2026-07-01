import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, Download, Share2, CheckCircle2, CreditCard } from 'lucide-react'

const INVOICE_DATA = {
  'T-1047': {
    id: 'T-1047', invoiceNo: 'INV-2047', date: 'May 3, 2026', dueDate: 'May 3, 2026', status: 'paid',
    project: 'Kitchen Full Remodel', contractor: 'Mike Rodriguez', contractorAvatar: 'MR', contractorColor: 'bg-slate-900',
    milestone: 'Milestone 2 — Cabinetry & Rough-In',
    items: [
      { desc: 'Cabinet installation labor (upper row)',  qty: '1', amount: 3200 },
      { desc: 'Lower cabinet labor',                    qty: '1', amount: 2800 },
      { desc: 'Cabinet hardware & fixtures',            qty: '1', amount: 1400 },
      { desc: 'Site cleanup & debris removal',          qty: '1', amount: 600  },
      { desc: 'Project management fee (5%)',            qty: '1', amount: 400  },
    ],
    subtotal: 8400, tax: 0, total: 8400, paid: 8400,
    method: 'Visa ···· 4242', processedAt: 'May 3, 2026 at 9:02 AM',
  },
  'T-1033': {
    id: 'T-1033', invoiceNo: 'INV-2033', date: 'Apr 15, 2026', dueDate: 'Apr 15, 2026', status: 'paid',
    project: 'Kitchen Full Remodel', contractor: 'Mike Rodriguez', contractorAvatar: 'MR', contractorColor: 'bg-slate-900',
    milestone: 'Initial Deposit (25%)',
    items: [
      { desc: 'Project deposit — Kitchen Full Remodel', qty: '1', amount: 8500 },
    ],
    subtotal: 8500, tax: 0, total: 8500, paid: 8500,
    method: 'Visa ···· 4242', processedAt: 'Apr 15, 2026 at 11:20 AM',
  },
}

const DEFAULT_INVOICE = INVOICE_DATA['T-1047']

export default function AppUserInvoice() {
  const navigate    = useNavigate()
  const [params]    = useSearchParams()
  const txId        = params.get('id')
  const inv         = INVOICE_DATA[txId] || DEFAULT_INVOICE
  const [downloaded, setDownloaded] = useState(false)

  const handleDownload = () => {
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }

  return (
    <MobileAppLayout role="user">
      <div className="pt-10 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between px-4 mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <ChevronLeft size={18} className="text-slate-600" />
            </button>
            <div>
              <h1 className="font-extrabold text-slate-900 text-base">Invoice {inv.invoiceNo}</h1>
              <p className="text-[11px] text-slate-400">{inv.date}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownload}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                downloaded ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {downloaded ? <><CheckCircle2 size={12}/> Saved</> : <><Download size={12}/> PDF</>}
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all">
              <Share2 size={12}/> Share
            </button>
          </div>
        </div>

        <div className="px-4 space-y-4">
          {/* Status banner */}
          <div className={`flex items-center gap-3 p-4 rounded-2xl ${
            inv.status === 'paid' ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
          }`}>
            <CheckCircle2 size={20} className={inv.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'} />
            <div>
              <p className={`text-sm font-bold ${inv.status === 'paid' ? 'text-emerald-800' : 'text-amber-800'}`}>
                {inv.status === 'paid' ? 'Payment Complete' : 'Payment Pending'}
              </p>
              <p className={`text-[11px] ${inv.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {inv.status === 'paid' ? `Processed ${inv.processedAt}` : `Due ${inv.dueDate}`}
              </p>
            </div>
          </div>

          {/* From / For */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${inv.contractorColor} rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                {inv.contractorAvatar}
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-slate-400">From</p>
                <p className="font-bold text-slate-900 text-sm">{inv.contractor}</p>
              </div>
            </div>
            <div className="border-t border-slate-50 pt-3 space-y-1">
              {[['Project', inv.project], ['Milestone', inv.milestone]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-slate-400">{k}</span>
                  <span className="font-semibold text-slate-700 text-right max-w-[65%]">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Line items */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Line Items</p>
            <div className="space-y-2.5">
              {inv.items.map((item, i) => (
                <div key={i} className="flex justify-between items-start gap-2">
                  <p className="text-xs text-slate-600 flex-1 leading-snug">{item.desc}</p>
                  <p className="text-xs font-semibold text-slate-800 shrink-0">${item.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 mt-3 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="font-semibold text-slate-700">${inv.subtotal.toLocaleString()}</span>
              </div>
              {inv.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tax</span>
                  <span className="font-semibold text-slate-700">${inv.tax.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold border-t border-slate-100 pt-2">
                <span className="text-slate-900">Total</span>
                <span className="text-slate-900">${inv.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
              <CreditCard size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">{inv.method}</p>
              <p className="text-[11px] text-slate-400">Charged {inv.processedAt}</p>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400">
            Invoice {inv.invoiceNo} · A-1 Renovations LLC · Secured by Stripe
          </p>
        </div>
      </div>
    </MobileAppLayout>
  )
}
