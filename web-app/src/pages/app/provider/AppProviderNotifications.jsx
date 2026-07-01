import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { Bell } from 'lucide-react'

export default function AppProviderNotifications() {
  return (
    <MobileAppLayout role="provider">
      <div className="pt-12 pb-6">
        <div className="px-4 mb-4">
          <h1 className="text-xl font-extrabold text-slate-900">Alerts</h1>
        </div>

        <div className="px-4">
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <Bell size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">No notifications</p>
            <p className="text-xs text-slate-400 mt-1">You're all caught up. New alerts will show up here.</p>
          </div>
        </div>
      </div>
    </MobileAppLayout>
  )
}
