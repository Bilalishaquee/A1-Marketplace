import AdminLayout from '../../components/layout/AdminLayout'
import { CreditCard } from 'lucide-react'

export default function AdminPayments() {
  return (
    <AdminLayout title="Payments & Finance" subtitle="Transactions, payouts, and revenue tracking">
      <div className="p-6">
        <div className="bg-white rounded-xl border border-slate-200 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <CreditCard size={26} className="text-slate-300" />
          </div>
          <p className="text-base font-semibold text-slate-700">No payment data yet</p>
          <p className="text-sm text-slate-400 mt-1 max-w-md">
            Payments integration is pending. Transactions, provider payouts, and revenue tracking
            will appear here once the payments backend is connected.
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}
