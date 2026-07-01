import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { Bell } from 'lucide-react'

export default function AppUserNotifications() {
  return (
    <MobileAppLayout role="user">
      <div className="pt-12 pb-6">
        <div className="px-4 mb-4 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-slate-900">Notifications</h1>
        </div>

        <div className="px-4">
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Bell size={22} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No notifications yet</p>
            <p className="text-xs text-slate-400 mt-1">
              You'll see updates about your projects, quotes, and messages here.
            </p>
          </div>
        </div>
      </div>
    </MobileAppLayout>
  )
}
